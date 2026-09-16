"""经验学习准入校验。"""

from __future__ import annotations

from typing import Any, Mapping

from app.tools.workorder.validator import WorkOrderValidator


class ExperienceValidator:
    def validate(self, workorder: Mapping[str, Any], quality: Mapping[str, Any]) -> None:
        if not WorkOrderValidator.can_learn(workorder, quality):
            raise ValueError("经验沉淀要求工单已关闭且质检通过")

    def is_valid(self, workorder: Mapping[str, Any], quality: Mapping[str, Any]) -> bool:
        return WorkOrderValidator.can_learn(workorder, quality)
