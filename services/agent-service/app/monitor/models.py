"""设备监测器使用的数据契约。"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple


class MonitorStatus(str, Enum):
    """监控器对设备当前状态的总体判定。"""

    NORMAL = "normal"
    WARNING = "warning"
    ALARM = "alarm"
    FAULT = "fault"


class AlertLevel(str, Enum):
    """工厂阈值表中使用的告警等级。"""

    NORMAL = "normal"
    INITIAL = "initial"
    INTERMEDIATE = "intermediate"
    HIGH = "high"


class RuleType(str, Enum):
    """可将异常事件移交给智能体的最终规则类型。"""

    CRITICAL = "critical"
    THRESHOLD = "threshold"
    DURATION = "duration"
    COUNT = "count"
    TREND = "trend"
    MULTI_METRIC = "multi_metric"


@dataclass(frozen=True)
class DeviceSample:
    """从模拟设备或真实设备接收到的一条实时采样。"""

    device_id: str
    timestamp: datetime
    temperature: Optional[float]
    vibration: Optional[float]
    rpm: Optional[float]
    alarm_code: Optional[str] = None
    temperature_point: str = "spindle_bearing_housing"
    vibration_point: str = "spindle_velocity_rms"
    alarm_level: Optional[AlertLevel] = None
    status: Optional[str] = None
    mode: Optional[str] = None
    cycle_state: Optional[str] = None
    cycle_state_label: Optional[str] = None
    health_score: Optional[float] = None
    metrics: Dict[str, Any] = field(default_factory=dict)
    metric_details: Dict[str, Any] = field(default_factory=dict)
    equipment_states: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """转换为可 JSON 序列化的字典，供接口和前端展示使用。"""

        return {
            "device_id": self.device_id,
            "timestamp": self.timestamp.isoformat(),
            "temperature": self.temperature,
            "vibration": self.vibration,
            "rpm": self.rpm,
            "alarm_code": self.alarm_code,
            "temperature_point": self.temperature_point,
            "vibration_point": self.vibration_point,
            "alarm_level": self.alarm_level.value if self.alarm_level else None,
            "status": self.status,
            "mode": self.mode,
            "cycle_state": self.cycle_state,
            "cycle_state_label": self.cycle_state_label,
            "health_score": self.health_score,
            "metrics": dict(self.metrics),
            "metric_details": dict(self.metric_details),
            "equipment_states": dict(self.equipment_states),
        }


@dataclass(frozen=True)
class AnomalyObservation:
    """在单条采样中检测到的一个异常观测。"""

    key: str
    kind: str
    value: Any
    threshold: Optional[float]
    message: str
    alert_level: AlertLevel = AlertLevel.INITIAL
    unit: Optional[str] = None
    monitoring_point: Optional[str] = None
    label: Optional[str] = None
    group: Optional[str] = None
    rule_type: RuleType = RuleType.DURATION
    related_keys: Tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> Dict[str, Any]:
        """转换为前端和诊断 Agent 都能消费的字典结构。"""

        return {
            "key": self.key,
            "kind": self.kind,
            "value": self.value,
            "threshold": self.threshold,
            "message": self.message,
            "alert_level": self.alert_level.value,
            "unit": self.unit,
            "monitoring_point": self.monitoring_point,
            "label": self.label,
            "group": self.group,
            "rule_type": self.rule_type.value,
            "related_keys": list(self.related_keys),
        }


@dataclass(frozen=True)
class AbnormalEvent:
    """监测器移交给 Diagnosis Agent 的统一异常事件。

    前面的字段保留了单项异常证据，后面的字段是 Agent 入口需要的聚合事件契约。
    这样既兼容现有监测规则，又能让后续诊断层只消费一个稳定的事件对象。
    """

    key: str
    kind: str
    first_seen: datetime
    last_seen: datetime
    occurrence_count: int
    duration_seconds: float
    latest_value: Any
    threshold: Optional[float]
    message: str
    triggered: bool
    alert_level: AlertLevel = AlertLevel.INITIAL
    unit: Optional[str] = None
    monitoring_point: Optional[str] = None
    rule_type: RuleType = RuleType.DURATION
    label: Optional[str] = None
    group: Optional[str] = None
    related_keys: Tuple[str, ...] = field(default_factory=tuple)
    device_id: str = ""
    event_type: str = "machine_abnormality"
    severity: str = "initial"
    alarm_code: Optional[str] = None
    abnormal_metrics: Tuple[Dict[str, Any], ...] = field(default_factory=tuple)
    realtime_snapshot: Dict[str, Any] = field(default_factory=dict)
    trigger_rules: Tuple[str, ...] = field(default_factory=tuple)
    timestamp: Optional[datetime] = None
    event_id: str = ""
    task_id: str = ""
    lifecycle: str = "active"
    trigger_reason: str = ""
    event_revision: int = 1

    def to_dict(self) -> Dict[str, Any]:
        """序列化异常事件，并把时间与枚举统一转成字符串。"""

        result = asdict(self)
        result["first_seen"] = self.first_seen.isoformat()
        result["last_seen"] = self.last_seen.isoformat()
        result["alert_level"] = self.alert_level.value
        result["rule_type"] = self.rule_type.value
        result["timestamp"] = (self.timestamp or self.last_seen).isoformat()
        result["abnormal_metrics"] = list(self.abnormal_metrics)
        result["trigger_rules"] = list(self.trigger_rules)
        result["event_id"] = self.event_id or self.key
        result["task_id"] = self.task_id or None
        result["lifecycle"] = self.lifecycle
        result["trigger_reason"] = self.trigger_reason
        result["event_revision"] = self.event_revision
        return result


@dataclass(frozen=True)
class DiagnosisTrigger:
    """监控器判断需要运行诊断智能体时输出的载荷。"""

    device_id: str
    triggered_at: datetime
    trigger_reasons: Tuple[str, ...]
    status: MonitorStatus
    current_sample: DeviceSample
    abnormal_events: Tuple[AbnormalEvent, ...]
    recent_samples: Tuple[DeviceSample, ...]
    abnormal_event: Optional[AbnormalEvent] = None
    task_id: str = ""
    event_id: str = ""
    trigger_cause: str = "首次确认异常"

    @property
    def active_anomalies(self) -> Tuple[AbnormalEvent, ...]:
        """兼容早期触发载荷字段名的别名。"""

        return self.abnormal_events

    def to_dict(self) -> Dict[str, Any]:
        """转换为 HTTP API 可直接返回的触发详情。"""

        return {
            "device_id": self.device_id,
            "triggered_at": self.triggered_at.isoformat(),
            "trigger_reasons": list(self.trigger_reasons),
            "status": self.status.value,
            "current_sample": self.current_sample.to_dict(),
            "abnormal_events": [item.to_dict() for item in self.abnormal_events],
            "active_anomalies": [item.to_dict() for item in self.abnormal_events],
            "abnormal_event": self.abnormal_event.to_dict() if self.abnormal_event else None,
            "task_id": self.task_id or None,
            "event_id": self.event_id or (
                self.abnormal_event.event_id if self.abnormal_event else None
            ),
            "trigger_cause": self.trigger_cause,
            "rule_types": sorted(
                {
                    rule_type
                    for item in self.abnormal_events
                    for rule_type in (
                        (RuleType.THRESHOLD.value, RuleType.DURATION.value)
                        if item.rule_type == RuleType.DURATION
                        else (item.rule_type.value,)
                    )
                }
            ),
            "recent_samples": [item.to_dict() for item in self.recent_samples],
        }


@dataclass(frozen=True)
class MonitorResult:
    """处理一条采样后得到的监控结果。"""

    device_id: str
    status: MonitorStatus
    current_sample: DeviceSample
    observations: Tuple[AnomalyObservation, ...] = field(default_factory=tuple)
    trigger: Optional[DiagnosisTrigger] = None

    @property
    def agent_should_run(self) -> bool:
        """只要生成触发载荷，就表示应启动诊断智能体。"""

        return self.trigger is not None

    def to_dict(self) -> Dict[str, Any]:
        """转换为接口响应字典。"""

        return {
            "device_id": self.device_id,
            "status": self.status.value,
            "current_sample": self.current_sample.to_dict(),
            "observations": [item.to_dict() for item in self.observations],
            "agent_should_run": self.agent_should_run,
            "trigger": self.trigger.to_dict() if self.trigger else None,
        }


@dataclass
class _AnomalyState:
    """单个异常键对应的可变内部状态。"""

    key: str
    kind: str
    first_seen: datetime
    last_seen: datetime
    continuous_start: Optional[datetime]
    occurrence_count: int
    latest_value: Any
    threshold: Optional[float]
    message: str
    alert_level: AlertLevel
    unit: Optional[str]
    monitoring_point: Optional[str]
    rule_type: RuleType
    label: Optional[str] = None
    group: Optional[str] = None
    occurrence_timestamps: List[datetime] = field(default_factory=list)
    related_keys: Tuple[str, ...] = field(default_factory=tuple)
    triggered: bool = False
    event_id: Optional[str] = None
    last_diagnosed_rank: int = -1
    event_revision: int = 0
    lifecycle: str = "pending"
    trigger_reason: str = ""
    level_upgraded: bool = False
    recovered: bool = False
    def update(self, observation: AnomalyObservation, timestamp: datetime) -> None:
        """用最新观测刷新累计次数、持续时间和展示信息。"""

        if self.recovered:
            self.first_seen = timestamp
            self.occurrence_count = 0
            self.continuous_start = timestamp
            self.triggered = False
            self.event_id = None
            self.last_diagnosed_rank = -1
            self.event_revision = 0
            self.lifecycle = "pending"
            self.trigger_reason = ""
            self.level_upgraded = False
            self.recovered = False
        elif self.continuous_start is None:
            self.continuous_start = timestamp
        self.last_seen = timestamp
        self.occurrence_count += 1
        self.latest_value = observation.value
        self.threshold = observation.threshold
        self.message = observation.message
        previous_rank = {
            AlertLevel.NORMAL: 0,
            AlertLevel.INITIAL: 1,
            AlertLevel.INTERMEDIATE: 2,
            AlertLevel.HIGH: 3,
        }[self.alert_level]
        next_rank = {
            AlertLevel.NORMAL: 0,
            AlertLevel.INITIAL: 1,
            AlertLevel.INTERMEDIATE: 2,
            AlertLevel.HIGH: 3,
        }[observation.alert_level]
        self.level_upgraded = self.level_upgraded or next_rank > previous_rank
        self.alert_level = observation.alert_level
        self.unit = observation.unit
        self.monitoring_point = observation.monitoring_point
        self.rule_type = observation.rule_type
        self.label = observation.label
        self.group = observation.group
        self.occurrence_timestamps.append(timestamp)

    def reset_continuous_duration(self) -> None:
        """标记异常已恢复，下一次出现时重新开启一个事件。"""

        self.continuous_start = None
        self.lifecycle = "recovered"
        self.recovered = True

    def prune_occurrences(self, timestamp: datetime, window_seconds: float) -> None:
        """只保留计数窗口内的异常发生时间。"""

        cutoff = timestamp.timestamp() - window_seconds
        self.occurrence_timestamps = [
            item for item in self.occurrence_timestamps if item.timestamp() >= cutoff
        ]

    def to_event(self) -> AbnormalEvent:
        """把内部状态快照转换为外部可见的异常事件。"""

        duration = 0.0
        if self.continuous_start is not None:
            duration = (self.last_seen - self.continuous_start).total_seconds()
        return AbnormalEvent(
            key=self.key,
            kind=self.kind,
            first_seen=self.first_seen,
            last_seen=self.last_seen,
            occurrence_count=(
                len(self.occurrence_timestamps)
                if self.rule_type == RuleType.COUNT
                else self.occurrence_count
            ),
            duration_seconds=max(0.0, duration),
            latest_value=self.latest_value,
            threshold=self.threshold,
            message=self.message,
            triggered=self.triggered,
            alert_level=self.alert_level,
            unit=self.unit,
            monitoring_point=self.monitoring_point,
            rule_type=self.rule_type,
            label=self.label,
            group=self.group,
            related_keys=self.related_keys,
            event_id=self.event_id or "",
            lifecycle=self.lifecycle,
            trigger_reason=self.trigger_reason,
            event_revision=self.event_revision,
        )
