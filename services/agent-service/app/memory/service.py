"""经验学习模块，不是 Agent。"""

from __future__ import annotations

from typing import Any, Mapping

from .store import LongMemoryStore, ShortMemoryStore
from app.rag import RAGServiceClient
from app.contracts import ExperienceResult
from app.harness import TraceRecorder

from .extractor import ExperienceExtractor
from .validator import ExperienceValidator
from .writer import ExperienceWriter


class ExperienceLearningModule:
    name = "experience_learning"

    def __init__(
        self,
        short_memory: Any | None = None,
        long_memory: Any | None = None,
        rag: RAGServiceClient | None = None,
        trace: TraceRecorder | None = None,
    ) -> None:
        self.short_memory = short_memory or ShortMemoryStore()
        self.long_memory = long_memory or LongMemoryStore()
        self.rag = rag or RAGServiceClient()
        self.trace = trace
        self.extractor = ExperienceExtractor()
        self.validator = ExperienceValidator()
        self.writer = ExperienceWriter(self.short_memory, self.long_memory, self.rag)

    def search(self, device_id: str = "", limit: int = 20, **filters: Any) -> dict[str, Any]:
        self._trace("module_started", action="search", device_id=device_id, filters=filters)
        items = self.long_memory.search(device_id=device_id, limit=limit, **filters)
        self._trace("module_completed", action="search", count=len(items))
        return {"action": "search", "device_id": device_id, "items": items, "backend": self.long_memory.backend}

    def learn(self, payload: Mapping[str, Any]) -> ExperienceResult:
        workorder = dict(payload.get("workorder") or {})
        repair_feedback = payload.get("repair_feedback") or workorder.get("repair_feedback") or {}
        self._trace("module_started", action="learn", workorder_id=workorder.get("workorder_id", ""))
        if not self.validator.is_valid(workorder, repair_feedback):
            result = ExperienceResult(
                experience_id="",
                device_id=str(workorder.get("device_id", "")),
                title="未沉淀经验",
                content="工单未关闭或缺少有效维修反馈，暂不写入经验库。",
                passed=False,
            )
            self._trace("module_completed", action="learn", saved=False, reason="admission_rejected")
            return result
        experience = self.extractor.extract(
            workorder=workorder,
            repair_feedback=repair_feedback,
            diagnosis=dict(payload.get("diagnosis") or {}),
            maintenance_plan=dict(payload.get("maintenance_plan") or {}),
            report=dict(payload.get("report") or {}),
        )
        existing_raw = self.long_memory.search(device_id=str(experience.get("device_id") or ""), limit=100)
        existing: list[Mapping[str, Any]] = [dict(item) for item in existing_raw if isinstance(item, Mapping)]
        quality = self.validator.validate_experience(experience, workorder, repair_feedback, existing=existing)
        experience.update({
            "experience_quality_score": quality.experience_quality_score,
            "validation_status": quality.validation_status,
            "validation_findings": list(quality.findings),
        })
        if quality.validation_status == "rejected":
            result = ExperienceResult(**{
                **experience,
                "passed": False,
                "memory_saved": False,
                "rag_saved": False,
            })
            self._trace("module_completed", action="learn", saved=False, reason="experience_quality_rejected", quality=quality.experience_quality_score)
            return result
        memory_saved, rag_saved, duplicate = self.writer.write(experience)
        result = ExperienceResult(**experience, memory_saved=memory_saved, rag_saved=rag_saved)
        self._trace("module_completed", action="learn", saved=memory_saved, rag_saved=rag_saved, duplicate=duplicate)
        return result

    def _trace(self, event: str, **payload: Any) -> None:
        if self.trace:
            self.trace.record(type="module", name=self.name, event=event, **payload)
