"""LangGraph nodes: map shared State to Agent inputs and result updates."""
from __future__ import annotations
from typing import Any, Dict
import os
from app.a2a.client import A2AError
from app.common.serialization import _serialize_agent_result
from app.graph.state import AgentState
from app.runtime import evidence as evidence_loop
from app.runtime.action import ActionModel
from app.runtime.container import AgentContainer
from app.runtime.loop_engine import LoopEngine, LoopPolicy

class OrchestratorNodes:
    def __init__(self, container: AgentContainer) -> None:
        self.container = container
        self.requests = container.requests
        self.tracing = container.tracing

    def _loop_trace(self, name: str, state: AgentState, event: str, payload: Dict[str, Any]) -> None:
        recorder = getattr(self.tracing, "loop_event", None)
        if recorder is not None:
            recorder(name, state, event, payload)

    @staticmethod
    def _evidence_ids(payload: Dict[str, Any]) -> list[str]:
        values = payload.get("evidence_ids")
        if isinstance(values, list):
            return [str(value) for value in values if value]
        ids: list[str] = []
        for key in ("documents", "evidence", "components", "parts"):
            for item in payload.get(key) or []:
                if isinstance(item, dict):
                    value = item.get("id") or item.get("document_id") or item.get("component_id") or item.get("part_no") or item.get("content")
                    if value:
                        ids.append(str(value))
        return ids

    def route(self, state: AgentState) -> Dict[str, Any]:
        self.tracing.start("route", state)
        if state.get("entry") == "trigger":
            payload = {"route": "diagnosis", "route_result": {"intent": "diagnosis", "target_agent": "diagnosis", "confidence": 1.0, "reason": "设备异常自动触发"}}
        else:
            result = self.container.harnesses["router"].execute_agent({
                "user_text": state.get("user_text", ""),
                "context": state.get("context", {}),
            })
            route_result = _serialize_agent_result(result)
            context = {**dict(state.get("context") or {}), **dict(route_result.get("target_input") or {})}
            payload = {"route": result.intent, "route_result": route_result, "context": context}
        return self.tracing.finish("route", state, payload)

    def diagnosis(self, state: AgentState) -> Dict[str, Any]:
        self.tracing.start("diagnosis", state)
        event = dict(state.get("event") or {})
        if not event:
            event = {
                "event_id": "USER-" + state["task_id"],
                "device_id": "unknown",
                "event_type": "user_question",
                "severity": "unknown",
                "abnormal_metrics": [],
                "realtime_snapshot": {},
                "timestamp": state.get("task_id", ""),
            }
        context = dict(state.get("context") or {})
        review_enabled = state.get("entry") == "trigger" or bool(context.get("enable_diagnosis_review_loop"))

        def observe_diagnosis(loop_state: Dict[str, Any], _loop_context: Any) -> Dict[str, Any]:
            diagnosis_result = dict(loop_state.get("diagnosis") or {})
            return {
                "domain": "diagnosis", "result": diagnosis_result,
                "evidence_ids": self._evidence_ids(diagnosis_result),
            }

        def select_diagnosis_action(_loop_state: Dict[str, Any], evaluation: Any, loop_context: Any) -> ActionModel:
            action_type = "replan" if getattr(evaluation.status, "value", str(evaluation.status)) == "replan" else "agent"
            action_name = "diagnosis.review" if action_type == "replan" else "diagnosis.analyze"
            if action_type == "replan":
                return ActionModel.replan(action_name, {"iteration": loop_context.iteration}, reason=evaluation.reason)
            return ActionModel.agent(action_name, {"iteration": loop_context.iteration}, reason=evaluation.reason)

        def execute_diagnosis(action: ActionModel, loop_state: Dict[str, Any], _loop_context: Any) -> Dict[str, Any]:
            review_event = dict(event)
            if action.action_type.value == "REPLAN":
                review_event.update({"review_required": True, "review_reason": "low_confidence_or_missing_evidence"})
            return self.requests.diagnose(loop_state, review_event)

        def update_diagnosis(loop_state: Dict[str, Any], _action: ActionModel, result: Any, loop_context: Any) -> Dict[str, Any]:
            return {**loop_state, "diagnosis": dict(result or {}), "review_index": loop_context.iteration + 1}

        review_policy = LoopPolicy(max_iterations=2 if review_enabled else 1, min_evidence_score=0.8)
        review_result = LoopEngine(review_policy).run_runtime(
            {"diagnosis": {}, "review_index": 0}, observe=observe_diagnosis,
            select_action=select_diagnosis_action, execute_action=execute_diagnosis,
            update_state=update_diagnosis,
            execution_manager=getattr(self.container, "execution_manager", None),
            trace=lambda event_name, payload: self._loop_trace("diagnosis_review", state, event_name, payload),
            trace_context={"task_id": state.get("task_id", ""), "trace_id": state.get("trace_id", "")},
        )
        diagnosis = dict(review_result.state.get("diagnosis") or {})
        output = {
            "diagnosis": diagnosis,
            "diagnosis_review": {
                "status": review_result.status,
                "stop_reason": review_result.stop_reason,
                "iterations": review_result.iterations,
                "evidence_score": review_result.evidence_score,
                "actions": review_result.actions,
            },
        }
        memory_query = str(diagnosis.get("fault") or diagnosis.get("summary") or diagnosis.get("diagnosis") or event.get("event_type") or "设备维修经验")
        try:
            memory = self.requests.access_memory(
                {**state, "diagnosis": diagnosis, "context": {**dict(state.get("context") or {}), **event}},
                action="search",
                query=memory_query,
                from_agent="diagnosis",
            )
            output["memory"] = memory
            output["memory_result"] = memory
        except A2AError as error:
            output["errors"] = [str(error)]
        if state.get("entry") == "trigger":
            a2a_tool = next(
                (
                    item
                    for item in diagnosis.get("tool_calls", [])
                    if item.get("name") == "search_knowledge" and item.get("source") == "a2a"
                ),
                None,
            )
            if a2a_tool:
                output["knowledge"] = a2a_tool.get("result") or {}
            else:
                query = str(diagnosis.get("diagnosis") or diagnosis.get("summary") or "设备故障维修")
                try:
                    output["knowledge"] = self.requests.retrieve_knowledge(state, query)
                except A2AError as error:
                    output["errors"] = [str(error)]
        return self.tracing.finish("diagnosis", state, output)

    def knowledge(self, state: AgentState) -> Dict[str, Any]:
        self.tracing.start("knowledge", state)
        diagnosis = state.get("diagnosis") or {}
        query = str(diagnosis.get("fault") or diagnosis.get("summary") or diagnosis.get("diagnosis") or state.get("user_text") or "工业设备维修")
        initial_result = dict(state.get("knowledge") or {})
        previous_attempts = int(state.get("evidence_loop_attempts") or 0)
        max_iterations = 2 if state.get("entry") == "trigger" and previous_attempts < 1 else 1

        def observe_knowledge(loop_state: Dict[str, Any], _loop_context: Any) -> Dict[str, Any]:
            current = dict(loop_state.get("knowledge") or {})
            evidence_ids = self._evidence_ids(current)
            if not evidence_ids and current:
                evidence_ids = ["knowledge-status:%s" % str(current.get("status") or "empty")]
            return {
                "domain": "knowledge", "result": current,
                "evidence_ids": evidence_ids,
            }

        def select_knowledge_action(_loop_state: Dict[str, Any], evaluation: Any, loop_context: Any) -> ActionModel:
            search_query = query
            if loop_context.iteration or previous_attempts:
                search_query = evidence_loop.refined_query(query, diagnosis)
            return ActionModel.tool("knowledge.retrieve", {"query": search_query}, reason=evaluation.reason)

        def execute_knowledge(action: ActionModel, _loop_state: Dict[str, Any], _loop_context: Any) -> Dict[str, Any]:
            return self.requests.retrieve_knowledge(state, str(action.payload.get("query") or query))

        def update_knowledge(loop_state: Dict[str, Any], _action: ActionModel, result: Any, _loop_context: Any) -> Dict[str, Any]:
            return {**loop_state, "knowledge": dict(result or {})}

        loop_result = LoopEngine(LoopPolicy(max_iterations=max_iterations, min_evidence_score=0.8)).run_runtime(
            {"knowledge": initial_result}, observe=observe_knowledge,
            select_action=select_knowledge_action, execute_action=execute_knowledge,
            update_state=update_knowledge,
            execution_manager=getattr(self.container, "execution_manager", None),
            trace=lambda event_name, payload: self._loop_trace("knowledge_evidence", state, event_name, payload),
            trace_context={"task_id": state.get("task_id", ""), "trace_id": state.get("trace_id", "")},
        )
        result = dict(loop_result.state.get("knowledge") or {})
        attempts = max(previous_attempts, max(0, loop_result.iterations - 1))
        loop = {
            "attempts": attempts,
            "max_attempts": 1,
            "status": "ready" if evidence_loop.ready(result, "knowledge") else "blocked",
            "stop_reason": "evidence_ready" if evidence_loop.ready(result, "knowledge") else loop_result.stop_reason,
            "iterations": loop_result.iterations,
            "evidence_score": loop_result.evidence_score,
            "guard_status": loop_result.status,
        }
        return self.tracing.finish("knowledge", state, {
            "knowledge": result,
            "evidence_loop": loop,
            "evidence_status": loop["status"],
            "evidence_loop_attempts": attempts,
        })

    def cad(self, state: AgentState) -> Dict[str, Any]:
        self.tracing.start("cad", state)
        diagnosis = state.get("diagnosis") or {}
        context = state.get("context") or {}
        query = str(diagnosis.get("fault") or diagnosis.get("summary") or context.get("query") or state.get("user_text") or "主轴组件")
        from_agent = "diagnosis" if state.get("entry") == "trigger" else "router"
        result = self.requests.retrieve_cad(state, query, from_agent, context={**context, "device_id": diagnosis.get("device_id") or context.get("device_id", "")})
        return self.tracing.finish("cad", state, {"cad": result})

    def maintenance(self, state: AgentState) -> Dict[str, Any]:
        self.tracing.start("maintenance", state)
        diagnosis = state.get("diagnosis") or {}
        context = state.get("context") or {}
        cad = state.get("cad") or {}
        if not cad:
            query = str(diagnosis.get("fault") or diagnosis.get("summary") or context.get("query") or state.get("user_text") or "设备维修")
            cad = self.requests.retrieve_cad(state, query, "maintenance", context=context)
        strict_evidence_gate = bool(context.get("enforce_evidence_gate")) or os.getenv("APP_ENV", "").strip().lower() in {"prod", "production"}
        if state.get("entry") == "trigger" and strict_evidence_gate:
            knowledge_ready = evidence_loop.ready(state.get("knowledge"), "knowledge")
            cad_ready = evidence_loop.ready(cad, "cad")
            if not knowledge_ready or not cad_ready:
                return self.tracing.finish("maintenance", state, {
                    "status": "blocked_insufficient_evidence",
                    "stop_reason": "evidence_gate",
                    "evidence_status": "blocked",
                    "evidence_findings": [
                        finding
                        for finding, valid in (
                            ("knowledge evidence is insufficient", knowledge_ready),
                            ("CAD evidence is insufficient", cad_ready),
                        )
                        if not valid
                    ],
                    "maintenance_plan": {},
                    "workorder": {},
                })
        memory_query = str(diagnosis.get("fault") or diagnosis.get("summary") or diagnosis.get("diagnosis") or context.get("query") or "设备维修经验")
        memory = state.get("memory") or {}
        try:
            memory = self.requests.access_memory(
                {**state, "diagnosis": diagnosis, "context": {**dict(context), "device_id": diagnosis.get("device_id") or context.get("device_id", "")}},
                action="search",
                query=memory_query,
                from_agent="maintenance",
            )
        except A2AError as error:
            memory = {"success": False, "validation_findings": [str(error)], "items": []}
        def observe_maintenance(loop_state: Dict[str, Any], _loop_context: Any) -> Dict[str, Any]:
            plan_result = dict(loop_state.get("maintenance_plan") or {})
            evidence_ids = self._evidence_ids(plan_result)
            return {
                "domain": "maintenance", "result": plan_result,
                "evidence_ids": evidence_ids,
            }

        def select_maintenance_action(_loop_state: Dict[str, Any], evaluation: Any, loop_context: Any) -> ActionModel:
            is_replan = getattr(evaluation.status, "value", str(evaluation.status)) == "replan"
            if is_replan:
                return ActionModel.replan("maintenance.replan", {"iteration": loop_context.iteration}, reason=evaluation.reason)
            return ActionModel.agent("maintenance.plan", {"iteration": loop_context.iteration}, reason=evaluation.reason)

        def execute_maintenance(action: ActionModel, _loop_state: Dict[str, Any], _loop_context: Any) -> Dict[str, Any]:
            plan_context = dict(context)
            if action.action_type.value == "REPLAN":
                plan_context["replan_required"] = True
                plan_context["replan_reason"] = "validation_findings_or_not_workorder_ready"
            planning_state = {**state, "context": plan_context, "memory": memory}
            return self.requests.create_maintenance_plan(
                planning_state, state.get("diagnosis", {}), state.get("knowledge", {}), cad,
            )

        def update_maintenance(loop_state: Dict[str, Any], _action: ActionModel, result: Any, _loop_context: Any) -> Dict[str, Any]:
            return {**loop_state, "maintenance_plan": dict(result or {})}

        replan_result = LoopEngine(LoopPolicy(max_iterations=2, min_evidence_score=0.8)).run_runtime(
            {"maintenance_plan": dict(state.get("maintenance_plan") or {})}, observe=observe_maintenance,
            select_action=select_maintenance_action, execute_action=execute_maintenance,
            update_state=update_maintenance,
            execution_manager=getattr(self.container, "execution_manager", None),
            trace=lambda event_name, payload: self._loop_trace("maintenance_replan", state, event_name, payload),
            trace_context={"task_id": state.get("task_id", ""), "trace_id": state.get("trace_id", "")},
        )
        plan = dict(replan_result.state.get("maintenance_plan") or {})
        payload = {
            "maintenance_plan": plan,
            "memory": memory,
            "memory_result": memory,
            "maintenance_replan": {
                "status": replan_result.status,
                "stop_reason": replan_result.stop_reason,
                "iterations": replan_result.iterations,
                "evidence_score": replan_result.evidence_score,
                "actions": replan_result.actions,
            },
        }
        if state.get("entry") == "trigger" and strict_evidence_gate and replan_result.status != "completed":
            payload.update({
                "status": "blocked_insufficient_evidence",
                "stop_reason": "maintenance_replan_guard",
                "evidence_status": "blocked",
                "workorder": {},
            })
            return self.tracing.finish("maintenance", state, payload)
        if state.get("entry") == "trigger":
            payload["workorder"] = {}
        return self.tracing.finish("maintenance", state, payload)

    def workorder(self, state: AgentState) -> Dict[str, Any]:
        """Maintenance 完成后创建并派工；后续维修由外部反馈入口驱动。"""

        self.tracing.start("workorder", state)
        event = dict(state.get("event") or {})
        context = dict(state.get("context") or {})
        context.update({
            "event_id": str(event.get("event_id") or context.get("event_id") or ""),
            "idempotency_key": "monitor:%s" % str(event.get("event_id")) if event.get("event_id") else context.get("idempotency_key", ""),
            "diagnosis_snapshot": dict(state.get("diagnosis") or {}),
            "maintenance_plan_snapshot": dict(state.get("maintenance_plan") or {}),
        })
        result = self.requests.execute_workorder({**state, "context": context}, action="create", from_agent="maintenance")
        return self.tracing.finish("workorder", state, {
            "workorder_result": result,
            "workorder": result.get("workorder", {}),
            "pending_workorder_id": result.get("workorder_id", ""),
            "status": "waiting_repair" if result.get("success") else "workorder_error",
        })

    def memory(self, state: AgentState) -> Dict[str, Any]:
        self.tracing.start("memory", state)
        route = state.get("route_result") or {}
        query = str((route.get("target_input") or {}).get("query") or state.get("user_text") or "")
        result = self.requests.access_memory(state, action="search", query=query, from_agent="router")
        return self.tracing.finish("memory", state, {"memory_result": result, "memory": result, "status": "completed" if result.get("success") else "insufficient_evidence"})

    def workorder_action(self, state: AgentState) -> Dict[str, Any]:
        """执行 Router 已确认的工单动作，统一转交 WorkOrder Agent。"""

        self.tracing.start("workorder_action", state)
        route = state.get("route_result") or {}
        target_input = dict(route.get("target_input") or state.get("context") or {})
        action = str(target_input.get("action") or "update").lower()
        workorder_id = str(target_input.get("workorder_id") or "")
        try:
            enriched = {**target_input, "action": action, "workorder_id": workorder_id}
            if action == "create":
                enriched["maintenance_plan"] = enriched.get("maintenance_plan") or state.get("maintenance_plan") or {
                    "device_id": enriched.get("device_id") or "unknown",
                    "diagnosis": state.get("diagnosis") or {},
                    "repair_steps": list(enriched.get("steps") or []),
                    "workorder_ready": True,
                    "target_part": enriched.get("repair_target") or enriched.get("target_part") or {},
                    "engineering_context": enriched.get("drawing_context") or enriched.get("engineering_context") or {},
                }
            result = self.requests.execute_workorder({**state, "context": enriched}, action=action, from_agent="router")
            return self.tracing.finish("workorder_action", state, {
                "workorder_result": result,
                "workorder": result.get("workorder", {}),
                "status": "completed" if result.get("success") else "error",
            })
        except Exception as error:
            return self.tracing.finish("workorder_action", state, {
                "status": "error",
                "errors": [str(error)],
                "workorder": {"workorder_id": workorder_id, "action": action},
            })

    def workorder_query(self, state: AgentState) -> Dict[str, Any]:
        """查询工单业务结果并写回共享 AgentState。"""

        self.tracing.start("workorder_query", state)
        route = state.get("route_result") or {}
        target_input = dict(route.get("target_input") or state.get("context") or {})
        workorder_id = str(target_input.get("workorder_id") or "")
        try:
            result = self.requests.execute_workorder({**state, "context": target_input}, action="query", workorder={"workorder_id": workorder_id}, from_agent="router")
            return self.tracing.finish("workorder_query", state, {
                "workorder_result": result,
                "workorder": result.get("workorder", result),
                "status": "completed" if result.get("success", True) else "not_found",
            })
        except Exception as error:
            return self.tracing.finish("workorder_query", state, {
                "status": "error",
                "errors": [str(error)],
                "workorder": {"workorder_id": workorder_id},
            })

    def quality(self, state: AgentState) -> Dict[str, Any]:
        self.tracing.start("quality", state)
        route = state.get("route_result") or {}
        target_input = dict(route.get("target_input") or state.get("context") or {})
        result = self.container.operations.inspect_quality(state, from_agent="router", quality_payload=target_input, persist=True)
        return self.tracing.finish("quality", state, {"quality": result})

    def report(self, state: AgentState) -> Dict[str, Any]:
        self.tracing.start("report", state)
        result = self.container.harnesses["report"].execute_agent(state)
        report = _serialize_agent_result(result)
        payload = {"report": report}
        return self.tracing.finish("report", state, payload)
