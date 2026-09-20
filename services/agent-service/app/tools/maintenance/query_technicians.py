"""查询可派工维修人员。"""
from typing import Any


def query_technicians(adapter: Any, **arguments: Any) -> dict[str, Any]:
    return adapter.query_technicians(**arguments)
