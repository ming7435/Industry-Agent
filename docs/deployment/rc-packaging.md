# Release Candidate Docker 封装

RC 包含四个应用容器：Agent `8010`、CAD `8011`、RAG `8020`、Monitor `8001`，以及 MySQL、Redis、Milvus、MinIO 和 OTLP Collector。

## 启动

在仓库根目录准备环境变量（不要把真实密钥提交到 Git）：

```powershell
$env:DEEPSEEK_API_KEY = "..."
$env:SILICONFLOW_API_KEY = "..."
$env:MYSQL_PASSWORD = "..."
$env:MYSQL_APP_PASSWORD = "..."
docker compose -f infra/docker/docker-compose.yml --profile apps --profile gateway up -d --build
```

Agent 的运行时 SQLite 文件统一位于 `/app/.runtime`，由 named volume `agent-runtime-data` 持久化，包含：

- `pending.sqlite3`：Approval wait/resume 任务；
- `events.sqlite3`：Event Idempotency；
- `workorders.sqlite3`：仅在显式切换 SQLite 时使用；
- `reports.sqlite3`、`learning.sqlite3`：报告和 Memory/RAG 幂等结果。

默认 Compose RC 配置使用 `REDIS_URL=redis://redis:6379/0`、`WORKORDER_BACKEND=mysql`，并关闭 degraded storage、RAG local fallback 和 CAD Demo fallback。需要本地演示降级时必须显式设置对应环境变量。

## 健康检查

```powershell
Invoke-WebRequest http://127.0.0.1:8010/health
Invoke-WebRequest http://127.0.0.1:8011/health
Invoke-WebRequest http://127.0.0.1:8020/health
Invoke-WebRequest http://127.0.0.1:8001/
```

Monitor 镜像内置 `/app/frontend/monitor/index.html`。Agent、CAD、RAG 的模型密钥通过 Compose 环境变量注入，镜像不会复制任何 `.env` 文件。

## 验收

```powershell
python scripts/test_all.py
docker compose -f infra/docker/docker-compose.yml config --quiet
docker compose -f infra/docker/docker-compose.yml --profile apps --profile gateway ps
```

真实 PLC/MES/Inventory/QMS MCP、审批身份认证和外部生产 Secret Manager 仍属于部署环境验收，不由本地 RC Demo 伪造。

`backend-service` 和 `model-service` 不属于当前 Runtime 包；当前运行时服务仅为 Agent、RAG、CAD 和 Monitor。
