"""MES MCP：生成维修计划草案。"""

from __future__ import annotations

from typing import Any, Dict, Mapping


def generate_repair_plan(diagnosis: Mapping[str, Any], **_: Any) -> Dict[str, Any]:
    fault = str(diagnosis.get("fault") or diagnosis.get("diagnosis") or "设备异常")
    if "温度" in fault or "过热" in fault:
        steps = ["执行断电和挂牌上锁", "检查冷却液、冷却泵和散热回路", "复测温度并空载试运行"]
    elif "振动" in fault:
        steps = ["停止设备并确认刀具安全", "检查刀具、夹具和主轴轴承", "低速试运行并复测振动"]
    else:
        steps = ["执行安全隔离", "根据报警定义检查相关部件", "复测指标并确认设备恢复"]
    return {"fault": fault, "repair_steps": steps, "safety": ["执行LOTO断电挂牌", "佩戴必要防护用品"]}
