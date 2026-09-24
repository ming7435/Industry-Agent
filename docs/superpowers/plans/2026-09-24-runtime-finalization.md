# Runtime Finalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the remaining Runtime convergence gaps so the existing Industry-Agent system is controlled by one bounded Runtime while preserving all existing business Agents and contracts.

**Architecture:** Keep LangGraph as the state/lifecycle container. RuntimeCoordinator owns planning and bounded replanning, CapabilityRegistry resolves declared Agent capabilities, ExecutionManager owns Runtime timeout/retry, and AgentHarness remains a compatibility boundary for direct A2A callers. Existing QualityAgent remains the only production-part quality Agent.

**Tech Stack:** Python 3, FastAPI, LangGraph, Pydantic, pytest, JSON Schema, existing RAG/CAD/MCP adapters.

**Spec:** `docs/superpowers/plans/2026-09-23-runtime-convergence.md` and the Runtime requirements in the current user request.

## Global Constraints

- Do not add a business Agent, microservice, or productionization layer.
- Preserve Event Idempotency, WorkOrder Lifecycle, RAG Contract, Trace Contract, and Shared Contract compatibility.
- Quality scope is only `production_part` / `part_quality` through the existing QualityAgent.
- Graph remains present as state and Runtime lifecycle execution layer; it does not choose business edges.
- All Runtime loops remain bounded by iteration, timeout, evidence, and idempotency guards.

## Review Focus

- A timed-out Runtime Agent must not be retried by both Harness and ExecutionManager.
- A Planner replan must not repeat completed side effects or loop indefinitely.
- Diagnosis-provided Knowledge evidence must be reused without bypassing traceability.
- Unknown capabilities must block explicitly and remain visible in the trace.
- Real E2E tests must distinguish deterministic local fixtures from unavailable external RAG/LLM dependencies.

### Task 1: Single Runtime execution policy

**Files:**
- Modify `services/agent-service/app/harness/runtime.py`
- Modify `services/agent-service/app/runtime/dispatcher.py`
- Modify `services/agent-service/app/runtime/coordinator.py`
- Test `services/agent-service/tests/test_runtime_execution_policy.py`

- [x] Add and run execution-policy tests for one Runtime attempt and shared timeout bounds.
- [x] Implement `AgentHarness.execute_once()` and route Runtime Dispatcher through it.
- [x] Make RuntimeCoordinator use the shared execution timeout for its outer guard.

### Task 2: Capability source of truth

**Files:**
- Modify `services/agent-service/app/runtime/capability.py`
- Modify `services/agent-service/app/runtime/planner.py`
- Test `services/agent-service/tests/test_capability_source_of_truth.py`

- [x] Add and run source-of-truth tests for concrete Agent declarations and Planner resolution.
- [x] Build the default Registry from `CORE_AGENT_REGISTRY` class declarations and preserve unknown capability blocking.

### Task 3: Real bounded Planner replan

**Files:**
- Modify `services/agent-service/app/runtime/planner.py`
- Modify `services/agent-service/app/runtime/coordinator.py`
- Test `services/agent-service/tests/test_runtime_replan.py`

- [x] Add and run coordinator tests for maintenance replanning and a capped repeated failure.
- [x] Replace the remaining plan through Planner context while preserving completed state and WorkOrder idempotency.
- [x] Run loop, evaluator, planner, and Runtime graph-control tests.

### Task 4: Evidence reuse and Runtime-managed Maintenance boundary

**Files:**
- Modify `services/agent-service/app/runtime/dispatcher.py`
- Modify `services/agent-service/app/agents/maintenance/graph.py`
- Test `services/agent-service/tests/test_runtime_evidence_reuse.py`

- [x] Add and run tests for Diagnosis evidence reuse and Runtime-managed Maintenance/Diagnosis boundaries.
- [x] Implement task-scoped evidence reuse and an explicit Runtime-managed request flag while preserving direct provider behavior.

### Task 5: Trace and Action contract alignment

**Files:**
- Modify `shared/contracts/runtime-trace.schema.json`
- Modify `shared/contracts/runtime-action.schema.json`
- Test `services/agent-service/tests/test_runtime_contract_alignment.py`

- [x] Add and run schema tests for actual Agent/Tool lifecycle records and AGENT Action capabilities.
- [x] Update schemas without removing legacy event or Action aliases.

### Task 6: Deterministic full Runtime E2E and documentation

**Files:**
- Modify `services/agent-service/tests/test_runtime_autonomous_e2e.py`
- Modify `services/agent-service/tests/test_orchestrator_trigger_flow.py`
- Modify `services/agent-service/app/runtime/ARCHITECTURE_AUDIT.md`
- Modify `docs/superpowers/plans/2026-09-23-runtime-convergence.md`

- [x] Maintain deterministic full Runtime coverage for JEV, Planner, capability selection, Diagnosis, Knowledge, CAD, Maintenance, WorkOrder, Quality, Memory, Evidence, Evaluation, and final stop.
- [x] Make the external RAG dependency explicit in integration tests; deterministic E2E enables local fallback.
- [x] Update architecture and completion checklists for the Runtime path and single production-part QualityAgent boundary.
- [x] Run the available repository verification matrix (Agent focused/full non-temp suite, RAG/CAD contract suites, and compile checks); external service availability remains an explicit test input.

### Task 7: Dynamic outer-loop handoff

**Files:**
- Modify `services/agent-service/app/runtime/coordinator.py`
- Test `services/agent-service/tests/test_runtime_replan.py`

- [x] Accept only explicit capability requirements from `AgentResult.next_actions`.
- [x] Return those requirements to Planner and continue through ActionModel and CapabilityRegistry.
- [x] Trace the dynamic handoff as a Runtime `replan` while retaining bounded loop limits.

This completes the first Runtime-convergence phase. Safety / Policy Control remains a
separate second phase and is intentionally not introduced here.

### Task 8: Safety / Policy Control (Phase 2)

**Files:**
- Create `services/agent-service/app/runtime/policy.py`
- Modify `services/agent-service/app/runtime/dispatcher.py`
- Modify `services/agent-service/app/runtime/coordinator.py`
- Modify `services/agent-service/app/runtime/loop_engine.py`
- Modify `services/agent-service/app/runtime/container.py`
- Modify `shared/contracts/runtime-trace.schema.json`
- Test `services/agent-service/tests/test_runtime_policy*.py`

- [x] Add deterministic pre-execution policy decisions for allow, approval, and deny.
- [x] Gate side effects by idempotency, evidence prerequisites, and scoped approval.
- [x] Stop Runtime immediately on policy denial or approval wait and preserve the reason.
- [x] Trace policy decisions and verify controlled-autonomy replay behavior.

This completes the second phase while preserving the first-phase Runtime control center.
