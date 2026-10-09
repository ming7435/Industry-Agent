"""实时设备监测 Web 控制台。"""

from __future__ import annotations

import ipaddress
import json
import os
import sys
from collections import deque
from concurrent.futures import Future, ThreadPoolExecutor
from functools import partial
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
from time import monotonic, sleep
from typing import Any, Callable, Dict, List, Mapping, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urlencode, urlparse
from urllib.request import Request, urlopen
from shared.dispatch_projection import compact_workorder_result


SERVICE_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = SERVICE_ROOT.parent.parent
FRONTEND_ROOT = PROJECT_ROOT / "frontend" / "monitor"
AGENT_SERVICE_BASE_URL = os.getenv("AGENT_SERVICE_BASE_URL", "http://127.0.0.1:8010")
# Runtime Action 合法地可能包含多次远程模型调用。
# 保持这个边界可配置，但不要让监控服务在 Agent Runtime 完成前
# 提前把真实的模型运行标记为失败。
AGENT_EVENT_TIMEOUT_SECONDS = float(
    os.getenv("AGENT_EVENT_TIMEOUT_SECONDS", os.getenv("AGENT_TIMEOUT_SECONDS", "180"))
)
MONITOR_PROXY_TIMEOUT_SECONDS = float(
    os.getenv("MONITOR_PROXY_TIMEOUT_SECONDS", str(max(AGENT_EVENT_TIMEOUT_SECONDS, 90.0)))
)
# HTTP 超时只表明没有收到响应。此窗口内只读回查，绝不再次提交事件。
AGENT_RESULT_RECOVERY_SECONDS = max(0.0, float(os.getenv("AGENT_RESULT_RECOVERY_SECONDS", "180")))
AGENT_RESULT_POLL_SECONDS = max(0.1, float(os.getenv("AGENT_RESULT_POLL_SECONDS", "2")))
CAD_BODY_TIMEOUT_SECONDS = 5.0
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

# 为导入旧版模块级 Registry 类型的集成保留向后兼容的符号导出。
# Monitor 不会实例化它；所有执行仍位于 Agent Service HTTP 边界之后。
from app.tools.registry import ToolRegistry as _ToolRegistry  # noqa: E402

ToolRegistry = _ToolRegistry


def agent_request_headers(content_type: str = "application/json") -> Dict[str, str]:
    """构造监控服务到 Agent Service 的内部请求头。"""

    headers = {"Content-Type": content_type}
    token = os.getenv("AGENT_API_TOKEN", "").strip()
    if token:
        headers["Authorization"] = "Bearer %s" % token
    return headers


_PUBLIC_TRACE_FIELDS = (
    "timestamp",
    "type",
    "name",
    "node",
    "agent",
    "event",
    "task_id",
    "trace_id",
    "tool_name",
    "latency",
    "error",
)


def _compact_trace(trace: Any) -> List[Dict[str, Any]]:
    """保留监控流程 Trace 的可用信息，同时不暴露 Runtime 状态负载。"""

    if not isinstance(trace, list):
        return []
    compacted: List[Dict[str, Any]] = []
    for item in trace[-200:]:
        if not isinstance(item, Mapping):
            continue
        compacted.append({key: item[key] for key in _PUBLIC_TRACE_FIELDS if key in item})
    return compacted


def _compact_stage(value: Any, fields: tuple[str, ...]) -> Dict[str, Any]:
    if not isinstance(value, Mapping):
        return {}
    return {key: value[key] for key in fields if key in value}


def compact_public_pipeline(pipeline: Mapping[str, Any] | None) -> Dict[str, Any]:
    """返回监控界面使用的有界 Pipeline 契约。

    Runtime 为 Trace API 保留完整证据、动作输出和状态迁移。将这些负载嵌入每秒
    监控快照会使单个响应增长到数百 MB，并阻止工作台加载。监控界面只需要阶段
    摘要、维修计划、报告和精简后的流程 Trace。
    """

    if not isinstance(pipeline, Mapping):
        return {}
    keys = (
        "task_id",
        "trace_id",
        "entry",
        "user_text",
        "event",
        "route",
        "route_result",
        "diagnosis",
        "knowledge",
        "cad",
        "maintenance_plan",
        "report",
        "status",
        "errors",
        "evidence_status",
        "stop_reason",
        "goal_event",
        "runtime_actions",
    )
    result = {key: pipeline[key] for key in keys if key in pipeline}
    if isinstance(pipeline.get('workorder'), Mapping):
        result['workorder'] = compact_workorder_result(pipeline['workorder'])
    if isinstance(pipeline.get("knowledge"), Mapping):
        result["knowledge"] = _compact_stage(
            pipeline["knowledge"],
            ("query", "status", "summary", "confidence", "possible_causes", "recommended_checks", "total", "backend_status", "degraded", "warning", "source", "validation_findings", "stop_reason"),
        )
    if isinstance(pipeline.get("maintenance_plan"), Mapping):
        result["maintenance_plan"] = _compact_stage(
            pipeline["maintenance_plan"],
            ("plan_id", "created_at", "diagnosis", "repair_target", "target_part", "engineering_context", "repair_steps", "tools", "parts", "safety", "required_tools", "required_parts", "safety_requirements", "pre_checks", "post_checks", "estimated_time", "estimated_duration", "cad_components", "inventory_status", "part_availability", "validation_findings", "risk_level", "workorder_ready", "workorder_draft", "evidence", "source_documents", "maintenance_required", "maintenance_reason", "cad_required", "synthetic", "plan_kind", "inspection_required", "inspection_reason"),
        )
    result["trace"] = _compact_trace(pipeline.get("trace"))
    runtime_result = pipeline.get("runtime_result")
    if isinstance(runtime_result, Mapping):
        result["runtime_result"] = {
            key: runtime_result[key]
            for key in ("status", "stop_reason", "iterations", "evidence_score", "actions")
            if key in runtime_result
        }
    return result


