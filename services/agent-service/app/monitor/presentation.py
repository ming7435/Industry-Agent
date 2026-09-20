"""面向维修人员的设备状态展示文本。"""

from __future__ import annotations

from typing import Any


CYCLE_STATE_LABELS = {
    "idle": "待机",
    "ready": "准备就绪",
    "running": "运行中",
    "processing": "加工中",
    "paused": "已暂停",
    "stopped": "已停止",
    "completed": "加工完成",
    "fault": "故障停机",
    "fault_injection": "故障注入状态",
    "emergency_stop": "急停状态",
    "offline": "离线",
}


def cycle_state_label(value: Any) -> str:
    """将内部 cycle_state 枚举转换成维修人员可读文本。"""

    raw = str(value or "").strip().lower()
    return CYCLE_STATE_LABELS.get(raw, str(value or "未知状态"))
