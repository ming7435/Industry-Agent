"""Router Agent 的目标与必要实体校验。"""

from __future__ import annotations

from typing import Any, Mapping


VALID_TARGETS = frozenset({"diagnosis", "knowledge", "cad", "maintenance", "quality", "report", "router"})


class RouterValidator:
    @staticmethod
    def validate(intent: str, target_agent: str, entities: Mapping[str, Any]) -> list[str]:
        findings: list[str] = []
        if target_agent not in VALID_TARGETS:
            findings.append("target_agent 无效：%s" % target_agent)
        if intent in {"workorder_action", "workorder_query"} and not entities.get("workorder_id"):
            findings.append("工单查询/操作缺少 workorder_id")
        if intent == "quality" and not entities.get("workorder_id"):
            findings.append("质检/验收查询缺少 workorder_id")
        return findings
