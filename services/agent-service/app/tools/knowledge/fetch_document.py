"""Knowledge MCP：全文档获取工具。"""

from __future__ import annotations

from typing import Any, Dict


def fetch_document(rag: Any, document_id: str = "", **_: Any) -> Dict[str, Any]:
    return rag.fetch_document(document_id)
