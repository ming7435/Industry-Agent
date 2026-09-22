# P0 Runtime, WorkOrder and RAG Lifecycle Design

## Scope and intent

本轮只收敛 P0 运行时、自动异常生命周期、幂等和独立 RAG HTTP 合约，保持现有 9 个 Agent、A2A、Skill、Tool Registry、API 兼容。`ARCHITECTURE_MODIFICATION_PLAN.md` 是目标约束；具体实现以当前源码为准。

本轮明确不做 monitor-service 目录拆分、CAD 真实数据库接入、全量 MySQL 迁移、前端拆分、配置治理和 OpenTelemetry。这些属于后续阶段，避免把 P0 行为修复和无关基础设施改造混在一起。

## Design decisions

### 1. Single Agent runtime

`monitor_web_server.py` 不再导入或构造 `DiagnosisAgent`、`AgentHarness`、`AgentOrchestrator`、`AgentContainer`。Monitor 仍负责采样、规则判定、保存展示状态和 generation 隔离；确认异常后，把原始 `AbnormalEvent` 通过 `POST /api/v1/agent/event` 交给 Agent Service。

Monitor 不再自行组装诊断结果，也不再额外调用 `/api/workorders`。Agent Service 返回的 pipeline（包括 task、trace、workorder）作为展示结果保存。事件请求使用稳定 `event_id`，调用端传递 `event_id` 作为幂等来源。

### 2. Automatic event lifecycle

自动入口保持现有图节点顺序：

```text
Diagnosis -> Knowledge -> CAD -> Maintenance -> WorkOrder -> END
```

`workorder` 节点创建成功后返回 `status=waiting_repair`，图立即结束，不执行 Report 或 Memory Learn。用户查询/报告入口仍沿用现有路由；本轮不改变用户侧 API 契约。

### 3. Close-gated learning and case report

`RuntimeOperations.execute_workorder("close")` 是关闭副作用的唯一入口。只有底层订单状态已为 `closed` 且 `WorkOrderValidator.can_learn(order, feedback)` 为真时，才调用 Memory Agent 的 `learn`。

学习请求携带稳定的 `experience_id`/幂等来源（优先使用 `event_id`，回退到 `workorder_id`），Memory 服务负责去重并将经验 upsert 到远程 RAG。学习成功后再调用 Report Agent 生成 `full_case_report`，结果放入 close 响应的 `report` 字段。重复 close 或重复回调不得再次写入经验或生成另一份工单；报告生成失败不能回滚已成功关闭的工单。

### 4. WorkOrder idempotency boundary

自动异常工单统一使用 `idempotency_key = "monitor:<event_id>"`。`WorkOrderService`、`RuntimeOperations` 和 MCP adapter 透传该字段；adapter 在创建前按幂等键查找已有订单并返回已有订单，保证同一 `event_id` 至多一张工单。当前实现先保持兼容的进程内存储，但把幂等逻辑集中在 adapter/repository 边界，后续可替换为数据库唯一键而不改 API。

自动链路只在 Agent Service 创建工单；Monitor 不创建工单。

### 5. Standalone RAG HTTP contract

Standalone RAG Service 补齐与 Agent RAG client 对齐的接口：

```text
POST /search
GET  /health
POST /documents/ingest
POST /documents/upsert
GET  /documents/{document_id}
GET  /documents/{document_id}/chunks/{chunk_id}
```

`/documents/upsert` 接受维修经验或文档 payload，至少保留 `document_id`、`content`、`metadata`、`collection` 和可选 `chunks`。实现通过现有 storage/retriever 能力写入可用后端；没有可用后端时返回明确失败，不把成功伪装成本地 fallback。Agent RAG client 使用规范化 `/documents/*` 路径，同时保留旧路径兼容别名。

### 6. Trace isolation

每次 orchestrator 执行生成自己的 `task_id` 和 `trace_id`。返回响应中的 `trace` 只允许包含同时匹配当前 task/trace 的记录；全局 Trace API 仍可按查询参数读取历史。该过滤在 orchestrator 响应边界实现，避免跨任务状态污染。

## Error and compatibility rules

- Monitor 无法调用 Agent Service 时只记录 `latest_error`，不在本地执行 Agent 或创建工单。
- Agent Service `/api/agent/event` 继续作为 deprecated alias，`/api/v1/agent/event` 为规范路径。
- 已存在的 WorkOrder、Memory、RAG、Trace API 形状尽量保持不变；新增字段只追加，不删除现有字段。
- close 后 Memory/Report 失败必须在响应中显式返回失败信息，不影响订单状态。
- 所有重复执行场景都通过测试固定：同一 event_id 重复事件、同一 idempotency_key 重复创建、重复 close、不同 task 的 trace。

## Verification targets

1. 同一异常事件产生一个 Agent task 和最多一张工单，订单状态为 `waiting_repair`。
2. 自动异常响应不含 trigger 侧的 Memory learn 或 Full Case Report。
3. 工单完成并关闭且 feedback 有效时，Memory learn、RAG upsert、full case report 按顺序各执行一次。
4. 无效 feedback、未关闭订单或重复 close 不触发经验写入。
5. standalone RAG 的 upsert/fetch/search 可被 Agent client 调用。
6. orchestrator 响应 trace 不包含其他 task/trace 的记录。

