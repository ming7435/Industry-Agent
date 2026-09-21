"""在编排边界序列化 Agent 结果。"""
from __future__ import annotations
from typing import Any, Dict

def _serialize_agent_result(value: Any) -> Dict[str, Any]:
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if hasattr(value, "to_dict"):
        return value.to_dict()
    return dict(value or {})
