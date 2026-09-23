# Runtime 与跨服务契约

本文档把当前源码中已经存在的边界整理成可检查的共享契约。它不是新的架构
设计；字段和状态均以 `services/agent-service/app/`、`services/rag-service/app/`
的实现为准。机器可读版本位于 [`shared/contracts`](../../shared/contracts)。

## 1. Runtime Action

`ActionModel` 是 Loop Engine 选择和执行动作的唯一表示，支持五种类型：

| `action_type` | 作用 | 是否允许副作用 |
| --- | --- | --- |
| `TOOL` | 调用 Tool Registry/MCP/RAG/CAD 等工具 | 取决于 `side_effect` |
| `AGENT` | 调用已有九个 Agent 之一 | 通常无；由目标能力决定 |
| `FINAL` | 结束当前 Loop 并返回结果 | 否 |
| `REPLAN` | 要求当前 Loop 根据缺失证据重新选择路径 | 否 |
| `WAIT` | 等待外部状态变化（例如维修反馈） | 否 |

规范输出字段是：

```json
{
  "action_type": "AGENT",
  "action_id": "ACT-8B8A9F0B4B2D1C33",
  "target": "knowledge",
  "reason": "missing evidence",
  "confidence": 0.75,
  "payload": {"query": "主轴温度"},
  "side_effect": false,
  "idempotency_key": "",
  "cost": 1.0
}
```

旧调用方可以继续发送 `kind/name/params`；`ActionModel` 只在输入边界把它们
转换为规范字段，Trace 和执行记录不会再产生第二套动作模型。

`action_id` 用于一次动作的可观测标识；LoopGuard 的重复判断仍使用不包含
`action_id` 的语义 fingerprint，避免同一个动作因为重新生成 ID 而绕过保护。

## 1.1 Planner

`app.runtime.planner.Planner` 只做 `Goal -> Plan -> ActionModel` 的确定性拆解，
不执行 Agent、Tool 或 MCP。默认异常计划使用已有能力：

```text
diagnosis -> knowledge -> cad -> maintenance -> workorder
```

WorkOrder Action 固定携带 `monitor:<event_id>` 幂等键。Planner 只能把结果交给
Loop Engine，不能直接调用执行器；`planner_start` 和 `planner_end` 进入 Trace。

## 2. Loop、Evaluator 与 Execution

所有 Evidence、Diagnosis Review、Maintenance Replan 和 Learning 相关的有限循环
都复用 `LoopEngine`。业务 Node 只提供 `observe/select_action/execute_action`
适配函数，不能自行实现无限循环。

```text
Observe
  -> RuntimeEvaluator
       continue / replan / final / blocked
  -> ActionModel
  -> LoopGuard
  -> ExecutionManager
       PENDING -> RUNNING -> SUCCESS | FAILED | TIMEOUT | CANCELLED | UNKNOWN
  -> Update State + Evidence
```

`LoopGuard` 统一检查：

- `max_iterations`、wall-clock `timeout_seconds` 和 `max_budget`；
- Action fingerprint 的 `duplicate_action`；
- Evidence 集合没有增加时的 `no_new_evidence`；
- Confidence 没有提升时的 `confidence_not_improved`。

`ExecutionManager` 的 timeout 只改变 Runtime 观察到的执行状态，不声称杀死底层
线程。非副作用 Action 可按有限 `max_retries` 重试；任何外部副作用动作必须有
`idempotency_key`，失败或超时后先做已有状态检查，不能盲目再次创建。执行记录
包含 `execution_id`、`attempts`、`retry_count`、`side_effect_status` 和 history；
超时后由 reconciliation 查询真实状态。

## 3. 自动异常与工单生命周期

自动异常链路固定为：

```text
AbnormalEvent
  -> Diagnosis
  -> Knowledge
  -> CAD
  -> Maintenance
  -> WorkOrder
  -> END
```

事件边界去重保证同一个 `event_id` 返回同一个 Agent task/pipeline。自动工单使用
稳定键 `monitor:<event_id>`，最多创建一张工单。创建成功后：

- `pipeline.status = waiting_repair`：表示自动图暂停等待人工维修；
- `workorder.status = open`（或后续合法 WorkOrder 状态）：表示真实工单状态；
- 不在此处执行 Memory Learn、RAG Upsert 或 Full Case Report。

## 4. Close-gated Learning 与独立 RAG

只有 `workorder.status=closed` 且 `repair_feedback` 有效时，才允许：

```text
Memory Learn -> RAG /documents/upsert -> Full Case Report
```

经验的 canonical 幂等边界是 `workorder:<workorder_id>`；`event_id` 以
`source_event_id` 保存为来源元数据。RAG 远程写入使用
`POST /documents/upsert`，读取使用 `GET /documents/{document_id}` 或
`GET /documents/{document_id}/chunks/{chunk_id}`。Agent Service 只有在配置允许
降级时才使用本地索引；生产环境应显式禁止 fallback。

Memory 在写入前执行 Experience Quality Gate，输出：

- `experience_quality_score`：0 到 1 的质量分；
- `validation_status`：`accepted`、`duplicate` 或 `rejected`；
- `validation_findings`：维修成功、内容完整性、人工确认和重复记录检查结果。

低于质量阈值或明确失败的维修经验不会写入 Memory/RAG；`duplicate` 仍可用于
幂等重试和补偿 RAG 写入，不会生成第二条经验。

## 5. Trace 隔离

每条 Runtime 记录必须带当前 `task_id` 和 `trace_id`。Loop 最少记录：

```text
loop_start
evaluation_result
action_selected
execution_start
execution_end
evidence_added
review_result
replan
loop_stop
```

Orchestrator 返回的 Trace 必须同时按当前 task 和 trace 过滤，不能把其他任务的
记录混入响应。完整事件和字段约束见
[`runtime-trace.schema.json`](../../shared/contracts/runtime-trace.schema.json)。

## 6. 兼容边界

本轮没有新增 Agent、没有拆分微服务，也没有改变既有九个 Agent、A2A、MCP、Skill
或 Tool Registry 的 API。未来 Planner 只能从
`CapabilityRegistry` 选择已有能力，不能绕过 LoopGuard 直接执行任意循环。
