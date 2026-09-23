"""Direct API operations backed by the same Agent A2A requests as the Graph."""
from __future__ import annotations
from typing import Any, Dict, Mapping
from uuid import uuid4
import os
from app.workorder.validator import WorkOrderValidator
from app.a2a.requests import A2ARequests
from app.closure import ClosureService
from app.common.serialization import _serialize_agent_result
from app.runtime.durable_store import DurableJsonStore
from app.runtime.action import ActionModel


class _IncompleteLearningStage(RuntimeError):
    """Carry a failed stage result without committing it as completed."""

    def __init__(self, result: Mapping[str, Any], message: str) -> None:
        super().__init__(message)
        self.result = dict(result)


class RuntimeOperations:
    def __init__(
        self,
        requests: A2ARequests,
        closure_service: ClosureService,
        report_harness: Any | None = None,
        learning_store_path: str | None = None,
        trace: Any | None = None,
    ) -> None:
        self.requests = requests
        self.closure_service = closure_service
        self.report_harness = report_harness
        self.trace = trace
        self._learning_results: dict[str, Dict[str, Any]] = {}
        self._learning_stages: dict[tuple[str, str], Dict[str, Any]] = {}
        from threading import Lock
        self._learning_lock = Lock()
        configured_path = str(learning_store_path or os.getenv("LEARNING_RESULT_STORE_PATH", "")).strip()
        self._learning_store = DurableJsonStore(configured_path) if configured_path else None

    def _cached_learning(self, key: str) -> Dict[str, Any] | None:
        cached = self._learning_results.get(key)
        if cached is not None:
            return dict(cached)
        if self._learning_store is not None:
            cached = self._learning_store.get("workorder_learning", key)
            if cached is not None:
                self._learning_results[key] = dict(cached)
                return dict(cached)
        return None

    def _save_learning(self, key: str, value: Mapping[str, Any]) -> None:
        payload = dict(value)
        self._learning_results[key] = payload
        if self._learning_store is not None:
            self._learning_store.set("workorder_learning", key, payload)

    def _run_learning_stage(
        self,
        namespace: str,
        key: str,
        producer: Any,
    ) -> Dict[str, Any]:
        """Run one close stage once, including across concurrent processes."""

        if self._learning_store is not None:
            return self._learning_store.get_or_create(namespace, key, producer)
        cache_key = (namespace, key)
        with self._learning_lock:
            cached = self._learning_stages.get(cache_key)
            if cached is not None:
                return dict(cached)
            value = dict(producer() or {})
            self._learning_stages[cache_key] = value
            return value

    def _learning_trace(self, state: Mapping[str, Any], event: str, payload: Mapping[str, Any] | None = None) -> None:
        if self.trace is None or not hasattr(self.trace, "record"):
            return
        values = dict(payload or {})
        self.trace.record(
            type="loop", name="learning", node="learning", agent="runtime", event=event,
            task_id=str(state.get("task_id", "")), trace_id=str(state.get("trace_id", "")),
            state_change=values, keys=list(values), tool_name="", latency=0.0, error="",
        )

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
                learning_loop: dict[str, Any] = {
                    "status": "running",
                    "learning_idempotency_key": learning_key,
                    "stages": [],
                    "stop_reason": "",
                }
                result["learning_loop"] = learning_loop
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
                self._learning_trace(
                    learning_state, "loop_start",
                    {"learning_idempotency_key": learning_key, "stages": list(learning_loop["stages"])},
                )
                self._learning_trace(
                    learning_state, "action_selected",
                    {"action": ActionModel.agent("memory.learn", {"workorder_id": learning_key}).as_dict()},
                )
                try:
                    def produce_memory() -> Dict[str, Any]:
                        memory = self.requests.access_memory(
                            learning_state,
                            action="learn",
                            from_agent="workorder",
                        )
                        experience = dict(memory.get("experience") or {})
                        rag_saved = memory.get("rag_saved")
                        if rag_saved is None:
                            rag_saved = experience.get("rag_saved", True)
                        if not memory.get("success") or not bool(rag_saved):
                            raise _IncompleteLearningStage(memory, "memory learning or RAG upsert incomplete")
                        return dict(memory)

                    try:
                        memory_result = self._run_learning_stage("workorder_memory", learning_key, produce_memory)
                    except _IncompleteLearningStage as stage_error:
                        result["memory_result"] = stage_error.result
                        learning_loop.update({"status": "blocked", "stop_reason": "memory_or_rag_failed"})
                        return result
                    result["memory_result"] = memory_result
                    experience_preview = dict(memory_result.get("experience") or {})
                    self._learning_trace(
                        learning_state, "evidence_added",
                        {"evidence_ids": [str(experience_preview.get("experience_id"))] if experience_preview.get("experience_id") else []},
                    )
                    if "memory" not in learning_loop["stages"]:
                        learning_loop["stages"].append("memory")
                    experience = dict(memory_result.get("experience") or {})
                    rag_saved = memory_result.get("rag_saved")
                    if rag_saved is None:
                        rag_saved = experience.get("rag_saved", True)
                    report_harness = self.report_harness
                    if memory_result.get("success") and bool(rag_saved) and report_harness is not None:
                        if "rag" not in learning_loop["stages"]:
                            learning_loop["stages"].append("rag")
                        report_state = {
                            **learning_state,
                            "report_type": "full_case_report",
                            "report": dict(memory_result.get("experience") or {}),
                        }
                        try:
                            def produce_report() -> Dict[str, Any]:
                                report = _serialize_agent_result(report_harness.execute_agent(report_state))
                                if str(report.get("status") or "completed") != "completed" or report.get("persisted") is False:
                                    raise _IncompleteLearningStage(report, "full case report is incomplete or not persisted")
                                return report

                            result["report"] = self._run_learning_stage("workorder_report", learning_key, produce_report)
                            if "report" not in learning_loop["stages"]:
                                learning_loop["stages"].append("report")
                        except Exception as report_error:
                            if isinstance(report_error, _IncompleteLearningStage):
                                result["report"] = {
                                    **report_error.result,
                                    "success": False,
                                    "stop_reason": "report_generation_failed",
                                }
                            else:
                                result["report"] = {
                                    "success": False,
                                    "report_type": "full_case_report",
                                    "error": str(report_error),
                                    "stop_reason": "report_generation_failed",
                                }
                            learning_loop.update({"status": "waiting_report", "stop_reason": "report_generation_failed"})
                        else:
                            learning_loop.update({"status": "completed", "stop_reason": "learning_complete"})
                    elif memory_result.get("success") and bool(rag_saved):
                        if "rag" not in learning_loop["stages"]:
                            learning_loop["stages"].append("rag")
                        learning_loop.update({"status": "completed", "stop_reason": "learning_complete"})
                except Exception as error:
                    result["memory_result"] = {
                        "success": False,
                        "error": str(error),
                        "stop_reason": "memory_learning_failed",
                    }
                    learning_loop.update({"status": "blocked", "stop_reason": "memory_learning_failed"})
                finally:
                    self._learning_trace(
                        learning_state, "review_result",
                        {"status": learning_loop.get("status"), "stages": list(learning_loop.get("stages") or [])},
                    )
                    self._learning_trace(
                        learning_state, "loop_stop",
                        {"status": learning_loop.get("status"), "stop_reason": learning_loop.get("stop_reason", "")},
                    )
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
