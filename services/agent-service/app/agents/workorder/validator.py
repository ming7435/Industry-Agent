"""WorkOrder Agent 的确定性校验和派工规则。"""

from __future__ import annotations

from typing import Any, Mapping

from app.workorder.validator import WorkOrderValidator


class WorkOrderAgentValidator:
    ACTIONS = {"create", "assign", "query", "get", "update", "submit_feedback", "mark_repair_completed", "close", "reopen"}

    @classmethod
    def validate_request(cls, request: Mapping[str, Any]) -> list[str]:
        findings: list[str] = []
        action = str(request.get("action") or "create")
        if action not in cls.ACTIONS:
            findings.append("不支持的工单动作：%s" % action)
        if action not in {"create", "query"} and not request.get("workorder_id"):
            findings.append("工单动作缺少 workorder_id")
        if action == "create":
            plan = request.get("maintenance_plan") or request.get("plan") or {}
            if not plan:
                findings.append("创建工单缺少 maintenance_plan")
            else:
                try:
                    WorkOrderValidator.validate_plan(plan)
                except (TypeError, ValueError) as error:
                    findings.append(str(error))
        return findings

    @staticmethod
    def priority(request: Mapping[str, Any], plan: Mapping[str, Any]) -> str:
        level = str(request.get("fault_level") or plan.get("risk_level") or (plan.get("diagnosis") or {}).get("severity") or "").lower()
        if any(token in level for token in ("critical", "fatal", "严重", "紧急")):
            return "urgent"
        if any(token in level for token in ("high", "高级", "高")):
            return "high"
        if any(token in level for token in ("low", "低")):
            return "low"
        return "normal"

    @classmethod
    def score_candidate(
        cls,
        candidate: Mapping[str, Any],
        *,
        component: str = "",
        area: str = "",
        current_shift: str = "",
        team_available: bool = True,
        priority: str = "normal",
    ) -> tuple[int, list[str]]:
        """用确定性规则计算派工分数，便于解释和复核。"""

        skills = [str(item).lower() for item in candidate.get("skills") or []]
        component_text = str(component or "").lower()
        score = 0
        reasons: list[str] = []
        if component_text and any(component_text in skill or skill in component_text for skill in skills):
            score += 40
            reasons.append("技能匹配")
        if area and str(candidate.get("area") or "") == area:
            score += 20
            reasons.append("区域匹配")
        candidate_shift = str(candidate.get("shift") or "")
        if current_shift and candidate_shift and candidate_shift == current_shift:
            score += 15
            reasons.append("当前班次")
        if bool(candidate.get("available")) and team_available:
            score += 15
            reasons.append("当前可用")
        workload = max(0, int(candidate.get("workload") or 0))
        workload_score = max(0, 10 - min(workload, 10))
        score += workload_score
        if workload_score:
            reasons.append("负载较低")
        if priority in {"urgent", "high"}:
            score += 5
            reasons.append("高优先级保障")
        return min(score, 100), reasons

    @staticmethod
    def final_findings(action: str, workorder: Mapping[str, Any], existing: list[str] | None = None) -> list[str]:
        findings = list(existing or [])
        if action in {"create", "assign", "update", "submit_feedback", "mark_repair_completed", "close", "reopen"} and not workorder.get("workorder_id"):
            findings.append("工单业务动作未返回 workorder_id")
        return list(dict.fromkeys(item for item in findings if item))
