# Runtime Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the existing Runtime the control center for Industrial-Agent while preserving all existing business Agents, Graphs, RAG, CAD, WorkOrder lifecycle, Memory Learning, and shared contracts.

**Architecture:** Add a small unified Agent contract and JEV boundary, register concrete Agent instances and capabilities in the existing Capability Registry, and introduce a Runtime dispatcher that resolves Planner Actions through capabilities and ExecutionManager. Keep LangGraph as a state/execution layer; the top-level Graph invokes Runtime actions instead of encoding the fixed business sequence.

**Tech Stack:** Python 3, Pydantic, LangGraph, FastAPI, pytest, existing TraceRecorder and Runtime components.

**Spec:** User-provided Runtime-driven Autonomous Industrial Agent System requirements in the conversation.

## Global Constraints

- Do not add a business Agent or microservice.
- Do not delete existing Graphs, Runtime components, Agent capabilities, RAG, CAD, WorkOrder, or shared contracts.
- Preserve Event Idempotency, WorkOrder Lifecycle, RAG Contract, Trace Contract, and existing API behavior.
- Do not add productionization beyond the Runtime architecture convergence.
- Keep the implementation split into focused modules; do not create a new monolithic orchestrator.

## Review Focus

- A Planner Action with an unknown capability must be blocked with a traceable reason rather than silently calling a hard-coded Agent.
- Repeated side-effect Actions must preserve idempotency and must not create duplicate WorkOrders.
- A Runtime loop must stop on final evidence, evaluator block, duplicate action, timeout, or max iterations.
- A JEV parse failure must preserve the existing event/user entry behavior and return a structured validation finding.
- Legacy Graph and A2A callers must continue to receive their existing result payloads.

### Task 1: Unified Runtime contracts and JEV boundary

**Files:**
- Create: `services/agent-service/app/agents/base.py`
- Create: `services/agent-service/app/runtime/jev.py`
- Modify: `services/agent-service/app/agents/*/agent.py`
- Modify: `services/agent-service/app/agents/registry.py`
- Test: `services/agent-service/tests/test_agent_contract.py`

**Interfaces:**
- `BaseAgent.name`, `BaseAgent.capabilities`, `BaseAgent.execute(task) -> AgentResult`, `BaseAgent.validate(task)`, `BaseAgent.trace(...)`.
- `AgentResult(success, output, evidence, confidence, next_actions)`.
- `GoalEvent(goal, entities, constraints, required_capabilities, source, raw)`.
- `JEVParser.parse(payload) -> GoalEvent`.

- [ ] Write failing contract tests for all nine registered Agents, AgentResult conversion, and JEV output.
- [ ] Run the focused tests and observe failures caused by the missing contract.
- [ ] Implement the minimal BaseAgent/AgentResult/JEV types and make each existing Agent inherit BaseAgent with its declared capability tuple.
- [ ] Register concrete Agent instances in the Agent Registry without changing their existing `run()` implementations.
- [ ] Run focused tests and the existing Agent registry tests.

### Task 2: Capability-driven planning and Runtime dispatcher

**Files:**
- Modify: `services/agent-service/app/runtime/action.py`
- Modify: `services/agent-service/app/runtime/capability.py`
- Modify: `services/agent-service/app/runtime/planner.py`
- Create: `services/agent-service/app/runtime/dispatcher.py`
- Modify: `services/agent-service/app/runtime/container.py`
- Test: `services/agent-service/tests/test_runtime_dispatcher.py`

**Interfaces:**
- `ActionModel.required_capability` property backed by `payload["required_capability"]`.
- `CapabilityRegistry.register_agent(agent)`, `resolve_agent(capability)`, and `snapshot()`.
- `RuntimeDispatcher.dispatch(action, state) -> AgentResult`.

