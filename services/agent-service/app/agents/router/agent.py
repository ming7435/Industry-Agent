"""用户意图识别 Agent。"""

from __future__ import annotations

from typing import Any, Mapping
from uuid import uuid4

from app.validator import RouteResult


class RouterAgent:
    name = "router"

    def run(self, task: Any) -> RouteResult:
        text = task if isinstance(task, str) else str((task or {}).get("user_text", ""))
        lowered = text.lower()
        rules = [
            ("experience", ("经验", "沉淀", "成功案例", "历史维修")),
            ("maintenance", ("维修方案", "怎么修", "维修步骤", "检修")),
            ("report", ("报告", "日报", "维修记录")),
            ("workorder", ("工单", "派工", "创建工单")),
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
            target_agent=intent if intent != "unknown" else "router",
            confidence=0.92 if intent != "unknown" else 0.2,
            reason="根据用户文本关键词完成初始路由",
        )
