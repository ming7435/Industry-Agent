"""Node execution tracing, separate from Graph state transformations."""
from __future__ import annotations
from time import perf_counter
from typing import Any, Dict, Mapping
from app.harness import TraceRecorder

class NodeTrace:
    def __init__(self, trace: TraceRecorder) -> None:
        self.trace = trace
        self._node_started_at: dict[tuple[str, str], float] = {}
        self._node_snapshots: dict[tuple[str, str], dict[str, Any]] = {}

    def start(self, name: str, state: Mapping[str, Any]) -> None:
        task_id = str(state.get("task_id", ""))
        key = (task_id, name)
        self._node_started_at[key] = perf_counter()
        self._node_snapshots[key] = dict(state)
        self.trace.record(
            type="node", name=name, node=name, agent=self._node_agent(name),
            event="node_started", task_id=task_id, trace_id=str(state.get("trace_id", "")), state_change={},
            tool_name="", latency=0.0, error="",
        )

    def finish(self, name: str, state: Mapping[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        task_id = str(state.get("task_id", ""))
        key = (task_id, name)
        started = self._node_started_at.pop(key, perf_counter())
        before = self._node_snapshots.pop(key, {})
        changed = [field for field in set(before) | set(payload) if before.get(field) != payload.get(field)]
        self.trace.record(
            type="node", name=name, node=name, agent=self._node_agent(name),
            event="node_completed", task_id=task_id, trace_id=str(state.get("trace_id", "")), keys=list(payload),
            state_change={"changed_keys": sorted(changed), "output_keys": list(payload)},
            tool_name="", latency=perf_counter() - started,
            error="; ".join(str(item) for item in payload.get("errors", []) if item),
        )
        return payload

    def loop_event(self, loop_name: str, state: Mapping[str, Any], event: str, payload: Mapping[str, Any] | None = None) -> None:
        """Record runtime loop lifecycle events with the active task/trace scope."""

        self.trace.record(
            type="loop", name=loop_name, node=loop_name, agent="runtime",
            event=event, task_id=str(state.get("task_id", "")),
            trace_id=str(state.get("trace_id", "")), state_change=dict(payload or {}),
            keys=list((payload or {}).keys()), tool_name="", latency=0.0, error="",
        )

    @staticmethod
    def _node_agent(name: str) -> str:
        return {
            "runtime": "runtime",
            "route": "router",
            "diagnosis": "diagnosis",
            "knowledge": "knowledge",
            "cad": "cad",
            "maintenance": "maintenance",
            "quality": "quality",
            "workorder": "workorder",
            "workorder_action": "workorder",
            "workorder_query": "workorder",
            "memory": "memory",
            "report": "report",
        }.get(name, name)
