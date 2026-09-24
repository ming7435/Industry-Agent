"""Capability-driven Runtime Action dispatcher."""

from __future__ import annotations

from typing import Any, Mapping

from app.agents.base import AgentResult
from app.harness import TraceRecorder
from app.tools.registry import ToolRegistry

from .action import ActionModel, ActionType
from .capability import CapabilityRegistry
from .execution import ExecutionManager, ExecutionStatus


def action_key(state: Mapping[str, Any], payload: Mapping[str, Any]) -> str:
    return str(
        payload.get("idempotency_key")
        or state.get("event", {}).get("event_id")
        or state.get("task_id")
        or ""
    )


class RuntimeDispatcher:
    """Resolve and execute Actions without hard-coded Agent sequencing."""

    def __init__(
        self,
        capabilities: CapabilityRegistry,
        execution_manager: ExecutionManager,
        trace: TraceRecorder | None = None,
        tools: ToolRegistry | None = None,
        harnesses: Mapping[str, Any] | None = None,
    ) -> None:
        self.capabilities = capabilities
        self.execution_manager = execution_manager
        self.trace = trace or TraceRecorder()
        self.tools = tools
        self.harnesses = dict(harnesses or {})

    def _emit(self, event: str, state: Mapping[str, Any], **payload: Any) -> None:
        record = {
            "type": "runtime",
            "name": "runtime_dispatcher",
            "node": "runtime",
            "agent": "runtime",
            "event": event,
            "task_id": str(state.get("task_id") or ""),
            "trace_id": str(state.get("trace_id") or ""),
            "state_change": dict(payload),
            "keys": list(payload),
            "tool_name": "",
            "latency": 0.0,
            "error": str(payload.get("error") or ""),
        }
        record.update(payload)
        self.trace.record(**record)

    def dispatch(self, action: ActionModel, state: Mapping[str, Any] | None = None) -> AgentResult:
        action = ActionModel.coerce(action)
        if action is None:
            return AgentResult(success=False, output={"error": "missing action"})
        current = dict(state or {})
        self._emit("action_selected", current, action=action.as_dict())

        if action.action_type == ActionType.TOOL:
            return self._dispatch_tool(action, current)
        if action.action_type in {ActionType.FINAL, ActionType.WAIT, ActionType.REPLAN}:
            return AgentResult(success=True, output={"status": action.kind, **dict(action.payload)})
        return self._dispatch_agent(action, current)

    def _dispatch_agent(self, action: ActionModel, state: dict[str, Any]) -> AgentResult:
        capability = action.required_capability or action.target
        agent = self.capabilities.resolve_agent(capability)
        if agent is None:
            error = "capability not registered: %s" % capability
            self._emit("capability_blocked", state, required_capability=capability, error=error)
            return AgentResult(success=False, output={"error": error, "status": "blocked"})
        agent_name = str(getattr(agent, "name", type(agent).__name__))
        self._emit("capability_selected", state, required_capability=capability, agent=agent_name)
        task = self._task_for_agent(capability, state, action.payload)

        record = self.execution_manager.execute(
            action,
            lambda: self.harnesses[agent_name].execute_once(task)
            if agent_name in self.harnesses
            else (agent.execute(task) if callable(getattr(agent, "execute", None)) else agent.run(task)),
            trace_context={"task_id": state.get("task_id", ""), "trace_id": state.get("trace_id", "")},
        )
        if record.status != ExecutionStatus.SUCCESS:
            return AgentResult(
                success=False,
                output={"error": record.error or record.status.value, "status": "blocked", "execution_id": record.execution_id},
            )
        return AgentResult.from_value(record.result)

    @staticmethod
    def _task_for_agent(capability: str, state: Mapping[str, Any], payload: Mapping[str, Any]) -> dict[str, Any]:
        """Adapt the canonical Runtime state to an existing Agent's request shape."""

        current = {**dict(state), **dict(payload)}
        if capability == "fault_analysis":
            event = dict(state.get("event") or payload.get("event") or current)
            event.setdefault("task_id", state.get("task_id", ""))
            event.setdefault("trace_id", state.get("trace_id", ""))
            return event
        diagnosis = dict(state.get("diagnosis") or {})
        query = str(
            diagnosis.get("fault")
            or diagnosis.get("summary")
            or diagnosis.get("diagnosis")
            or state.get("user_text")
            or payload.get("goal")
            or "工业设备维修"
        )
        if capability in {"document_search", "historical_case_search", "evidence_retrieval"}:
            return {"query": query, "diagnosis": diagnosis, "context": dict(state.get("context") or {})}
        if capability in {"drawing_search", "bom_query", "component_relation"}:
            context = dict(state.get("context") or {})
            return {"query": query, "device_id": diagnosis.get("device_id") or context.get("device_id", "")}
        if capability in {"repair_planning", "repair_plan", "maintenance_replan"}:
            return {
                "diagnosis": diagnosis,
                "knowledge": dict(state.get("knowledge") or {}),
                "cad": dict(state.get("cad") or {}),
                "memory": dict(state.get("memory") or {}),
                "event_id": state.get("event", {}).get("event_id", ""),
                "context": dict(state.get("context") or {}),
            }
        if capability in {"workorder_create", "workorder_update"}:
            return {
                "action": "create" if capability == "workorder_create" else "update",
                "maintenance_plan": dict(state.get("maintenance_plan") or {}),
                "diagnosis": diagnosis,
                "event_id": state.get("event", {}).get("event_id", ""),
                "idempotency_key": action_key(state, payload),
            }
        if capability in {"quality_inspection", "quality_review"}:
            context = dict(state.get("context") or {})
            return {
                **current,
                "part_id": payload.get("part_id") or context.get("part_id") or state.get("event", {}).get("part_id", ""),
            }
        if capability in {"experience_learning", "experience_retrieval"}:
            return {
                **current,
                "action": "learn" if capability == "experience_learning" else "search",
                "workorder": dict(state.get("workorder") or {}),
                "repair_feedback": dict(state.get("repair_feedback") or {}),
                "repair_verification": dict(state.get("repair_verification") or {}),
                "query": query,
            }
        return current

    def _dispatch_tool(self, action: ActionModel, state: dict[str, Any]) -> AgentResult:
        if self.tools is None:
            return AgentResult(success=False, output={"error": "tool registry unavailable", "status": "blocked"})
        self._emit("capability_selected", state, required_capability="tool:%s" % action.target, agent="tool")
        record = self.execution_manager.execute(
            action,
            lambda: self.tools.execute(action.target, dict(action.payload)),
            trace_context={"task_id": state.get("task_id", ""), "trace_id": state.get("trace_id", "")},
        )
        if record.status != ExecutionStatus.SUCCESS:
            return AgentResult(success=False, output={"error": record.error or record.status.value, "status": "blocked"})
        return AgentResult.from_value(record.result)


__all__ = ["RuntimeDispatcher"]
