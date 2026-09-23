"""Runtime evidence policies shared by Knowledge, Diagnosis and Maintenance loops."""

from __future__ import annotations

from typing import Any, Mapping


def _items(payload: Mapping[str, Any] | None, *keys: str) -> list[Any]:
    values: list[Any] = []
    for key in keys:
        value = (payload or {}).get(key)
        if isinstance(value, list):
            values.extend(value)
    return values


def ready(payload: Mapping[str, Any] | None, stage: str) -> bool:
    """Return whether a stage has actionable, non-degraded evidence."""

    value = dict(payload or {})
    status = str(value.get("status") or "").strip().lower()
    if value.get("error") or value.get("degraded") and not _items(value, "documents", "evidence", "components", "parts"):
        return False
    if status in {"error", "insufficient_evidence", "insufficient_engineering_data", "blocked_insufficient_evidence"}:
        return False
    if stage == "knowledge":
        return bool(_items(value, "documents", "evidence", "items")) or status == "completed"
    if stage == "cad":
        return bool(_items(value, "components", "parts", "drawings", "bom_items", "evidence")) or status == "completed"
    return bool(_items(value, "evidence", "documents", "components", "parts")) or status == "completed"


def refined_query(query: str, diagnosis: Mapping[str, Any] | None = None) -> str:
    """Add deterministic evidence hints for one bounded retrieval retry."""

    base = str(query or "设备维修").strip()
    fault = str((diagnosis or {}).get("fault") or (diagnosis or {}).get("diagnosis") or "").strip()
    suffix = "报警定义 维修步骤 历史案例"
    parts = [base]
    if fault and fault not in base:
        parts.append(fault)
    if suffix not in base:
        parts.append(suffix)
    return " ".join(parts)


def loop_payload(attempts: int, payload: Mapping[str, Any] | None) -> dict[str, Any]:
    status = "ready" if ready(payload, "knowledge") else "blocked"
    return {
        "attempts": int(attempts),
        "max_attempts": 1,
        "status": status,
        "stop_reason": "evidence_ready" if status == "ready" else "evidence_exhausted",
    }


__all__ = ["ready", "refined_query", "loop_payload"]
