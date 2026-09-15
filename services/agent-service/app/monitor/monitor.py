"""连续设备监测器与诊断触发状态机。"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Deque, Dict, Iterable, List, Optional

from .models import (
    _AnomalyState,
    AlertLevel,
    AbnormalEvent,
    AnomalyObservation,
    DeviceSample,
    DiagnosisTrigger,
    MonitorResult,
    MonitorStatus,
    RuleType,
)
from .rules import MonitorConfig, classify_metric_detail


TriggerHandler = Callable[[DiagnosisTrigger], None]


@dataclass
class _DeviceState:
    """单台设备的历史采样和异常状态。"""

    samples: Deque[DeviceSample]
    anomalies: Dict[str, _AnomalyState] = field(default_factory=dict)
    last_timestamp: Optional[datetime] = None
    incident_id: Optional[str] = None
    incident_alarm_codes: set = field(default_factory=set)


class DeviceMonitor:
    """监控所有采样，并在满足规则后才发出诊断触发。

    监控器刻意与诊断智能体解耦：这里负责确定性的时间、次数和趋势判断，
    输出的结构化载荷后续可以交给 LangGraph 或其他智能体编排层。
    """

    def __init__(
        self,
        config: Optional[MonitorConfig] = None,
        on_trigger: Optional[TriggerHandler] = None,
    ) -> None:
        self.config = config or MonitorConfig()
        self.on_trigger = on_trigger
        self._devices: Dict[str, _DeviceState] = {}
        self._event_sequence = 0

    def observe(self, sample: DeviceSample) -> MonitorResult:
        """处理一条采样并返回监控判定。"""

        state = self._devices.setdefault(
            sample.device_id,
            _DeviceState(samples=deque(maxlen=self.config.history_size)),
        )
        self._validate_timestamp(state, sample.timestamp)
        state.samples.append(sample)

        observations = self._detect_anomalies(state, sample)
        self._expire_old_anomalies(state, sample.timestamp)
        self._reset_missing_continuous_events(
            state,
            {item.key for item in observations},
        )
        self._update_anomaly_states(state, observations, sample.timestamp)
        self._prepare_incident(state, observations, sample.timestamp)

        status = self._classify_status(sample, observations)
        trigger = self._build_trigger_if_ready(state, sample, status)
        result = MonitorResult(
            device_id=sample.device_id,
            status=status,
            current_sample=sample,
            observations=tuple(observations),
            trigger=trigger,
        )
        if trigger and self.on_trigger:
            self.on_trigger(trigger)
        return result

    def observe_many(self, samples: Iterable[DeviceSample]) -> List[MonitorResult]:
        """处理有限采样流，便于模拟器或测试使用。"""

        return [self.observe(sample) for sample in samples]

    def reset(self, device_id: Optional[str] = None) -> None:
        """清空单台设备或全部设备的监控状态。"""

        if device_id is None:
            self._devices.clear()
            self._event_sequence = 0
        else:
            self._devices.pop(device_id, None)

    def _new_event_id(self, timestamp: datetime) -> str:
        """为一个新的故障生命周期生成稳定事件编号。"""

        self._event_sequence += 1
        return "EVT-%s-%03d" % (
            timestamp.strftime("%Y%m%d-%H%M%S-%f")[:-3],
            self._event_sequence,
        )

    def _prepare_incident(
        self,
        state: _DeviceState,
        observations: List[AnomalyObservation],
        timestamp: datetime,
    ) -> None:
        """维护设备级故障生命周期，合并同一异常窗口内陆续出现的证据。"""

        if not observations:
            # 连续指标恢复正常后关闭设备级事件；计数状态本身仍可保留其时间窗口。
            state.incident_id = None
            state.incident_alarm_codes.clear()
            return

        current_alarm_codes = {
            str(item.value)
            for item in observations
            if item.kind == "alarm"
        }
        new_alarm_code = bool(
            current_alarm_codes
            and state.incident_alarm_codes
            and current_alarm_codes.difference(state.incident_alarm_codes)
        )
        new_incident = state.incident_id is None or new_alarm_code
        if new_incident:
            state.incident_id = self._new_event_id(timestamp)
            state.incident_alarm_codes = set()
        state.incident_alarm_codes.update(current_alarm_codes)

        current_states = [
            state.anomalies[item.key]
            for item in observations
            if item.key in state.anomalies
        ]
        if new_incident:
            for anomaly in current_states:
                self._start_event_state(anomaly, state.incident_id)
            return

        event_states = [
            item
            for item in state.anomalies.values()
            if item.event_id == state.incident_id
        ]
        inherited_rank = max(
            (item.last_diagnosed_rank for item in event_states),
            default=-1,
        )
        inherited_revision = max(
            (item.event_revision for item in event_states),
            default=0,
        )
        for anomaly in current_states:
            if anomaly.event_id == state.incident_id:
                continue
            anomaly.event_id = state.incident_id
            anomaly.last_diagnosed_rank = inherited_rank
            anomaly.event_revision = inherited_revision
            anomaly.triggered = inherited_rank >= 0
            anomaly.lifecycle = "active" if inherited_rank >= 0 else "pending"

    @staticmethod
    def _start_event_state(
        anomaly: _AnomalyState,
        event_id: Optional[str],
    ) -> None:
        """把异常状态绑定到新事件，并清除上一事件的诊断记录。"""

        anomaly.event_id = event_id
        anomaly.last_diagnosed_rank = -1
        anomaly.event_revision = 0
        anomaly.triggered = False
        anomaly.lifecycle = "pending"
        anomaly.trigger_reason = ""

    def active_anomalies(self, device_id: str) -> List[AbnormalEvent]:
        """返回当前仍在追踪的异常事件快照。"""

        state = self._devices.get(device_id)
        if state is None:
            return []
        return [item.to_event() for item in state.anomalies.values()]

    def _validate_timestamp(self, state: _DeviceState, timestamp: datetime) -> None:
        """确保同一设备的采样按时间顺序进入状态机。"""

        if state.last_timestamp and timestamp < state.last_timestamp:
            raise ValueError("device samples must arrive in timestamp order")
        state.last_timestamp = timestamp

    def _detect_anomalies(
        self,
        state: _DeviceState,
        sample: DeviceSample,
    ) -> List[AnomalyObservation]:
        """汇总指标、状态、报警、趋势和多指标联合异常。"""

        # 新工厂快照优先使用 metric_details，可覆盖整机更多指标。
        observations: List[AnomalyObservation] = self._detect_metric_details(sample)
        if not observations:
            observations = self._detect_legacy_temperature_vibration(sample)

        if sample.status and str(sample.status).lower() in {
            "fault", "failed", "emergency_stop", "e_stop", "offline"
        }:
            observations.append(
                AnomalyObservation(
                    key="status:" + str(sample.status).lower(),
                    kind="status",
                    value=sample.status,
                    threshold=None,
                    message="设备当前状态不可运行",
                    alert_level=AlertLevel.HIGH,
                    monitoring_point="device_status",
                    rule_type=RuleType.CRITICAL,
                    label="设备状态",
                    group="整机",
                )
            )
        if sample.alarm_code:
            alarm_key = "alarm:" + sample.alarm_code
            alarm_level = sample.alarm_level or AlertLevel.HIGH
            observations.append(
                AnomalyObservation(
                    key=alarm_key,
                    kind="alarm",
                    value=sample.alarm_code,
                    threshold=None,
                    message="设备报警已激活",
                    alert_level=alarm_level,
                    monitoring_point="device_alarm",
                    rule_type=self.config.rule_type_for(alarm_key, alarm_level),
                    label="设备报警",
                    group="整机",
                )
            )

        metric_observations = [
            item
            for item in observations
            if item.kind not in {"alarm", "status", "trend", "multi_metric"}
        ]
        observations.extend(self._trend_observations(state, sample, metric_observations))
        observations.extend(self._multi_metric_observations(metric_observations))
        return observations

    def _detect_metric_details(self, sample: DeviceSample) -> List[AnomalyObservation]:
        """检测工厂快照中描述的每一个指标。"""

        result: List[AnomalyObservation] = []
        for metric_key, detail in sample.metric_details.items():
            value = sample.metrics.get(metric_key)
            classified = classify_metric_detail(value, detail)
            if classified is None:
                continue
            level, threshold, unit = classified
            if metric_key == "spindle_temperature_c":
                key, kind, point = "temperature", "temperature", "spindle_bearing_housing"
            elif metric_key in {
                "spindle_vibration_rms",
                "spindle_vibration_velocity_rms",
                "vibration_rms",
                "vibration_mm_s",
                "vibration",
            }:
                key, kind, point = "vibration", "vibration", "spindle_velocity_rms"
            else:
                key, kind, point = "metric:" + metric_key, "metric", metric_key
            result.append(
                AnomalyObservation(
                    key=key,
                    kind=kind,
                    value=value,
                    threshold=threshold,
                    message="%s 超出正常范围"
                    % (detail.get("label") or metric_key),
                    alert_level=level,
                    unit=unit,
                    monitoring_point=point,
                    label=str(detail.get("label") or metric_key),
                    group=str(detail.get("group") or "整机"),
                    rule_type=RuleType.DURATION,
                )
            )
        return result

    def _detect_legacy_temperature_vibration(
        self,
        sample: DeviceSample,
    ) -> List[AnomalyObservation]:
        """兼容只提供温度和振动字段的旧调用方。"""

        observations: List[AnomalyObservation] = []
        temperature_band = self.config.temperature_threshold_for(sample.temperature_point)
        temperature_level = (
            temperature_band.level_for(sample.temperature)
            if sample.temperature is not None
            else AlertLevel.NORMAL
        )
        if sample.temperature is not None and temperature_level != AlertLevel.NORMAL:
            observations.append(
                AnomalyObservation(
                    key="temperature",
                    kind="temperature",
                    value=sample.temperature,
                    threshold=self._threshold_for(temperature_band, temperature_level),
                    message="温度超过%s等级阈值" % self._alert_level_label(temperature_level),
                    alert_level=temperature_level,
                    unit=temperature_band.unit,
                    monitoring_point=sample.temperature_point,
                    rule_type=RuleType.DURATION,
                    label="temperature",
                    group="主轴",
                )
            )
        vibration_band = self.config.vibration_threshold_for(sample.vibration_point)
        vibration_level = (
            vibration_band.level_for(sample.vibration)
            if sample.vibration is not None
            else AlertLevel.NORMAL
        )
        if sample.vibration is not None and vibration_level != AlertLevel.NORMAL:
            observations.append(
                AnomalyObservation(
                    key="vibration",
                    kind="vibration",
                    value=sample.vibration,
                    threshold=self._threshold_for(vibration_band, vibration_level),
                    message="振动超过%s等级阈值" % self._alert_level_label(vibration_level),
                    alert_level=vibration_level,
                    unit=vibration_band.unit,
                    monitoring_point=sample.vibration_point,
                    rule_type=RuleType.DURATION,
                    label="vibration",
                    group="主轴",
                )
            )
        return observations

    def _trend_observations(
        self,
        state: _DeviceState,
        sample: DeviceSample,
        metric_observations: List[AnomalyObservation],
    ) -> List[AnomalyObservation]:
        """检测已经越过阈值的指标是否持续恶化。"""

        result: List[AnomalyObservation] = []
        window = self.config.trend_window_samples
        samples = list(state.samples)[-window:]
        if len(samples) < window:
            return result

        for observation in metric_observations:
            values = [self._metric_value(item, observation) for item in samples]
            if any(value is None for value in values):
                continue
            numeric_values = [float(value) for value in values]
            if not all(
                right > left
                for left, right in zip(numeric_values, numeric_values[1:])
            ):
                continue
            delta = numeric_values[-1] - numeric_values[0]
            if delta < self.config.trend_min_delta:
                continue
            result.append(
                AnomalyObservation(
                    key="trend:" + observation.key,
                    kind="trend",
                    value=delta,
                    threshold=self.config.trend_min_delta,
                    message="%s 在连续 %s 个采样中持续恶化"
                    % (observation.label or observation.kind, window),
                    alert_level=self._raise_level(observation.alert_level),
                    unit=observation.unit,
                    monitoring_point=observation.monitoring_point,
                    label=observation.label or observation.kind,
                    group=observation.group,
                    rule_type=RuleType.TREND,
                    related_keys=(observation.key,),
                )
            )
        return result

    def _multi_metric_observations(
        self,
        metric_observations: List[AnomalyObservation],
    ) -> List[AnomalyObservation]:
        """当多个指标同时异常时，生成联合异常观测。"""

        if len(metric_observations) < self.config.multi_metric_min_count:
            return []
        related_keys = tuple(item.key for item in metric_observations)
        highest = max(
            metric_observations,
            key=lambda item: self._level_rank(item.alert_level),
        )
        return [
            AnomalyObservation(
                key="multi_metric:" + "+".join(related_keys),
                kind="multi_metric",
                value=len(metric_observations),
                threshold=float(self.config.multi_metric_min_count),
                message="多个异常指标同时处于异常状态",
                alert_level=self._raise_level(highest.alert_level),
                monitoring_point="multi_metric",
                rule_type=RuleType.MULTI_METRIC,
                related_keys=related_keys,
            )
        ]

    @staticmethod
    def _metric_value(sample: DeviceSample, observation: AnomalyObservation):
        """按观测类型从采样中取出用于趋势判断的数值。"""

        if observation.kind == "temperature":
            return sample.temperature
        if observation.kind == "vibration":
            return sample.vibration
        if observation.key.startswith("metric:"):
            return sample.metrics.get(observation.key.removeprefix("metric:"))
        return None

    @staticmethod
    def _level_rank(level: AlertLevel) -> int:
        """把告警等级转换为可比较的严重程度排序。"""

        return {
            AlertLevel.NORMAL: 0,
            AlertLevel.INITIAL: 1,
            AlertLevel.INTERMEDIATE: 2,
            AlertLevel.HIGH: 3,
        }[level]

    @classmethod
    def _raise_level(cls, level: AlertLevel) -> AlertLevel:
        """趋势和多指标联合异常会在原等级基础上抬升一级。"""

        if level == AlertLevel.INITIAL:
            return AlertLevel.INTERMEDIATE
        if level == AlertLevel.INTERMEDIATE:
            return AlertLevel.HIGH
        return level

    @staticmethod
    def _threshold_for(band, level: AlertLevel) -> float:
        """按告警等级返回对应阈值。"""

        if level == AlertLevel.HIGH:
            return band.high
        if level == AlertLevel.INTERMEDIATE:
            return band.intermediate
        return band.initial

    @staticmethod
    def _alert_level_label(level: AlertLevel) -> str:
        """把内部告警枚举转换为中文描述。"""

        return {
            AlertLevel.NORMAL: "正常",
            AlertLevel.INITIAL: "初级预警",
            AlertLevel.INTERMEDIATE: "中级报警",
            AlertLevel.HIGH: "高级故障",
        }[level]

    def _expire_old_anomalies(self, state: _DeviceState, timestamp: datetime) -> None:
        """移除超过事件间隔或计数窗口的旧异常状态。"""

        expired = []
        for key, anomaly in state.anomalies.items():
            if anomaly.rule_type == RuleType.COUNT:
                anomaly.prune_occurrences(timestamp, self.config.count_window_seconds)
                if not anomaly.occurrence_timestamps:
                    expired.append(key)
                continue
            if (timestamp - anomaly.last_seen).total_seconds() > self.config.event_gap_seconds:
                expired.append(key)
        for key in expired:
            del state.anomalies[key]

    def _update_anomaly_states(
        self,
        state: _DeviceState,
        observations: List[AnomalyObservation],
        timestamp: datetime,
    ) -> None:
        """把当前观测写入累计状态，新事件会重新建状态。"""

        for observation in observations:
            current = state.anomalies.get(observation.key)
            if current is None or self._starts_new_event(current, observation, timestamp):
                current = _AnomalyState(
                    key=observation.key,
                    kind=observation.kind,
                    first_seen=timestamp,
                    last_seen=timestamp,
                    continuous_start=timestamp,
                    occurrence_count=1,
                    latest_value=observation.value,
                    threshold=observation.threshold,
                    message=observation.message,
                    alert_level=observation.alert_level,
                    unit=observation.unit,
                    monitoring_point=observation.monitoring_point,
                    label=observation.label,
                    group=observation.group,
                    rule_type=observation.rule_type,
                    occurrence_timestamps=[timestamp],
                    related_keys=observation.related_keys,
                )
                related_event_ids = [
                    state.anomalies[key].event_id
                    for key in observation.related_keys
                    if key in state.anomalies and state.anomalies[key].event_id
                ]
                current.event_id = related_event_ids[0] if related_event_ids else self._new_event_id(timestamp)
                state.anomalies[observation.key] = current
            else:
                current.update(observation, timestamp)

    def _starts_new_event(
        self,
        current: _AnomalyState,
        observation: AnomalyObservation,
        timestamp: datetime,
    ) -> bool:
        """判断当前观测是否应与旧状态拆分为新事件。"""

        if current.rule_type == RuleType.COUNT or observation.rule_type == RuleType.COUNT:
            return (
                timestamp - current.last_seen
            ).total_seconds() > self.config.count_window_seconds
        return (
            timestamp - current.last_seen
        ).total_seconds() > self.config.event_gap_seconds

    @staticmethod
    def _reset_missing_continuous_events(
        state: _DeviceState,
        observed_keys: set,
    ) -> None:
        """正常采样关闭连续异常，计数型异常继续保留其时间窗口。"""

        recovered = [
            key
            for key, anomaly in state.anomalies.items()
            if key not in observed_keys and anomaly.rule_type != RuleType.COUNT
        ]
        for key in recovered:
            state.anomalies[key].reset_continuous_duration()
            del state.anomalies[key]

    def _classify_status(
        self,
        sample: DeviceSample,
        observations: List[AnomalyObservation],
    ) -> MonitorStatus:
        """按当前观测中的最高告警等级给出设备状态。"""

        if any(
            item.alert_level == AlertLevel.HIGH for item in observations
        ):
            return MonitorStatus.FAULT
        if any(
            item.alert_level == AlertLevel.INTERMEDIATE for item in observations
        ):
            return MonitorStatus.ALARM
        if observations:
            return MonitorStatus.WARNING
        return MonitorStatus.NORMAL

    def _build_trigger_if_ready(
        self,
        state: _DeviceState,
        sample: DeviceSample,
        status: MonitorStatus,
    ) -> Optional[DiagnosisTrigger]:
        """判断异常是否满足触发条件，并构造诊断载荷。"""

        candidates: List[_AnomalyState] = []
        for anomaly in state.anomalies.values():
            same_event = [
                item
                for item in state.anomalies.values()
                if item.event_id and item.event_id == anomaly.event_id
            ]
            diagnosed_rank = max(
                (item.last_diagnosed_rank for item in same_event),
                default=-1,
            )
            current_rank = self._level_rank(anomaly.alert_level)
            is_first_confirmation = diagnosed_rank < 0
            if anomaly.rule_type == RuleType.CRITICAL:
                ready = True
            elif anomaly.rule_type in {RuleType.TREND, RuleType.MULTI_METRIC}:
                ready = True
            else:
                duration = 0.0
                if anomaly.continuous_start is not None:
                    duration = (
                        sample.timestamp - anomaly.continuous_start
                    ).total_seconds()
                if anomaly.rule_type == RuleType.COUNT:
                    anomaly.prune_occurrences(sample.timestamp, self.config.count_window_seconds)
                    ready = (
                        len(anomaly.occurrence_timestamps)
                        >= self.config.abnormal_occurrence_threshold
                    )
                else:
                    ready = duration >= self.config.abnormal_duration_seconds
            if ready and (
                is_first_confirmation or current_rank > diagnosed_rank
            ):
                candidates.append(anomaly)

        if not candidates:
            return None

        reasons = []
        for anomaly in candidates:
            duration = 0.0
            if anomaly.continuous_start is not None:
                duration = (
                    sample.timestamp - anomaly.continuous_start
                ).total_seconds()
            if anomaly.rule_type == RuleType.CRITICAL:
                reasons.append(
                    "关键规则：%s，严重报警立即触发"
                    % (anomaly.label or anomaly.key)
                )
            elif anomaly.rule_type == RuleType.DURATION:
                reasons.append(
                    "阈值规则：%s 超过阈值 %s%s"
                    % (
                        anomaly.label or anomaly.key,
                        anomaly.threshold,
                        anomaly.unit or "",
                    )
                )
                reasons.append(
                    "持续规则：%s 持续异常达到 %s 秒"
                    % (anomaly.label or anomaly.key, self.config.abnormal_duration_seconds)
                )
            elif anomaly.rule_type == RuleType.COUNT:
                reasons.append(
                    "计数规则：%s 在 %s 秒时间窗口内出现次数达到 %s"
                    % (
                        anomaly.label or anomaly.key,
                        self.config.count_window_seconds,
                        self.config.abnormal_occurrence_threshold,
                    )
                )
            elif anomaly.rule_type == RuleType.TREND:
                reasons.append(
                    "趋势规则：%s 连续 %s 个采样持续恶化"
                    % (anomaly.label or anomaly.key, self.config.trend_window_samples)
                )
            elif anomaly.rule_type == RuleType.MULTI_METRIC:
                reasons.append(
                    "多指标规则：同时存在 %s 个异常指标"
                    % len(anomaly.related_keys)
                )
        primary = max(
            candidates,
            key=lambda item: self._level_rank(item.alert_level),
        )
        primary_event_id = primary.event_id or self._new_event_id(sample.timestamp)
        has_previous_diagnosis = any(
            item.last_diagnosed_rank >= 0
            for item in candidates
        )
        trigger_cause = "故障等级升级" if has_previous_diagnosis else "首次确认异常"
        highest_rank = max(self._level_rank(item.alert_level) for item in candidates)

        candidate_event_ids = {item.event_id for item in candidates if item.event_id}
        for anomaly in state.anomalies.values():
            if anomaly.event_id not in candidate_event_ids:
                continue
            anomaly.last_diagnosed_rank = max(anomaly.last_diagnosed_rank, highest_rank)
            anomaly.event_revision += 1
            anomaly.triggered = True
            anomaly.lifecycle = "active"
            anomaly.trigger_reason = trigger_cause

        active = tuple(
            item.to_event()
            for item in state.anomalies.values()
            if item.event_id == primary_event_id
        )
        event_revision = max(
            (
                item.event_revision
                for item in state.anomalies.values()
                if item.event_id == primary_event_id
            ),
            default=1,
        )
        abnormal_event = self._build_abnormal_event(
            sample=sample,
            status=status,
            active_events=active,
            trigger_reasons=tuple(reasons),
            event_id=primary_event_id,
            trigger_cause=trigger_cause,
            event_revision=event_revision,
        )
        trigger = DiagnosisTrigger(
            device_id=sample.device_id,
            triggered_at=sample.timestamp,
            trigger_reasons=tuple(reasons),
            status=status,
            current_sample=sample,
            abnormal_events=active,
            recent_samples=tuple(state.samples),
            abnormal_event=abnormal_event,
            task_id="TASK-%s-R%02d"
            % (abnormal_event.event_id.removeprefix("EVT-"), event_revision),
            event_id=abnormal_event.event_id,
            trigger_cause=trigger_cause,
        )
        return trigger

    def _build_abnormal_event(
        self,
        sample: DeviceSample,
        status: MonitorStatus,
        active_events: tuple,
        trigger_reasons: tuple,
        event_id: str,
        trigger_cause: str,
        event_revision: int,
    ) -> AbnormalEvent:
        """把本次确认的异常聚合为 Diagnosis Agent 的单一入口事件。"""

        highest = max(
            active_events,
            key=lambda item: self._level_rank(item.alert_level),
        )
        event_type = "multi_metric" if len(active_events) > 1 else highest.kind
        abnormal_metrics = tuple(
            {
                "key": item.key,
                "label": item.label or item.key,
                "value": item.latest_value,
                "threshold": item.threshold,
                "unit": item.unit,
                "group": item.group,
                "monitoring_point": item.monitoring_point,
                "alert_level": item.alert_level.value,
                "rule_type": item.rule_type.value,
            }
            for item in active_events
            if item.kind not in {"alarm", "status", "trend", "multi_metric"}
        )
        first_seen = min(
            (item.first_seen for item in active_events),
            default=sample.timestamp,
        )
        return AbnormalEvent(
            key="event:%s:%s" % (sample.device_id, event_id),
            kind="abnormal_event",
            first_seen=first_seen,
            last_seen=sample.timestamp,
            occurrence_count=max(
                (item.occurrence_count for item in active_events),
                default=1,
            ),
            duration_seconds=max(
                (item.duration_seconds for item in active_events),
                default=0.0,
            ),
            latest_value=sample.metrics or {
                "temperature": sample.temperature,
                "vibration": sample.vibration,
                "rpm": sample.rpm,
            },
            threshold=None,
            message="；".join(trigger_reasons),
            triggered=True,
            alert_level=highest.alert_level,
            monitoring_point="machine",
            rule_type=(
                RuleType.MULTI_METRIC
                if len(active_events) > 1
                else highest.rule_type
            ),
            label="整机异常事件",
            group="整机",
            related_keys=tuple(item.key for item in active_events),
            device_id=sample.device_id,
            event_type=event_type,
            severity=highest.alert_level.value,
            alarm_code=sample.alarm_code,
            abnormal_metrics=abnormal_metrics,
            realtime_snapshot=sample.to_dict(),
            trigger_rules=tuple(
                sorted(
                    {
                        rule_type
                        for item in active_events
                        for rule_type in (
                            (RuleType.THRESHOLD.value, RuleType.DURATION.value)
                            if item.rule_type == RuleType.DURATION
                            else (item.rule_type.value,)
                        )
                    }
                )
            ),
            timestamp=sample.timestamp,
            event_id=event_id,
            task_id="TASK-%s-R%02d" % (event_id.removeprefix("EVT-"), event_revision),
            lifecycle="active",
            trigger_reason=trigger_cause,
            event_revision=event_revision,
        )