def _compact_monitor_result(result: Any) -> Dict[str, Any] | None:
    """裁剪最新监控结果中的嵌套历史，生成界面负载。"""

    if result is None:
        return None
    value = dict(result.to_dict())
    trigger = value.get("trigger")
    if isinstance(trigger, Mapping):
        value["trigger"] = {
            key: trigger[key]
            for key in (
                "device_id",
                "triggered_at",
                "trigger_reasons",
                "status",
                "current_sample",
                "abnormal_events",
                "abnormal_event",
                "task_id",
                "event_id",
                "trigger_cause",
                "rule_types",
            )
            if key in trigger
        }
    return value


def _compact_trigger_history(items: Any) -> List[Dict[str, Any]]:
    if not isinstance(items, list):
        return []
    compacted: List[Dict[str, Any]] = []
    for item in items[-30:]:
        if not isinstance(item, Mapping):
            continue
        compacted.append({
            key: item[key]
            for key in (
                "device_id",
                "triggered_at",
                "trigger_reasons",
                "status",
                "abnormal_events",
                "abnormal_event",
                "task_id",
                "event_id",
                "trigger_cause",
                "rule_types",
            )
            if key in item
        })
    return compacted


def _event_identity(event: Mapping[str, Any]) -> Dict[str, Any]:
    """所有进行中、成功和失败结果都携带原始事件归属。"""

    return {**{key: event[key] for key in
            ("tenant_id", "project_id", "device_id", "device_name", "device_model", "event_id", "event_revision", "alarm_code", "task_id") if key in event},
            "event_timestamp": event.get('timestamp') or ''}


def dispatch_agent_event(event: Dict[str, Any], *, on_recovery: Callable | None = None,
                         on_pipeline: Callable | None = None,
                         should_continue: Callable[[], bool] | None = None) -> Dict[str, Any]:
    """只提交一次；并行读取阶段诊断，超时后有界对账，不重放工单写操作。"""

    body = json.dumps({"event": dict(event or {})}, ensure_ascii=False).encode("utf-8")
    request = Request(
        AGENT_SERVICE_BASE_URL.rstrip("/") + "/api/v1/agent/event",
        data=body,
        headers=agent_request_headers(),
        method="POST",
    )
    def submit_once():
        with urlopen(request, timeout=AGENT_EVENT_TIMEOUT_SECONDS) as response:
            result = json.loads(response.read().decode("utf-8"))
        if not isinstance(result, dict):
            raise RuntimeError("Agent Service 返回的诊断结果不是对象")
        return result

    lookup = None
    if event.get("event_id") and event.get("device_id"):
        query = urlencode({"device_id": event["device_id"], "event_revision": event.get("event_revision", 1),
                           "tenant_id": event.get("tenant_id") or ""})
        lookup = Request(AGENT_SERVICE_BASE_URL.rstrip("/") + "/api/v1/agent/event/"
                         + quote(str(event["event_id"]), safe="") + "/result?" + query,
                         headers=agent_request_headers(), method="GET")

    worker = ThreadPoolExecutor(max_workers=1, thread_name_prefix="agent-event-http")
    submitted = worker.submit(submit_once)
    diagnosis: Dict[str, Any] = {}
    published_pipeline: Dict[str, Any] = {}
    uncertain = False
    post_finished = False
    deadline = monotonic() + AGENT_EVENT_TIMEOUT_SECONDS
    interval = max(0.01, AGENT_RESULT_POLL_SECONDS)

    def wait_for_response(wait_seconds):
        try:
            return True, submitted.result(timeout=wait_seconds)
        except TimeoutError:
            # 等待超时与 POST 自己抛出网络超时不同。完成竞态中必须消费真实响应。
            if submitted.done():
                return True, submitted.result()
            return False, None

    def publish(value):
        nonlocal diagnosis
        if value != diagnosis:
            diagnosis = value
            if on_recovery:
                on_recovery(dict(value))

    def start_recovery():
        nonlocal uncertain, deadline
        if uncertain:
            return
        uncertain = True
        deadline = monotonic() + AGENT_RESULT_RECOVERY_SECONDS
        if diagnosis.get("summary"):
            publish({**diagnosis, "workflow_status": "recovering"})
        else:
            publish({**_event_identity(event), "status": "recovering",
                     "summary": "诊断响应超时，正在回查后台结果", "diagnosis": "",
                     "error": "HTTP 等待超时；尚不能判定后台执行失败。"})

    try:
        while should_continue is None or should_continue():
            if not post_finished:
                try:
                    received, value = wait_for_response(max(0.001, min(interval, deadline - monotonic())))
                    if received:
                        return value
                except TimeoutError:
                    post_finished = True
                    start_recovery()
                except HTTPError as error:
                    if error.code != 504:
                        raise
                    error.close()
                    post_finished = True
                    start_recovery()
                except URLError as error:
                    if not isinstance(error.reason, TimeoutError):
                        raise
                    post_finished = True
                    start_recovery()
            else:
                sleep(max(0.0, min(interval, deadline - monotonic())))
            if not uncertain and monotonic() >= deadline:
                start_recovery()
            if uncertain and (monotonic() >= deadline or lookup is None):
                break
            if lookup is None:
                continue
            try:
                with urlopen(lookup, timeout=max(0.01, min(5.0, deadline - monotonic()))) as response:
                    payload = json.loads(response.read().decode("utf-8"))
                if not isinstance(payload, dict):
                    raise ValueError("回查响应必须是对象")
                if payload.get("status") == "available" and isinstance(payload.get("result"), dict):
                    return payload["result"]
                if payload.get("status") == "in_progress" and isinstance(payload.get("result"), dict):
                    progress = compact_public_pipeline(payload['result'])
                    stage = progress.get("diagnosis")
                    if isinstance(stage, dict):
                        publish({**stage, **_event_identity(event),
                                 "workflow_status": "recovering" if uncertain else "running"})
                    if on_pipeline and progress != published_pipeline:
                        published_pipeline = progress
                        on_pipeline(dict(progress))
            except (OSError, ValueError) as error:
                # 只读 GET 可重试；服务拒绝或版本不兼容时停止回查，不触发写重试。
                if isinstance(error, HTTPError):
                    error.close()
                    if error.code < 500:
                        lookup = None
                        if uncertain:
                            diagnosis["error"] = "结果回查被拒绝（HTTP %s），未重新提交事件。" % error.code
                            break
    finally:
        # 原 POST 仍受 HTTP 超时约束。停止回查不取消或重复已提交的写动作。
        worker.shutdown(wait=False)
    if diagnosis.get("status") in {"completed", "fallback"}:
        diagnosis["workflow_status"] = "unknown"
    else:
        diagnosis.update(**_event_identity(event), status="unknown", summary="诊断结果暂未确认",
                         diagnosis="后台可能仍在处理或等待对账；未重新提交异常，未确认执行成功。")
    return {"event": dict(event), "status": "unknown", "diagnosis": diagnosis}

