"""Configuração LoRA específica para a arquitetura Qwen3."""

from peft import LoraConfig, TaskType


TARGET_MODULES = (
    "q_proj", "k_proj", "v_proj", "o_proj",
    "gate_proj", "up_proj", "down_proj",
)


def create_lora_config() -> LoraConfig:
    """Retorna uma LoRA Qwen3 moderna, sem módulos extras ou vieses treináveis."""
    return LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=32,
        lora_alpha=64,
        lora_dropout=0.0,
        bias="none",
        target_modules=list(TARGET_MODULES),
        fan_in_fan_out=False,
    )
