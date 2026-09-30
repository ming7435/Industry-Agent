"""正式顶层 Graph 唯一接入的 Runtime 节点。"""

from __future__ import annotations

from typing import Any, Dict

from app.graph.state import AgentState
from app.runtime.container import AgentContainer


class RuntimeNode:
    """把 Graph 状态交给 RuntimeCoordinator，保留统一轨迹边界。"""

    def __init__(self, container: AgentContainer) -> None:
        self.container = container
        self.tracing = container.tracing

    def runtime(self, state: AgentState) -> Dict[str, Any]:
        self.tracing.start("runtime", state)
        coordinator = getattr(self.container, "coordinator", None)
        if coordinator is None:
            return self.tracing.finish("runtime", state, {
                "status": "blocked",
                "stop_reason": "runtime_coordinator_unavailable",
                "errors": ["Runtime coordinator is not configured"],
            })
        result = coordinator.run(state)
        return self.tracing.finish("runtime", state, result)
