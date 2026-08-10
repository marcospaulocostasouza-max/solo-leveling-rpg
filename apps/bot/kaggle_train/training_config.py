"""Configuração central da LoRA para o modelo oficial Qwen/Qwen3-8B."""

from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, Optional


MODEL_NAME = "Qwen/Qwen3-8B"


@dataclass(frozen=True)
class TrainingConfig:
    """Configuração conservadora para QLoRA do Qwen3-8B em GPU Kaggle."""

    model_name: str = MODEL_NAME
    model_revision: str = "main"
    dataset_path: Optional[str] = None
    output_dir: str = "output"
    adapter_dir: str = "output/adapter"
    logging_dir: str = "output/logs"
    max_seq_length: int = 2048
    num_train_epochs: int = 3
    per_device_train_batch_size: int = 1
    gradient_accumulation_steps: int = 16
    learning_rate: float = 2e-4
    weight_decay: float = 0.01
    warmup_ratio: float = 0.03
    lr_scheduler_type: str = "cosine"
    optim: str = "paged_adamw_8bit"
    max_grad_norm: float = 0.3
    logging_steps: int = 10
    save_steps: int = 250
    save_total_limit: int = 3
    seed: int = 42
    use_4bit: bool = True
    bnb_4bit_quant_type: str = "nf4"
    bnb_4bit_use_double_quant: bool = True
    attn_implementation: str = "sdpa"
    gradient_checkpointing: bool = True
    packing: bool = False
    assistant_only_loss: bool = True

    def resolved_dataset_path(self) -> Path:
        return Path(self.dataset_path) if self.dataset_path else Path(__file__).with_name("dataset.jsonl")

    def as_dict(self) -> Dict[str, Any]:
        values = asdict(self)
        values["dataset_path"] = str(self.resolved_dataset_path())
        return values


def build_training_config(**overrides: Any) -> TrainingConfig:
    """Cria configuração validada; somente campos conhecidos podem ser alterados."""
    allowed = set(TrainingConfig.__dataclass_fields__)
    unknown = set(overrides) - allowed
    if unknown:
        raise ValueError(f"Parâmetros de configuração desconhecidos: {', '.join(sorted(unknown))}")
    return TrainingConfig(**overrides)
