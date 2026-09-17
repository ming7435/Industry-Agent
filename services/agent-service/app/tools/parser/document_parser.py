"""Knowledge MCP：解析维修手册、SOP 或工程文档。"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict


def document_parser(path: str, **_: Any) -> Dict[str, Any]:
    source = Path(path)
    if not source.is_file():
        raise FileNotFoundError("文档不存在：%s" % source)
    suffix = source.suffix.lower()
    if suffix in {".json", ".jsonl"}:
        if suffix == ".jsonl":
            records = []
            with source.open("r", encoding="utf-8-sig") as stream:
                for line in stream:
                    if line.strip():
                        records.append(json.loads(line))
            return {"path": str(source), "format": "jsonl", "records": records, "count": len(records)}
        value = json.loads(source.read_text(encoding="utf-8-sig"))
        return {"path": str(source), "format": "json", "content": value}
    text = source.read_text(encoding="utf-8-sig")
    return {"path": str(source), "format": suffix.lstrip(".") or "text", "content": text, "count": len(text)}
