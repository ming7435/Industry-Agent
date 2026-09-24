# Runtime Approval Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete controlled autonomy with durable approval, pending-task recovery, approve/reject lifecycle, and true resume-from-original-Action behavior.

**Architecture:** Persist the exact Runtime State, Plan, Action, and next index when policy returns `require_approval`. Expose an ApprovalManager and HTTP endpoints for approve/reject/status; approval resumes the saved plan at the saved index with a trusted approval marker, while rejection finalizes the pending task as rejected/blocked. No new Agent or business service is introduced.

**Tech Stack:** Python 3, FastAPI, Pydantic, existing DurableJsonStore, RuntimeCoordinator, RuntimeDispatcher, and pytest.

**Spec:** User-provided remaining Phase 2 gaps: Approval API, Pending Task persistence, Resume original task, Reject lifecycle, Approval → Resume E2E, AgentState declaration, and architecture ordering.

## Global Constraints

- Preserve Event Idempotency, WorkOrder Lifecycle, RAG Contract, Trace Contract, and Shared Contract compatibility.
- Do not re-plan a pending Action during approval resume.
- Approval and rejection must be idempotent for an already finalized pending task.
- Rejection must never execute the pending Agent/Tool/MCP Action.
- No new business Agent, microservice, or productionization layer.

## Review Focus

- A pending record must survive a new store instance when a durable path is configured.
- Approval must execute the original Action exactly once and preserve its original idempotency key.
- Reject must create a terminal `rejected` record with a blocked Runtime result.
- Approving an unknown or already finalized pending id must return a structured error/idempotent record.
- API responses must not expose an internal state without the pending id and lifecycle status.

### Task 1: Durable approval and pending-task contract

**Files:**
- Create: `services/agent-service/app/runtime/approval.py`
- Test: `services/agent-service/tests/test_runtime_approval.py`

- [ ] Write failing persistence, approve callback, and reject lifecycle tests.
- [ ] Run them and verify the approval module is missing.
- [ ] Implement `PendingTaskStore` and `ApprovalManager` on `DurableJsonStore`.
- [ ] Run the contract tests and verify they pass.

### Task 2: True Runtime pending and resume

**Files:**
- Modify: `services/agent-service/app/runtime/coordinator.py`
- Modify: `services/agent-service/app/runtime/container.py`
- Modify: `services/agent-service/app/runtime/__init__.py`
- Modify: `services/agent-service/app/graph/state.py`
- Test: `services/agent-service/tests/test_runtime_approval_resume.py`

- [ ] Write failing wait→approve→resume and reject tests.
- [ ] Run them and verify waiting currently has no durable pending record or resume path.
- [ ] Persist full State/Plan/Action/index on `require_approval`.
- [ ] Add `RuntimeCoordinator.resume_pending()` that resumes the saved plan at the saved index.
- [ ] Run the Runtime approval-resume tests and existing policy/E2E tests.

### Task 3: Formal Approval API

**Files:**
- Modify: `services/agent-service/app/api/server.py`
- Modify: `services/agent-service/app/api/schemas/agent.py`
- Test: `services/agent-service/tests/test_runtime_approval_api.py`

- [ ] Write failing API tests for GET pending, POST approve, and POST reject.
- [ ] Run them and verify the routes do not exist.
- [ ] Add typed request schemas and `/api/v1/runtime/approvals` endpoints.
- [ ] Return structured lifecycle records and idempotent repeated decisions.
- [ ] Run API tests and existing API regression tests.

### Task 4: Contract, docs, and final verification

**Files:**
- Modify: `services/agent-service/app/runtime/ARCHITECTURE_AUDIT.md`
- Modify: `docs/superpowers/plans/2026-09-24-runtime-safety-policy.md`
- Modify: `shared/contracts/runtime-trace.schema.json`
- Test: `services/agent-service/tests/test_runtime_approval_e2e.py`

- [ ] Add approval lifecycle Trace events and contract coverage.
- [ ] Add a complete wait→approve→resume and wait→reject E2E.
- [ ] Declare `runtime_policy` and `runtime_pending_task` in AgentState.
- [ ] Correct the documented ExecutionManager/RuntimePolicy order.
- [ ] Run the full Agent Service suite, compile checks, commit, and push.
