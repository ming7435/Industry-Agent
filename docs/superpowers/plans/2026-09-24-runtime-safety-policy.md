# Runtime Safety / Policy Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a bounded Safety / Policy Control layer so Runtime autonomy is explicitly authorized, evidence-gated, idempotent, traceable, and stoppable.

**Architecture:** Keep Planner and CapabilityRegistry responsible for selecting capabilities. Add a small RuntimePolicy boundary immediately before ExecutionManager; it evaluates canonical Actions against the current state and returns `allow`, `require_approval`, or `deny`. RuntimeCoordinator records policy decisions and stops or waits before side effects; existing WorkOrder, Quality, RAG, Trace, and shared contracts remain unchanged.

**Tech Stack:** Python 3, Pydantic, pytest, existing ActionModel, ExecutionManager, TraceRecorder, and RuntimeCoordinator.

**Spec:** User requirement: controlled autonomous Agent; Phase 2 Safety / Policy Control after Runtime convergence.

## Global Constraints

- Do not add a business Agent, microservice, or productionization layer.
- Do not change existing Agent business capabilities or QualityAgent scope.
- Preserve Event Idempotency, WorkOrder Lifecycle, RAG Contract, Trace Contract, and Shared Contract compatibility.
- Safety decisions must happen before Agent/Tool execution and before any side effect.
- Policy denial and approval waits must be terminal for the current Runtime invocation; they must not silently continue.
- Existing read-only deterministic E2E flows remain allowed without external approval.

## Review Focus

- A side-effect Action without an idempotency key must be denied before execution.
- WorkOrder creation must be denied when maintenance/evidence prerequisites are missing.
- A high-risk Action must wait for an explicit approval marker and must not call the handler while waiting.
- A denied or approval-required Action must emit a trace event with the policy reason.
- Replayed events must retain existing idempotency behavior and must not create duplicate WorkOrders.

### Task 1: Safety policy contract

**Files:**
- Create: `services/agent-service/app/runtime/policy.py`
- Test: `services/agent-service/tests/test_runtime_policy.py`

**Interfaces:**
- `PolicyStatus`: `allow`, `require_approval`, `deny`.
- `PolicyDecision(status, reason, risk_level, required_evidence, missing_evidence)`.
- `RuntimePolicy.evaluate(action: ActionModel, state: Mapping[str, Any]) -> PolicyDecision`.

- [x] Write failing tests for idempotency, evidence prerequisites, approval, and read-only allowance.
- [x] Run the policy tests and verify they fail for the missing policy module.
- [x] Implement the minimal policy contract and deterministic rules.
- [x] Run the policy tests and verify they pass.

### Task 2: Dispatcher enforcement and trace

**Files:**
- Modify: `services/agent-service/app/runtime/dispatcher.py`
- Modify: `services/agent-service/app/runtime/container.py`
- Test: `services/agent-service/tests/test_runtime_policy_dispatch.py`

**Interfaces:**
- `RuntimeDispatcher(..., policy: RuntimePolicy | None = None)` evaluates every Action before execution.
- Policy events use `policy_decision` and include status, reason, risk level, and missing evidence.

- [x] Write failing tests proving denied/approval-required Actions never invoke a handler.
- [x] Run the tests and verify the current dispatcher executes them, demonstrating the missing enforcement.
- [x] Add policy injection, pre-execution evaluation, and canonical blocked AgentResult responses.
- [x] Emit policy decisions through the existing TraceRecorder.
- [x] Run dispatcher policy tests and the existing dispatcher/execution tests.

### Task 3: Runtime stop semantics

**Files:**
- Modify: `services/agent-service/app/runtime/coordinator.py`
- Test: `services/agent-service/tests/test_runtime_policy_runtime.py`

**Interfaces:**
- `RuntimeCoordinator` passes current Runtime state to Dispatcher policy evaluation.
- Policy denial/approval results become `runtime_result.status = blocked` or `waiting_approval`, with `stop_reason` preserved.

- [x] Write failing tests for a blocked WorkOrder and an approval-required side effect.
- [x] Run them and verify the current coordinator incorrectly reports execution failure/completion semantics.
- [x] Preserve policy status in Runtime state and prevent downstream Actions after a policy stop.
- [x] Run the Runtime policy tests and existing Replan/Graph/E2E tests.

### Task 4: Contracts, documentation, and full verification

**Files:**
- Modify: `shared/contracts/runtime-trace.schema.json`
- Modify: `services/agent-service/app/runtime/ARCHITECTURE_AUDIT.md`
- Modify: `docs/superpowers/plans/2026-09-24-runtime-finalization.md`
- Test: `services/agent-service/tests/test_runtime_policy_e2e.py`

- [x] Add trace-contract coverage for `policy_decision`.
- [x] Add a controlled-autonomy E2E covering allow, deny, approval wait, and replay idempotency.
- [x] Update architecture documentation to distinguish Phase 1 Runtime autonomy from Phase 2 policy control.
- [x] Run the complete Agent Service test suite and compile checks.
- [x] Commit and push the completed Phase 2 implementation.

