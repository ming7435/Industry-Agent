"""经验写入短期记忆、长期记忆和 RAG。"""

from __future__ import annotations

from threading import Lock
from typing import Any, Mapping

from app.rag import RAGServiceClient

from .dedup import ExperienceDeduplicator


class ExperienceWriter:
    def __init__(self, short_memory: Any, long_memory: Any, rag: RAGServiceClient, deduplicator: ExperienceDeduplicator | None = None) -> None:
        self.short_memory = short_memory
        self.long_memory = long_memory
        self.rag = rag
        self.deduplicator = deduplicator or ExperienceDeduplicator()
        # Keep retry state local to this writer.  The RAG document id is stable,
        # so a process restart can safely retry an incomplete remote write.
        self._rag_synced: set[str] = set()
        self._lock = Lock()

    def write(self, experience: Mapping[str, Any]) -> tuple[bool, bool, bool]:
        existing = self.long_memory.search(device_id=str(experience.get("device_id", "")), limit=100)
        if self.deduplicator.contains(experience, existing):
            existing_item = next(
                (
                    item
                    for item in existing
                    if str(item.get("experience_id") or "") == str(experience.get("experience_id") or "")
                ),
                None,
            )
            experience_id = str(experience.get("experience_id") or "")
            with self._lock:
                if experience_id and experience_id in self._rag_synced:
                    return False, True, True
            rag_saved = self._upsert_rag(existing_item or experience)
            if rag_saved:
                with self._lock:
                    if experience_id:
                        self._rag_synced.add(experience_id)
            return False, rag_saved, True
        payload = dict(experience)
        self.short_memory.add({"type": "experience", **payload})
        self.long_memory.save(payload)
        rag_saved = self._upsert_rag(payload)
        if rag_saved:
            with self._lock:
                self._rag_synced.add(str(payload.get("experience_id") or ""))
        return True, rag_saved, False

    def _upsert_rag(self, experience: Mapping[str, Any]) -> bool:
        """Upsert one stable experience document and expose failure to callers."""

        try:
            rag_result = self.rag.upsert(
                {"id": experience["experience_id"], **dict(experience)},
                collection=str(experience.get("collection", "maint_fault_events")),
            )
            return bool(rag_result.get("loaded", 0) or rag_result.get("success", False))
        except Exception:
            return False
