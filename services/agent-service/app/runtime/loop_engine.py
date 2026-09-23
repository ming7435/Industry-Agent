"""Shared bounded runtime loop for evidence-driven Agent orchestration."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError
from dataclasses import dataclass, field
from time import perf_counter
from typing import Any, Callable, Dict, Mapping

from .action import ActionModel
from .guard import LoopGuard


@dataclass(frozen=True)
class LoopPolicy:
    """Hard limits shared by Tool, Agent, Evidence and Learning loops."""

    max_iterations: int = 4
    min_evidence_score: float = 0.8
    timeout_seconds: float = 30.0

    def __post_init__(self) -> None:
        if int(self.max_iterations) < 1:
            raise ValueError("max_iterations must be >= 1")
        if not 0 <= float(self.min_evidence_score) <= 1:
            raise ValueError("min_evidence_score must be between 0 and 1")
        if float(self.timeout_seconds) <= 0:
            raise ValueError("timeout_seconds must be > 0")


@dataclass
class LoopContext:
    iteration: int
    policy: LoopPolicy
    evidence_score: float = 0.0
    actions: list[str] = field(default_factory=list)


@dataclass
class LoopResult:
    status: str
    stop_reason: str
    state: Dict[str, Any]
    iterations: int
    evidence_score: float
    actions: list[str] = field(default_factory=list)
    history: list[Dict[str, Any]] = field(default_factory=list)


class LoopEngine:
    """Run a finite sequence of state transitions with common safety guards.

    A step receives the current state and :class:`LoopContext`, then returns a
    mapping containing ``state``, ``action``, ``evidence_score`` and ``done``.
    The engine never invents a next action and never runs beyond its policy.
    """

    def __init__(self, policy: LoopPolicy | None = None) -> None:
        self.policy = policy or LoopPolicy()
        self.guard = LoopGuard(self.policy)

    def run(
        self,
        initial_state: Mapping[str, Any] | None,
        step: Callable[[Dict[str, Any], LoopContext], Mapping[str, Any]],
        *,
        trace: Callable[[str, Dict[str, Any]], None] | None = None,
        trace_context: Mapping[str, Any] | None = None,
    ) -> LoopResult:
        state = dict(initial_state or {})
        actions: list[str] = []
        seen_actions: set[str] = set()
        history: list[Dict[str, Any]] = []
        evidence_score = 0.0
        previous_evidence: set[str] = set()
        previous_confidence: float | None = None

        def emit(event: str, **payload: Any) -> None:
            if trace is None:
                return
            trace(event, {**dict(trace_context or {}), "iteration": len(history), **payload})

        def stopped(result: LoopResult) -> LoopResult:
            emit("loop_stop", status=result.status, stop_reason=result.stop_reason,
                 iterations=result.iterations, evidence_score=result.evidence_score,
                 actions=list(result.actions))
            return result

        emit("loop_start", max_iterations=self.policy.max_iterations,
             min_evidence_score=self.policy.min_evidence_score,
             timeout_seconds=self.policy.timeout_seconds)

        for iteration in range(int(self.policy.max_iterations)):
            iteration_guard = self.guard.check_iteration(iteration)
            if not iteration_guard.allowed:
                return stopped(LoopResult(
                    status="blocked", stop_reason=iteration_guard.reason, state=state,
                    iterations=iteration, evidence_score=evidence_score,
                    actions=actions, history=history,
                ))
            context = LoopContext(
                iteration=iteration,
                policy=self.policy,
                evidence_score=evidence_score,
                actions=list(actions),
            )
            started = perf_counter()
            executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="agent-loop")
            future = executor.submit(step, dict(state), context)
            try:
                raw = future.result(timeout=float(self.policy.timeout_seconds))
            except TimeoutError:
                future.cancel()
                executor.shutdown(wait=False, cancel_futures=True)
                return stopped(LoopResult(
                    status="timeout",
                    stop_reason="timeout",
                    state=state,
                    iterations=iteration + 1,
                    evidence_score=evidence_score,
                    actions=actions,
                    history=history,
                ))
            except Exception as error:
                executor.shutdown(wait=False, cancel_futures=True)
                history.append({"iteration": iteration, "error": str(error)})
                return stopped(LoopResult(
                    status="error",
                    stop_reason="step_error",
                    state=state,
                    iterations=iteration + 1,
                    evidence_score=evidence_score,
                    actions=actions,
                    history=history,
                ))
            finally:
                if not future.done():
                    executor.shutdown(wait=False, cancel_futures=True)
                else:
                    executor.shutdown(wait=True, cancel_futures=True)

            timeout_guard = self.guard.check_timeout(started)
            if not timeout_guard.allowed:
                return stopped(LoopResult(
                    status="timeout", stop_reason=timeout_guard.reason, state=state,
                    iterations=iteration + 1, evidence_score=evidence_score,
                    actions=actions, history=history,
                ))

            output = dict(raw or {})
            next_state = output.get("state")
            if isinstance(next_state, Mapping):
                state = dict(next_state)
            action = ActionModel.coerce(output.get("action") or output.get("next_action"))
            action_decision = self.guard.check_action(action, seen_actions)
            if action is not None:
                emit("action_selected", action=action.as_dict())
                if not action_decision.allowed:
                    actions.append(action.name)
                    history.append({"iteration": iteration, "action": action.name, "duplicate": True})
                    return stopped(LoopResult(
                        status="blocked",
                        stop_reason="duplicate_action",
                        state=state,
                        iterations=iteration + 1,
                        evidence_score=evidence_score,
                        actions=actions,
                        history=history,
                    ))
                actions.append(action.name)
                seen_actions.add(action.fingerprint)
            try:
                evidence_score = max(0.0, min(1.0, float(output.get("evidence_score", evidence_score))))
            except (TypeError, ValueError):
                evidence_score = 0.0
            current_evidence = {str(item) for item in output.get("evidence_ids", []) if item}
            confidence_raw = output.get("confidence")
            confidence = float(confidence_raw) if confidence_raw is not None else None
            done = bool(output.get("done"))
            evidence_decision = self.guard.check_evidence(done, evidence_score)
            if current_evidence:
                added = sorted(current_evidence - previous_evidence)
                if added:
                    emit("evidence_added", evidence_ids=added)
            if iteration and previous_evidence:
                progress = self.guard.check_evidence_progress(previous_evidence, current_evidence)
                if not progress.allowed and not evidence_decision.allowed:
                    history.append({"iteration": iteration, "stop_reason": progress.reason})
                    return stopped(LoopResult(
                        status="blocked", stop_reason=progress.reason, state=state,
                        iterations=iteration + 1, evidence_score=evidence_score,
                        actions=actions, history=history,
                    ))
            if iteration and confidence is not None and previous_confidence is not None:
                confidence_progress = self.guard.check_confidence(previous_confidence, confidence)
                if not confidence_progress.allowed and not evidence_decision.allowed:
                    history.append({"iteration": iteration, "stop_reason": confidence_progress.reason})
                    return stopped(LoopResult(
                        status="blocked", stop_reason=confidence_progress.reason, state=state,
                        iterations=iteration + 1, evidence_score=evidence_score,
                        actions=actions, history=history,
                    ))
            history.append({
                "iteration": iteration,
                "action": action.name if action else "",
                "evidence_score": evidence_score,
                "confidence": confidence,
                "elapsed_ms": round((perf_counter() - started) * 1000, 2),
            })
            emit("review_result", done=done, evidence_score=evidence_score,
                 confidence=confidence, action=action.as_dict() if action else None)
            previous_evidence = current_evidence or previous_evidence
            previous_confidence = confidence if confidence is not None else previous_confidence
            if evidence_decision.allowed:
                return stopped(LoopResult(
                    status="completed",
                    stop_reason="evidence_ready",
                    state=state,
                    iterations=iteration + 1,
                    evidence_score=evidence_score,
                    actions=actions,
                    history=history,
                ))

        return stopped(LoopResult(
            status="blocked",
            stop_reason="max_iterations",
            state=state,
            iterations=int(self.policy.max_iterations),
            evidence_score=evidence_score,
            actions=actions,
            history=history,
        ))
