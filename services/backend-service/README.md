# Backend Service

确定性业务系统边界：WorkOrder 生命周期、技师/班组查询、Inventory/QMS MCP 工具、业务持久化和后续 Auth/RBAC 边界。Agent 只通过 `POST /tools/call` 调用，不直接拥有业务 MySQL repository。

- `GET /health`
- `POST /tools/call`，统一 `{tool, arguments}` contract
- `GET /api/workorders`、`GET /api/workorders/{id}` 兼容查询 facade
