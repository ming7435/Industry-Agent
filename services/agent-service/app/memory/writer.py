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
        # 此集合只缓存本进程的成功写入；同步回执和重试时间另存数据库。
        # RAG 文档 ID 稳定，后台任务重启后可以继续重试。
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
            rag_saved = bool(self.sync(existing_item or experience).get('rag_saved'))
            if rag_saved:
                with self._lock:
                    if experience_id:
                        self._rag_synced.add(experience_id)
            return False, rag_saved, True
        payload = dict(experience)
        self.short_memory.add({"type": "experience", **payload})
        self.long_memory.save(payload)
        rag_saved = bool(self.sync(payload).get('rag_saved'))
        if rag_saved:
            with self._lock:
                self._rag_synced.add(str(payload.get("experience_id") or ""))
        return True, rag_saved, False

    def _upsert_rag(self, experience: Mapping[str, Any]) -> bool:
        """更新或插入一条标识稳定的经验文档，并向调用方反映写入失败。"""

        try:
            rag_result = self.rag.upsert(
                {"id": experience["experience_id"], **dict(experience)},
                collection=str(experience.get("collection", "maint_fault_events")),
            )
            if "pipeline_ready" in rag_result:
                return bool(rag_result.get("pipeline_ready"))
            return bool(rag_result.get("loaded", 0) or rag_result.get("success", False))
        except Exception:
            return False

    def sync(self, experience: Mapping[str, Any]) -> dict[str, Any]:
        """Index stable saved facts and persist the receipt, including partial success."""
        payload = dict(experience)
        metadata = {key: value for key, value in payload.items() if key not in
                    {'content', 'knowledge_sync', 'rag_saved', 'memory_saved', 'duplicate'}}
        metadata.update(corpus='cases', knowledge_type='case', record_category='case')
        document = {**payload, 'id': payload['experience_id'], 'metadata': metadata}
        # Online knowledge must never claim success from an in-process fallback.
        # Preserve the remote failure for the durable retry worker.
        document['content'] = ('经验编号：' + payload['experience_id'] + '；来源工单：' + str(payload.get('source_workorder') or '')
            + '；确认方式：' + ('维修人员人工确认' if payload.get('validation_status') == 'manual_confirmed' else '设备恢复核验')
            + '\n' + str(payload.get('content') or ''))
        try:
            if getattr(self.rag, 'base_url', ''):
                result = self.rag.upsert(document, collection=str(payload.get('collection') or 'maint_fault_events'), require_remote=True)
            else:
                result = self.rag.upsert(document, collection=str(payload.get('collection') or 'maint_fault_events'))
        except Exception as error:
            result = {'success': False, 'pipeline_ready': False, 'metadata_saved': False,
                      'error': type(error).__name__, 'backends': {}}
        result = {**result, 'document_revision': payload.get('content_revision')}
        if hasattr(self.long_memory, 'record_index'):
            payload = self.long_memory.record_index(payload['experience_id'], result)
        else:
            payload.update(rag_saved=bool(result.get('pipeline_ready', result.get('loaded', 0))))
            self.long_memory.save(payload)
        return {**payload, 'memory_saved': True}
