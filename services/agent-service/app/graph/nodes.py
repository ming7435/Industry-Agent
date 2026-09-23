"""LangGraph nodes: map shared State to Agent inputs and result updates."""
from __future__ import annotations
from typing import Any, Dict
import os
from app.a2a.client import A2AError
from app.common.serialization import _serialize_agent_result
from app.graph.state import AgentState
from app.graph import evidence as evidence_loop
from app.runtime.container import AgentContainer

class OrchestratorNodes:
    def __init__(self, container: AgentContainer) -> None:
        self.container = container
        self.requests = container.requests
        self.tracing = container.tracing

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
        output = {"diagnosis": self.requests.diagnose(state, event)}
        diagnosis = output["diagnosis"]
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
        result = dict(state.get("knowledge") or {})
        if not result:
            result = self.requests.retrieve_knowledge(state, query)
        attempts = int(state.get("evidence_loop_attempts") or 0)
        if state.get("entry") == "trigger" and not evidence_loop.ready(result, "knowledge") and attempts < 1:
            attempts += 1
            result = self.requests.retrieve_knowledge(state, evidence_loop.refined_query(query, diagnosis))
        loop = evidence_loop.loop_payload(attempts, result)
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
        planning_state = {**state, "memory": memory}
        plan = self.requests.create_maintenance_plan(
            planning_state,
            state.get("diagnosis", {}),
            state.get("knowledge", {}),
            cad,
        )
        payload = {"maintenance_plan": plan, "memory": memory, "memory_result": memory}
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
