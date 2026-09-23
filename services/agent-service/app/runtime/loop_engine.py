"""Shared bounded runtime loop for evidence-driven Agent orchestration."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError
from dataclasses import dataclass, field
from time import perf_counter
from typing import Any, Callable, Dict, Mapping

from .action import ActionModel
from .evaluator import EvaluationStatus, RuntimeEvaluator
from .execution import ExecutionManager, ExecutionStatus
from .guard import LoopGuard


@dataclass(frozen=True)
class LoopPolicy:
    """Hard limits shared by Tool, Agent, Evidence and Learning loops."""

    max_iterations: int = 4
    min_evidence_score: float = 0.8
    timeout_seconds: float = 30.0
    max_budget: float | None = None

    def __post_init__(self) -> None:
        if int(self.max_iterations) < 1:
            raise ValueError("max_iterations must be >= 1")
        if not 0 <= float(self.min_evidence_score) <= 1:
            raise ValueError("min_evidence_score must be between 0 and 1")
        if float(self.timeout_seconds) <= 0:
            raise ValueError("timeout_seconds must be > 0")
        if self.max_budget is not None and float(self.max_budget) <= 0:
            raise ValueError("max_budget must be > 0 when provided")


@dataclass
class LoopContext:
    iteration: int
    policy: LoopPolicy
    evidence_score: float = 0.0
    actions: list[str] = field(default_factory=list)
    budget_used: float = 0.0


@dataclass
class LoopResult:
    status: str
    stop_reason: str
    state: Dict[str, Any]
    iterations: int
    evidence_score: float
    actions: list[str] = field(default_factory=list)
    history: list[Dict[str, Any]] = field(default_factory=list)
    loop_state: Dict[str, Any] = field(default_factory=dict)


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
        evaluator: RuntimeEvaluator | None = None,
        trace: Callable[[str, Dict[str, Any]], None] | None = None,
        trace_context: Mapping[str, Any] | None = None,
    ) -> LoopResult:
        state = dict(initial_state or {})
        actions: list[str] = []
        seen_actions: set[str] = set()
        history: list[Dict[str, Any]] = []
        evidence_score = 0.0
        budget_used = 0.0
        started_at = perf_counter()
        evidence_history: list[list[str]] = []
        previous_evidence: set[str] = set()
        previous_confidence: float | None = None

        def emit(event: str, **payload: Any) -> None:
            if trace is None:
                return
            trace(event, {**dict(trace_context or {}), "iteration": len(history), **payload})

        def stopped(result: LoopResult) -> LoopResult:
            if not result.loop_state:
                result.loop_state = {
                    "iteration": result.iterations,
                    "max_iterations": self.policy.max_iterations,
                    "start_time": started_at,
                    "elapsed_time": perf_counter() - started_at,
                    "action_history": list(actions),
                    "evidence_history": list(evidence_history),
                    "stop_reason": result.stop_reason,
                    "budget_used": budget_used,
                }
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
                budget_used=budget_used,
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
                budget_decision = self.guard.check_budget(budget_used, action.cost)
                if not budget_decision.allowed:
                    return stopped(LoopResult(
                        status="blocked", stop_reason=budget_decision.reason, state=state,
                        iterations=iteration + 1, evidence_score=evidence_score,
                        actions=actions, history=history,
                    ))
                budget_used += action.cost
            try:
                evidence_score = max(0.0, min(1.0, float(output.get("evidence_score", evidence_score))))
            except (TypeError, ValueError):
                evidence_score = 0.0
            current_evidence = {str(item) for item in output.get("evidence_ids", []) if item}
            evidence_history.append(sorted(current_evidence))
            confidence_raw = output.get("confidence")
            confidence = float(confidence_raw) if confidence_raw is not None else None
            done = bool(output.get("done"))
            if evaluator is not None:
                evaluation = evaluator.evaluate({**output, "evidence_score": evidence_score, "confidence": confidence})
                emit("evaluation_result", status=evaluation.status.value, reason=evaluation.reason,
                     confidence=evaluation.confidence, evidence_score=evaluation.evidence_score,
                     missing_evidence=evaluation.missing_evidence)
                if evaluation.status == EvaluationStatus.REPLAN:
                    emit("replan", reason=evaluation.reason, missing_evidence=evaluation.missing_evidence)
                elif evaluation.status == EvaluationStatus.BLOCKED:
                    return stopped(LoopResult(
                        status="blocked", stop_reason=evaluation.reason, state=state,
                        iterations=iteration + 1, evidence_score=evaluation.evidence_score,
                        actions=actions, history=history,
                    ))
                done = evaluation.status == EvaluationStatus.FINAL
                evidence_score = evaluation.evidence_score
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
                "budget_used": budget_used,
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
                    loop_state={"iteration": iteration + 1, "max_iterations": self.policy.max_iterations,
                                "start_time": started_at, "elapsed_time": perf_counter() - started_at,
                                "action_history": list(actions), "evidence_history": list(evidence_history),
                                "stop_reason": "evidence_ready", "budget_used": budget_used},
                ))

        return stopped(LoopResult(
            status="blocked",
            stop_reason="max_iterations",
            state=state,
            iterations=int(self.policy.max_iterations),
            evidence_score=evidence_score,
            actions=actions,
            history=history,
            loop_state={"iteration": int(self.policy.max_iterations), "max_iterations": self.policy.max_iterations,
                        "start_time": started_at, "elapsed_time": perf_counter() - started_at,
                        "action_history": list(actions), "evidence_history": list(evidence_history),
                        "stop_reason": "max_iterations", "budget_used": budget_used},
        ))

    def run_runtime(
        self,
        initial_state: Mapping[str, Any] | None,
        *,
        observe: Callable[[Dict[str, Any], LoopContext], Mapping[str, Any]],
        select_action: Callable[[Dict[str, Any], Any, LoopContext], ActionModel],
        execute_action: Callable[[ActionModel, Dict[str, Any], LoopContext], Any],
        update_state: Callable[[Dict[str, Any], ActionModel, Any, LoopContext], Mapping[str, Any]] | None = None,
        evaluator: RuntimeEvaluator | None = None,
        execution_manager: ExecutionManager | None = None,
        trace: Callable[[str, Dict[str, Any]], None] | None = None,
        trace_context: Mapping[str, Any] | None = None,
    ) -> LoopResult:
        """Run the Runtime-native Observe → Evaluate → Action → Execute cycle."""

        state = dict(initial_state or {})
        evaluator = evaluator or RuntimeEvaluator(min_evidence_score=self.policy.min_evidence_score)
        actions: list[str] = []
        seen: set[str] = set()
        history: list[Dict[str, Any]] = []
        execution_history: list[Dict[str, Any]] = []
        evidence_history: list[list[str]] = []
        evidence_score = 0.0
        budget_used = 0.0
        started_at = perf_counter()
        previous_evidence: set[str] = set()
        previous_confidence: float | None = None

        def emit(event: str, **payload: Any) -> None:
            if trace is not None:
                trace(event, {**dict(trace_context or {}), "iteration": len(history), **payload})

        def finish(status: str, reason: str, iteration: int) -> LoopResult:
            result = LoopResult(
                status=status, stop_reason=reason, state=state, iterations=iteration,
                evidence_score=evidence_score, actions=list(actions), history=list(history),
                loop_state={
                    "iteration": iteration, "max_iterations": self.policy.max_iterations,
                    "start_time": started_at, "elapsed_time": perf_counter() - started_at,
                    "action_history": list(actions), "evidence_history": list(evidence_history),
                    "execution_history": list(execution_history),
                    "stop_reason": reason, "budget_used": budget_used,
                },
            )
            emit("loop_stop", status=status, stop_reason=reason, iterations=iteration,
                 evidence_score=evidence_score, actions=list(actions))
            return result

        emit("loop_start", max_iterations=self.policy.max_iterations,
             min_evidence_score=self.policy.min_evidence_score,
             timeout_seconds=self.policy.timeout_seconds)
        manager = execution_manager or ExecutionManager(
            timeout_seconds=self.policy.timeout_seconds,
            trace=lambda event, payload: emit(event, **payload),
        )
        for iteration in range(int(self.policy.max_iterations)):
            if not self.guard.check_iteration(iteration).allowed:
                return finish("blocked", "max_iterations", iteration)
            context = LoopContext(iteration=iteration, policy=self.policy, actions=list(actions), budget_used=budget_used)
            observation = dict(observe(state, context) or {})
            evaluation = evaluator.evaluate(observation)
            evidence_score = evaluation.evidence_score
            evidence_ids = [str(item) for item in (observation.get("evidence_ids") or []) if item]
            evidence_history.append(evidence_ids)
            emit("evaluation_result", status=evaluation.status.value, reason=evaluation.reason,
                 confidence=evaluation.confidence, evidence_score=evaluation.evidence_score,
                 missing_evidence=evaluation.missing_evidence)
            if evidence_ids and evaluation.status == EvaluationStatus.FINAL:
                emit("evidence_added", evidence_ids=evidence_ids)
            if evaluation.status == EvaluationStatus.FINAL:
                return finish("completed", "final", iteration)
            if evaluation.status == EvaluationStatus.BLOCKED:
                return finish("blocked", evaluation.reason, iteration)
            if evaluation.status == EvaluationStatus.REPLAN:
                emit("replan", reason=evaluation.reason, missing_evidence=evaluation.missing_evidence)
            action = ActionModel.coerce(select_action(state, evaluation, context))
            if action is None:
                return finish("blocked", "no_action", iteration + 1)
            action_decision = self.guard.check_action(action, seen)
            emit("action_selected", action=action.as_dict())
            if not action_decision.allowed:
                return finish("blocked", action_decision.reason, iteration + 1)
            budget_decision = self.guard.check_budget(budget_used, action.cost)
            if not budget_decision.allowed:
                return finish("blocked", budget_decision.reason, iteration + 1)
            seen.add(action.fingerprint)
            actions.append(action.target)
            budget_used += action.cost
            record = manager.execute(
                action, lambda: execute_action(action, dict(state), context),
                trace_context=trace_context,
            )
            execution_history.append({
                "execution_id": record.execution_id,
                "action_id": action.action_id,
                "target": action.target,
                "status": record.status.value,
                "attempts": record.attempts,
                "retry_count": record.retry_count,
                "side_effect": action.side_effect,
                "side_effect_status": record.side_effect_status,
            })
            if record.status != ExecutionStatus.SUCCESS:
                return finish("blocked", "execution_%s" % record.status.value.lower(), iteration + 1)
            result_value = record.result
            if update_state is not None:
                state = dict(update_state(state, action, result_value, context) or state)
            elif isinstance(result_value, Mapping):
                state = {**state, **dict(result_value)}
            history.append({"iteration": iteration, "action": action.target, "evaluation": evaluation.status.value,
                            "evidence_score": evidence_score, "elapsed_ms": round((perf_counter() - started_at) * 1000, 2)})
            post_observation = dict(observe(state, context) or {})
            post_evaluation = evaluator.evaluate(post_observation)
            evidence_score = post_evaluation.evidence_score
            post_evidence = {str(item) for item in (post_observation.get("evidence_ids") or []) if item}
            post_confidence = post_evaluation.confidence
            evidence_progressed = bool(post_evidence - previous_evidence)
            if post_evidence:
                added = sorted(post_evidence - previous_evidence)
                if added:
                    emit("evidence_added", evidence_ids=added)
            if previous_evidence and not post_evaluation.status == EvaluationStatus.FINAL:
                progress = self.guard.check_evidence_progress(previous_evidence, post_evidence)
                if not progress.allowed:
                    return finish("blocked", progress.reason, iteration + 1)
            if previous_confidence is not None and not evidence_progressed and not post_evaluation.status == EvaluationStatus.FINAL:
                confidence_progress = self.guard.check_confidence(previous_confidence, post_confidence)
                if not confidence_progress.allowed:
                    return finish("blocked", confidence_progress.reason, iteration + 1)
            previous_evidence = post_evidence or previous_evidence
            previous_confidence = post_confidence
            emit("evaluation_result", status=post_evaluation.status.value, reason=post_evaluation.reason,
                 confidence=post_evaluation.confidence, evidence_score=post_evaluation.evidence_score,
                 missing_evidence=post_evaluation.missing_evidence)
            emit("review_result", status=post_evaluation.status.value, reason=post_evaluation.reason,
                 confidence=post_evaluation.confidence, evidence_score=post_evaluation.evidence_score)
            if post_evaluation.status == EvaluationStatus.FINAL:
                return finish("completed", "final", iteration + 1)
            if post_evaluation.status == EvaluationStatus.BLOCKED:
                return finish("blocked", post_evaluation.reason, iteration + 1)
        return finish("blocked", "max_iterations", int(self.policy.max_iterations))
