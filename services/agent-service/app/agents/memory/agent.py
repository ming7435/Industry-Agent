"""Memory Agent：只管理已验证维修经验的检索与沉淀。"""

from __future__ import annotations

from typing import Any, Mapping

from app.memory import ExperienceLearningModule
from app.memory import build_memory_stores
from app.rag import RAGServiceClient
from app.tools.registry import ToolRegistry

from .graph import build_memory_graph
from .schemas import MemoryQuery, MemoryResult


class MemoryAgent:
    name = "memory"

    def __init__(self, experience_module: ExperienceLearningModule | None = None, tools: ToolRegistry | None = None) -> None:
        self.tools = tools or ToolRegistry()
        if experience_module is None:
            short, long = build_memory_stores()
            experience_module = ExperienceLearningModule(short, long, self.tools.rag)
        self.experience_module = experience_module
        self.graph = build_memory_graph()

    def run(self, task: Any) -> MemoryResult:
        output = self.graph.invoke({"agent": self, "request": task if isinstance(task, Mapping) else {"query": str(task or "")}})
        result = output.get("result")
        if result is None:
            raise RuntimeError("Memory LangGraph 未生成结果")
        return result

    @staticmethod
    def normalize_request(payload: Any) -> dict[str, Any]:
        return MemoryQuery.from_payload(payload).model_dump(mode="json")

    @staticmethod
    def search_arguments(request: Mapping[str, Any]) -> dict[str, Any]:
        return {key: request.get(key, "") for key in ("device_id", "device_model", "alarm_code", "fault_type", "component", "part_no", "query")} | {"limit": int(request.get("limit") or 20)}

    def recent(self, limit: int = 20) -> list[dict[str, Any]]:
        store = self.experience_module.long_memory
        if hasattr(store, "recent"):
            return list(store.recent(limit=max(1, min(int(limit), 100))))
        return list(store.search(limit=max(1, min(int(limit), 100))))
