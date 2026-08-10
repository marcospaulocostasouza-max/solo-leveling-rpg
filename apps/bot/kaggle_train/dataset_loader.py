"""Carregamento imutável do dataset conversacional JSONL."""

from pathlib import Path
from typing import Any, Dict, List, Optional

from .utils import LoggerSetup, read_jsonl


DEFAULT_DATASET_PATH = Path(__file__).with_name("dataset.jsonl")


class DatasetLoader:
    def __init__(self, dataset_path: Optional[Path] = None) -> None:
        self.dataset_path = Path(dataset_path) if dataset_path else DEFAULT_DATASET_PATH
        self.logger = LoggerSetup.get_logger(self.__class__.__name__)

    def dataset_exists(self) -> bool:
        return self.dataset_path.is_file()

    def count_lines(self) -> int:
        if not self.dataset_exists():
            raise FileNotFoundError(f"Dataset não encontrado: {self.dataset_path}")
        with self.dataset_path.open("r", encoding="utf-8") as handle:
            return sum(1 for line in handle if line.strip())

    def load(self) -> List[Dict[str, Any]]:
        if not self.dataset_exists():
            raise FileNotFoundError(f"Dataset não encontrado: {self.dataset_path}")
        records = read_jsonl(self.dataset_path)
        self.logger.info("Dataset carregado: %d exemplos", len(records))
        return records
