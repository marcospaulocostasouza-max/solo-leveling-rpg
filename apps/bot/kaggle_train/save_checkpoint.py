"""Metadados de execução para adapters salvos pelo SFTTrainer."""

import json
from pathlib import Path
from typing import Any, Dict


def write_training_metadata(adapter_dir: Path, metadata: Dict[str, Any]) -> Path:
    """Registra procedência do adapter sem modificar checkpoints do Trainer."""
    adapter_dir = Path(adapter_dir)
    adapter_dir.mkdir(parents=True, exist_ok=True)
    target = adapter_dir / "training_metadata.json"
    target.write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8")
    return target
