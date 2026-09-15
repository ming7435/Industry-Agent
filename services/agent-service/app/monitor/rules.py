"""首个监控演示使用的阈值配置。"""

from dataclasses import dataclass, field
from typing import Any, Dict, Mapping, Optional, Tuple

from .models import AlertLevel, RuleType


@dataclass(frozen=True)
class ThresholdBand:
    """单个指标的初级、中级和高级阈值边界。"""

    initial: float
    intermediate: float
    high: float
    unit: str

    def __post_init__(self) -> None:
        """校验三档阈值必须按严重程度递增。"""

        if not self.initial <= self.intermediate <= self.high:
            raise ValueError("thresholds must be ordered initial <= intermediate <= high")

    def level_for(self, value: float) -> AlertLevel:
        """根据指标值返回对应告警等级。"""

        if value >= self.high:
            return AlertLevel.HIGH
        if value >= self.intermediate:
            return AlertLevel.INTERMEDIATE
        if value >= self.initial:
            return AlertLevel.INITIAL
        return AlertLevel.NORMAL


def _contains(value: float, range_value: Any) -> bool:
    """判断数值是否落在工厂快照给出的闭区间内。"""

    if not isinstance(range_value, (list, tuple)) or len(range_value) != 2:
        return False
    try:
        return float(range_value[0]) <= value <= float(range_value[1])
    except (TypeError, ValueError):
        return False


def classify_metric_detail(
    value: Any,
    detail: Mapping[str, Any],
) -> Optional[Tuple[AlertLevel, Optional[float], str]]:
    """使用工厂指标详情中的正常、预警和报警区间进行分类。"""

    if value is None or not isinstance(detail, Mapping):
        return None
    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        return None

    normal_range = detail.get("normal_range")
    warn_range = detail.get("warn_range")
    alarm_range = detail.get("alarm_range")
    if _contains(numeric_value, normal_range):
        return None

    unit = str(detail.get("unit") or "")
    if _contains(numeric_value, alarm_range):
        threshold = _anomaly_threshold(alarm_range, normal_range, numeric_value)
        return AlertLevel.HIGH, threshold, unit
    if _contains(numeric_value, warn_range):
        threshold = _anomaly_threshold(warn_range, normal_range, numeric_value)
        return AlertLevel.INITIAL, threshold, unit

    # 工厂区间之间可能存在空档；只要离开正常范围，就按方向推断最接近的严重度。
    normal = _numeric_range(normal_range)
    alarm = _numeric_range(alarm_range)
    if normal and alarm:
        low_direction = alarm[1] < normal[0]
        high_direction = alarm[0] > normal[1]
        if low_direction and numeric_value <= alarm[1]:
            return AlertLevel.HIGH, alarm[1], unit
        if high_direction and numeric_value >= alarm[0]:
            return AlertLevel.HIGH, alarm[0], unit
    return AlertLevel.INITIAL, _anomaly_threshold(warn_range, normal_range, numeric_value), unit


def _numeric_range(range_value: Any) -> Optional[Tuple[float, float]]:
    """把合法的区间配置转换为浮点数二元组。"""

    if not isinstance(range_value, (list, tuple)) or len(range_value) != 2:
        return None
    try:
        return float(range_value[0]), float(range_value[1])
    except (TypeError, ValueError):
        return None


def _range_boundary(range_value: Any, value: float) -> Optional[float]:
    """返回数值穿越区间时更接近的一侧边界。"""

    numeric = _numeric_range(range_value)
    if numeric is None:
        return None
    return numeric[0] if value < numeric[0] else numeric[1]


def _anomaly_threshold(
    range_value: Any,
    normal_range: Any,
    value: float,
) -> Optional[float]:
    """返回指标离开正常区间时跨过的边界值。"""

    normal = _numeric_range(normal_range)
    target = _numeric_range(range_value)
    if normal and target:
        if value > normal[1]:
            return target[0]
        if value < normal[0]:
            return target[1]
    return _range_boundary(range_value, value)


