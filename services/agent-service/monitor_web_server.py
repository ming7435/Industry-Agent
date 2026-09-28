"""实时设备监测 Web 控制台。"""

from __future__ import annotations

import json
import os
import sys
from collections import deque
from concurrent.futures import Future, ThreadPoolExecutor
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
from time import monotonic
from typing import Any, Dict, List, Mapping, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


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
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

# 为导入旧版模块级 Registry 类型的集成保留向后兼容的符号导出。
# Monitor 不会实例化它；所有执行仍位于 Agent Service HTTP 边界之后。
from app.tools.registry import ToolRegistry  # noqa: E402,F401


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
    if isinstance(pipeline.get("knowledge"), Mapping):
        result["knowledge"] = _compact_stage(
            pipeline["knowledge"],
            ("query", "status", "summary", "confidence", "possible_causes", "recommended_checks", "total", "backend_status", "degraded", "warning", "source", "validation_findings", "stop_reason"),
        )
    if isinstance(pipeline.get("maintenance_plan"), Mapping):
        result["maintenance_plan"] = _compact_stage(
            pipeline["maintenance_plan"],
            ("plan_id", "diagnosis", "repair_target", "target_part", "engineering_context", "repair_steps", "tools", "parts", "safety", "required_tools", "required_parts", "safety_requirements", "pre_checks", "post_checks", "estimated_time", "estimated_duration", "cad_components", "inventory_status", "part_availability", "validation_findings", "risk_level", "workorder_ready", "workorder_draft"),
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


def dispatch_agent_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """把原始异常事件交给唯一的 Agent Service Runtime。"""

    body = json.dumps({"event": dict(event or {})}, ensure_ascii=False).encode("utf-8")
    request = Request(
        AGENT_SERVICE_BASE_URL.rstrip("/") + "/api/v1/agent/event",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=AGENT_EVENT_TIMEOUT_SECONDS) as response:
        result = json.loads(response.read().decode("utf-8"))
    if not isinstance(result, dict):
        raise RuntimeError("Agent Service 返回的工单结果不是对象")
    return result

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
        self.diagnosis_task_count = 0
        self._last_alarm_codes: Dict[str, Optional[str]] = {}
        self.trigger_history = deque(maxlen=30)
        self.diagnosis_executor = ThreadPoolExecutor(
            max_workers=1,
            thread_name_prefix="diagnosis-agent",
        )
        self.latest_diagnosis: Optional[Dict[str, Any]] = None
        self.latest_pipeline: Optional[Dict[str, Any]] = None
        self.latest_diagnoses_by_device: Dict[str, Dict[str, Any]] = {}
        self.latest_pipelines_by_device: Dict[str, Dict[str, Any]] = {}
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
        # 监控逻辑刻意保持只读。严重结果只暴露给诊断/工单流程，
        # 绝不会直接启动或停止设备。

    def _on_trigger(self, trigger) -> None:
        """把确认后的异常事件异步交给 Diagnosis Agent。"""

        event = trigger.abnormal_event.to_dict() if trigger.abnormal_event else None
        if not event:
            return
        with self.lock:
            generation = self._diagnosis_generation
            self.diagnosis_pending += 1
        future = self.diagnosis_executor.submit(dispatch_agent_event, event)
        future.add_done_callback(
            lambda completed: self._on_diagnosis_done(completed, generation, event)
        )

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
            self.diagnosis_pending = max(0, self.diagnosis_pending - 1)
            if generation != self._diagnosis_generation:
                return
            self.latest_diagnosis = diagnosis
            self.latest_pipeline = pipeline
            device_id = str(
                (event or {}).get("device_id")
                or diagnosis.get("device_id")
                or ""
            ).strip()
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
            self.diagnosis_history.clear()
            self.diagnosis_pending = 0
            self.machine_controls.clear()
        if was_running:
            self.runner.start()
        return self.snapshot()


class MonitorRequestHandler(BaseHTTPRequestHandler):
    """提供监控面板静态资源和本地监控控制 API。"""

    state: MonitorWebState

    def do_GET(self) -> None:  # noqa: N802，沿用标准库处理器要求的方法名。
        """处理前端静态资源和监控快照查询。"""

        parsed = urlparse(self.path)
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

        return path.startswith((
            "/api/agent/",
            "/api/rag/",
            "/api/trace",
            "/api/runs",
            "/api/v1/runs",
            "/api/memory/",
            "/api/workorders",
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
        if method in {"POST", "PUT", "PATCH"}:
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length) if length else b""
        headers = {"Content-Type": self.headers.get("Content-Type", "application/json")}
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
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
        except HTTPError as error:
            payload = error.read() or json.dumps({"error": str(error)}, ensure_ascii=False).encode("utf-8")
            self.send_response(error.code)
            self.send_header("Content-Type", error.headers.get("Content-Type", "application/json; charset=utf-8"))
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except URLError as error:
            self._error(HTTPStatus.BAD_GATEWAY, "Agent Service unavailable: %s" % error.reason)

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
