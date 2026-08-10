"""Validação estrita do formato conversacional aceito pelo TRL."""

import json
import hashlib
from pathlib import Path
from typing import Any, Dict, Optional

from .dataset_loader import DEFAULT_DATASET_PATH


def _validate_record(record: Any) -> Optional[str]:
    if not isinstance(record, dict):
        return "registro não é objeto JSON"
    messages = record.get("messages")
    if not isinstance(messages, list) or len(messages) < 2:
        return "messages deve ser uma lista com ao menos duas mensagens"
    if not isinstance(messages[0], dict) or messages[0].get("role") != "system":
        return "a primeira mensagem deve ter role system"
    for index, message in enumerate(messages):
        if not isinstance(message, dict):
            return f"messages[{index}] não é objeto"
        role, content = message.get("role"), message.get("content")
        if role not in {"system", "user", "assistant", "tool"}:
            return f"messages[{index}].role inválido"
        if not isinstance(content, str) or not content.strip():
            return f"messages[{index}].content deve ser texto não vazio"
    if messages[-1]["role"] != "assistant":
        return "a última mensagem deve ter role assistant"
    return None


def generate_validation_report(dataset_path: Optional[Path] = None) -> Dict[str, Any]:
    path = Path(dataset_path) if dataset_path else DEFAULT_DATASET_PATH
    report: Dict[str, Any] = {
        "dataset_path": str(path), "valid": False, "errors": [],
        "valid_json_lines": 0, "duplicates": [],
    }
    if not path.is_file():
        report["errors"].append("dataset inexistente")
        return report
    try:
        with path.open("r", encoding="utf-8") as handle:
            lines = list(enumerate(handle, start=1))
    except UnicodeDecodeError:
        report["errors"].append("dataset não está em UTF-8 válido")
        return report
    seen = {}
    for line_number, line in lines:
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError as exc:
            report["errors"].append(f"linha {line_number}: JSON inválido ({exc.msg})")
            continue
        issue = _validate_record(record)
        if issue:
            report["errors"].append(f"linha {line_number}: {issue}")
        else:
            report["valid_json_lines"] += 1
            canonical = json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
            digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
            if digest in seen:
                report["duplicates"].append([seen[digest], line_number])
            else:
                seen[digest] = line_number
            if any("\ufffd" in message["content"] for message in record["messages"]):
                report["errors"].append(f"linha {line_number}: caractere de substituição Unicode encontrado")
    if not report["valid_json_lines"]:
        report["errors"].append("dataset vazio")
    if report["duplicates"]:
        report["errors"].append(f"{len(report['duplicates'])} exemplo(s) duplicado(s)")
    report["valid"] = not report["errors"]
    return report
