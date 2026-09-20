"""Router Agent 的目标与必要实体校验。"""

from __future__ import annotations

from typing import Any, Mapping


VALID_TARGETS = frozenset({"diagnosis", "knowledge", "cad", "maintenance", "workorder", "quality", "report", "memory", "router"})


class RouterValidator:
    @staticmethod
    def validate(intent: str, target_agent: str, entities: Mapping[str, Any], action: str = "") -> list[str]:
        findings: list[str] = []
        if target_agent not in VALID_TARGETS:
            findings.append("target_agent 无效：%s" % target_agent)
        if intent == "workorder_query" and not entities.get("workorder_id"):
            findings.append("工单查询/操作缺少 workorder_id")
        if intent == "workorder_action" and action not in {"create"} and not entities.get("workorder_id"):
            findings.append("工单查询/操作缺少 workorder_id")
        if intent == "quality" and not any(
            entities.get(key) for key in ("part_id", "part_no", "batch_id", "production_order_id")
        ) and not entities.get("inspection_type") == "part_quality":
            findings.append("生产零件质检请提供 part_id、part_no、batch_id 或 production_order_id")
        return findings
