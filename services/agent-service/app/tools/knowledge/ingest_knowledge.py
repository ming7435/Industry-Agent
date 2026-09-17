"""Knowledge MCP：将知识文档入库。"""

from __future__ import annotations

from typing import Any, Dict


def ingest_knowledge(rag: Any, path: str, collection: str = "", **_: Any) -> Dict[str, Any]:
    return rag.ingest_jsonl(path, collection=collection)
