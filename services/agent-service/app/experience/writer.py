"""经验写入短期记忆、长期记忆和 RAG。"""

from __future__ import annotations

from typing import Any, Mapping

from app.memory import LongMemoryStore, ShortMemoryStore
from app.rag import RAGServiceClient

from .dedup import ExperienceDeduplicator


class ExperienceWriter:
    def __init__(self, short_memory: Any, long_memory: Any, rag: RAGServiceClient, deduplicator: ExperienceDeduplicator | None = None) -> None:
        self.short_memory = short_memory
        self.long_memory = long_memory
        self.rag = rag
        self.deduplicator = deduplicator or ExperienceDeduplicator()

    def write(self, experience: Mapping[str, Any]) -> tuple[bool, bool, bool]:
        existing = self.long_memory.search(device_id=str(experience.get("device_id", "")), limit=100)
        if self.deduplicator.contains(experience, existing):
            return False, False, True
        payload = dict(experience)
        self.short_memory.add({"type": "experience", **payload})
        self.long_memory.save(payload)
        try:
            rag_result = self.rag.upsert(
                {"id": payload["experience_id"], **payload},
                collection=str(payload.get("collection", "maint_fault_events")),
            )
            rag_saved = bool(rag_result.get("loaded", 0) or rag_result.get("success", False))
        except Exception:
            rag_saved = False
        return True, rag_saved, False
