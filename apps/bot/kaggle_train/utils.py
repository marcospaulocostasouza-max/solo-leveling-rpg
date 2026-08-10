"""Utilitários pequenos e sem efeitos de modelo para a pipeline Kaggle."""

import hashlib
import json
import logging
import shutil
from pathlib import Path
from typing import Any, Dict, List


class LoggerSetup:
    @staticmethod
    def get_logger(name: str) -> logging.Logger:
        logger = logging.getLogger(name)
        if logger.handlers:
            return logger
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(name)s | %(message)s"))
        logger.addHandler(handler)
        return logger


def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    with Path(path).open("r", encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def load_file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def check_disk_space(path: Path) -> Dict[str, Any]:
    usage = shutil.disk_usage(Path(path))
    return {"free_bytes": usage.free, "free_human": f"{usage.free / 1024**3:.2f} GB"}
