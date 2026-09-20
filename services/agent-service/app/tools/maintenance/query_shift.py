"""查询当前班次。"""
from typing import Any


def query_shift(adapter: Any, **arguments: Any) -> dict[str, Any]:
    return adapter.query_shift(**arguments)