from app.monitor import (  # noqa: E402，路径注入后再导入本地应用包。
    DeviceMonitor,
    FactoryApiClient,
    FactorySnapshotProvider,
    MonitorRunner,
)


class MonitorWebState:
    """持有监控运行器，以及暴露给界面的少量运行状态。"""

    def __init__(self) -> None:
        self.base_url = os.getenv("FACTORY_API_BASE_URL", "http://127.0.0.1:4529")
        self.interval_seconds = float(os.getenv("MONITOR_INTERVAL_SECONDS", "0.5"))
        self.client = FactoryApiClient(self.base_url)
        self.latest_error: Optional[str] = None
        self.devices = self._load_devices()
        self.device_ids = [str(item.get("device_id")) for item in self.devices if item.get("device_id")]
        if not self.device_ids:
            self.device_ids = ["TRAK-TC820LTYSI-001"]
            self.devices = [{"device_id": self.device_ids[0], "name": self.device_ids[0]}]
        self.device_id = self.device_ids[0]
        self.providers = {
            device_id: FactorySnapshotProvider(self.client, device_id)
            for device_id in self.device_ids
        }
        self.monitor = DeviceMonitor()
        self.lock = Lock()
        self.latest_result = None
        self.latest_results: Dict[str, Any] = {}
        self.result_count = 0
        self.alarm_event_count = 0
        self.alarm_event_counts: Dict[str, int] = {}
        self.machine_controls: Dict[str, Any] = {}
        self._paused_event_keys: set[str] = set()
        self.diagnosis_task_count = 0
        self._last_alarm_codes: Dict[str, Optional[str]] = {}
        self.trigger_history = deque(maxlen=30)
        self.diagnosis_executor = ThreadPoolExecutor(
            max_workers=1,
            thread_name_prefix="diagnosis-agent",
        )
        from app.clients.backend import BackendServiceClient
        from app.monitor.line_control import LineController
        self.line_controller = None
        if os.getenv('BACKEND_SERVICE_BASE_URL'):
            self.line_controller = LineController(self.client, BackendServiceClient())
        self.control_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix='virtual-line-control')
        self.line_state = {'state': 'unknown'}
        self.latest_diagnosis: Optional[Dict[str, Any]] = None
        self.latest_pipeline: Optional[Dict[str, Any]] = None
        self.latest_diagnoses_by_device: Dict[str, Dict[str, Any]] = {}
        self.latest_pipelines_by_device: Dict[str, Dict[str, Any]] = {}
        self._diagnosis_events_by_device: Dict[str, Dict[str, Any]] = {}
        self._latest_diagnosis_event: Dict[str, Any] = {}
        self._last_device_discovery = 0.0
        self._device_discovery_interval = max(
            1.0,
            float(os.getenv("MONITOR_DEVICE_DISCOVERY_SECONDS", "5")),
        )
        self.diagnosis_history = deque(maxlen=30)
        self.diagnosis_pending = 0
        self._diagnosis_generation = 0
        self.runner = MonitorRunner(
            monitor=self.monitor,
            sample_provider=self._read_all_samples,
            interval_seconds=self.interval_seconds,
            on_result=self._on_result,
            on_trigger=self._on_trigger,
            on_error=self._on_error,
        )

    def _configured_device_ids(self) -> List[str]:
        """读取可选设备范围配置；未配置时返回空列表，表示接入全部设备。"""

        raw_ids = os.getenv("FACTORY_DEVICE_IDS", "")
        if raw_ids.strip():
            return [item.strip() for item in raw_ids.split(",") if item.strip()]
        legacy_id = os.getenv("FACTORY_DEVICE_ID")
        if legacy_id:
            return [legacy_id.strip()]
        return []

    def _load_devices(self) -> List[Dict[str, Any]]:
        """从工厂接口发现设备，必要时回退到配置中的设备 ID。"""

        configured_ids = self._configured_device_ids()
        try:
            api_devices = self.client.devices()
        except Exception as error:
            self.latest_error = "%s: %s" % (type(error).__name__, error)
            api_devices = []
        if configured_ids:
            by_id = {str(item.get("device_id")): dict(item) for item in api_devices if item.get("device_id")}
            return [by_id.get(device_id, {"device_id": device_id, "name": device_id}) for device_id in configured_ids]
        if api_devices:
            return [dict(item) for item in api_devices if item.get("device_id")]
        return []

    def _read_all_samples(self):
        """读取当前接入的全部设备采样。"""

        self._refresh_devices()
        with self.lock:
            providers = [self.providers[device_id] for device_id in self.device_ids]
        return [provider.read() for provider in providers]

    def _refresh_devices(self, force: bool = False) -> None:
        """周期性重新发现工厂设备，避免服务启动过早时永久只监控回退设备。"""

        now = monotonic()
        if not force and now - self._last_device_discovery < self._device_discovery_interval:
            return
        self._last_device_discovery = now
        configured_ids = self._configured_device_ids()
        try:
            api_devices = self.client.devices()
        except Exception as error:
            # 保留当前设备集合继续监测；采样错误会通过 runner 暴露给前端。
            self.latest_error = "%s: %s" % (type(error).__name__, error)
            return
        if configured_ids:
            by_id = {str(item.get("device_id")): dict(item) for item in api_devices if item.get("device_id")}
            discovered = [by_id.get(device_id, {"device_id": device_id, "name": device_id}) for device_id in configured_ids]
        else:
            discovered = [dict(item) for item in api_devices if item.get("device_id")]
        if not discovered:
            return
        device_ids = [str(item.get("device_id")) for item in discovered if item.get("device_id")]
        with self.lock:
            current_ids = list(self.device_ids)
            self.devices = discovered
            self.device_ids = device_ids
            for device_id in device_ids:
                self.providers.setdefault(device_id, FactorySnapshotProvider(self.client, device_id))
            self._last_device_discovery = now
            if current_ids != device_ids:
                self.latest_error = None

    def start(self) -> None:
        """启动后台自动监测。"""

        self.runner.start()

    def stop(self) -> None:
        """停止后台自动监测。"""

        self.runner.stop(timeout=3.0)
        self.diagnosis_executor.shutdown(wait=False, cancel_futures=True)
        self.control_executor.shutdown(wait=False, cancel_futures=True)

    def _on_result(self, result) -> None:
        """接收运行器回调，并更新前端可读取的最新结果。"""

        with self.lock:
            self.latest_result = result
            self.latest_results[result.device_id] = result
            self.latest_error = None
            self.result_count += 1
            alarm_code = result.current_sample.alarm_code or None
            previous_alarm_code = self._last_alarm_codes.get(result.device_id)
            if alarm_code and alarm_code != previous_alarm_code:
                self.alarm_event_count += 1
                self.alarm_event_counts[alarm_code] = self.alarm_event_counts.get(alarm_code, 0) + 1
            self._last_alarm_codes[result.device_id] = alarm_code
            if result.trigger:
                self.diagnosis_task_count += 1
                self.trigger_history.appendleft(result.trigger.to_dict())
    def _on_trigger(self, trigger) -> None:
        """把确认后的异常事件异步交给 Diagnosis Agent。"""

        event = trigger.abnormal_event.to_dict() if trigger.abnormal_event else None
        if not event:
            return
        device = next((item for item in getattr(self, 'devices', []) if item.get('device_id') == event.get('device_id')), {})
        if device.get('name'):
            event['device_name'] = device['name']
        if device.get('device_model') or device.get('model'):
            event['device_model'] = device.get('device_model') or device['model']
        from app.monitor.models import MonitorStatus
        if trigger.status == MonitorStatus.FAULT and self.line_controller:
            control = self.control_executor.submit(self.line_controller.handle_fault, str(event.get('event_id') or event.get('key') or ''), trigger.device_id, str(event.get('message') or '监控确认故障'))
            control.add_done_callback(self._on_line_control_done)
        with self.lock:
            generation = self._diagnosis_generation
            self.diagnosis_pending += 1
            device_id = str(event.get("device_id") or "")
            self._diagnosis_events_by_device = {**getattr(self, "_diagnosis_events_by_device", {}), device_id: event}
            self._latest_diagnosis_event = event
            diagnosis = {**_event_identity(event), "status": "running", "summary": "当前故障正在诊断"}
            self.latest_diagnosis = diagnosis
            self.latest_pipeline = {}
            self.latest_diagnoses_by_device = {**getattr(self, "latest_diagnoses_by_device", {}), device_id: diagnosis}
            self.latest_pipelines_by_device = {**getattr(self, "latest_pipelines_by_device", {}), device_id: {}}
        future = self.diagnosis_executor.submit(partial(
            dispatch_agent_event, event,
            on_recovery=lambda diagnosis: self._on_diagnosis_progress(diagnosis, generation, event),
            on_pipeline=lambda pipeline: self._on_pipeline_progress(pipeline, generation, event),
            should_continue=lambda: self._diagnosis_is_current(generation, event),
        ))
        future.add_done_callback(
            lambda completed: self._on_diagnosis_done(completed, generation, event)
        )

    def _on_line_control_done(self, future):
        try:
            result = future.result()
        except Exception as error:
            result = {'state': 'failed', 'reason': type(error).__name__}
        with self.lock:
            self.line_state = result
            self.machine_controls = dict(result.get('devices') or {})

    def _diagnosis_is_current(self, generation: int, event: Dict[str, Any]) -> bool:
        with self.lock:
            return generation == self._diagnosis_generation and self._diagnosis_events_by_device.get(str(event.get("device_id") or "")) == event

    def _on_diagnosis_progress(self, diagnosis: Dict[str, Any], generation: int, event: Dict[str, Any]) -> None:
        """回查期间立即显示真实状态；旧事件不能覆盖当前故障。"""

        with self.lock:
            device_id = str(event.get("device_id") or "")
            if generation != self._diagnosis_generation or self._diagnosis_events_by_device.get(device_id) != event:
                return
            self.latest_diagnoses_by_device[device_id] = diagnosis
            if self._latest_diagnosis_event == event:
                self.latest_diagnosis = diagnosis

    def _on_pipeline_progress(self, pipeline: Dict[str, Any], generation: int, event: Dict[str, Any]) -> None:
        """已生成的方案立即显示；阶段结果不冒充整流程完成或触发派工。"""
        with self.lock:
            device_id = str(event.get('device_id') or '')
            if generation != self._diagnosis_generation or self._diagnosis_events_by_device.get(device_id) != event:
                return
            progress = {**pipeline, 'event':dict(event), 'status':'running'}
            self.latest_pipelines_by_device[device_id] = progress
            if self._latest_diagnosis_event == event:
                self.latest_pipeline = progress

    def _on_diagnosis_done(self, future: Future, generation: int, event: Dict[str, Any] | None = None) -> None:
        """保存异步诊断结果；统计归零后完成的旧任务不会污染新会话。"""

        try:
            pipeline = dict(future.result() or {})
            diagnosis = dict(pipeline.get("diagnosis") or {})
            if not diagnosis:
                diagnosis = {
                    "status": "failed",
                    "summary": "Agent Service 未返回诊断结果",
                    "diagnosis": "无法生成诊断结果。",
                }
        except Exception as error:  # pragma: no cover，Agent Service 自身已有降级边界。
            pipeline = {}
            diagnosis = {
                "status": "failed",
                "summary": "Agent Service 调用失败",
                "diagnosis": "无法生成诊断结果。",
                "error": "%s: %s" % (type(error).__name__, error),
            }
        with self.lock:
            if generation != self._diagnosis_generation:
                return
            self.diagnosis_pending = max(0, self.diagnosis_pending - 1)
            device_id = str(
                (event or {}).get("device_id")
                or diagnosis.get("device_id")
                or ""
            ).strip()
            if event and self._diagnosis_events_by_device.get(device_id) != event:
                return
            previous = self.latest_diagnoses_by_device.get(device_id) or {}
            if diagnosis.get("status") == "failed" and previous.get("status") in {"completed", "fallback"}:
                # 诊断已完成与整流程 HTTP 失败是两件事，后者不能擦掉前者的正文。
                diagnosis = {**previous, "workflow_status": "unknown", "error": diagnosis.get("error", "后续流程结果未返回")}
                prior_pipeline = self.latest_pipelines_by_device.get(device_id) or {}
                pipeline = {**prior_pipeline, "event": dict(event or {}), "status": "unknown", "diagnosis": diagnosis,
                            "stop_reason": "agent_response_unavailable"}
            # 原始事件是可信归属；不依赖模型是否在正文中返回报警编号。
            diagnosis.update(_event_identity(event or {}))
            if not getattr(self, "_latest_diagnosis_event", {}) or self._latest_diagnosis_event == event:
                self.latest_diagnosis = diagnosis
                self.latest_pipeline = pipeline
            if device_id:
                self.latest_diagnoses_by_device[device_id] = diagnosis
                self.latest_pipelines_by_device[device_id] = pipeline
            self.diagnosis_history.appendleft(diagnosis)

    def _diagnosis_snapshot(self) -> Dict[str, Any]:
        """返回诊断智能体当前状态，供页面实时展示。"""

        if self.latest_diagnosis:
            return {
                "pending": self.diagnosis_pending,
                "latest": self.latest_diagnosis,
                "latest_by_device": dict(self.latest_diagnoses_by_device),
                "pipeline_by_device": {
                    device_id: compact_public_pipeline(pipeline)
                    for device_id, pipeline in self.latest_pipelines_by_device.items()
                },
                "history": list(self.diagnosis_history),
                "pipeline": self.latest_pipeline or {},
            }
        return {
            "pending": self.diagnosis_pending,
            "latest": {
                "status": "running" if self.diagnosis_pending else "idle",
                "summary": "诊断智能体正在分析" if self.diagnosis_pending else "等待异常事件",
            },
            "latest_by_device": dict(self.latest_diagnoses_by_device),
            "pipeline_by_device": {
                device_id: compact_public_pipeline(pipeline)
                for device_id, pipeline in self.latest_pipelines_by_device.items()
            },
            "history": [],
            "pipeline": {},
        }

    def _on_error(self, error: Exception) -> None:
        """记录最近一次采样或上游调用错误。"""

        with self.lock:
            self.latest_error = "%s: %s" % (type(error).__name__, error)

    def snapshot(self) -> Dict[str, Any]:
        """生成前端轮询接口使用的完整监控快照。"""

        with self.lock:
            result = self.latest_result
            results = dict(self.latest_results)
            public_result = _compact_monitor_result(result)
            return {
                "runner": self.runner.snapshot().__dict__,
                "device_id": self.device_id,
                "device_ids": list(self.device_ids),
                "devices": self._device_snapshots(results),
                "data_source": "模拟工厂",
                "result_count": self.result_count,
                "alarm_event_count": self.alarm_event_count,
                "alarm_event_counts": dict(self.alarm_event_counts),
                "diagnosis_task_count": self.diagnosis_task_count,
                "latest_error": self.latest_error,
                "machine_controls": dict(self.machine_controls),
                'line_control': dict(getattr(self, 'line_state', {'state': 'unknown'})),
                "latest_result": public_result,
                "latest_results": {
                    device_id: _compact_monitor_result(item)
                    for device_id, item in results.items()
                },
                "trigger_history": _compact_trigger_history(list(self.trigger_history)),
                "diagnosis": {
                    **self._diagnosis_snapshot(),
                    "pipeline": compact_public_pipeline((self.latest_pipeline or {})),
                },
            }

    def _device_snapshots(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """返回设备清单，并附加各自最新监测结果，供前端多设备展示。"""

        devices = []
        for item in self.devices:
            device = dict(item)
            device_id = str(device.get("device_id") or "")
            result = results.get(device_id)
            device["live"] = device_id in self.providers
            device["latest_result"] = _compact_monitor_result(result)
            device["current_sample"] = (
                result.current_sample.to_dict() if result else None
            )
            devices.append(device)
        return devices

    def set_enabled(self, enabled: bool) -> Dict[str, Any]:
        """设置自动监测开关，并返回最新快照。"""

        self.runner.set_enabled(enabled)
        return self.snapshot()

    def reset_stats(self) -> Dict[str, Any]:
        """在不关闭 Web 服务的情况下开始一轮新的监测会话。"""

        was_running = self.runner.running
        self.runner.stop(timeout=3.0)
        self.monitor.reset()
        with self.lock:
            self._diagnosis_generation += 1
            self.latest_result = None
            self.latest_results.clear()
            self.latest_error = None
            self.result_count = 0
            self.alarm_event_count = 0
            self.alarm_event_counts.clear()
            self.diagnosis_task_count = 0
            self._last_alarm_codes.clear()
            self.trigger_history.clear()
            self.latest_diagnosis = None
            self.latest_pipeline = None
            self.latest_diagnoses_by_device.clear()
            self.latest_pipelines_by_device.clear()
            self._diagnosis_events_by_device.clear()
            self._latest_diagnosis_event = {}
            self.diagnosis_history.clear()
            self.diagnosis_pending = 0
            self.machine_controls.clear()
            self._paused_event_keys.clear()
        if was_running:
            self.runner.start()
        return self.snapshot()


class MonitorRequestHandler(BaseHTTPRequestHandler):
    """提供监控面板静态资源和本地监控控制 API。"""

    state: MonitorWebState

    def do_GET(self) -> None:  # noqa: N802，沿用标准库处理器要求的方法名。
        """处理前端静态资源和监控快照查询。"""

        parsed = urlparse(self.path)
        if parsed.path.startswith('/api/team/'):
            self._proxy_team('GET')
            return
        if parsed.path == "/api/monitor/snapshot":
            self._json(self.state.snapshot())
            return
        if self._should_proxy(parsed.path):
            self._proxy_to_agent_service("GET")
            return
        self._serve_static(parsed.path)

    def do_POST(self) -> None:  # noqa: N802，沿用标准库处理器要求的方法名。
        """处理监控开关和统计重置请求。"""

        parsed = urlparse(self.path)
        if parsed.path.startswith('/api/team/'):
            self._proxy_team('POST')
            return
        if self._should_proxy(parsed.path):
            self._proxy_to_agent_service("POST")
            return
        try:
            payload = self._read_json()
            if parsed.path == "/api/monitor/control":
                action = payload.get("action")
                if action == "on":
                    self._json(self.state.set_enabled(True))
                elif action == "off":
                    self._json(self.state.set_enabled(False))
                elif action == "toggle":
                    self.state.runner.toggle()
                    self._json(self.state.snapshot())
                else:
                    self._error(HTTPStatus.BAD_REQUEST, "action must be on, off or toggle")
                return
            if parsed.path == "/api/monitor/reset":
                self._json(self.state.reset_stats())
                return
            self._error(HTTPStatus.NOT_FOUND, "endpoint not found")
        except Exception as error:
            self._error(HTTPStatus.BAD_GATEWAY, str(error))

    def do_DELETE(self) -> None:  # noqa: N802，沿用标准库处理器要求的方法名。
        parsed = urlparse(self.path)
        if self._should_proxy(parsed.path):
            self._proxy_to_agent_service("DELETE")
            return
        self._error(HTTPStatus.NOT_FOUND, "endpoint not found")

    def log_message(self, format: str, *args: Any) -> None:
        """关闭默认访问日志，保持控制台输出简洁。"""

        return

    @staticmethod
    def _should_proxy(path: str) -> bool:
        """判断是否需要转发给 Agent Service。"""

        if path == '/api/production/virtual' or path.startswith('/api/production/virtual/'):
            return True

        return path.startswith((
            "/api/agent/",
            "/api/rag/",
            "/api/trace",
            "/api/runs",
            "/api/v1/runs",
            "/api/memory/",
            "/api/workorders",
            "/api/maintenance/",
            "/api/v1/workorders",
            "/api/experience/",
            "/api/reports",
            "/api/cad/",
            "/api/quality/",
            "/api/v1/quality/",
            "/api/v1/closure",
            "/api/v1/closure-tasks",
        ))

    def _proxy_to_agent_service(self, method: str) -> None:
        """把平台 API 请求转发给 Agent Service，保持前端同源调用。"""

        body = None
        # Starlette 的终端 '$' 也接受最终换行，斜杠重定向还能去掉尾斜杠；两者均须防护。
        path_parts = unquote(urlparse(self.path).path).strip("/").removesuffix("\n").split("/")
        cad_write = (
            method != "GET"
            and path_parts[:2] == ["api", "cad"]
            and len(path_parts) > 2 and path_parts[2] in {"buildcad", "freecad"}
        )
        production_write = method != 'GET' and path_parts[:3] == ['api', 'production', 'virtual']
        if cad_write or production_write:
            body = self._read_local_cad_body()
            if body is None:
                return
        else:
            origin = self.headers.get('Origin')
            if method != 'GET' and origin and urlparse(origin).netloc != self.headers.get('Host'):
                self._error(HTTPStatus.FORBIDDEN, '仅允许同源请求')
                return
            if method in {"POST", "PUT", "PATCH"}:
                length = int(self.headers.get("Content-Length", "0"))
                body = self.rfile.read(length) if length else b""
        headers = agent_request_headers(self.headers.get("Content-Type", "application/json"))
        if self.headers.get('Cookie'):
            headers['Cookie'] = self.headers['Cookie']
        request = Request(
            AGENT_SERVICE_BASE_URL.rstrip("/") + self.path,
            data=body,
            headers=headers,
            method=method,
        )
        try:
            with urlopen(request, timeout=MONITOR_PROXY_TIMEOUT_SECONDS) as response:
                payload = response.read()
                self.send_response(response.status)
                self.send_header("Content-Type", response.headers.get("Content-Type", "application/json; charset=utf-8"))
                self.send_header("Cache-Control", "no-store")
                if response.headers.get("Content-Disposition"):
                    self.send_header("Content-Disposition", response.headers["Content-Disposition"])
                if path_parts[:4] == ["api", "cad", "buildcad", "auth"]:
                    for cookie in response.headers.get_all("Set-Cookie", []):
                        self.send_header("Set-Cookie", cookie)
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
        except HTTPError as error:
            payload = error.read() or json.dumps({"error": str(error)}, ensure_ascii=False).encode("utf-8")
            self.send_response(error.code)
            self.send_header("Content-Type", error.headers.get("Content-Type", "application/json; charset=utf-8"))
            if path_parts[:4] == ["api", "cad", "buildcad", "auth"]:
                for cookie in error.headers.get_all("Set-Cookie", []):
                    self.send_header("Set-Cookie", cookie)
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except URLError as error:
            self._error(HTTPStatus.BAD_GATEWAY, "Agent Service unavailable: %s" % error.reason)

    def _read_local_cad_body(self) -> bytes | None:
        """在附加服务凭据前验证本机 CAD 请求的来源和正文边界。"""
        def reject(status: HTTPStatus, message: str) -> None:
            self.close_connection = True
            self._error(status, message)

        try:
            local_peer = ipaddress.ip_address(self.client_address[0]).is_loopback
        except ValueError:
            local_peer = False
        port = self.server.server_port
        authorities = {f"localhost:{port}", f"127.0.0.1:{port}", f"[::1]:{port}"}
        if port == 80:
            authorities.update({"localhost", "127.0.0.1", "[::1]"})
        hosts = self.headers.get_all("Host", [])
        origins = self.headers.get_all("Origin", [])
        if not local_peer or len(hosts) != 1 or hosts[0].lower() not in authorities:
            reject(HTTPStatus.FORBIDDEN, "CAD 接口仅允许本机地址和当前服务端口")
            return None
        if len(origins) != 1 or origins[0].lower() != "http://" + hosts[0].lower():
            reject(HTTPStatus.FORBIDDEN, "CAD 接口需要完整的 HTTP 同源 Origin")
            return None
        lengths = self.headers.get_all("Content-Length", [])
        if (
            self.headers.get_all("Transfer-Encoding", [])
            or len(lengths) != 1
            or not lengths[0].isascii()
            or not lengths[0].isdigit()
        ):
            reject(HTTPStatus.BAD_REQUEST, "CAD 请求的 Content-Length 无效")
            return None
        # 新入口仅接收 JSON 需求，不再接收原本地模型文件上传。
        if len(lengths[0]) > 10 or int(lengths[0]) > 1024 * 1024:
            reject(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "CAD 请求体过大")
            return None
        length = int(lengths[0])
        original_timeout = self.connection.gettimeout()
        try:
            self.connection.settimeout(CAD_BODY_TIMEOUT_SECONDS)
            body = self.rfile.read(length)
        except (OSError, TimeoutError):
            reject(HTTPStatus.BAD_REQUEST, "CAD 请求体读取失败")
            return None
        finally:
            self.connection.settimeout(original_timeout)
        if len(body) != length:
            reject(HTTPStatus.BAD_REQUEST, "CAD 请求体长度与 Content-Length 不一致")
            return None
        return body

    def _proxy_team(self, method):
        allowed = {'GET': {'/api/team/me', '/api/team/devices', '/api/team/reminders', '/api/team/workorders', '/api/team/line'}, 'POST': {'/api/team/register', '/api/team/login', '/api/team/logout', '/api/team/reminders', '/api/team/responsibilities'}}
        path = urlparse(self.path).path
        import re
        reminder_read = method == 'POST' and re.fullmatch(r'/api/team/reminders/[a-f0-9]{32}/read', path)
        if path not in allowed.get(method, set()) and not reminder_read:
            self._error(HTTPStatus.NOT_FOUND, '未允许的账号接口')
            return
        origin = self.headers.get('Origin')
        if origin and urlparse(origin).netloc != self.headers.get('Host'):
            self._error(HTTPStatus.FORBIDDEN, '仅允许同源请求')
            return
        body = self.rfile.read(int(self.headers.get('Content-Length', '0'))) if method == 'POST' else None
        headers = {'Content-Type': 'application/json'}
        if self.headers.get('Cookie'):
            headers['Cookie'] = self.headers['Cookie']
        if self.headers.get('Host'):
            headers['Host'] = self.headers['Host']
        if origin:
            headers['Origin'] = origin
        request = Request(os.getenv('BACKEND_SERVICE_BASE_URL', 'http://127.0.0.1:8030').rstrip('/') + self.path, data=body, method=method, headers=headers)
        try:
            response = urlopen(request, timeout=15)
        except HTTPError as error:
            response = error
        except (URLError, TimeoutError):
            self._error(HTTPStatus.BAD_GATEWAY, '维修账号服务不可用')
            return
        with response:
            payload = response.read()
            self.send_response(response.code)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            for cookie in response.headers.get_all('Set-Cookie', []):
                self.send_header('Set-Cookie', cookie)
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

    def _serve_static(self, path: str) -> None:
        """从前端目录安全地返回静态文件。"""

        relative = "index.html" if path in {"", "/"} else path.lstrip("/")
        file_path = (FRONTEND_ROOT / relative).resolve()
        if FRONTEND_ROOT.resolve() not in file_path.parents and file_path != FRONTEND_ROOT.resolve():
            self._error(HTTPStatus.NOT_FOUND, "file not found")
            return
        if not file_path.is_file():
            self._error(HTTPStatus.NOT_FOUND, "file not found")
            return
        content_types = {
            ".css": "text/css; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".html": "text/html; charset=utf-8",
        }
        body = file_path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_types.get(file_path.suffix, "application/octet-stream"))
        # 入口文档包含当前带哈希的 bundle 名称。前端重建后不能让浏览器继续缓存旧的
        # index，否则刷新时可能静默运行持久化改动之前的 bundle。
        if file_path.suffix == ".html":
            self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> Dict[str, Any]:
        """读取 JSON 请求体，并要求顶层结构必须是对象。"""

        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        payload = json.loads(self.rfile.read(length).decode("utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("request body must be a JSON object")
        return payload

    def _json(self, payload: Any) -> None:
        """返回 JSON 响应，并禁用浏览器缓存。"""

        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _error(self, status: HTTPStatus, message: str) -> None:
        """按统一格式返回错误响应。"""

        body = json.dumps({"error": message}, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    """启动本地监控 Web 服务。"""

    host = os.getenv("MONITOR_WEB_HOST", "127.0.0.1")
    port = int(os.getenv("MONITOR_WEB_PORT", "8001"))
    state = MonitorWebState()
    MonitorRequestHandler.state = state
    server = ThreadingHTTPServer((host, port), MonitorRequestHandler)
    state.start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        state.stop()
        server.server_close()


if __name__ == "__main__":
    main()
