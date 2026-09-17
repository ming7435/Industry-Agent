"""读取工单维修反馈。"""

from __future__ import annotations

from typing import Any, Dict


def get_repair_feedback(adapter: Any, workorder_id: str, **_: Any) -> Dict[str, Any]:
    return adapter.get_repair_feedback(workorder_id=workorder_id)
