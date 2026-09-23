"""Shared bounded runtime loop for evidence-driven Agent orchestration."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError
from dataclasses import dataclass, field
from time import perf_counter
from typing import Any, Callable, Dict, Mapping


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

    def run(
        self,
        initial_state: Mapping[str, Any] | None,
        step: Callable[[Dict[str, Any], LoopContext], Mapping[str, Any]],
    ) -> LoopResult:
        state = dict(initial_state or {})
        actions: list[str] = []
        seen_actions: set[str] = set()
        history: list[Dict[str, Any]] = []
        evidence_score = 0.0

        for iteration in range(int(self.policy.max_iterations)):
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
                return LoopResult(
                    status="timeout",
                    stop_reason="timeout",
                    state=state,
                    iterations=iteration + 1,
                    evidence_score=evidence_score,
                    actions=actions,
                    history=history,
                )
            except Exception as error:
                executor.shutdown(wait=False, cancel_futures=True)
                history.append({"iteration": iteration, "error": str(error)})
                return LoopResult(
                    status="error",
                    stop_reason="step_error",
                    state=state,
                    iterations=iteration + 1,
                    evidence_score=evidence_score,
                    actions=actions,
                    history=history,
                )
            finally:
                if not future.done():
                    executor.shutdown(wait=False, cancel_futures=True)
                else:
                    executor.shutdown(wait=True, cancel_futures=True)

            output = dict(raw or {})
            next_state = output.get("state")
            if isinstance(next_state, Mapping):
                state = dict(next_state)
            action = str(output.get("action") or output.get("next_action") or "").strip()
            if action:
                actions.append(action)
                if action in seen_actions:
                    history.append({"iteration": iteration, "action": action, "duplicate": True})
                    return LoopResult(
                        status="blocked",
                        stop_reason="duplicate_action",
                        state=state,
                        iterations=iteration + 1,
                        evidence_score=evidence_score,
                        actions=actions,
                        history=history,
                    )
                seen_actions.add(action)
            try:
                evidence_score = max(0.0, min(1.0, float(output.get("evidence_score", evidence_score))))
            except (TypeError, ValueError):
                evidence_score = 0.0
            history.append({
                "iteration": iteration,
                "action": action,
                "evidence_score": evidence_score,
                "elapsed_ms": round((perf_counter() - started) * 1000, 2),
            })
            if bool(output.get("done")) and evidence_score >= float(self.policy.min_evidence_score):
                return LoopResult(
                    status="completed",
                    stop_reason="evidence_ready",
                    state=state,
                    iterations=iteration + 1,
                    evidence_score=evidence_score,
                    actions=actions,
                    history=history,
                )

        return LoopResult(
            status="blocked",
            stop_reason="max_iterations",
            state=state,
            iterations=int(self.policy.max_iterations),
            evidence_score=evidence_score,
            actions=actions,
            history=history,
        )
