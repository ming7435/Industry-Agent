"""Top-level Runtime coordinator used by the Graph execution layer."""

from __future__ import annotations

from typing import Any, Mapping

from .action import ActionModel
from .jev import GoalEvent, JEVParser
from .loop_engine import LoopEngine, LoopPolicy, LoopResult


class RuntimeCoordinator:
    """Run a bounded Planner → Action → Agent loop for one Goal/Event."""

    def __init__(self, container: Any) -> None:
        self.container = container
        self.jev = JEVParser()

    @staticmethod
    def _result_key(capability: str) -> str:
        return {
            "fault_analysis": "diagnosis",
            "document_search": "knowledge",
            "historical_case_search": "knowledge",
            "evidence_retrieval": "knowledge",
            "drawing_search": "cad",
            "bom_query": "cad",
            "component_relation": "cad",
            "repair_planning": "maintenance_plan",
            "repair_plan": "maintenance_plan",
            "maintenance_replan": "maintenance_plan",
            "workorder_create": "workorder",
            "workorder_update": "workorder",
            "quality_inspection": "quality",
            "experience_learning": "memory",
            "experience_retrieval": "memory",
            "case_reporting": "report",
        }.get(capability, capability.replace(".", "_"))

    def run(self, state: Mapping[str, Any]) -> dict[str, Any]:
        initial = dict(state)
        source_payload = dict(initial.get("event") or {}) if initial.get("entry") == "trigger" else {
            "user_text": initial.get("user_text", ""),
            **dict(initial.get("context") or {}),
        }
        goal_event: GoalEvent = self.jev.parse(source_payload)
        planner_context = {
            **goal_event.entities,
            "event": dict(goal_event.raw),
            "required_capabilities": list(goal_event.required_capabilities),
            "task_id": initial.get("task_id", ""),
            "trace_id": initial.get("trace_id", ""),
        }
        plan = self.container.planner.plan(goal_event.goal, planner_context)
        self.container.trace.record(
            type="runtime", name="runtime", node="runtime", agent="runtime",
            event="goal_parsed", task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
            state_change=goal_event.as_dict(), keys=list(goal_event.as_dict()), tool_name="", latency=0.0, error="",
        )
        runtime_state = {
            **initial,
            "goal_event": goal_event.as_dict(),
            "runtime_plan": plan.as_dict(),
            "runtime_next_index": 0,
            "runtime_outputs": {},
        }

        def step(current: dict[str, Any], _context: Any) -> dict[str, Any]:
            index = int(current.get("runtime_next_index") or 0)
            if index >= len(plan.actions):
                return {"state": current, "action": ActionModel.final(), "evidence_score": 1.0, "done": True}
            action = plan.actions[index]
            result = self.container.dispatcher.dispatch(action, current)
            if not result.success:
                raise RuntimeError(str(result.output.get("error") or "Runtime Action failed"))
            capability = action.required_capability or action.target
            outputs = dict(current.get("runtime_outputs") or {})
            outputs[self._result_key(capability)] = result.output
            next_state = {
                **current,
                "runtime_next_index": index + 1,
                "runtime_outputs": outputs,
                self._result_key(capability): result.output,
                "evidence_status": "ready" if result.evidence else "pending",
            }
            if capability == "workorder_create":
                next_state["status"] = str(result.output.get("status") or "waiting_repair")
            return {
                "state": next_state,
                "action": action,
                "evidence_ids": self._evidence_ids(result.evidence) or ["action:%s" % capability],
                "evidence_score": result.confidence if result.confidence else (1.0 if result.evidence else 0.0),
                # The plan loop is a bounded action sequence, not a confidence
                # review loop; domain confidence is retained in the AgentResult
                # output and must not prematurely stop the remaining Actions.
                "confidence": None,
                "done": False,
            }

        def trace(event: str, payload: dict[str, Any]) -> None:
            self.container.trace.record(
                type="loop", name="runtime", node="runtime", agent="runtime", event=event,
                task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                state_change=dict(payload), keys=list(payload), tool_name="", latency=0.0, error="",
            )

        result: LoopResult = LoopEngine(
            LoopPolicy(max_iterations=max(1, len(plan.actions) + 1), min_evidence_score=0.0),
        ).run(
            runtime_state,
            step,
            trace=trace,
            trace_context={"task_id": initial.get("task_id", ""), "trace_id": initial.get("trace_id", "")},
        )
        final_state = dict(result.state)
        final_state["runtime_result"] = {
            "status": result.status,
            "stop_reason": result.stop_reason,
            "iterations": result.iterations,
            "evidence_score": result.evidence_score,
            "actions": list(result.actions),
            "history": list(result.history),
        }
        if result.status != "completed":
            final_state["status"] = "blocked"
            final_state["stop_reason"] = result.stop_reason
        return final_state

    @staticmethod
    def _evidence_ids(items: list[Any]) -> list[str]:
        values: list[str] = []
        for item in items:
            if isinstance(item, Mapping):
                value = item.get("id") or item.get("document_id") or item.get("component_id") or item.get("content")
            else:
                value = item
            if value:
                values.append(str(value))
        return values


__all__ = ["RuntimeCoordinator"]
