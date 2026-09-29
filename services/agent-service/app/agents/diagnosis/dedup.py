"""Diagnosis Agent 运行去重和幂等缓存。"""

from __future__ import annotations

from copy import deepcopy
import hashlib
import json
from threading import Lock
from typing import Any, Dict, Tuple


class DiagnosisRunCache:
    """按 event_id + event_revision 缓存一次诊断结果。

    同一事件版本重复投递时直接返回已有结果；事件版本升级会自然使用新的缓存键重新运行。
    """

    def __init__(self) -> None:
        self._lock = Lock()
        self._results: Dict[Tuple[str, int, str, str, str], Any] = {}

    @staticmethod
    def key(event: Dict[str, Any]) -> Tuple[str, int, str, str, str] | None:
        event_id = str(event.get("event_id") or event.get("key") or "").strip()
        # 没有稳定事件标识时不能把不同请求归入同一个 unknown 缓存槽。
        if not event_id or event_id == "event:unknown":
            return None
        try:
            revision = max(1, int(event.get("event_revision") or 1))
        except (TypeError, ValueError):
            revision = 1
        fingerprint_source = {
            key: event.get(key)
            for key in ("evidence", "evidence_records", "observations", "abnormal_metrics", "realtime_snapshot", "alarm_snapshot", "diagnosis_evidence_fingerprint")
            if event.get(key) is not None
        }
        try:
            encoded = json.dumps(fingerprint_source, ensure_ascii=False, sort_keys=True, default=str)
        except (TypeError, ValueError):
            encoded = repr(fingerprint_source)
        fingerprint = hashlib.sha256(encoded.encode("utf-8")).hexdigest() if fingerprint_source else ""
        device_id = str(event.get("device_id") or "").strip()
        tenant_id = str(event.get("tenant_id") or event.get("organization_id") or "").strip()
        return event_id, revision, device_id, tenant_id, fingerprint

    @staticmethod
    def _bypass(event: Dict[str, Any]) -> bool:
        return any(event.get(key) is True for key in ("review", "force_review", "bypass_cache", "new_evidence"))

    def get(self, event: Dict[str, Any]) -> Any | None:
        if self._bypass(event):
            return None
        cache_key = self.key(event)
        if cache_key is None:
            return None
        with self._lock:
            result = self._results.get(cache_key)
            return deepcopy(result) if result is not None else None

    def put(self, event: Dict[str, Any], result: Any) -> None:
        if self._bypass(event):
            return
        cache_key = self.key(event)
        if cache_key is None:
            return
        with self._lock:
            self._results[cache_key] = deepcopy(result)

    def clear(self) -> None:
        with self._lock:
            self._results.clear()

    def __len__(self) -> int:
        with self._lock:
            return len(self._results)
