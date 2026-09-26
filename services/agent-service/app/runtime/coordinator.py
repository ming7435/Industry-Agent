"""Top-level Runtime coordinator used by the Graph execution layer."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping

from .action import ActionModel
from .jev import GoalEvent, JEVParser
from .loop_engine import LoopEngine, LoopPolicy, LoopResult
from .evaluator import RuntimeEvaluator
from .capability import build_capability_registry
from app.skills import get_skill_registry


class RuntimeCoordinator:
    """Run a bounded Planner → Action → Agent loop for one Goal/Event."""

    def __init__(self, container: Any) -> None:
        self.container = container
        self.jev = JEVParser()
        # Small compatibility containers used by direct Runtime tests may
        # provide only planner/dispatcher/trace. Keep the metadata boundary
        # available without requiring the full application container.
        self.capabilities = (
            getattr(container, "capabilities", None)
            or getattr(getattr(container, "dispatcher", None), "capabilities", None)
            or build_capability_registry()
        )

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
        resume = initial.get("runtime_resume")
        if isinstance(resume, Mapping) and isinstance(resume.get("plan"), Mapping):
            plan = self._plan_from_dict(resume["plan"], goal_event.goal)
            resume_index = int(resume.get("next_index") or 0)
        else:
            plan = self.container.planner.plan(goal_event.goal, planner_context)
            resume_index = 0
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
            "runtime_next_index": resume_index,
            "runtime_outputs": dict(initial.get("runtime_outputs") or {}),
            "active_agent": "runtime",
            "active_skills": [],
            "current_step": "",
            "step_history": list(initial.get("step_history") or []),
            "completed_steps": list(initial.get("completed_steps") or []),
            "failed_steps": list(initial.get("failed_steps") or []),
            "tool_calls": list(initial.get("tool_calls") or []),
            "observations": list(initial.get("observations") or []),
            "evidence": list(initial.get("evidence") or []),
            "evidence_records": list(initial.get("evidence_records") or []),
            "validation": dict(initial.get("validation") or {}),
            "validation_results": list(initial.get("validation_results") or []),
            "next_action": {},
        }

        def step(current: dict[str, Any], _context: Any) -> dict[str, Any]:
            nonlocal plan, replan_count
            index = int(current.get("runtime_next_index") or 0)
            if index >= len(plan.actions):
                return {"state": current, "action": ActionModel.final(), "evidence_score": 1.0, "done": True}
            action = self._enrich_action(plan.actions[index], current)
            step_started_at = datetime.now(timezone.utc).isoformat()
            current = {
                **current,
                "active_agent": str(action.payload.get("agent") or action.target),
                "active_skills": list(action.payload.get("active_skills") or []),
                "current_step": str(action.payload.get("step") or ""),
                "next_action": action.as_dict(),
            }
            self.container.trace.record(
                type="runtime", name="runtime", node="runtime", agent=str(current.get("active_agent") or "runtime"),
                event="skill_selected", task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                state_change={"skills": list(current.get("active_skills") or []), "step": current.get("current_step", ""), "action": action.as_dict()},
                keys=["skills", "step", "action"], tool_name="", latency=0.0, error="",
            )
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
                        "failed_steps": [
                            *list(current.get("failed_steps") or []),
                            {"step": action.payload.get("step", ""), "agent": action.payload.get("agent", ""), "reason": policy_output.get("reason", "")},
                        ],
                        "step_history": [
                            *list(current.get("step_history") or []),
                            {
                                "step_id": action.step,
                                "started_at": step_started_at,
                                "completed_at": datetime.now(timezone.utc).isoformat(),
                                "status": "failed",
                                "input_keys": sorted(action.payload),
                                "output_keys": sorted(policy_output),
                                "tool": action.target if action.action_type.value == "TOOL" else "",
                                "error": str(policy_output.get("reason") or "policy_denied"),
                            },
                        ],
                    }
                    if policy_status == "require_approval":
                        approvals = getattr(self.container, "approvals", None)
                        if approvals is not None:
                            pending_state = {
                                **current,
                                "runtime_plan": plan.as_dict(),
                                "runtime_next_index": index,
                            }
                            pending = approvals.create_pending(
                                action=action.as_dict(),
                                state=pending_state,
                                plan=plan.as_dict(),
                                next_index=index,
                                policy=policy_output,
                            )
                            next_state["runtime_pending_task"] = pending
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
                current["failed_steps"] = [
                    *list(current.get("failed_steps") or []),
                    {"step": action.step, "agent": action.target, "reason": str(result.output.get("error") or "Runtime Action failed")},
                ]
                current["step_history"] = [
                    *list(current.get("step_history") or []),
                    {
                        "step_id": action.step,
                        "started_at": step_started_at,
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                        "status": "failed",
                        "input_keys": sorted(action.payload),
                        "output_keys": sorted(result.output or {}),
                        "tool": action.target if action.action_type.value == "TOOL" else "",
                        "error": str(result.output.get("error") or "Runtime Action failed"),
                    },
                ]
                raise RuntimeError(str(result.output.get("error") or "Runtime Action failed"))
            capability = action.required_capability or action.target
            canonical_capability = self.capabilities.canonical_name(capability)
            outputs = dict(current.get("runtime_outputs") or {})
            result_key = self.capabilities.result_key_for(capability)
            outputs[result_key] = result.output
            result_tool_calls = result.output.get("tool_calls") if isinstance(result.output, Mapping) else []
            if not isinstance(result_tool_calls, list):
                result_tool_calls = []
            validation_payload = dict(result.validation or {
                "passed": True,
                "checks": {},
                "findings": [],
                "missing": [],
                "recommended_action": {"type": "continue", "reason": "no_domain_validator"},
            })
            next_state = {
                **current,
                "runtime_next_index": index + 1,
                "runtime_outputs": outputs,
                result_key: result.output,
                "evidence_status": "ready" if result.evidence else "pending",
                "active_agent": str(action.payload.get("agent") or action.target),
                "active_skills": list(action.payload.get("active_skills") or []),
                "current_step": str(action.payload.get("step") or ""),
                "completed_steps": [
                    *list(current.get("completed_steps") or []),
                    {"step": action.payload.get("step", ""), "agent": action.payload.get("agent", ""), "action_id": action.action_id, "success": result.success},
                ],
                "tool_calls": [*list(current.get("tool_calls") or []), *result_tool_calls],
                "step_history": [
                    *list(current.get("step_history") or []),
                    {
                        "step_id": action.step,
                        "started_at": step_started_at,
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                        "status": "completed" if result.success else "failed",
                        "input_keys": sorted(action.payload),
                        "output_keys": sorted(result.output or {}),
                        "tool": action.target if action.action_type.value == "TOOL" else "",
                        "error": "",
                    },
                ],
                "observations": [*list(current.get("observations") or []), *list(result.observations or [])],
                "evidence": [*list(current.get("evidence") or []), *list(result.evidence or [])],
                "evidence_records": [*list(current.get("evidence_records") or []), *list(result.evidence or [])],
                "validation": validation_payload,
                "validation_results": [*list(current.get("validation_results") or []), validation_payload],
                "next_action": (
                    self._enrich_action(plan.actions[index + 1], current).as_dict()
                    if index + 1 < len(plan.actions)
                    else {"action_type": "FINAL", "target": "final", "reason": "planned_actions_complete"}
                ),
            }
            if canonical_capability == "workorder_create":
                next_state["status"] = "waiting_repair"
            domain = self.capabilities.domain_for(capability)
            trace_agent = str(action.payload.get("agent") or action.target)
            if result.observations:
                self.container.trace.record(
                    type="runtime", name="runtime", node="runtime", agent=trace_agent,
                    event="observation_added", task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                    state_change={"observations": list(result.observations), "step": action.payload.get("step", "")},
                    keys=["observations", "step"], tool_name="", latency=0.0, error="",
                )
            if result.evidence:
                self.container.trace.record(
                    type="runtime", name="runtime", node="runtime", agent=trace_agent,
                    event="evidence_added", task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                    state_change={"evidence": list(result.evidence), "step": action.payload.get("step", "")},
                    keys=["evidence", "step"], tool_name="", latency=0.0, error="",
                )
            self.container.trace.record(
                type="runtime", name="runtime", node="runtime", agent=trace_agent,
                event="validation_result", task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                state_change={"validation": validation_payload, "step": action.payload.get("step", "")},
                keys=["validation", "step"], tool_name="", latency=0.0, error="",
            )
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
                    "recommended_action": evaluation.recommended_action,
                },
                keys=["capability", "domain", "status", "reason", "confidence", "evidence_score", "missing_evidence"],
                tool_name="", latency=0.0, error="",
            )
            self.container.trace.record(
                type="runtime", name="runtime_evaluator", node="runtime", agent="runtime",
                event="decision", task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                state_change={"status": evaluation.status.value, "reason": evaluation.reason, "recommended_action": evaluation.recommended_action},
                keys=["status", "reason", "recommended_action"], tool_name="", latency=0.0, error="",
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

    def _enrich_action(self, action: ActionModel, state: Mapping[str, Any]) -> ActionModel:
        """Attach Skill-derived execution metadata to a canonical Action."""

        payload = dict(action.payload)
        capability = action.required_capability or action.target
        registry = get_skill_registry()
        agent = ""
        try:
            matches = self.capabilities.find(capability)
            agent = str(matches[0]) if matches else ""
        except Exception:
            agent = ""
        agent = agent or str(payload.get("agent") or action.target).split(".", 1)[0]
        names = payload.get("active_skills") or payload.get("skills")
        if isinstance(names, str):
            names = [names]
        try:
            selected = registry.select(agent, context={**dict(state.get("context") or {}), "capability": capability}, names=list(names or []))
        except Exception:
            selected = []
        skill_names = [item.name for item in selected]
        steps = [step for item in selected for step in item.normalized_steps()]
        payload.setdefault("agent", agent)
        payload.setdefault("active_skills", skill_names)
        if steps:
            payload.setdefault("skill", skill_names[0] if skill_names else "")
            payload.setdefault("step", steps[0].id)
            # Existing Agent graphs may execute several Skill steps inside one
            # Runtime action.  The guard receives the union of that Agent's
            # declared tools unless the Action explicitly narrows it.
            payload.setdefault("allowed_tools", registry.merge_tools(registry.list(agent)))
        return action.model_copy(update={"payload": payload})

    def resume_pending(self, record: Mapping[str, Any]) -> dict[str, Any]:
        """Resume the persisted Action without invoking Planner again."""

        state = dict(record.get("state") or {})
        action = dict(record.get("action") or {})
        payload = action.get("payload")
        payload = payload if isinstance(payload, Mapping) else {}
        capability = str(payload.get("required_capability") or action.get("target") or "")
        context = dict(state.get("context") or {})
        approved = set(context.get("approved_capabilities") or [])
        if capability:
            approved.add(capability)
        context.update({"approval_granted": True, "approved_capabilities": sorted(approved)})
        state.update({
            "context": context,
            "runtime_resume": {
                "plan": dict(record.get("plan") or {}),
                "next_index": int(record.get("next_index") or 0),
                "pending_id": str(record.get("pending_id") or ""),
            },
        })
        return self.run(state)

    @staticmethod
    def _plan_from_dict(value: Mapping[str, Any], goal: str) -> Any:
        from .planner import Plan

        actions = [ActionModel.coerce(item) for item in value.get("actions") or []]
        return Plan(
            goal=str(value.get("goal") or goal),
            actions=[item for item in actions if item is not None],
            metadata=dict(value.get("metadata") or {}),
        )

    def _replan_capabilities(self, capability: str, output: Mapping[str, Any], remaining: list[ActionModel]) -> list[str]:
        definition = self.capabilities.get(capability)
        if definition and definition.replan_capabilities:
            return list(definition.replan_capabilities)
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
