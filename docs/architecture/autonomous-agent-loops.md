# 自主 Agent 循环

Runtime 正从一次性 Agent 执行转向有界、证据驱动的循环。每个循环都有明确的状态、停止条件和持久副作用规则。共享实现属于 Runtime 基础设施；领域 Node 只提供观察和动作适配器。

## 工具循环

Diagnosis 和 Knowledge 已经使用有界的 LangGraph 工具循环：

- Tool Guard 根据当前 Skill 校验每次调用。
- Observation 记录会计算哈希，以阻止重复结果。
- `max_steps` 用于停止失控的工具调用。
- 工具 Trace 携带 `task_id` 和 `trace_id`。

循环必须在验证器认可结果、观察结果重复或预算错误时停止。带副作用的工具仍不可重试，除非其边界具备幂等性。

## Agent 循环

Graph 现在只作为 Runtime 执行层。它将状态传入一个 Runtime 生命周期节点；Planner 和 LoopEngine 负责选择下一个 Action：

```text
Goal/Event -> RuntimeInputParser -> Planner -> CapabilityRegistry -> LoopEngine
  -> ActionModel -> ExecutionManager -> Agent/Tool/MCP
  -> Evidence -> Evaluator -> Continue/Replan/Final
```

默认异常事件计划仍然解析为
`Diagnosis -> Knowledge -> CAD -> Maintenance -> WorkOrder -> waiting_repair`，
但该顺序是 Planner 的结果，而不是 Graph 边。Maintenance 可以返回
`blocked_insufficient_evidence`；此时 Runtime 会停止，且不会创建 WorkOrder。

## 统一循环引擎

`app.runtime.loop_engine.LoopEngine` 是共享的有限状态 Runtime，用于证据循环、诊断复核、Maintenance 重新规划以及未来的有界学习操作。它的原生 Runtime API 为：

```text
Observe -> RuntimeEvaluator -> Select Action -> Execute -> Update State
```

引擎强制执行 `max_iterations`、`min_evidence_score`、墙钟超时、成本预算、重复动作检测、无新增证据检测和置信度进展检测。不存在自由运行的 Agent 循环：每个循环都有有限策略和明确停止原因。

每一步都会生成一个 `ActionModel`，其类型为 `AGENT`、`TOOL`、`REPLAN`、`FINAL` 或 `WAIT` 五者之一。`LoopGuard` 是引擎使用的唯一守卫实现。`RuntimeEvaluator` 是处理 `continue`、`replan`、`final` 和 `blocked` 的唯一策略入口；业务 Node 不得重复实现这套决策逻辑。`ExecutionManager` 负责动作执行状态和对账边界。Runtime Trace 会携带当前 `task_id` 和 `trace_id`，记录 `planner_start`、`planner_end`、`capability_selected`、`action_selected`、`execution_start`、`execution_end`、`evidence_added`、`evaluation_result`、`loop_continue`、`review_result`、`replan` 和 `loop_stop`。

## 证据循环

当第一次结果没有可用文档或证据时，Trigger Knowledge 检索会通过共享 Runtime Engine 进行一次确定性的细化尝试。结果会暴露：

```json
{
  "evidence_loop": {
    "attempts": 1,
    "max_attempts": 1,
    "status": "ready|blocked",
    "stop_reason": "evidence_ready|evidence_exhausted|max_iterations|timeout|duplicate_action",
    "guard_status": "completed|blocked|timeout|error"
  }
}
```

## 诊断复核循环

当诊断明确报告低置信度、缺少证据或存在校验发现时，Runtime 最多执行一次复核。复核会接收同一事件以及确定性的复核原因，只有当诊断证据分数达到策略阈值时才完成。没有质量字段的旧版诊断载荷保持兼容，不会因此产生第二次调用。

## 维修重新规划循环

带有校验发现或 `workorder_ready=false` 的 Maintenance 计划最多执行一次重新规划。第二次尝试会标记 `context.replan_required=true`；如果有界循环仍然无法生成有证据支持的计划，严格触发模式会在创建 WorkOrder 前结束。

生产环境（`APP_ENV=production`）或显式设置 `context.enforce_evidence_gate=true` 时，Maintenance 必须先获得可用的 Knowledge 和 CAD 证据，才能创建 WorkOrder。开发环境保留现有的降级兼容行为，同时继续暴露证据元数据。

## 学习循环

只有已合法关闭、包含维修反馈且明确通过维修验证的 WorkOrder 才能进入学习流程：

```text
Memory Learn -> RAG Upsert -> Full Case Report
```

`RuntimeOperations` 使用 `workorder:<workorder_id>` 持久化每个阶段，并返回 `learning_loop` 元数据。Memory/RAG 阶段失败时可以重试；Report 阶段失败时只重试 Report，绝不会让同一个 WorkOrder 重复学习。

```json
{
  "learning_loop": {
    "status": "running|blocked|waiting_report|completed",
    "learning_idempotency_key": "workorder:WO-001",
    "stages": ["memory", "rag", "report"]
  }
}
```

所有循环都有边界。如果循环无法满足证据或副作用契约，会返回明确的停止原因，而不是静默继续。

## Runtime 控制平面

当前原生 Runtime 路径为：

```text
Goal
  ↓
Planner (Goal -> Plan -> ActionModel)
  ↓
LoopEngine
  ↓ Observe
RuntimeEvaluator
  ↓ Continue / Replan / Final / Blocked
ActionModel (TOOL | AGENT | REPLAN | FINAL | WAIT)
  ↓
ExecutionManager
  ↓
Agent / Tool / A2A / MCP
  ↓
State update + Evidence
```

`ExecutionManager` 暴露明确的 `PENDING`、`RUNNING`、`SUCCESS`、`FAILED`、`TIMEOUT`、`CANCELLED` 和 `UNKNOWN` 状态。超时绝不声称工作线程已经被杀死；带副作用的动作必须提供 `idempotency_key`，并继续受既有状态检查和对账机制约束。`CapabilityRegistry` 描述现有九个 Agent 的能力，是基础 Planner 使用的唯一查找来源；它不会创建另一个 Agent。这些边界的机器可读版本位于 `shared/contracts/`，字段级映射记录在 `docs/contracts/runtime-contracts.md`。
