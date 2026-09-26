# Agent Runtime Architecture Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 集中 Runtime capability 元数据、消除领域节点别名硬编码，并在保持现有执行能力和外部契约的前提下减轻 Coordinator。

**Architecture:** 先在现有目录内增强 `runtime/capability.py`，让 Planner、Coordinator 和 Dispatcher 通过 `CapabilityDefinition` 查询统一元数据；再把每个 Agent Graph 的 node→skill step 绑定移到本领域 Graph 文件。最后以全量测试验证双层 Loop、Policy/Approval、A2A/MCP 和业务闭环。

**Tech Stack:** Python 3.12、Pydantic、LangGraph、pytest、现有 Runtime/A2A/MCP 集成。

**Spec:** `docs/superpowers/specs/2026-09-26-agent-runtime-refactor-design.md`

## Global Constraints

- 不减少能力，只降低复杂度。
- 九个业务 Agent、两层 Loop、A2A、MCP、Memory 学习、RAG、CAD、WorkOrder、Quality 全部保留。
- 不第一步物理移动所有文件；先逻辑重构和测试。
- 不破坏 FastAPI、Agent input/output、WorkOrder、Quality、RAG、CAD、Trace 和 Shared contracts。
- 禁止通过跳过测试、删除断言或降低断言要求制造通过结果。

## Review Focus

- alias capability 查询应解析为 canonical metadata，未知 capability 应保持明确未注册行为；由 Capability Registry 测试覆盖。
- side effect/approval/idempotency metadata 应在 Action/Policy 流程中保持原行为；由 capability metadata 与 policy 测试覆盖。
- 各 Agent Graph 的节点名称变化不应依赖 `base.py` 中的全局表；由显式 binding 测试覆盖。
- 现有旧调用方继续使用 `Capability`、`snapshot` 和 `trace_skill_node` 兼容接口；由回归测试覆盖。
- Runtime replan、resume 和最终结果 key 必须保持原状态形状；由 coordinator/runtime e2e 测试覆盖。

### Task 1: Capability single source of truth

**Files:**
- Modify: `services/agent-service/app/runtime/capability.py`
- Modify: `services/agent-service/app/runtime/capabilities.py`
- Modify: `services/agent-service/app/runtime/planner.py`
- Test: `services/agent-service/tests/test_capability_registry.py`
- Test: `services/agent-service/tests/test_capability_source_of_truth.py`
- Test: `services/agent-service/tests/test_planner.py`

**Interfaces:**
- Produces `CapabilityDefinition`, `CapabilityRegistry.get()`, `domain_for()`, `result_key_for()`, `side_effect_for()`, `requires_approval_for()` and compatibility `Capability` behavior.

- [ ] Write failing tests for metadata lookup, aliases, all nine Agent declarations, and Planner metadata-driven action construction.
- [ ] Run the focused tests and confirm failure because the new metadata interface is absent.
- [ ] Implement canonical immutable definitions and registry indexes while preserving existing lookup/snapshot APIs.
- [ ] Remove Planner's duplicated capability tuples and read reason/side effect/target data from Registry.
- [ ] Run focused capability and planner tests, then the agent suite.

### Task 2: Coordinator metadata boundary

**Files:**
- Modify: `services/agent-service/app/runtime/coordinator.py`
- Modify: `services/agent-service/app/runtime/dispatcher.py`
- Test: `services/agent-service/tests/test_runtime_contract_alignment.py`
- Test: `services/agent-service/tests/test_runtime_replan.py`
- Test: `services/agent-service/tests/test_runtime_dispatcher.py`

**Interfaces:**
- Consumes Task 1's `CapabilityRegistry` metadata methods.
- Produces unchanged `AgentState` result keys, domain evaluation, policy behavior, and replan/resume contracts.

- [ ] Add failing assertions that coordinator has no capability mapping helpers and that result/domain decisions come from Registry.
- [ ] Run focused runtime tests to confirm the assertions fail against current hard-coded mappings.
- [ ] Replace `_result_key()` and `_domain_for_capability()` call sites with registry queries; use definitions for side-effect defaults where applicable.
- [ ] Preserve explicit replan semantics and policy/approval state shapes.
- [ ] Run runtime dispatch, replan, approval, and e2e tests.

### Task 3: Explicit Skill/node bindings

**Files:**
- Modify: `services/agent-service/app/agents/base.py`
- Modify: `services/agent-service/app/agents/{router,diagnosis,knowledge,cad,maintenance,workorder,quality,report,memory}/graph.py`
- Test: `services/agent-service/tests/test_agent_contract.py`
- Test: `services/agent-service/tests/test_skill_registry.py`

**Interfaces:**
- `trace_skill_node(agent_name, node_name, node, *, skill_step=None)` keeps old positional calls valid and uses explicit `skill_step` when supplied.

- [ ] Add a failing test proving a wrapper can bind a node to a step without consulting a central aliases table.
- [ ] Run the focused test and confirm the current wrapper cannot accept the explicit binding.
- [ ] Move each existing alias mapping beside its Agent Graph and pass the binding to `trace_skill_node`.
- [ ] Remove the central aliases table while preserving step history, active agent, current step, trace events, and error behavior.
- [ ] Run all Agent Graph and Skill tests.

### Task 4: Integration verification and documentation

**Files:**
- Modify: `services/agent-service/app/runtime/ARCHITECTURE_AUDIT.md`
- Test: `services/agent-service/tests/test_full_agent_runtime_e2e.py`
- Test: `services/agent-service/tests/test_runtime_policy_e2e.py`
- Test: `tests/integration/test_runtime_rag_cad_contract.py`

- [ ] Run `pytest -c pytest-agent.ini -q`.
- [ ] Run `pytest -c pytest-rag.ini -q` and `pytest -c pytest-cad.ini -q`.
- [ ] Run `python scripts/test_all.py` and record existing failures separately from regressions.
- [ ] Update the audit with actual post-refactor call chain, files changed, retained legacy paths, and remaining technical debt.
