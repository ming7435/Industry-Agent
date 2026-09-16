"""用户意图识别 Agent。"""

from __future__ import annotations

import re
from typing import Any, Mapping
from app.validator import RouteResult


_ALARM_CODE_RE = re.compile(r"\b(?:e|alm)[-]?\d{2,6}\b", re.IGNORECASE)


class RouterAgent:
    name = "router"

    def run(self, task: Any) -> RouteResult:
        text = task if isinstance(task, str) else str((task or {}).get("user_text", ""))
        lowered = text.lower()
        if _ALARM_CODE_RE.search(lowered) and any(keyword in lowered for keyword in ("什么", "含义", "处理", "步骤", "说明")):
            return RouteResult(
                intent="knowledge",
                target_agent="knowledge",
                confidence=0.92,
                reason="识别到报警码知识问答，路由到 Knowledge Agent",
            )
        rules = [
            ("cad", ("cad", "bom", "图纸", "结构", "零件", "物料", "位置", "在哪里", "部件", "组件", "传感器", "装配", "关系")),
            ("workorder_action", ("工单", "派工", "创建工单")),
            ("maintenance", ("维修方案", "怎么修", "怎么维修", "维修步骤", "检修", "维修", "修理", "维护", "保养")),
            ("report", ("报告", "日报", "维修记录")),
            ("quality", ("验收", "质检", "是否恢复")),
            ("knowledge", ("手册", "sop", "规范", "案例", "怎么检查")),
            ("diagnosis", ("诊断", "故障", "报警", "异常", "为什么")),
        ]
        intent = "unknown"
        for candidate, keywords in rules:
            if any(keyword.lower() in lowered for keyword in keywords):
                intent = candidate
                break
        return RouteResult(
            intent=intent,
            target_agent=("workorder_node" if intent == "workorder_action" else intent if intent != "unknown" else "router"),
            confidence=0.92 if intent != "unknown" else 0.2,
            reason="根据用户文本关键词完成初始路由",
        )
