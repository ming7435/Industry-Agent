"""设备实时数据接口的 HTTP 适配器。"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, Mapping, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .models import AlertLevel, DeviceSample
from .presentation import cycle_state_label


class FactoryApiError(RuntimeError):
    """设备数据接口无法提供快照时抛出的异常。"""


class FactoryApiClient:
    """从设备数据接口读取设备快照。"""

    def __init__(self, base_url: str = "http://127.0.0.1:8000", timeout: float = 5.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def snapshot(self, device_id: str) -> Dict[str, Any]:
        """读取指定设备的工厂快照，并校验响应是 JSON 对象。"""

        query = urlencode({"device_id": device_id})
        request = Request(
            "%s/api/snapshot?%s" % (self.base_url, query),
            headers={"Accept": "application/json"},
        )
        try:
            with urlopen(request, timeout=self.timeout) as response:
                payload = response.read().decode("utf-8")
        except (HTTPError, URLError, TimeoutError) as error:
            raise FactoryApiError("failed to read factory snapshot: %s" % error) from error
        try:
            result = json.loads(payload)
        except json.JSONDecodeError as error:
            raise FactoryApiError("factory snapshot is not valid JSON") from error
        if not isinstance(result, dict):
            raise FactoryApiError("factory snapshot must be a JSON object")
        return result

    def devices(self) -> list[Dict[str, Any]]:
        """读取工厂当前已暴露的设备清单。"""

        request = Request(
            "%s/api/devices" % self.base_url,
            headers={"Accept": "application/json"},
        )
        try:
            with urlopen(request, timeout=self.timeout) as response:
                payload = response.read().decode("utf-8")
        except (HTTPError, URLError, TimeoutError) as error:
            raise FactoryApiError("failed to read factory devices: %s" % error) from error
        try:
            result = json.loads(payload)
        except json.JSONDecodeError as error:
            raise FactoryApiError("factory devices response is not valid JSON") from error
        if not isinstance(result, list):
            raise FactoryApiError("factory devices response must be a JSON array")
        return [item for item in result if isinstance(item, dict)]


class FactorySnapshotProvider:
    """把工厂快照转换为监控器使用的 ``DeviceSample``。"""

    # 工厂侧可能使用不同字段名表达振动速度，这里按优先级寻找第一个有效值。
    _VIBRATION_KEYS = (
        "spindle_vibration_rms",
        "spindle_vibration_velocity_rms",
        "vibration_rms",
        "vibration_mm_s",
        "vibration",
    )

    def __init__(self, client: FactoryApiClient, device_id: str):
        self.client = client
        self.device_id = device_id

    def __call__(self) -> DeviceSample:
        """让 provider 可以作为无参采样函数传给运行器。"""

        return self.read()

    def read(self) -> DeviceSample:
        """读取一次工厂快照，并映射成统一采样结构。"""

        payload = self.client.snapshot(self.device_id)
        raw_monitor = payload.get("monitor") or {}
        devices = payload.get("devices") or []
        device = self._select_device(devices, self.device_id)
        monitor = self._select_monitor(raw_monitor, self.device_id)
        metrics = dict(monitor.get("metrics") or device.get("metrics") or {})
        metric_details = dict(
            monitor.get("metric_details") or device.get("metric_details") or {}
        )
        equipment_states = dict(
            monitor.get("equipment_states") or device.get("equipment_states") or {}
        )

        actual_device_id = (
            monitor.get("device_id")
            or device.get("device_id")
            or self.device_id
        )
        alarm_code = (
            monitor.get("alarm_code")
            or device.get("alarm_code")
            or None
        )
        active_scenario = (payload.get("scenarios") or {}).get("active_scenario")
        scenario = self._find_matching_scenario(payload, active_scenario, alarm_code)
        alarm_level = self._map_scenario_severity(scenario)

        cycle_state = monitor.get("cycle_state") or device.get("cycle_state")
        return DeviceSample(
            device_id=actual_device_id,
            timestamp=self._extract_sample_timestamp(payload, monitor, device),
            temperature=self._to_optional_number(metrics.get("spindle_temperature_c")),
            vibration=self._first_available_number(metrics, self._VIBRATION_KEYS),
            rpm=self._to_optional_number(metrics.get("spindle_rpm")),
            alarm_code=alarm_code,
            temperature_point="spindle_bearing_housing",
            vibration_point="spindle_velocity_rms",
            alarm_level=alarm_level,
            status=monitor.get("status") or device.get("status"),
            mode=monitor.get("mode") or device.get("mode"),
            cycle_state=cycle_state,
            cycle_state_label=cycle_state_label(cycle_state),
            health_score=self._to_optional_number(
                monitor.get("health_score")
                if monitor.get("health_score") is not None
                else device.get("health_score")
            ),
            metrics=metrics,
            metric_details=metric_details,
            equipment_states=equipment_states,
        )

    @staticmethod
    def _select_device(devices: Any, device_id: str) -> Mapping[str, Any]:
        """从多设备快照中选出请求设备，避免误读第一台设备。"""

        if not isinstance(devices, list):
            return {}
        for device in devices:
            if isinstance(device, Mapping) and str(device.get("device_id") or "") == device_id:
                return device
        return {}

    @staticmethod
    def _select_monitor(monitor: Any, device_id: str) -> Mapping[str, Any]:
        """只使用匹配当前设备的监测块。"""

        if not isinstance(monitor, Mapping):
            return {}
        monitor_device_id = str(monitor.get("device_id") or "")
        if monitor_device_id and monitor_device_id != device_id:
            return {}
        return monitor

    @staticmethod
    def _to_optional_number(value: Any) -> Optional[float]:
        """将工厂侧可选数值转换为浮点数，布尔值不作为测量值。"""

        if value is None or isinstance(value, bool):
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @classmethod
    def _first_available_number(
        cls,
        metrics: Mapping[str, Any],
        keys: tuple,
    ) -> Optional[float]:
        """按候选字段优先级返回第一个有效数值。"""

        for key in keys:
            value = cls._to_optional_number(metrics.get(key))
            if value is not None:
                return value
        return None

    @staticmethod
    def _find_matching_scenario(
        payload: Mapping[str, Any],
        active_scenario: Any,
        alarm_code: Optional[str],
    ) -> Optional[Mapping[str, Any]]:
        """根据激活场景或报警码找到对应的工厂场景定义。"""

        scenarios = (payload.get("scenarios") or {}).get("scenarios") or []
        for scenario in scenarios:
            if not isinstance(scenario, Mapping):
                continue
            if active_scenario and (
                scenario.get("scenario_id") == active_scenario
                or scenario.get("alarm_code") == active_scenario
            ):
                return scenario
            if alarm_code and scenario.get("alarm_code") == alarm_code:
                return scenario
        return None

    @staticmethod
    def _map_scenario_severity(scenario: Optional[Mapping[str, Any]]) -> Optional[AlertLevel]:
        """将工厂场景严重度映射为统一告警等级。"""

        if not scenario:
            return None
        severity = str(scenario.get("severity") or "").lower()
        if severity in {"critical", "high", "fault"}:
            return AlertLevel.HIGH
        if severity in {"alarm", "error", "intermediate"}:
            return AlertLevel.INTERMEDIATE
        if severity in {"warning", "warn", "initial"}:
            return AlertLevel.INITIAL
        return None

    @staticmethod
    def _extract_sample_timestamp(
        payload: Mapping[str, Any],
        monitor: Mapping[str, Any],
        device: Mapping[str, Any],
    ) -> datetime:
        """从工厂快照提取采样时间，兼容毫秒级数值时间戳。"""

        raw = (
            monitor.get("checked_at")
            or device.get("updated_at")
            or (payload.get("summary") or {}).get("updated_at")
        )
        if isinstance(raw, (int, float)):
            return datetime.fromtimestamp(raw / 1000.0, tz=timezone.utc).replace(
                tzinfo=None
            )
        return datetime.now()
