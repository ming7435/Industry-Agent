"""CAD 内部建模工具：只执行有界工作线程绑定的当前任务。"""

from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any, Iterator


_MODELING_TASK: ContextVar[tuple[Any, str, Any] | None] = ContextVar("cad_modeling_task", default=None)


@contextmanager
def modeling_task_scope(service: Any, design_id: str, request: Any) -> Iterator[None]:
    """内部绑定保持在当前任务作用域，绝不通过客户端工具参数传入。"""
    token = _MODELING_TASK.set((service, design_id, request))
    try:
        yield
    finally:
        _MODELING_TASK.reset(token)


def generate_3d_model(design_id: str) -> dict[str, Any]:
    task = _MODELING_TASK.get()
    if task is None or task[1] != design_id:
        raise PermissionError("三维建模工具需要当前队列任务的可信上下文")
    service, identifier, request = task
    service._build_model(identifier, request)
    record = service.get(identifier)
    # 返回真实业务结果，不把整个历史日志和原图再嵌套进工具返回体。
    keys = (
        "design_id", "status", "message", "geometry", "artifacts", "digest",
        "resolved_spec", "suggested_spec", "analysis", "missing_information",
        "manufacturing_missing", "production_status",
    )
    return {key: record[key] for key in keys if key in record}
