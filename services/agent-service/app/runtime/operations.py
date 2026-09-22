"""Direct API operations backed by the same Agent A2A requests as the Graph."""
from __future__ import annotations
from typing import Any, Dict, Mapping
from uuid import uuid4
from app.workorder.validator import WorkOrderValidator
from app.a2a.requests import A2ARequests
from app.closure import ClosureService
from app.common.serialization import _serialize_agent_result

class RuntimeOperations:
    def __init__(self, requests: A2ARequests, closure_service: ClosureService, report_harness: Any | None = None) -> None:
        self.requests = requests
        self.closure_service = closure_service
        self.report_harness = report_harness
        self._learning_results: dict[str, Dict[str, Any]] = {}

    def inspect_quality(
        self,
        state: Mapping[str, Any],
        from_agent: str = "router",
        quality_payload: Mapping[str, Any] | None = None,
        persist: bool = False,
    ) -> Dict[str, Any]:
        values = {**dict(state.get("context") or {}), **dict(quality_payload or {})}
        result = self.requests.inspect_quality(state, from_agent=from_agent, quality_payload=quality_payload)
        if persist and (result.get("part_id") or result.get("part_no")):
            check = self.closure_service.record_part_quality(
                {
                    "part_id": result.get("part_id") or values.get("part_id") or "",
                    "part_no": result.get("part_no") or values.get("part_no") or "",
                    "part_name": result.get("part_name") or values.get("part_name") or "",
                    "batch_id": result.get("batch_id") or values.get("batch_id") or "",
                    "production_order_id": result.get("production_order_id") or values.get("production_order_id") or "",
                    "result": "passed" if bool(result.get("passed") or result.get("qualified")) else "failed",
                    "score": result.get("score") or result.get("quality_score"),
                    "findings": list(result.get("findings") or result.get("defects") or result.get("failed_checks") or []),
                    "items": list(result.get("inspection_items") or []),
                    "reviewer": str(values.get("reviewer") or "quality-agent"),
                    "risk_level": str(values.get("risk_level") or "R1"),
                },
                operator=str(values.get("reviewer") or "quality-agent"),
            )
            result["quality_check_id"] = check["quality_check_id"]
        return result

    def execute_workorder(self, action: str, payload: Mapping[str, Any] | None = None, from_agent: str = "router") -> Dict[str, Any]:
        """API/事件入口：所有工单业务动作都通过 WorkOrder Agent。"""

        values = dict(payload or {})
        values["action"] = action
        if action == "create" and not values.get("maintenance_plan"):
            values["maintenance_plan"] = {
                "device_id": values.get("device_id") or "unknown",
                "title": values.get("title") or "设备维修工单",
                "plan_id": values.get("plan_id") or "",
                "repair_steps": list(values.get("steps") or []),
                "target_part": dict(values.get("repair_target") or {}),
                "engineering_context": dict(values.get("drawing_context") or {}),
                "alarm_code": values.get("alarm_code") or "",
                "diagnosis": {"device_id": values.get("device_id") or "unknown", "fault": values.get("title") or "设备异常", **dict(values.get("diagnosis_context") or {})},
                "workorder_ready": True,
                "priority": values.get("priority") or "normal",
                "risk_level": values.get("risk_level") or "",
                "source": values.get("source") or "manual",
                "idempotency_key": values.get("idempotency_key") or "",
            }
        state: dict[str, Any] = {
            "entry": "user",
            "task_id": "TASK-WO-API-" + uuid4().hex[:12].upper(),
            "trace_id": "TRACE-WO-API-" + uuid4().hex[:12].upper(),
            "context": values,
            "workorder": dict(values.get("workorder") or {}),
            "repair_feedback": values.get("repair_feedback") or {},
            "repair_verification": dict(values.get("verification") or values.get("repair_verification") or {}),
        }
        result = self.requests.execute_workorder(state, action=action, workorder=values.get("workorder"), from_agent=from_agent)
        if action == "close":
            order = dict(result.get("workorder") or {})
            feedback = order.get("repair_feedback") or values.get("repair_feedback") or {}
            if order.get("status") == "closed" and WorkOrderValidator.can_learn(order, feedback):
                learning_key = "workorder:%s" % str(order.get("workorder_id") or values.get("workorder_id") or "")
                cached = self._learning_results.get(learning_key)
                if cached is not None:
                    result.update(cached)
                    return result
                learning_state: dict[str, Any] = {
                    **state,
                    "workorder": order,
                    "repair_feedback": feedback,
                    "repair_verification": dict(order.get("repair_verification") or {}),
                    "diagnosis": dict(values.get("diagnosis") or order.get("diagnosis_snapshot") or {}),
                    "maintenance_plan": dict(values.get("maintenance_plan") or order.get("maintenance_plan_snapshot") or {}),
                    "context": {
                        **dict(values),
                        "learning_idempotency_key": learning_key,
                        "source_event_id": str(order.get("event_id") or values.get("event_id") or ""),
                        "report_type": "full_case_report",
                    },
                }
                learning_state["workorder"] = {
                    **order,
                    "learning_idempotency_key": learning_key,
                    "source_event_id": str(order.get("event_id") or values.get("event_id") or ""),
                }
                try:
                    memory_result = self.requests.access_memory(
                        learning_state,
                        action="learn",
                        from_agent="workorder",
                    )
                    result["memory_result"] = memory_result
                    if memory_result.get("success") and self.report_harness is not None:
                        report_state = {
                            **learning_state,
                            "report_type": "full_case_report",
                            "report": dict(memory_result.get("experience") or {}),
                        }
                        result["report"] = _serialize_agent_result(self.report_harness.execute_agent(report_state))
                    self._learning_results[learning_key] = {
                        "memory_result": result.get("memory_result", {}),
                        **({"report": result["report"]} if result.get("report") else {}),
                    }
                except Exception as error:
                    result["memory_result"] = {
                        "success": False,
                        "error": str(error),
                        "stop_reason": "memory_learning_failed",
                    }
        return result

    def execute_memory(self, action: str, payload: Mapping[str, Any] | None = None, from_agent: str = "router") -> Dict[str, Any]:
        """API/事件入口：所有经验检索和学习动作都通过 Memory Agent。"""

        values = dict(payload or {})
        state: dict[str, Any] = {
            "entry": "user",
            "task_id": "TASK-MEMORY-API-" + uuid4().hex[:12].upper(),
            "trace_id": "TRACE-MEMORY-API-" + uuid4().hex[:12].upper(),
            "context": values,
            "user_text": str(values.get("query") or ""),
            "diagnosis": dict(values.get("diagnosis") or {}),
            "maintenance_plan": dict(values.get("maintenance_plan") or {}),
            "workorder": dict(values.get("workorder") or {}),
            "repair_feedback": values.get("repair_feedback") or {},
            "quality": dict(values.get("quality") or {}),
            "report": dict(values.get("report") or {}),
        }
        return self.requests.access_memory(state, action=action, query=str(values.get("query") or ""), from_agent=from_agent)

    def inspect_part(self, part_id: str, payload: Mapping[str, Any]) -> Dict[str, Any]:
        values = dict(payload)
        values.update({"part_id": part_id, "inspection_type": "part_quality", "action": "inspect_part"})
        state = {
            "entry": "user",
            "task_id": "TASK-PART-QUALITY-" + uuid4().hex[:12].upper(),
            "trace_id": "TRACE-PART-QUALITY-" + uuid4().hex[:12].upper(),
            "context": values,
            "diagnosis": {},
            "maintenance_plan": {},
        }
        return self.inspect_quality(state, from_agent="router", quality_payload=values, persist=True)
