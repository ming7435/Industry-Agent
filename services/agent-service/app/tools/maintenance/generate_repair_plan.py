"""维修方案工具：根据诊断生成维修计划草案。"""

from __future__ import annotations

from typing import Any, Dict, Mapping
from app.workorder.repair_profile import repair_profile


def generate_repair_plan(diagnosis: Mapping[str, Any], **_: Any) -> Dict[str, Any]:
    fault = str(diagnosis.get("fault") or diagnosis.get("summary") or diagnosis.get("diagnosis") or "设备异常")
    kind = repair_profile(diagnosis)["kind"]
    if kind == "lubrication":
        steps = ["执行安全隔离和断电挂牌", "检查润滑油液位、润滑泵及油路压力反馈", "检查油路过滤器及泄漏，确认故障后处理", "复测润滑压力与报警状态并记录恢复数据"]
    elif kind == "thermal":
        steps = ["执行断电和挂牌上锁", "检查冷却液、冷却泵和散热回路", "复测温度并空载试运行"]
    elif kind == "vibration":
        steps = ["停止设备并确认刀具安全", "检查刀具、夹具和主轴轴承", "低速试运行并复测振动"]
    else:
        steps = ["执行安全隔离", "根据报警定义检查相关部件", "复测指标并确认设备恢复"]
    return {"fault": fault, "repair_steps": steps, "safety": ["执行LOTO断电挂牌", "佩戴必要防护用品"]}
