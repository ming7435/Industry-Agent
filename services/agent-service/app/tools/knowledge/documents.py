"""Knowledge Agent 的文档和片段溯源工具。"""

from __future__ import annotations

from typing import Any, Dict


class KnowledgeDocumentTools:
    """统一文档全文和片段获取入口，屏蔽 RAG 后端差异。"""

    def fetch_document(self, document_id: str = "", **_: Any) -> Dict[str, Any]:
        return self.rag.fetch_document(document_id)

    def fetch_chunk(
        self,
        document_id: str = "",
        chunk_id: str = "",
        **_: Any,
    ) -> Dict[str, Any]:
        return self.rag.fetch_chunk(document_id, chunk_id)
