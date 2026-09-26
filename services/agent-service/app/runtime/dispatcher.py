"""Capability-driven Runtime Action dispatcher."""

from __future__ import annotations

from typing import Any, Mapping

from app.agents.base import AgentResult
from app.harness import TraceRecorder
from app.tools.registry import ToolRegistry

from .action import ActionModel, ActionType
from .capability import CapabilityRegistry
from .execution import ExecutionManager, ExecutionStatus
from .policy import PolicyStatus, RuntimePolicy


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
        policy: RuntimePolicy | None = None,
    ) -> None:
        self.capabilities = capabilities
        self.execution_manager = execution_manager
        self.trace = trace or TraceRecorder()
        self.tools = tools
        self.harnesses = dict(harnesses or {})
        self.policy = policy or RuntimePolicy()

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

        decision = self.policy.evaluate(action, current)
        self._emit(
            "policy_decision", current,
            action_id=action.action_id,
            required_capability=action.required_capability or action.target,
            status=decision.status.value,
            reason=decision.reason,
            risk_level=decision.risk_level,
            required_evidence=list(decision.required_evidence),
            missing_evidence=list(decision.missing_evidence),
        )
        if decision.status != PolicyStatus.ALLOW:
            return AgentResult(
                success=False,
                output={
                    "status": "waiting_approval" if decision.status == PolicyStatus.REQUIRE_APPROVAL else "blocked",
                    "policy_status": decision.status.value,
                    "reason": decision.reason,
                    "error": decision.reason,
                    "risk_level": decision.risk_level,
                    "missing_evidence": list(decision.missing_evidence),
                },
            )

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
        self._emit("agent_selected", state, required_capability=capability, agent=agent_name)
        task = self._task_for_agent(capability, state, action.payload)
        task.setdefault("task_id", str(state.get("task_id") or ""))
        task.setdefault("trace_id", str(state.get("trace_id") or ""))
        runtime_context = self._runtime_context(action, state, agent_name)
        task["runtime_context"] = runtime_context
        self._emit(
            "step_started",
            state,
            agent=agent_name,
            skill=runtime_context.get("skill", ""),
            step=runtime_context.get("step", ""),
            required_capability=capability,
        )

        # Diagnosis may already have retrieved the exact knowledge evidence
        # required by this Action. Reuse only a successful, non-degraded record
        # with the same normalized query; all other searches still execute via
        # the registered Knowledge Agent.
        if capability in {"document_search", "historical_case_search", "evidence_retrieval"}:
            cached = self._cached_knowledge_result(state, task)
            if cached is not None:
                self._emit(
                    "evidence_added",
                    state,
                    source="diagnosis_cache",
                    required_capability=capability,
                    evidence_count=len(cached.evidence),
                )
                return cached

        record = self.execution_manager.execute(
            action,
            lambda: self.harnesses[agent_name].execute_once(task)
            if agent_name in self.harnesses
            else (agent.execute(task) if callable(getattr(agent, "execute", None)) else agent.run(task)),
            trace_context={"task_id": state.get("task_id", ""), "trace_id": state.get("trace_id", "")},
        )
        if record.status != ExecutionStatus.SUCCESS:
            self._emit("step_failed", state, agent=agent_name, step=runtime_context.get("step", ""), error=record.error or record.status.value)
            return AgentResult(
                success=False,
                output={"error": record.error or record.status.value, "status": "blocked", "execution_id": record.execution_id},
            )
        result = AgentResult.from_value(record.result)
        if not result.observations and isinstance(record.result, Mapping):
            normalizer = getattr(self.tools, "_normalize_observation", None)
            if callable(normalizer):
                result.observations = [normalizer(action.target, record.result, runtime_context)]
        self._emit(
            "step_completed",
            state,
            agent=agent_name,
            skill=runtime_context.get("skill", ""),
            step=runtime_context.get("step", ""),
            evidence_count=len(result.evidence),
            success=result.success,
        )
        return result

    @staticmethod
    def _conversation_context(context: Mapping[str, Any], query: str) -> str:
        """Carry a bounded short conversation into the current knowledge query."""

        history = context.get("conversation_history")
        if not isinstance(history, list):
            return query
        lines: list[str] = []
        for item in history[-6:]:
            if not isinstance(item, Mapping):
                continue
            role = "用户" if str(item.get("role") or "user") == "user" else "助手"
            content = str(item.get("content") or item.get("text") or "").strip()
            if content:
                lines.append(f"{role}：{content[:1200]}")
        if not lines:
            return query
        return "历史对话：%s\n当前问题：%s" % ("\n".join(lines), query)

    @staticmethod
    def _task_for_agent(capability: str, state: Mapping[str, Any], payload: Mapping[str, Any]) -> dict[str, Any]:
        """Adapt the canonical Runtime state to an existing Agent's request shape."""

        current = {**dict(state), **dict(payload)}
        if capability in {"fault_analysis", "diagnosis_review"}:
            event = dict(state.get("event") or payload.get("event") or current)
            event.setdefault("task_id", state.get("task_id", ""))
            event.setdefault("trace_id", state.get("trace_id", ""))
            event["runtime_managed"] = True
            event["runtime_capability"] = capability
            if capability == "diagnosis_review":
                event["knowledge"] = dict(state.get("knowledge") or {})
                event["runtime_evidence"] = list(state.get("evidence") or [])
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
            context = dict(state.get("context") or {})
            query = RuntimeDispatcher._conversation_context(context, query)
            event = state.get("event")
            event = event if isinstance(event, Mapping) else {}
            # Scope knowledge retrieval only to an active alarm. Runtime event
            # execution carries the current machine/alarm as its scope.
            alarm_active = bool(context.get("alarm_active"))
            event_device_id = str(event.get("device_id") or "").strip()
            event_alarm_code = str(event.get("alarm_code") or event.get("error_code") or "").strip()
            if event_device_id and event_alarm_code:
                alarm_active = True
            scoped = {}
            if alarm_active:
                device_id = str(context.get("device_id") or event_device_id).strip()
                alarm_code = str(context.get("alarm_code") or event_alarm_code).strip()
                if device_id:
                    scoped["device_id"] = device_id
                if alarm_code:
                    scoped["alarm_code"] = alarm_code
                alarm_label = str(context.get("alarm_label") or event.get("alarm_label") or "").strip()
                if alarm_label:
                    scoped["alarm_label"] = alarm_label
            return {"query": query, "diagnosis": diagnosis, "context": context, "alarm_active": alarm_active, **scoped, "filters": dict(scoped)}
        if capability in {"drawing_search", "bom_query", "component_relation"}:
            context = dict(state.get("context") or {})
            event = state.get("event")
            event = event if isinstance(event, Mapping) else {}
            component = str(
                payload.get("component")
                or context.get("component")
                or event.get("component")
                or event.get("component_id")
                or diagnosis.get("component")
                or ""
            )
            part_no = str(
                payload.get("part_no")
                or context.get("part_no")
                or event.get("part_no")
                or diagnosis.get("part_no")
                or ""
            )
            engineering_query = str(
                payload.get("query")
                or component
                or part_no
                or context.get("query")
                or event.get("query")
                or query
            )
            return {
                "query": engineering_query,
                "component": component,
                "part_no": part_no,
                "device_id": diagnosis.get("device_id") or event.get("device_id") or context.get("device_id", ""),
                "device_model": str(payload.get("device_model") or context.get("device_model") or event.get("device_model") or ""),
            }
        if capability in {"repair_planning", "repair_plan", "maintenance_replan"}:
            return {
                "diagnosis": diagnosis,
                "knowledge": dict(state.get("knowledge") or {}),
                "cad": dict(state.get("cad") or {}),
                "memory": dict(state.get("memory") or {}),
                "runtime_managed": True,
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
            event = state.get("event")
            event = event if isinstance(event, Mapping) else {}
            part_no = payload.get("part_no") or context.get("part_no") or event.get("part_no") or ""
            return {
                **current,
                "part_id": payload.get("part_id") or context.get("part_id") or event.get("part_id") or part_no,
                "part_no": part_no,
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

    @staticmethod
    def _cached_knowledge_result(state: Mapping[str, Any], task: Mapping[str, Any]) -> AgentResult | None:
        diagnosis = state.get("diagnosis")
        if not isinstance(diagnosis, Mapping):
            return None
        expected_query = str(task.get("query") or "").strip()
        if not expected_query:
            return None
        records = diagnosis.get("tool_calls") or diagnosis.get("tool_results") or []
        if not isinstance(records, list):
            return None
        for record in records:
            if not isinstance(record, Mapping):
                continue
            name = str(record.get("name") or record.get("tool_name") or "")
            if name not in {
                "search_knowledge",
                "search_alarm_knowledge",
                "search_sop",
                "search_manual",
                "search_fault_cases",
                "search_semantic_memory",
            }:
                continue
            arguments = record.get("arguments") or record.get("input") or {}
            result = record.get("result") or record.get("output") or {}
            if not isinstance(arguments, Mapping) or not isinstance(result, Mapping):
                continue
            query = str(result.get("query") or arguments.get("query") or "").strip()
            if query != expected_query:
                continue
            if result.get("success") is False or result.get("degraded") or result.get("warning") or result.get("error"):
                continue
            evidence = result.get("documents") or result.get("items") or result.get("evidence") or []
            if not isinstance(evidence, list) or not evidence:
                continue
            output = dict(result)
            output.setdefault("query", query)
            output.setdefault("documents", list(evidence))
            try:
                confidence = float(output.get("confidence") or 1.0)
            except (TypeError, ValueError):
                confidence = 1.0
            return AgentResult(
                success=True,
                output=output,
                evidence=list(evidence),
                confidence=max(0.0, min(1.0, confidence)),
            )
        return None

    def _dispatch_tool(self, action: ActionModel, state: dict[str, Any]) -> AgentResult:
        if self.tools is None:
            return AgentResult(success=False, output={"error": "tool registry unavailable", "status": "blocked"})
        self._emit("capability_selected", state, required_capability="tool:%s" % action.target, agent="tool")
        runtime_context = self._runtime_context(action, state, "tool")
        self._emit("step_started", state, agent="tool", skill=runtime_context.get("skill", ""), step=runtime_context.get("step", ""), tool=action.target)
        record = self.execution_manager.execute(
            action,
            lambda: self.tools.execute(action.target, dict(action.payload), context=runtime_context),
            trace_context={"task_id": state.get("task_id", ""), "trace_id": state.get("trace_id", "")},
        )
        if record.status != ExecutionStatus.SUCCESS:
            self._emit("step_failed", state, agent="tool", step=runtime_context.get("step", ""), error=record.error or record.status.value)
            return AgentResult(success=False, output={"error": record.error or record.status.value, "status": "blocked"})
        result = AgentResult.from_value(record.result)
        self._emit("step_completed", state, agent="tool", skill=runtime_context.get("skill", ""), step=runtime_context.get("step", ""), tool=action.target, evidence_count=len(result.evidence), success=result.success)
        return result

    @staticmethod
    def _runtime_context(action: ActionModel, state: Mapping[str, Any], agent: str) -> dict[str, Any]:
        payload = dict(action.payload)
        skills = payload.get("active_skills") or payload.get("skills") or []
        if isinstance(skills, str):
            skills = [skills]
        allowed_tools = payload.get("allowed_tools") or []
        if isinstance(allowed_tools, str):
            allowed_tools = [allowed_tools]
        return {
            "agent": agent,
            "skill": str(payload.get("skill") or (skills[0] if skills else "")),
            "skills": [str(item) for item in skills if str(item).strip()],
            "step": str(payload.get("step") or payload.get("current_step") or ""),
            "allowed_tools": [str(item) for item in allowed_tools if str(item).strip()],
            "task_id": str(state.get("task_id") or ""),
            "trace_id": str(state.get("trace_id") or ""),
        }


__all__ = ["RuntimeDispatcher"]
