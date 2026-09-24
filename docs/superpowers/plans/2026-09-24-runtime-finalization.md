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

- [ ] Add a failing test proving Runtime Dispatcher executes one Agent attempt through ExecutionManager without Harness retry.
- [ ] Add a failing test proving Runtime loop timeout is derived from the configured ExecutionManager timeout with a bounded collection margin.
- [ ] Implement `AgentHarness.execute_once()` and route Runtime Dispatcher through it.
- [ ] Make RuntimeCoordinator use the shared execution timeout for its outer guard.
- [ ] Run focused execution-policy tests and the existing harness/execution tests.

### Task 2: Capability source of truth

**Files:**
- Modify `services/agent-service/app/runtime/capability.py`
- Modify `services/agent-service/app/runtime/planner.py`
- Test `services/agent-service/tests/test_capability_source_of_truth.py`

- [ ] Add a failing test proving the default Registry exactly mirrors concrete Agent class declarations.
- [ ] Add a failing test proving Planner does not maintain a second capability-to-Agent map.
- [ ] Build the default Registry from `CORE_AGENT_REGISTRY` class declarations and preserve unknown capability blocking.
- [ ] Run capability, planner, dispatcher, and Agent contract tests.

### Task 3: Real bounded Planner replan

**Files:**
- Modify `services/agent-service/app/runtime/planner.py`
- Modify `services/agent-service/app/runtime/coordinator.py`
- Test `services/agent-service/tests/test_runtime_replan.py`

- [ ] Add a failing coordinator test where a maintenance Agent returns validation findings and Planner is called again with a new bounded capability sequence.
- [ ] Add a failing test proving a replan is capped and cannot repeat a side-effect WorkOrder indefinitely.
- [ ] Implement Planner replan context and RuntimeCoordinator plan replacement while preserving completed state and idempotency keys.
- [ ] Run loop, evaluator, planner, and Runtime graph-control tests.

### Task 4: Evidence reuse and Runtime-managed Maintenance boundary

**Files:**
- Modify `services/agent-service/app/runtime/dispatcher.py`
- Modify `services/agent-service/app/agents/maintenance/graph.py`
- Test `services/agent-service/tests/test_runtime_evidence_reuse.py`

- [ ] Add a failing test proving Diagnosis Knowledge evidence is reused for the outer document-search Action.
- [ ] Add a failing test proving Runtime-managed Maintenance does not issue its own Knowledge/CAD provider calls when context is present.
- [ ] Implement task-scoped evidence reuse and an explicit Runtime-managed request flag while preserving direct legacy provider behavior.
- [ ] Run duplicate-call, maintenance, A2A, and Runtime E2E tests.

### Task 5: Trace and Action contract alignment

**Files:**
- Modify `shared/contracts/runtime-trace.schema.json`
- Modify `shared/contracts/runtime-action.schema.json`
- Test `services/agent-service/tests/test_runtime_contract_alignment.py`

- [ ] Add a failing schema test for actual Agent/Tool lifecycle event names.
- [ ] Add a failing schema test requiring `required_capability` on AGENT Actions.
- [ ] Update schemas without removing legacy event aliases or Action aliases.
- [ ] Run shared contract and trace regression tests.

### Task 6: Deterministic full Runtime E2E and documentation

**Files:**
- Modify `services/agent-service/tests/test_runtime_autonomous_e2e.py`
- Modify `services/agent-service/tests/test_orchestrator_trigger_flow.py`
- Modify `services/agent-service/app/runtime/ARCHITECTURE_AUDIT.md`
- Modify `docs/superpowers/plans/2026-09-23-runtime-convergence.md`

- [ ] Add a deterministic full Runtime scenario covering JEV, Planner, capability selection, Diagnosis, Knowledge, CAD, Maintenance, WorkOrder, Quality, Memory, Evidence, Evaluation, and final stop using existing Agent contracts and test fixtures.
- [ ] Make the external RAG dependency explicit in integration tests; no test may silently depend on an unavailable service.
- [ ] Update architecture and completion checklists to describe the Runtime-controlled path and the single production-part QualityAgent boundary.
- [ ] Run Agent, RAG, CAD, compile, and frontend build verification.

