"""Diagnosis Agent 的领域工具。"""

from .alarm_definition import ALARM_DEFINITIONS, get_alarm_definition
from .history import get_device_history

__all__ = ["ALARM_DEFINITIONS", "get_alarm_definition", "get_device_history"]