@dataclass(frozen=True)
class MonitorConfig:
    """大模型介入前使用的确定性监控规则。

    阈值为闭区间判定。每个异常观测都会先归入一个最终规则类型，
    再决定是否触发诊断智能体。
    """

    # 默认阈值来自工厂表：主轴轴承座温度 60 / 70 / 80 C。
    temperature_band: ThresholdBand = ThresholdBand(
        initial=60.0,
        intermediate=70.0,
        high=80.0,
        unit="C",
    )
    # 默认阈值来自工厂表：主轴速度 RMS 1.8 / 2.8 / 4.5 mm/s。
    vibration_band: ThresholdBand = ThresholdBand(
        initial=1.8,
        intermediate=2.8,
        high=4.5,
        unit="mm/s",
    )
    temperature_profiles: Dict[str, ThresholdBand] = field(
        default_factory=lambda: {
            "main_spindle_motor": ThresholdBand(120.0, 130.0, 150.0, "C"),
            "spindle_bearing_housing": ThresholdBand(60.0, 70.0, 80.0, "C"),
            "spindle_warmup": ThresholdBand(20.0, 20.0, 20.0, "C"),
            "hydraulic_oil": ThresholdBand(60.0, 70.0, 80.0, "C"),
            "electrical_cabinet": ThresholdBand(50.0, 55.0, 60.0, "C"),
        }
    )
    vibration_profiles: Dict[str, ThresholdBand] = field(
        default_factory=lambda: {
            "spindle_velocity_rms": ThresholdBand(1.8, 2.8, 4.5, "mm/s"),
            "spindle_displacement": ThresholdBand(10.0, 20.0, 40.0, "um"),
            "spindle_acceleration": ThresholdBand(2.0, 5.0, 10.0, "g"),
            "turret_vibration": ThresholdBand(2.0, 3.0, 5.0, "mm/s"),
            "servo_vibration": ThresholdBand(2.0, 3.0, 5.0, "mm/s"),
        }
    )
    abnormal_duration_seconds: float = 5.0
    abnormal_occurrence_threshold: int = 3
    count_window_seconds: float = 5 * 60
    event_gap_seconds: float = 2.0
    history_size: int = 30
    trend_window_samples: int = 3
    trend_min_delta: float = 1.0
    multi_metric_min_count: int = 2
    critical_alert_levels: Tuple[AlertLevel, ...] = (AlertLevel.HIGH,)

    @property
    def temperature_warning(self) -> float:
        """兼容旧代码使用的温度预警阈值。"""

        return self.temperature_band.initial

    @property
    def temperature_fault(self) -> float:
        """兼容旧代码使用的温度故障阈值。"""

        return self.temperature_band.high

    @property
    def vibration_warning(self) -> float:
        """兼容旧代码使用的振动预警阈值。"""

        return self.vibration_band.initial

    @property
    def vibration_fault(self) -> float:
        """兼容旧代码使用的振动故障阈值。"""

        return self.vibration_band.high

    def temperature_threshold_for(self, monitoring_point: str) -> ThresholdBand:
        """按温度测点选择阈值配置，未知测点回退到默认值。"""

        return self.temperature_profiles.get(monitoring_point, self.temperature_band)

    def vibration_threshold_for(self, monitoring_point: str) -> ThresholdBand:
        """按振动测点选择阈值配置，未知测点回退到默认值。"""

        return self.vibration_profiles.get(monitoring_point, self.vibration_band)

    def rule_type_for(self, key: str, alert_level: AlertLevel) -> RuleType:
        """为原始观测选择最终触发规则类型。"""

        if key.startswith("alarm:"):
            if alert_level in self.critical_alert_levels:
                return RuleType.CRITICAL
            return RuleType.COUNT
        return RuleType.DURATION

    def __post_init__(self) -> None:
        """校验所有时间窗口、计数阈值和样本窗口配置。"""

        if self.abnormal_duration_seconds <= 0:
            raise ValueError("abnormal_duration_seconds must be positive")
        if self.abnormal_occurrence_threshold <= 0:
            raise ValueError("abnormal_occurrence_threshold must be positive")
        if self.count_window_seconds <= 0:
            raise ValueError("count_window_seconds must be positive")
        if self.event_gap_seconds < 0:
            raise ValueError("event_gap_seconds cannot be negative")
        if self.history_size <= 0:
            raise ValueError("history_size must be positive")
        if self.trend_window_samples < 2:
            raise ValueError("trend_window_samples must be at least 2")
        if self.trend_min_delta < 0:
            raise ValueError("trend_min_delta cannot be negative")
        if self.multi_metric_min_count < 2:
            raise ValueError("multi_metric_min_count must be at least 2")
