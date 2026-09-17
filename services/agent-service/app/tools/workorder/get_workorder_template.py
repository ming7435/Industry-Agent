"""WorkOrder MCP：获取工单草案模板。"""

from __future__ import annotations

from typing import Any, Dict, Mapping


def get_workorder_template(device_id: str = "", plan: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
    payload = dict(plan or {})
    return {"template_id": "WO-TPL-MAINT-001", "device_id": device_id, "title": "设备维修工单", "steps": list(payload.get("repair_steps") or []), "source": "workorder-template-local"}
