"""检查工单完成状态、维修步骤和反馈完整性。"""

from __future__ import annotations

from typing import Any, Dict, Mapping


COMPLETED_STATUSES = {"completed", "repair_completed", "closed"}


def check_workorder_compliance(
    adapter: Any,
    workorder_id: str = "",
    workorder: Mapping[str, Any] | None = None,
    required_steps: list[str] | None = None,
    **_: Any,
) -> Dict[str, Any]:
    order = dict(workorder or {})
    if not order and workorder_id:
        order = dict(adapter.get_workorder(workorder_id=workorder_id) or {})
    steps = [str(item).strip() for item in order.get("steps") or [] if str(item).strip()]
    feedback = str(order.get("repair_feedback") or "").strip()
    missing_steps = [item for item in required_steps or [] if str(item) not in steps]
    status_ok = str(order.get("status") or "") in COMPLETED_STATUSES
    steps_complete = bool(steps) and not missing_steps
    passed = bool(order.get("found", True)) and status_ok and steps_complete and bool(feedback)
    return {
        "found": bool(order),
        "success": True,
        "workorder_id": str(order.get("workorder_id") or workorder_id),
        "passed": passed,
        "status": order.get("status", ""),
        "status_ok": status_ok,
        "steps": steps,
        "steps_complete": steps_complete,
        "missing_steps": missing_steps,
        "has_feedback": bool(feedback),
        "repair_feedback": feedback,
        "source": "mes-mcp",
    }
