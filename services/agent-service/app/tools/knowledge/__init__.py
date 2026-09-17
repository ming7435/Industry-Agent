"""Knowledge Agent 的领域工具。"""

from .documents import KnowledgeDocumentTools
from .retrieval import KnowledgeRetrievalTools


class KnowledgeToolset(KnowledgeRetrievalTools, KnowledgeDocumentTools):
    """将知识检索和文档溯源工具组合成统一 MCP 工具集。"""

    def __init__(self, rag) -> None:
        self.rag = rag


__all__ = ["KnowledgeDocumentTools", "KnowledgeRetrievalTools", "KnowledgeToolset"]
