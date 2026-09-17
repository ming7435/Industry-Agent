"""Knowledge MCP：文档片段获取工具。"""

from __future__ import annotations

from typing import Any, Dict


def fetch_chunk(
    rag: Any,
    document_id: str = "",
    chunk_id: str = "",
    **_: Any,
) -> Dict[str, Any]:
    return rag.fetch_chunk(document_id, chunk_id)
