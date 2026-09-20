"""Router MCP：本地意图分类工具。"""

from __future__ import annotations

import re
from typing import Any, Dict


def intent_classifier_tool(user_text: str, **_: Any) -> Dict[str, Any]:
    text = str(user_text or "").lower()
    if re.search(r"\b(?:e|alm)[-]?\d{2,6}\b", text) and any(keyword in text for keyword in ("什么", "含义", "处理", "步骤", "说明")):
        return {"intent": "knowledge", "confidence": 0.92, "source": "local-intent-classifier"}
    candidates = {
        "diagnosis": ("诊断", "故障", "报警", "异常"),
        "knowledge": ("手册", "sop", "规范", "案例", "怎么检查"),
        "quality": ("零件质量", "质量检测", "尺寸检测", "外观检测", "材料检测", "功能检测", "生产出来", "成品质检", "质检", "验收", "是否恢复"),
        "report": ("报告", "日报", "维修记录"),
        "workorder_action": ("工单", "派工", "创建工单", "查询工单", "关闭工单"),
        "memory": ("历史维修经验", "维修经验", "经验库", "类似案例", "历史案例"),
        "maintenance": ("维修方案", "怎么修", "怎么维修", "维修步骤", "检修", "维修", "修理", "维护", "保养"),
        "cad": ("cad", "bom", "图纸", "结构", "物料", "位置", "在哪里", "部件", "组件", "传感器", "装配", "关系"),
    }
    intent = "unknown"
    for name, keywords in candidates.items():
        if any(keyword.lower() in text for keyword in keywords):
            intent = name
            break
    return {"intent": intent, "confidence": 0.92 if intent != "unknown" else 0.2, "source": "local-intent-classifier"}
