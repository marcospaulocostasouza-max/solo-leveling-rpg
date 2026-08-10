"""Treinamento QLoRA explícito e reprodutível para Qwen/Qwen3-8B no Kaggle."""

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from .dataset_loader import DatasetLoader
from .lora_config import create_lora_config
from .save_checkpoint import write_training_metadata
from .training_config import TrainingConfig, build_training_config
from .utils import LoggerSetup, check_disk_space, load_file_hash
from .validate_dataset import generate_validation_report


class Qwen3LoraTrainer:
    """Orquestra validação, carga, SFT e exportação do adapter LoRA."""

    def __init__(self, config: TrainingConfig) -> None:
        self.config = config
        self.logger = LoggerSetup.get_logger(self.__class__.__name__)
        self.dataset_loader = DatasetLoader(config.resolved_dataset_path())
        self.tokenizer = None
        self.model = None
        self.trainer = None

    @staticmethod
    def _precision() -> Tuple[Any, bool, bool]:
        """Seleciona bf16 quando a GPU suporta; caso contrário, fp16."""
        import torch

        if not torch.cuda.is_available():
            raise RuntimeError("Uma GPU CUDA é necessária para o treinamento QLoRA no Kaggle.")
        use_bf16 = torch.cuda.is_bf16_supported()
        return (torch.bfloat16 if use_bf16 else torch.float16, use_bf16, not use_bf16)

    def preflight(self) -> Dict[str, Any]:
        """Executa somente verificações locais; não carrega modelo nem toca na GPU."""
        validation = generate_validation_report(self.dataset_loader.dataset_path)
        free_disk = check_disk_space(Path.cwd())
        result = {
            "model": self.config.model_name,
            "dataset": str(self.dataset_loader.dataset_path),
            "dataset_examples": self.dataset_loader.count_lines() if validation["valid"] else 0,
            "dataset_sha256": load_file_hash(self.dataset_loader.dataset_path) if validation["valid"] else None,
            "dataset_valid": validation["valid"],
            "free_disk": free_disk["free_human"],
            "ready": validation["valid"],
        }
        return result

    def load_tokenizer(self) -> None:
        from transformers import AutoTokenizer

        tokenizer = AutoTokenizer.from_pretrained(
            self.config.model_name,
            revision=self.config.model_revision,
            use_fast=True,
        )
        if tokenizer.pad_token_id is None:
            tokenizer.pad_token = tokenizer.eos_token
        tokenizer.padding_side = "right"
        self.tokenizer = tokenizer

    def load_model(self) -> None:
        import torch
        from transformers import AutoModelForCausalLM, BitsAndBytesConfig

        compute_dtype, _, _ = self._precision()
        quantization = BitsAndBytesConfig(
            load_in_4bit=self.config.use_4bit,
            bnb_4bit_quant_type=self.config.bnb_4bit_quant_type,
            bnb_4bit_use_double_quant=self.config.bnb_4bit_use_double_quant,
            bnb_4bit_compute_dtype=compute_dtype,
        )
        self.model = AutoModelForCausalLM.from_pretrained(
            self.config.model_name,
            revision=self.config.model_revision,
            quantization_config=quantization,
            dtype=compute_dtype,
            device_map="auto",
            attn_implementation=self.config.attn_implementation,
            low_cpu_mem_usage=True,
        )
        self.model.config.use_cache = False
        self.model.config.pad_token_id = self.tokenizer.pad_token_id
        self.model.generation_config.pad_token_id = self.tokenizer.pad_token_id

    def build_trainer(self, resume_from_checkpoint: Optional[str] = None) -> None:
        """Prepara SFTTrainer com o formato conversacional nativo do dataset."""
        if self.model is None or self.tokenizer is None:
            raise RuntimeError("Tokenizer e modelo devem ser carregados antes do trainer.")

        from datasets import Dataset
        from peft import prepare_model_for_kbit_training
        from trl import SFTConfig, SFTTrainer

        compute_dtype, use_bf16, use_fp16 = self._precision()
        del compute_dtype
        model = prepare_model_for_kbit_training(
            self.model,
            use_gradient_checkpointing=self.config.gradient_checkpointing,
            gradient_checkpointing_kwargs={"use_reentrant": False},
        )
        records = self.dataset_loader.load()
        dataset = Dataset.from_list(records)
        args = SFTConfig(
            output_dir=self.config.output_dir,
            logging_dir=self.config.logging_dir,
            num_train_epochs=self.config.num_train_epochs,
            per_device_train_batch_size=self.config.per_device_train_batch_size,
            gradient_accumulation_steps=self.config.gradient_accumulation_steps,
            learning_rate=self.config.learning_rate,
            weight_decay=self.config.weight_decay,
            warmup_ratio=self.config.warmup_ratio,
            lr_scheduler_type=self.config.lr_scheduler_type,
            optim=self.config.optim,
            max_grad_norm=self.config.max_grad_norm,
            logging_steps=self.config.logging_steps,
            save_strategy="steps",
            save_steps=self.config.save_steps,
            save_total_limit=self.config.save_total_limit,
            report_to="none",
            bf16=use_bf16,
            fp16=use_fp16,
            gradient_checkpointing=self.config.gradient_checkpointing,
            gradient_checkpointing_kwargs={"use_reentrant": False},
            max_length=self.config.max_seq_length,
            packing=self.config.packing,
            assistant_only_loss=self.config.assistant_only_loss,
            dataset_num_proc=2,
            seed=self.config.seed,
        )
        self.trainer = SFTTrainer(
            model=model,
            args=args,
            train_dataset=dataset,
            processing_class=self.tokenizer,
            peft_config=create_lora_config(),
        )
        self.resume_from_checkpoint = resume_from_checkpoint

    def train(self) -> Path:
        if self.trainer is None:
            raise RuntimeError("build_trainer deve ser chamado antes de train.")
        self.trainer.train(resume_from_checkpoint=self.resume_from_checkpoint)
        adapter_dir = Path(self.config.adapter_dir)
        adapter_dir.mkdir(parents=True, exist_ok=True)
        self.trainer.save_model(adapter_dir)
        self.tokenizer.save_pretrained(adapter_dir)
        metadata = {
            "base_model": self.config.model_name,
            "dataset_sha256": load_file_hash(self.dataset_loader.dataset_path),
            "training_config": self.config.as_dict(),
        }
        write_training_metadata(adapter_dir, metadata)
        return adapter_dir

    def run_training(self, resume_from_checkpoint: Optional[str] = None) -> Path:
        check = self.preflight()
        if not check["ready"]:
            raise RuntimeError("Dataset inválido; treinamento não iniciado.")
        self.load_tokenizer()
        self.load_model()
        self.build_trainer(resume_from_checkpoint)
        return self.train()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="QLoRA para Qwen/Qwen3-8B")
    parser.add_argument("--train", action="store_true", help="Inicia o treinamento explicitamente.")
    parser.add_argument("--dataset", type=str, help="Caminho alternativo para dataset.jsonl.")
    parser.add_argument("--output-dir", type=str, help="Diretório de checkpoints do Trainer.")
    parser.add_argument("--adapter-dir", type=str, help="Diretório final do adapter LoRA.")
    parser.add_argument("--resume-from-checkpoint", type=str, help="Checkpoint do Trainer a retomar.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    overrides = {
        key: value for key, value in {
            "dataset_path": args.dataset,
            "output_dir": args.output_dir,
            "adapter_dir": args.adapter_dir,
        }.items() if value is not None
    }
    pipeline = Qwen3LoraTrainer(build_training_config(**overrides))
    if args.train:
        print(f"Adapter salvo em: {pipeline.run_training(args.resume_from_checkpoint)}")
    else:
        print(json.dumps(pipeline.preflight(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
