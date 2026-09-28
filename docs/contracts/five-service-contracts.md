# 五服务契约

## Backend MCP

`POST /tools/call`

```json
{"tool":"create_workorder","arguments":{"device_id":"CNC-001","idempotency_key":"monitor:EVT-1"}}
```

工单响应包含 `success`、`workorder_id`、`status` 和完整的 `workorder` 记录。
`mark_repair_completed` 要求 `repair_verification.passed=true`；
`close_workorder` 要求工单已完成且通过同一验证门禁。唯一幂等键由后端仓库强制执行。

质检、关闭、审计、报告元数据和结构化经验记录共用同一个后端边界，公开的 Agent 门面保持兼容。

## Model 网关

模型服务将提供方失败统一为 HTTP 503，并提供稳定的 OpenAI 兼容请求结构。
`MODEL_PROVIDER=fake|ci|test` 是确定性模式，也是 Compose E2E 任务唯一使用的提供方。

## Runtime Trace

Runtime Trace 记录使用现有 Trace 契约，包含 Planner 起止、动作/能力选择、执行起止、证据、评估、
循环继续/停止、重新规划和策略决策。Trace 会随事件响应返回，也可以通过 `/api/v1/trace` 查询。
