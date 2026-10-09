"""直接 API 操作，使用与 Graph 相同的 Agent A2A 请求。"""
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
    """保留失败阶段的结果，同时避免将其记录为已完成。"""

    def __init__(self, result: Mapping[str, Any], message: str) -> None:
        super().__init__(message)
        self.result = dict(result)


class RuntimeOperations:
    def execute_virtual_production(self, action, arguments, context):
        return self.requests.execute_virtual_production(action, arguments, context)

    def inspect_virtual_output(self, part_id, output_digest, context):
        return self.requests.inspect_virtual_output(part_id, output_digest, context)

    def __init__(
        self,
        requests: A2ARequests,
        closure_service: ClosureService,
        report_harness: Any | None = None,
        learning_store_path: str | None = None,
        trace: Any | None = None,
        factory_client: Any | None = None,
        repair_controller: Any | None = None,
        quality_harness: Any | None = None,
    ) -> None:
        self.requests = requests
        self.closure_service = closure_service
        self.report_harness = report_harness
        # 在线报告由已核验的停机至复机周期统一保存；孤立内存演示沿用独立报告。
        self.lifecycle_reporting = getattr(closure_service, 'backend', '') == 'backend-service'
        self.quality_harness = quality_harness
        self.trace = trace
        self.factory_client = factory_client
        self.repair_controller = repair_controller
        self._learning_results: dict[str, Dict[str, Any]] = {}
        self._learning_stages: dict[tuple[str, str], Dict[str, Any]] = {}
        from threading import Lock
        self._learning_lock = Lock()
        configured_path = str(learning_store_path or os.getenv("LEARNING_RESULT_STORE_PATH", "")).strip()
        self._learning_store = DurableJsonStore(configured_path) if configured_path or os.getenv("APP_ENV", "development").lower() != "testing" else None

    def _cached_learning(self, key: str) -> Dict[str, Any] | None:
        cached = self._learning_results.get(key) if os.getenv("APP_ENV", "development").lower() == "testing" else None
        if cached is not None:
            return dict(cached)
        if self._learning_store is not None:
            cached = self._learning_store.get("workorder_learning", key)
            if cached is not None:
                if os.getenv("APP_ENV", "development").lower() == "testing":
                    self._learning_results[key] = dict(cached)
                return dict(cached)
        return None

    def _save_learning(self, key: str, value: Mapping[str, Any]) -> None:
        payload = dict(value)
        if self._learning_store is not None:
            self._learning_store.set("workorder_learning", key, payload)
        if os.getenv("APP_ENV", "development").lower() == "testing":
            self._learning_results[key] = payload

    def _run_learning_stage(
        self,
        namespace: str,
        key: str,
        producer: Any,
    ) -> Dict[str, Any]:
        """确保关闭阶段只执行一次，跨并发进程也适用。"""

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
            inspection_status = str(result.get("status") or "").lower()
            if inspection_status in {"pass", "passed"}:
                persisted_result = "passed" if result.get("passed") is True and result.get("qualified", True) is True else "review"
            elif inspection_status in {"fail", "failed"}:
                persisted_result = "failed"
            elif inspection_status in {"not_tested", "insufficient_data", "review"}:
                persisted_result = inspection_status
            else:
                persisted_result = "pending"
            record_payload = {
                    "part_id": result.get("part_id") or values.get("part_id") or "",
                    "part_no": result.get("part_no") or values.get("part_no") or "",
                    "part_name": result.get("part_name") or values.get("part_name") or "",
                    "batch_id": result.get("batch_id") or values.get("batch_id") or "",
                    "production_order_id": result.get("production_order_id") or values.get("production_order_id") or "",
                    "result": persisted_result,
                    "score": result.get("score") or result.get("quality_score"),
                    "findings": list(result.get("findings") or result.get("defects") or result.get("failed_checks") or []),
                    "items": list(result.get("inspection_items") or []),
                    "quality_validation": dict(result.get("quality_validation") or result.get("inspection_summary") or {}),
                    'evidence': list(result.get('evidence') or []),
                    'measurements': dict(result.get('measurements') or {}),
                    'specifications': dict(result.get('specifications') or {}),
                    'comparison_scope': str(result.get('comparison_scope') or ''),
                    'design_reference': dict(result.get('design_reference') or {}),
                    'device_id': str(result.get('device_id') or values.get('device_id') or ''),
                    'device_name': str(result.get('device_name') or ''),
                    'line_id': str(result.get('line_id') or ''), 'line_name': str(result.get('line_name') or ''),
                    'part_recorded_at': str(result.get('part_recorded_at') or ''),
                    'workorder_id': str(values.get('workorder_id') or ''),
                    'event_id': str(values.get('event_id') or ''),
                    'task_id': str(state.get('task_id') or ''), 'trace_id': str(state.get('trace_id') or ''),
                    "reviewer": str(values.get("reviewer") or "quality-agent"),
                    "risk_level": str(values.get("risk_level") or "R1"),
                }
            if self.quality_harness is not None:
                from app.agents.quality.agent import QUALITY_CLOSURE_AUTHORITY
                persisted = self.quality_harness.execute_once({**dict(state), '_closure_authority':QUALITY_CLOSURE_AUTHORITY,
                    'closure_operation':'create_quality_check','arguments':{**record_payload,'operator':str(values.get('reviewer') or 'quality-agent')},
                    'runtime_context':{'run_type':'quality'}})
                check = persisted.get('quality_check') or persisted
            else:
                # 小型隔离测试容器没有 Harness，仍执行原存储；不伪造 Agent 事件。
                check = self.closure_service.record_part_quality(record_payload,operator=str(values.get('reviewer') or 'quality-agent'))
            result["quality_check_id"] = check["quality_check_id"]
            result['quality_check'] = check
            if result.get('batch_id') and hasattr(self.closure_service, 'get_batch_quality'):
                try:
                    batch = self.closure_service.get_batch_quality(str(result['batch_id']))
                    if batch.get('success') is not True or not isinstance(batch.get('batch_quality'), Mapping):
                        raise ValueError('Invalid batch statistics response')
                    from app.agents.quality.batch_evidence import enrich_batch_report
                    batch = enrich_batch_report(batch, base_url=getattr(self.factory_client, 'base_url', None))
                    result.update(batch_quality=batch['batch_quality'], problem_analysis=batch.get('problem_analysis') or {})
                except Exception:
                    # Inspection is already committed. A read failure must never invite resubmission.
                    result['batch_quality'] = {'batch_id': result['batch_id'], 'status': 'unavailable',
                        'rate_percent': None, 'error': '本次检测已保存；批次统计暂不可用，请刷新查询，不要重复提交检测。'}
                    result['problem_analysis'] = {'status': 'unavailable', 'note': '批次问题分析暂不可用'}
            if self.report_harness is not None and not self.lifecycle_reporting:
                try:
                    result['report'] = _serialize_agent_result(self.report_harness.execute_agent({
                        **dict(state), 'report_type':'quality_report', 'quality':{**result, **check, 'passed':result.get('passed')},
                        'context':{**dict(state.get('context') or {}), 'run_type':'quality'}, 'persist':True}))
                except Exception as error:
                    result['report'] = {'persisted':False,'status':'incomplete','error':str(error),'stop_reason':'report_generation_failed'}
        return result

    def execute_workorder(self, action: str, payload: Mapping[str, Any] | None = None, from_agent: str = "router", *, actor_id: str = "") -> Dict[str, Any]:
        """API/事件入口：所有工单业务动作都通过 WorkOrder Agent。"""

        values = dict(payload or {})
        if action == 'mark_repair_completed':
            if not actor_id:
                raise PermissionError('维修完成必须来自登录的被派工人员，不能用上下文声明确认人')
            from app.clients.backend import BackendServiceClient
            from app.monitor.factory_api import FactoryApiClient
            from app.monitor.line_control import LineController
            feedback = values.get('repair_feedback') or values.get('feedback') or ''
            if isinstance(feedback, Mapping):
                feedback = feedback.get('feedback') or feedback.get('result') or ''
            controller = self.repair_controller or LineController(self.factory_client or FactoryApiClient(os.getenv('FACTORY_API_BASE_URL', 'http://127.0.0.1:4529')), BackendServiceClient())
            return controller.confirm_and_restart(str(values.get('workorder_id') or ''), actor_id, str(feedback), manual_restart=True)
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
                    if memory_result.get("success") and bool(rag_saved) and report_harness is not None and not self.lifecycle_reporting:
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
        result = self.inspect_quality(state, from_agent="router", quality_payload=values, persist=True)
        return {**result, 'task_id':state['task_id'], 'trace_id':state['trace_id']}

    def execute_quality_action(self, harness, operation: str, arguments: Mapping[str, Any]) -> Dict[str, Any]:
        """同一质检记录的闭环动作使用真实 Quality Agent，不伪造工具完成。"""
        from app.agents.quality.agent import QUALITY_CLOSURE_AUTHORITY
        values = dict(arguments)
        check_id = str(values.get('check_id') or values.get('quality_check_id') or '')
        if operation == 'complete_closure_task':
            task = next((item for item in self.closure_service.list_closure_tasks() if item.get('closure_task_id') == values.get('task_id')), {})
            check_id = str(task.get('quality_check_id') or '')
        source = self.closure_service.get_quality_check(check_id) if check_id else {}
        state = {'_closure_authority':QUALITY_CLOSURE_AUTHORITY, 'closure_operation':operation, 'arguments':values,
                 'task_id': 'TASK-QC-ACTION-' + uuid4().hex[:12], 'trace_id':(source or {}).get('trace_id') or 'TRACE-QC-' + check_id,
                 'runtime_context':{'run_type':'quality','quality_check_id':check_id}}
        result = _serialize_agent_result(harness.execute_once(state))
        if operation == 'close_quality_check' and self.report_harness is not None and not self.lifecycle_reporting:
            saved = self.closure_service.get_quality_check(check_id) or {}
            try:
                result['report'] = _serialize_agent_result(self.report_harness.execute_agent({**state,'quality':{**saved,'passed':saved.get('result')=='passed'},'report_type':'quality_report','persist':True}))
            except Exception:
                # 关闭已提交；独立记录报告失败，不让客户端误以为关闭也失败。
                result['report'] = {'persisted':False,'status':'incomplete','stop_reason':'report_generation_failed'}
        return result
