"""Top-level Runtime coordinator used by the Graph execution layer."""

from __future__ import annotations

from typing import Any, Mapping

from .action import ActionModel
from .jev import GoalEvent, JEVParser
from .loop_engine import LoopEngine, LoopPolicy, LoopResult
from .evaluator import RuntimeEvaluator


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
            "quality_review": "quality",
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
            "constraints": dict(goal_event.constraints),
            "event": dict(goal_event.raw),
            "required_capabilities": list(goal_event.required_capabilities),
            "task_id": initial.get("task_id", ""),
            "trace_id": initial.get("trace_id", ""),
        }
        plan = self.container.planner.plan(goal_event.goal, planner_context)
        evaluator = RuntimeEvaluator(min_evidence_score=0.0, min_confidence=0.0)
        replan_count = 0
        self.container.trace.record(
            type="runtime", name="runtime", node="runtime", agent="runtime",
            event="goal_parsed", task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
            state_change=goal_event.as_dict(), keys=list(goal_event.as_dict()), tool_name="", latency=0.0,
            error="; ".join(goal_event.validation_findings),
        )
        runtime_state = {
            **initial,
            "route": "runtime",
            "route_result": {"intent": "runtime", "target_agent": "runtime", "goal": goal_event.goal},
            "goal_event": goal_event.as_dict(),
            "runtime_plan": plan.as_dict(),
            "runtime_next_index": 0,
            "runtime_outputs": {},
        }

        def step(current: dict[str, Any], _context: Any) -> dict[str, Any]:
            nonlocal plan, replan_count
            index = int(current.get("runtime_next_index") or 0)
            if index >= len(plan.actions):
                return {"state": current, "action": ActionModel.final(), "evidence_score": 1.0, "done": True}
            action = plan.actions[index]
            result = self.container.dispatcher.dispatch(action, current)
            if not result.success:
                policy_status = str(result.output.get("policy_status") or "")
                if policy_status in {"deny", "require_approval"}:
                    policy_output = dict(result.output or {})
                    next_state = {
                        **current,
                        "runtime_policy": {
                            "status": policy_status,
                            "reason": str(policy_output.get("reason") or "policy_denied"),
                            "risk_level": str(policy_output.get("risk_level") or "normal"),
                            "missing_evidence": list(policy_output.get("missing_evidence") or []),
                        },
                    }
                    return {
                        "state": next_state,
                        "action": action,
                        "terminal_status": "waiting_approval" if policy_status == "require_approval" else "blocked",
                        "terminal_reason": str(policy_output.get("reason") or "policy_denied"),
                        "evidence_ids": [],
                        "evidence_score": 0.0,
                        "confidence": None,
                        "done": False,
                    }
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
                next_state["status"] = "waiting_repair"
            domain = self._domain_for_capability(capability)
            evaluation = evaluator.evaluate({"domain": domain, "result": dict(result.output or {})})
            self.container.trace.record(
                type="runtime", name="runtime_evaluator", node="runtime", agent="runtime",
                event="evaluation_result", task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                state_change={
                    "capability": capability,
                    "domain": domain,
                    "status": evaluation.status.value,
                    "reason": evaluation.reason,
                    "confidence": evaluation.confidence,
                    "evidence_score": evaluation.evidence_score,
                    "missing_evidence": list(evaluation.missing_evidence),
                },
                keys=["capability", "domain", "status", "reason", "confidence", "evidence_score", "missing_evidence"],
                tool_name="", latency=0.0, error="",
            )
            if evaluation.status.value == "replan":
                if replan_count < 2:
                    replan_count += 1
                    requested = self._replan_capabilities(capability, result.output or {}, plan.actions[index + 1:])
                    replan_context = {
                        **planner_context,
                        **next_state,
                        "required_capabilities": requested,
                        "replan_reason": evaluation.reason,
                        "missing_evidence": list(evaluation.missing_evidence),
                    }
                    plan = self.container.planner.plan(goal_event.goal, replan_context)
                    next_state["runtime_next_index"] = 0
                    next_state["runtime_plan"] = plan.as_dict()
                    next_state["runtime_replan_count"] = replan_count
                    self.container.trace.record(
                        type="runtime", name="runtime", node="runtime", agent="runtime", event="replan",
                        task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                        state_change={"reason": evaluation.reason, "missing_evidence": list(evaluation.missing_evidence),
                                      "actions": [item.as_dict() for item in plan.actions]},
                        keys=["reason", "missing_evidence", "actions"], tool_name="", latency=0.0, error="",
                    )
                else:
                    # A repeated replan request is a terminal safety condition.
                    # Do not continue into side effects (for example, creating a
                    # work order) while the preceding evidence remains invalid.
                    result.output = {
                        **dict(result.output or {}),
                        "status": "blocked",
                        "reason": "replan_limit_exceeded",
                    }
            elif result.next_actions:
                # Agents may observe evidence that changes the next useful
                # capability.  Keep the decision inside the Runtime contract:
                # extract capability requirements, ask Planner for a new
                # Action plan, then let the normal dispatcher select the
                # registered Agent.  Never execute an Agent suggestion
                # directly from the outer loop.
                requested = self._next_action_capabilities(
                    result.next_actions,
                    plan.actions[index + 1:],
                )
                remaining = [
                    item.required_capability
                    for item in plan.actions[index + 1:]
                    if item.required_capability
                ]
                if requested and requested != remaining and replan_count < 2:
                    replan_count += 1
                    replan_context = {
                        **planner_context,
                        **next_state,
                        "required_capabilities": requested,
                        "next_actions": list(result.next_actions),
                        "replan_reason": "agent_next_actions",
                    }
                    plan = self.container.planner.plan(goal_event.goal, replan_context)
                    next_state["runtime_next_index"] = 0
                    next_state["runtime_plan"] = plan.as_dict()
                    next_state["runtime_replan_count"] = replan_count
                    self.container.trace.record(
                        type="runtime", name="runtime", node="runtime", agent="runtime", event="replan",
                        task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                        state_change={
                            "reason": "agent_next_actions",
                            "requested_capabilities": requested,
                            "actions": [item.as_dict() for item in plan.actions],
                        },
                        keys=["reason", "requested_capabilities", "actions"],
                        tool_name="", latency=0.0, error="",
                    )
            return {
                "state": next_state,
                "action": action,
                # Domain evaluators decide whether an action needs replanning;
                # only a replan is propagated to LoopEngine. A domain FINAL is
                # not the end of the overall plan.
                "domain": domain if evaluation.status.value == "replan" else "",
                "result": dict(result.output or {}) if evaluation.status.value == "replan" else {},
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

        execution_manager = getattr(self.container, "execution_manager", None)
        execution_timeout = float(getattr(execution_manager, "timeout_seconds", 30.0))
        result: LoopResult = LoopEngine(
            LoopPolicy(
                max_iterations=max(1, len(plan.actions) * 3 + 2),
                min_evidence_score=0.0,
                timeout_seconds=max(1.0, execution_timeout + 1.0),
            ),
        ).run(
            runtime_state,
            step,
            evaluator=evaluator,
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
        final_state["runtime_actions"] = list(result.actions)
        if result.status != "completed":
            final_state["status"] = result.status
            final_state["stop_reason"] = result.stop_reason
        return final_state

    @staticmethod
    def _domain_for_capability(capability: str) -> str:
        if capability in {"fault_analysis", "hypothesis_generation", "diagnosis_review"}:
            return "diagnosis"
        if capability in {"document_search", "historical_case_search", "evidence_retrieval"}:
            return "knowledge"
        if capability in {"drawing_search", "bom_query", "component_relation"}:
            return "cad"
        if capability in {"repair_planning", "repair_plan", "maintenance_replan"}:
            return "maintenance"
        if capability in {"experience_learning", "experience_retrieval"}:
            return "learning"
        return ""

    @staticmethod
    def _replan_capabilities(capability: str, output: Mapping[str, Any], remaining: list[ActionModel]) -> list[str]:
        if capability in {"fault_analysis", "diagnosis_review"}:
            return ["document_search", "diagnosis_review"]
        if capability in {"repair_planning", "repair_plan", "maintenance_replan"}:
            return ["maintenance_replan", "workorder_create"]
        return [item.required_capability for item in remaining if item.required_capability] or [capability]

    @staticmethod
    def _next_action_capabilities(next_actions: list[Any], remaining: list[ActionModel]) -> list[str]:
        """Extract planner inputs from an AgentResult.next_actions envelope.

        Only explicit capability requirements are accepted.  This preserves
        the Action → Registry → Agent boundary and keeps free-form Agent
        output from becoming an implicit dispatcher command.
        """
        requested: list[str] = []
        for item in next_actions:
            if isinstance(item, str):
                capability = item.strip()
            elif isinstance(item, Mapping):
                payload = item.get("payload")
                payload = payload if isinstance(payload, Mapping) else {}
                capability = (
                    item.get("required_capability")
                    or item.get("capability")
                    or payload.get("required_capability")
                    or ""
                )
                capability = str(capability).strip()
            else:
                capability = ""
            if capability and capability not in requested:
                requested.append(capability)

        # Preserve unfinished planned work after Agent-requested capabilities
        # unless the Agent explicitly requested the same capability sequence.
        for action in remaining:
            capability = action.required_capability
            if capability and capability not in requested:
                requested.append(capability)
        return requested

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
