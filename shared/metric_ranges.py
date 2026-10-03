"""工厂已提供的区间分类规则，由监控与维修验收共用，不新增设备阈值。"""
from typing import Any, Mapping


def numeric_range(value):
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        return None
    try:
        return float(value[0]), float(value[1])
    except (TypeError, ValueError):
        return None


def contains(value, limits):
    limits = numeric_range(limits)
    return bool(limits and limits[0] <= value <= limits[1])


def anomaly_threshold(limits, normal, value):
    normal, target = numeric_range(normal), numeric_range(limits)
    if normal and target:
        if value > normal[1]:
            return target[0]
        if value < normal[0]:
            return target[1]
    return (target[0] if value < target[0] else target[1]) if target else None


def classify_metric_range(value: Any, detail: Mapping):
    if value is None or not isinstance(detail, Mapping):
        return None
    try:
        value = float(value)
    except (TypeError, ValueError):
        return None
    normal, warn, alarm = (detail.get(k) for k in ('normal_range', 'warn_range', 'alarm_range'))
    if contains(value, normal):
        return None
    unit = str(detail.get('unit') or '')
    if contains(value, alarm):
        return 'high', anomaly_threshold(alarm, normal, value), unit
    if contains(value, warn):
        return 'initial', anomaly_threshold(warn, normal, value), unit
    normal_limits, alarm_limits = numeric_range(normal), numeric_range(alarm)
    if normal_limits and alarm_limits:
        if alarm_limits[1] < normal_limits[0] and value <= alarm_limits[1]:
            return 'high', alarm_limits[1], unit
        if alarm_limits[0] > normal_limits[1] and value >= alarm_limits[0]:
            return 'high', alarm_limits[0], unit
    return 'initial', anomaly_threshold(warn, normal, value), unit
