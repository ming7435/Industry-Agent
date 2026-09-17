"""Diagnosis Agent 的本地 MCP 兼容工具。

今天先用进程内 Mock 字典代替真实 MCP Server。工具的名称、参数和返回结构保持稳定，
后续可把它替换成真实 MCP Server，而不用改 Agent State。
"""

from __future__ import annotations

from typing import Any, Dict


ALARM_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    "E102": {
        "alarm_code": "E102",
        "name": "主轴温度异常",
        "severity": "high",
        "description": "主轴温度超过允许范围，可能与主轴负载、冷却、润滑或驱动系统有关。",
        "recommended_action": "检查主轴负载、冷却液流量、润滑状态、皮带和主轴驱动器。",
    },
    "700223": {
        "alarm_code": "700223",
        "name": "主轴过温",
        "severity": "high",
        "description": "主轴温度达到过温报警条件。",
        "recommended_action": "停止高负载加工，检查主轴负载、冷却状态、皮带以及驱动器和电机。",
    },
    "700001": {
        "alarm_code": "700001",
        "name": "润滑压力未达到",
        "severity": "high",
        "description": "导轨润滑压力没有达到设定值。",
        "recommended_action": "检查润滑泵、油路、过滤器和压力反馈。",
    },
    "700010": {
        "alarm_code": "700010",
        "name": "液压压力未达到",
        "severity": "high",
        "description": "液压系统压力不足，可能影响卡盘、刀塔、尾座或主轴制动。",
        "recommended_action": "检查液压油位、液压泵、泄漏和压力开关。",
    },
    "700006": {
        "alarm_code": "700006",
        "name": "刀塔旋转超时",
        "severity": "high",
        "description": "刀塔没有在规定时间内完成旋转或到位反馈异常。",
        "recommended_action": "检查刀塔伺服、液压夹紧、位置反馈和机械卡滞。",
    },
    "700020": {
        "alarm_code": "700020",
        "name": "急停按钮被按下",
        "severity": "critical",
        "description": "设备处于急停状态，所有危险动作应立即停止。",
        "recommended_action": "确认现场安全后检查急停按钮、回路和复位条件。",
    },
    "700021": {
        "alarm_code": "700021",
        "name": "操作门未关闭",
        "severity": "critical",
        "description": "操作门未关闭或门互锁没有锁定。",
        "recommended_action": "关闭并锁定操作门，确认门互锁反馈信号。",
    },
    "700033": {
        "alarm_code": "700033",
        "name": "排屑输送机电机过载",
        "severity": "high",
        "description": "排屑输送机可能堵塞或电机负载过高。",
        "recommended_action": "停机检查排屑通道、输送链和电机负载。",
    },
    "HPC-LOW": {
        "alarm_code": "HPC-LOW",
        "name": "高压冷却压力不足",
        "severity": "warning",
        "description": "高压冷却压力低于设定值。",
        "recommended_action": "检查高压冷却泵、过滤器、管路和压力传感器。",
    },
    "VIB-SPINDLE-HIGH": {
        "alarm_code": "VIB-SPINDLE-HIGH",
        "name": "主轴振动超限",
        "severity": "high",
        "description": "主轴振动进入高风险区，可能存在轴承、刀具、夹持或对中问题。",
        "recommended_action": "降低转速并检查刀具、夹具、轴承、皮带和主轴对中状态。",
    },
}


def get_alarm_definition(alarm_code: str) -> Dict[str, Any]:
    """查询 Mock 报警字典，返回稳定的工具结果。"""

    normalized = str(alarm_code or "").strip().upper()
    definition = ALARM_DEFINITIONS.get(normalized)
    if definition is None:
        return {
            "found": False,
            "success": True,
            "alarm_code": normalized or None,
            "name": "未知报警",
            "severity": "unknown",
            "severity_label": "未知",
            "description": "当前 Mock 报警字典中没有找到该报警码。",
            "recommended_action": "记录报警码，并查询设备维修手册或真实报警服务。",
            "source": "mock_alarm_dictionary",
        }
    severity_labels = {
        "warning": "初级预警",
        "high": "高级故障",
        "critical": "严重故障",
        "unknown": "未知",
    }
    return {
        "found": True,
        "success": True,
        "source": "mock_alarm_dictionary",
        "severity_label": severity_labels.get(definition.get("severity"), "未知"),
        **definition,
    }
