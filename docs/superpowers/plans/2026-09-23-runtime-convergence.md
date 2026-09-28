# Runtime 收敛实施计划

> **面向 Agent 工作���：**必须使用 `superpowers:executing-plans` 子技能，按任务逐项实施本计划。

**目标：**让现有 Runtime 成为 Industrial-Agent 的控制中心，同时保留所有现有业务 Agent、Graph、RAG、CAD、WorkOrder 生命周期、Memory Learning 和共享契约。

**架构：**增加统一的 Agent 契约和 JEV 边界，在现有 Capability Registry 中注册具体 Agent 实例及其能力，并引入通过 capability 和 ExecutionManager 解析 Planner Action 的 Runtime dispatcher。保留 LangGraph 作为状态/执行层；顶层 Graph 调用 Runtime Action，而不是编码固定业务顺序。

**技术栈：**Python 3、Pydantic、LangGraph、FastAPI、pytest，以及现有 TraceRecorder 和 Runtime 组件。

**规格：**对话中用户提供的 Runtime 驱动自主工业 Agent 系统要求。

## 全局约束

- 不新增业务 Agent 或微服务。
- 不删除现有 Graph、Runtime 组件、Agent 能力、RAG、CAD、WorkOrder 或共享契约。
- 保持事件幂等性、WorkOrder 生命周期、RAG 契约、Trace 契约和现有 API 行为。
- 除 Runtime 架构收敛外，不增加生产化范围。
- 保持实现拆分在聚焦模块中；不要创建新的单体编排器。

## 复核重点

- 带未知 capability 的 Planner Action 必须以可追踪原因阻断，而不是静默调用硬编码 Agent。
- 重复的副作用 Action 必须保持幂等性，不得创建重复 WorkOrder。
- Runtime 循环必须在最终证据、评估器阻断、重复动作、超时或最大迭代次数时停止。
- JEV 解析失败必须保留现有事件/用户入口行为，并返回结构化校验发现。
- 旧 Graph 和 A2A 调用方必须继续接收原有结果载荷。

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

- [x] Write and run contract tests for all nine registered Agents, AgentResult conversion, and JEV output.
- [x] Implement BaseAgent/AgentResult/JEV and declare capabilities on existing Agents.
- [x] Register concrete Agent instances without changing their business `run()` implementations.

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

- [x] Test Planner capabilities, Registry resolution, unknown-capability blocking, and side-effect execution.
- [x] Build the Dispatcher from declared capabilities and route Runtime execution through ExecutionManager.
- [x] Preserve legacy `target` values while making `required_capability` authoritative.

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

- [x] Test abnormal-event planning and capability dispatch.
- [x] Keep LangGraph as the single Runtime lifecycle node; preserve legacy node methods for direct callers.
- [x] Make Planner/Dispatcher/LoopEngine determine Actions and preserve legacy A2A/WorkOrder behavior.

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

- [x] Test diagnosis confidence, maintenance evidence, learning quality gates, and loop trace events.
- [x] Implement domain-aware evaluation and canonical Runtime events.
- [x] Route replanning through the shared LoopEngine without changing business result schemas.

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

- [x] Add deterministic E2E coverage for Runtime planning, capability dispatch, evidence, evaluation, WorkOrder idempotency, QualityAgent and Memory learning.
- [x] Make external RAG dependency explicit in integration tests and use local fallback only in deterministic test setup.
- [x] Align Trace and Action JSON Schemas with emitted lifecycle records.
- [x] Update architecture documentation with the Runtime flow and completion criteria.

