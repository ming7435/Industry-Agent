# Runtime 收尾实施计划

> **面向 Agent 工作者：**必须使用 `superpowers:executing-plans` 子技能，按任务逐项实施本计划。

**目标：**关闭剩余 Runtime 收敛缺口，让现有 Industry-Agent 系统由一个有界 Runtime 控制，同时保留所有现有业务 Agent 和契约。

**架构：**保留 LangGraph 作为状态/生命周期容器。RuntimeCoordinator 负责规划和有界重规划，CapabilityRegistry 解析声明的 Agent 能力，ExecutionManager 负责 Runtime 超时/重试，AgentHarness 继续作为直接 A2A 调用的兼容边界。现有 QualityAgent 仍是生产零件质量领域唯一的生产 Agent。

**技术栈：**Python 3、FastAPI、LangGraph、Pydantic、pytest、JSON Schema，以及现有 RAG/CAD/MCP 适配器。

**规格：**`docs/superpowers/plans/2026-09-23-runtime-convergence.md` 和当前用户请求中的 Runtime 要求。

## 全局约束

- 不新增业务 Agent、微服务或生产化层。
- 保持事件幂等性、WorkOrder 生命周期、RAG 契约、Trace 契约和共享契约兼容。
- 质量范围仅限通过现有 QualityAgent 处理的 `production_part` / `part_quality`。
- Graph 继续作为状态和 Runtime 生命周期执行层存在；不负责选择业务边。
- 所有 Runtime 循环继续受迭代次数、超时、证据和幂等守卫约束。

## 复核重点

- Runtime Agent 超时后，不得同时被 Harness 和 ExecutionManager 重试。
- Planner 重规划不得重复已完成的副作用，也不得无限循环。
- 必须复用 Diagnosis 提供的 Knowledge 证据，同时不能绕过 Trace 记录。
- 未知 capability 必须显式阻断，并在 Trace 中可见。
- 真实 E2E 测试必须区分确定性的本地 fixture 与不可用的外部 RAG/LLM 依赖。

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

本计划完成第一阶段 Runtime 收敛。安全/策略控制保留为独立的第二阶段，本计划不会提前引入。

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

第二阶段在保留第一阶段 Runtime 控制中心的同时完成。