- [ ] Write failing tests proving Planner Actions contain required capabilities, Registry resolves concrete Agents, unknown capabilities are blocked, and side-effect Actions use ExecutionManager.
- [ ] Run the focused tests and observe failures.
- [ ] Implement dynamic Agent registration and a dispatcher that emits capability/action/execution trace events, then calls AgentHarness/Agent.execute through ExecutionManager.
- [ ] Preserve Planner legacy `target` values while making `required_capability` authoritative.
- [ ] Run focused tests plus Planner, Capability, Execution, and idempotency tests.

### Task 3: Runtime-controlled Graph entrypoint

**Files:**
- Modify: `services/agent-service/app/graph/workflow.py`
- Modify: `services/agent-service/app/graph/nodes.py`
- Modify: `services/agent-service/app/runtime/operations.py`
- Modify: `services/agent-service/app/api/entrypoints.py`
- Test: `services/agent-service/tests/test_runtime_graph_control.py`

**Interfaces:**
- `AgentOrchestrator` creates a GoalEvent, asks Planner for a bounded plan, and runs the plan through RuntimeDispatcher/LoopEngine.
- Existing `run_user()` and `run_abnormal_event()` return legacy state keys plus `runtime_plan`, `runtime_actions`, and `trace`.

- [ ] Write failing tests proving an abnormal event is planned and dispatched by capability, while Graph no longer selects fixed diagnosis→knowledge→CAD edges.
- [ ] Run the focused tests and observe the expected failure.
- [ ] Add a Runtime node/container path in the Graph; preserve legacy node methods for direct callers and existing tests.
- [ ] Make Planner/Dispatcher/LoopEngine determine the next Action; Graph only carries state and records lifecycle.
- [ ] Run the complete Agent test suite and verify legacy A2A/WorkOrder behavior.

### Task 4: Loop and evaluator convergence

**Files:**
- Modify: `services/agent-service/app/runtime/evaluator.py`
- Modify: `services/agent-service/app/runtime/loop_engine.py`
- Modify: `services/agent-service/app/runtime/tracing.py`
- Modify: `services/agent-service/app/graph/nodes.py`
- Test: `services/agent-service/tests/test_runtime_evaluator_domains.py`

**Interfaces:**
- `RuntimeEvaluator.evaluate()` keeps `continue`, `replan`, `final`, and `blocked` statuses.
- Domain normalization covers diagnosis, maintenance, and learning without introducing Agent-specific loops.
- Loop events include `loop_continue`, `evidence_added`, `evaluation_result`, and `loop_stop`.

- [ ] Write failing tests for diagnosis confidence, maintenance evidence, learning quality gate, and loop trace events.
- [ ] Run focused tests and observe failures.
- [ ] Implement domain-aware evidence/quality normalization and emit the canonical Runtime events.
- [ ] Route existing review/replan behavior through LoopEngine without changing business result schemas.
- [ ] Run loop, evaluator, learning, and evidence tests.

### Task 5: Trace, full lifecycle E2E, and completion documentation

**Files:**
- Modify: `services/agent-service/app/harness/trace.py`
- Modify: `services/agent-service/app/runtime/execution.py`
- Create: `services/agent-service/tests/test_runtime_autonomous_e2e.py`
- Modify: `docs/contracts/runtime-contracts.md`
- Modify: `README.md`

**Interfaces:**
- Canonical events: `planner_start`, `planner_end`, `capability_selected`, `action_selected`, `execution_start`, `execution_end`, `evidence_added`, `evaluation_result`, `loop_continue`, `loop_stop`.
- E2E covers abnormal event → Planner → capability dispatch → diagnosis/knowledge/CAD/maintenance/workorder → close → memory learning/RAG experience.

- [ ] Write the complete E2E test and assert every canonical event and lifecycle output.
- [ ] Run it and observe failure before Runtime integration is complete.
- [ ] Implement missing Trace normalization and durable result propagation without changing existing contracts.
- [ ] Run all Agent, RAG, CAD, and frontend build checks.
- [ ] Update architecture documentation with the final Runtime flow and completion criteria.

