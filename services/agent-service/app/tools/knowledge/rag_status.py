"""Knowledge MCP：查询 RAG 状态。"""

from __future__ import annotations

from typing import Any, Dict


def rag_status(rag: Any, **_: Any) -> Dict[str, Any]:
    return rag.status()
