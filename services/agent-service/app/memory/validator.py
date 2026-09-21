"""经验学习准入校验。"""

from __future__ import annotations

from typing import Any, Mapping

from app.workorder import WorkOrderValidator


class ExperienceValidator:
    def validate(self, workorder: Mapping[str, Any], repair_feedback: Any) -> None:
        if not WorkOrderValidator.can_learn(workorder, repair_feedback):
            raise ValueError("经验沉淀要求工单已关闭且具有有效维修反馈")

    def is_valid(self, workorder: Mapping[str, Any], repair_feedback: Any) -> bool:
        return WorkOrderValidator.can_learn(workorder, repair_feedback)
