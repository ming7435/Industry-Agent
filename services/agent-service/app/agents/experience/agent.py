"""从维修闭环提取经验，并写入短期记忆、长期记忆和 RAG。"""

from __future__ import annotations

from typing import Any

from app.memory import LongMemoryStore, ShortMemoryStore
from app.memory.experience import ExperienceExtractor
from app.rag import RAGServiceClient
from app.validator import ExperienceResult


class ExperienceAgent:
    name = "experience"

    def __init__(
        self,
        short_memory: Any | None = None,
        long_memory: Any | None = None,
        rag: RAGServiceClient | None = None,
    ) -> None:
        self.short_memory = short_memory or ShortMemoryStore()
        self.long_memory = long_memory or LongMemoryStore()
        self.rag = rag or RAGServiceClient()
        self.extractor = ExperienceExtractor()

    def run(self, task: Any) -> ExperienceResult | dict[str, Any]:
        payload = dict(task or {})
        if payload.get("action") in {"search", "query"}:
            device_id = str(payload.get("device_id", ""))
            limit = int(payload.get("limit", 20))
            return {
                "action": "search",
                "device_id": device_id,
                "items": self.long_memory.search(device_id=device_id, limit=limit),
                "backend": self.long_memory.backend,
            }

        quality = dict(payload.get("quality") or {})
        if not quality.get("passed"):
            return ExperienceResult(
                experience_id="",
                device_id=str((payload.get("workorder") or {}).get("device_id", "")),
                title="未沉淀经验",
                content="质检未通过，暂不写入经验库。",
                passed=False,
            )

        experience = self.extractor.extract(
            workorder=dict(payload.get("workorder") or {}),
            quality=quality,
            diagnosis=dict(payload.get("diagnosis") or {}),
            maintenance_plan=dict(payload.get("maintenance_plan") or {}),
            report=dict(payload.get("report") or {}),
        )
        self.short_memory.add({"type": "experience", **experience})
        self.long_memory.save(experience)
        try:
            rag_result = self.rag.upsert(
                {"id": experience["experience_id"], **experience},
                collection="maint_fault_events",
            )
            rag_saved = bool(rag_result.get("loaded", 0) or rag_result.get("success", False))
        except Exception:
            rag_saved = False
        return ExperienceResult(
            **experience,
            memory_saved=True,
            rag_saved=rag_saved,
        )
