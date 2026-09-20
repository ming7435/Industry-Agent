"""查询维修人员技能。"""
from typing import Any


def query_technician_skills(adapter: Any, **arguments: Any) -> dict[str, Any]:
    return adapter.query_technician_skills(**arguments)
