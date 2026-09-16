"""Diagnosis Agent 的领域工具。"""

from .alarm_definition import ALARM_DEFINITIONS, get_alarm_definition
from .history import get_device_history
from .logs import get_device_logs
from .status import get_device_status

__all__ = ["ALARM_DEFINITIONS", "get_alarm_definition", "get_device_history", "get_device_logs", "get_device_status"]
