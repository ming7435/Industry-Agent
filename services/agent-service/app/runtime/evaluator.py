"""Evidence-driven evaluation shared by every Runtime loop."""

from __future__ import annotations

from enum import Enum
from typing import Any, Mapping

from pydantic import BaseModel, Field


class EvaluationStatus(str, Enum):
    CONTINUE = "continue"
    REPLAN = "replan"
    FINAL = "final"
    BLOCKED = "blocked"


class EvaluationResult(BaseModel):
    status: EvaluationStatus
    reason: str
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    evidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    missing_evidence: list[str] = Field(default_factory=list)


class RuntimeEvaluator:
    """Central policy for completion, continuation and bounded replanning."""

    def __init__(self, min_evidence_score: float = 0.8, min_confidence: float = 0.8, min_experience_quality_score: float = 0.8) -> None:
        self.min_evidence_score = max(0.0, min(1.0, float(min_evidence_score)))
        self.min_confidence = max(0.0, min(1.0, float(min_confidence)))
        self.min_experience_quality_score = max(0.0, min(1.0, float(min_experience_quality_score)))

    def evaluate(self, observation: Mapping[str, Any] | None) -> EvaluationResult:
        value = dict(observation or {})
        result = value.get("result")
        if isinstance(result, Mapping):
            value = {**value, **dict(result)}
        domain = str(value.get("domain") or "").lower()
        value = self._normalize_domain(value, domain)
        if value.get("blocked") or str(value.get("status") or "").lower() in {"blocked", "error"}:
            return EvaluationResult(
                status=EvaluationStatus.BLOCKED,
                reason=str(value.get("reason") or "blocked"),
                confidence=self._confidence(value),
                evidence_score=self._evidence_score(value),
                missing_evidence=self._missing(value),
            )
        missing = self._missing(value)
        confidence = self._confidence(value)
        evidence_score = self._evidence_score(value, domain=domain)
        if value.get("replan_required") or value.get("validation_findings") or value.get("validation_errors"):
            findings = [str(item) for item in (value.get("validation_findings") or value.get("validation_errors") or [])]
            return EvaluationResult(
                status=EvaluationStatus.REPLAN,
                reason="replan_required",
                confidence=confidence,
                evidence_score=evidence_score,
                missing_evidence=findings or missing,
            )
        done = bool(value.get("done") or value.get("complete"))
        if domain == "maintenance":
            done = bool(value.get("workorder_ready")) and not bool(value.get("validation_findings") or value.get("validation_errors"))
        elif domain in {"knowledge", "cad"}:
            done = done or bool(value.get("documents") or value.get("evidence") or value.get("components") or value.get("parts"))
        if done and evidence_score >= self.min_evidence_score and confidence >= self.min_confidence and not missing:
            return EvaluationResult(status=EvaluationStatus.FINAL, reason="evidence_and_confidence_sufficient", confidence=confidence, evidence_score=evidence_score, missing_evidence=[])
        return EvaluationResult(status=EvaluationStatus.CONTINUE, reason="insufficient_evidence", confidence=confidence, evidence_score=evidence_score, missing_evidence=missing)

    @staticmethod
    def _missing(value: Mapping[str, Any]) -> list[str]:
        return [str(item) for item in (value.get("missing_evidence") or []) if item]

    def _normalize_domain(self, value: dict[str, Any], domain: str) -> dict[str, Any]:
        result = value.get("result") if isinstance(value.get("result"), Mapping) else value
        if domain == "diagnosis":
            payload = dict(result or {})
            if not payload:
                value.update({"done": False, "confidence": 0.0, "evidence_score": 0.0, "missing_evidence": ["diagnosis"]})
                return value
            raw_confidence = payload.get("confidence")
            confidence = float(raw_confidence) if raw_confidence is not None else 1.0
            evidence = (
                payload.get("evidence")
                or payload.get("evidence_records")
                or ([payload.get("alarm_definition")] if isinstance(payload.get("alarm_definition"), Mapping) and payload.get("alarm_definition", {}).get("found", True) else [])
            )
            findings = payload.get("validation_errors") or payload.get("validation_findings") or []
            explicit_quality = raw_confidence is not None or bool(evidence) or bool(findings)
            ready = confidence >= self.min_confidence and (bool(evidence) or not explicit_quality) and not findings
            value.update({
                "done": True, "confidence": confidence, "evidence_score": 1.0 if ready else min(confidence, 0.79),
                "missing_evidence": [] if ready else ["diagnosis_evidence"],
                "replan_required": not ready,
            })
        elif domain == "knowledge":
            payload = dict(result or {})
            status = str(payload.get("status") or "").lower()
            ready = status == "completed" or bool(payload.get("documents") or payload.get("evidence") or payload.get("items"))
            if status in {"error", "insufficient_evidence", "blocked_insufficient_evidence"} and not (payload.get("documents") or payload.get("evidence")):
                ready = False
            value.update({"done": ready, "confidence": 1.0, "evidence_score": 1.0 if ready else 0.0,
                          "missing_evidence": [] if ready else ["knowledge_evidence"]})
        elif domain == "maintenance":
            payload = dict(result or {})
            findings = payload.get("validation_findings") or payload.get("validation_errors") or []
            ready = bool(payload.get("workorder_ready")) and not findings
            value.update({"done": ready, "workorder_ready": bool(payload.get("workorder_ready")),
                          "evidence_score": 1.0 if ready else 0.0,
                          "missing_evidence": [] if ready else ["maintenance_plan"]})
        elif domain == "learning":
            nested_experience = value.get("experience") if isinstance(value.get("experience"), Mapping) else {}
            result_payload = value.get("result") if isinstance(value.get("result"), Mapping) else {}
            payload = dict(result_payload or nested_experience or {})
            quality = value.get("experience_quality_score")
            if quality is None:
                quality = payload.get("experience_quality_score", 0.0)
            try:
                quality = max(0.0, min(1.0, float(quality)))
            except (TypeError, ValueError):
                quality = 0.0
            validation_status = value.get("validation_status")
            if validation_status is None:
                validation_status = payload.get("validation_status", "")
            validation_status = str(validation_status).lower()
            workorder_value = value.get("workorder")
            workorder: Mapping[str, Any] = workorder_value if isinstance(workorder_value, Mapping) else {}
            closed = str(value.get("workorder_status") or workorder.get("status") or "").lower() == "closed"
            feedback = value.get("repair_feedback") or payload.get("repair_feedback") or workorder.get("repair_feedback")
            has_feedback = bool(feedback)
            verification_value = value.get("repair_verification") or workorder.get("repair_verification")
            verification = verification_value if isinstance(verification_value, Mapping) else {}
            if not verification and isinstance(feedback, Mapping) and isinstance(feedback.get("verification"), Mapping):
                verification = dict(feedback.get("verification") or {})
            verification_passed = verification.get("passed") is True
            rejected = validation_status in {"rejected", "invalid", "duplicate"} or quality < self.min_experience_quality_score
            value.update({
                "confidence": quality,
                "evidence_score": quality,
                "done": bool(value.get("done") or value.get("complete") or (closed and has_feedback and verification_passed and not rejected)),
                "missing_evidence": [] if closed and has_feedback and verification_passed and not rejected else ["repair_verification" if not verification_passed else "experience_quality"],
            })
            if rejected:
                value.update({"blocked": True, "reason": "experience_quality_gate"})
        return value

    def _confidence(self, value: Mapping[str, Any]) -> float:
        raw = value.get("confidence")
        return max(0.0, min(1.0, float(raw))) if raw is not None else 1.0

    def _evidence_score(self, value: Mapping[str, Any], domain: str = "") -> float:
        raw = value.get("evidence_score")
        if raw is not None:
            return max(0.0, min(1.0, float(raw)))
        ids = value.get("evidence_ids") or value.get("evidence") or value.get("documents") or value.get("components") or value.get("parts")
        if ids:
            return 1.0
        if domain == "maintenance" and value.get("workorder_ready"):
            return 1.0
        return 0.0


__all__ = ["EvaluationStatus", "EvaluationResult", "RuntimeEvaluator"]
