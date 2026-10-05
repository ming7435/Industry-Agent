"""从既有事件结果投影独立维修方案，不创建方案或工单。"""
from typing import Any, Mapping

from app.workorder.policy import auto_workorder_decision


_PLAN_FIELDS = (
    "plan_id", "repair_target", "target_part", "engineering_context", "repair_steps", "tools", "parts", "safety",
    "required_tools", "required_parts", "safety_requirements", "pre_checks", "post_checks", "estimated_time",
    "estimated_duration", "source_documents", "cad_components", "evidence", "validation_findings", "risk_level",
    "workorder_ready", "maintenance_required", "maintenance_reason", "cad_required", "synthetic",
)
_DIAGNOSIS_FIELDS = (
    "device_id", "alarm_code", "fault", "summary", "cause", "diagnosis", "severity", "confidence", "evidence",
    "evidence_status", "evidence_validated", "validated", "maintenance_required", "maintenance_reason",
    "requires_human_review", "synthetic", "recommendation",
)


def list_saved_maintenance_plans(results: list[dict[str, Any]], device_id: str = "", limit: int = 100) -> dict[str, Any]:
    items: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str, str]] = set()
    for result in results:
        plan = result.get("maintenance_plan")
        if not isinstance(plan, Mapping) or not plan:
            continue
        event = result.get("event") if isinstance(result.get("event"), Mapping) else {}
        plan_diagnosis = plan.get("diagnosis") if isinstance(plan.get("diagnosis"), Mapping) else {}
        pipeline_diagnosis = result.get("diagnosis") if isinstance(result.get("diagnosis"), Mapping) else {}
        diagnosis = {**plan_diagnosis, **pipeline_diagnosis}
        raw = diagnosis.get("raw")
        if isinstance(raw, Mapping):
            diagnosis = {**raw, **diagnosis}
        plan_device = str(event.get("device_id") or diagnosis.get("device_id") or plan.get("device_id") or "")
        if device_id and plan_device != device_id:
            continue
        event_id = str(event.get("event_id") or diagnosis.get("event_id") or "")
        revision = event.get("event_revision", diagnosis.get("event_revision", 1))
        identity = (plan_device, str(plan.get("plan_id") or ""), event_id, str(revision))
        if identity in seen:
            continue
        seen.add(identity)
        allowed, reason = auto_workorder_decision(diagnosis, plan, event)
        items.append({
            **{key: plan[key] for key in _PLAN_FIELDS if key in plan},
            "diagnosis": {key: diagnosis[key] for key in _DIAGNOSIS_FIELDS if key in diagnosis},
            "device_id": plan_device,
            "alarm_code": str(event.get("alarm_code") or diagnosis.get("alarm_code") or ""),
            "event_id": event_id, "event_revision": revision,
            "task_id": str(result.get("task_id") or ""), "trace_id": str(result.get("trace_id") or ""),
            "created_at": str(diagnosis.get("created_at") or event.get("timestamp") or ""),
            "status": str(result.get("status") or ""), "stop_reason": str(result.get("stop_reason") or ""),
            "dispatch": {"allowed": allowed, "reason": reason},
        })
        if len(items) >= limit:
            break
    return {"items": items, "count": len(items), "source": "saved-event-results"}
