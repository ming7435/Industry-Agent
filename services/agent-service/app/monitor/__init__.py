"""连续设备监测与诊断触发生成模块。"""

from .models import (
    AbnormalEvent,
    AlertLevel,
    AnomalyObservation,
    DeviceSample,
    DiagnosisTrigger,
    MonitorResult,
    MonitorStatus,
    RuleType,
)
from .monitor import DeviceMonitor
from .rules import MonitorConfig
from .rules import ThresholdBand
from .runner import MonitorRunner, RunnerSnapshot
from .factory_api import FactoryApiClient, FactoryApiError, FactorySnapshotProvider

# 统一导出监控模块的公共 API，便于入口脚本和测试按包级别导入。
__all__ = [
    "AnomalyObservation",
    "AbnormalEvent",
    "AlertLevel",
    "DeviceMonitor",
    "DeviceSample",
    "DiagnosisTrigger",
    "MonitorConfig",
    "MonitorResult",
    "MonitorStatus",
    "RuleType",
    "MonitorRunner",
    "RunnerSnapshot",
    "FactoryApiError",
    "FactorySnapshotProvider",
    "FactoryApiClient",
    "ThresholdBand",
]
