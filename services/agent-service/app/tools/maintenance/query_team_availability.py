"""查询维修班组可用性。"""
from typing import Any


def query_team_availability(adapter: Any, **arguments: Any) -> dict[str, Any]:
    return adapter.query_team_availability(**arguments)
