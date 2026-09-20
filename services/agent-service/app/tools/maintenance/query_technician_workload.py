"""查询维修人员工作负载。"""
from typing import Any


def query_technician_workload(adapter: Any, **arguments: Any) -> dict[str, Any]:
    return adapter.query_technician_workload(**arguments)
