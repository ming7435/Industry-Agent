"""Safety decisions shared by all bounded runtime loops."""

from __future__ import annotations

from dataclasses import dataclass
from time import monotonic
from typing import Any, Iterable

from .action import ActionModel


@dataclass(frozen=True)
class GuardDecision:
    allowed: bool
    reason: str


class LoopGuard:
    """Evaluate finite-loop stop conditions without executing an action."""

    def __init__(self, policy: Any | None = None) -> None:
        if policy is None:
            from .loop_engine import LoopPolicy

            policy = LoopPolicy()
        self.policy = policy

    def check_iteration(self, iteration: int) -> GuardDecision:
        if int(iteration) >= int(self.policy.max_iterations):
            return GuardDecision(False, "max_iterations")
        return GuardDecision(True, "within_budget")

    def check_timeout(self, started_at: float, now: float | None = None) -> GuardDecision:
        elapsed = (monotonic() if now is None else float(now)) - float(started_at)
        if elapsed > float(self.policy.timeout_seconds):
            return GuardDecision(False, "timeout")
        return GuardDecision(True, "within_timeout")

    def check_action(self, action: ActionModel | None, seen: Iterable[str]) -> GuardDecision:
        if action is None:
            return GuardDecision(True, "no_action")
        if action.fingerprint in set(seen):
            return GuardDecision(False, "duplicate_action")
        return GuardDecision(True, "new_action")

    def check_evidence(self, done: bool, evidence_score: float) -> GuardDecision:
        score = max(0.0, min(1.0, float(evidence_score)))
        if done and score >= float(self.policy.min_evidence_score):
            return GuardDecision(True, "evidence_ready")
        if done:
            return GuardDecision(False, "evidence_score")
        return GuardDecision(False, "not_done")

    def check_evidence_progress(self, previous: Iterable[str], current: Iterable[str]) -> GuardDecision:
        previous_set = {str(item) for item in previous if item}
        current_set = {str(item) for item in current if item}
        if previous_set and current_set.issubset(previous_set):
            return GuardDecision(False, "no_new_evidence")
        return GuardDecision(True, "evidence_added")

    def check_confidence(self, previous: float | None, current: float | None) -> GuardDecision:
        if previous is not None and current is not None and float(current) <= float(previous):
            return GuardDecision(False, "confidence_not_improved")
        return GuardDecision(True, "confidence_improved")


__all__ = ["GuardDecision", "LoopGuard"]
