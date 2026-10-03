"""首个监控演示使用的阈值配置。"""

from dataclasses import dataclass, field
from typing import Any, Dict, Mapping, Optional, Tuple

from .models import AlertLevel, RuleType
from shared.metric_ranges import classify_metric_range


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


def classify_metric_detail(
    value: Any,
    detail: Mapping[str, Any],
) -> Optional[Tuple[AlertLevel, Optional[float], str]]:
    """使用工厂指标详情中的正常、预警和报警区间进行分类。"""

    result = classify_metric_range(value, detail)
    return (AlertLevel(result[0]), result[1], result[2]) if result else None


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
