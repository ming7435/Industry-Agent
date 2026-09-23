"""经验学习准入校验。"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping

from app.workorder import WorkOrderValidator

from .dedup import ExperienceDeduplicator


@dataclass(frozen=True)
class ExperienceValidationResult:
    experience_quality_score: float
    validation_status: str
    findings: list[str] = field(default_factory=list)

    @property
    def accepted(self) -> bool:
        return self.validation_status in {"accepted", "duplicate"}


class ExperienceValidator:
    def validate(self, workorder: Mapping[str, Any], repair_feedback: Any) -> None:
        if not WorkOrderValidator.can_learn(workorder, repair_feedback):
            raise ValueError("经验沉淀要求工单已关闭且具有有效维修反馈")

    def is_valid(self, workorder: Mapping[str, Any], repair_feedback: Any) -> bool:
        return WorkOrderValidator.can_learn(workorder, repair_feedback)

    def validate_experience(
        self,
        experience: Mapping[str, Any],
        workorder: Mapping[str, Any],
        repair_feedback: Any,
        existing: list[Mapping[str, Any]] | None = None,
    ) -> ExperienceValidationResult:
        """Score an extracted experience before it can enter long memory/RAG."""

        findings: list[str] = []
        score = 0.0
        if str(workorder.get("status") or "").lower() == "closed" and repair_feedback:
            score += 0.45
        else:
            findings.append("workorder_not_closed_or_feedback_missing")
        if str(experience.get("content") or "").strip():
            score += 0.15
        else:
            findings.append("experience_content_missing")

        feedback: Mapping[str, Any] = repair_feedback if isinstance(repair_feedback, Mapping) else {"feedback": repair_feedback}
        verification_value = feedback.get("verification")
        verification: Mapping[str, Any] = verification_value if isinstance(verification_value, Mapping) else {}
        result_text = str(feedback.get("result") or feedback.get("status") or "").lower()
        if verification.get("passed") is False or result_text in {"failed", "fail", "unsuccessful"}:
            findings.append("repair_not_successful")
        else:
            score += 0.2
        if (
            feedback.get("operator")
            or feedback.get("verified_by")
            or feedback.get("manual_confirmed") is True
            or verification.get("passed") is True
        ):
            score += 0.2
        else:
            findings.append("human_confirmation_missing")

        duplicate = ExperienceDeduplicator().contains(experience, existing or [])
        blocking_findings = {"workorder_not_closed_or_feedback_missing", "experience_content_missing", "repair_not_successful"}
        if duplicate and score >= 0.8 and not set(findings).intersection(blocking_findings):
            findings.append("duplicate_experience")
            return ExperienceValidationResult(round(min(score, 1.0), 4), "duplicate", findings)
        status = "accepted" if score >= 0.8 and not set(findings).intersection(blocking_findings) else "rejected"
        return ExperienceValidationResult(round(min(score, 1.0), 4), status, findings)
