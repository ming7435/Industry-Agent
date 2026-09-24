# Release Candidate Docker 封装

RC 包含五个业务应用容器：Agent `8010`、CAD `8011`、RAG `8020`、Backend `8030`、Model `8040`，以及 Monitor `8001`、Gateway `8080` 和基础设施 MySQL、Redis、Milvus、MinIO、OTLP Collector。

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

模型密钥只注入 Model Service；Agent、RAG、CAD 通过 Model HTTP 合同调用，不读取
`DEEPSEEK_API_KEY` 或 `SILICONFLOW_API_KEY`。

## 健康检查

```powershell
Invoke-WebRequest http://127.0.0.1:8010/health
Invoke-WebRequest http://127.0.0.1:8030/health
Invoke-WebRequest http://127.0.0.1:8040/health
Invoke-WebRequest http://127.0.0.1:8011/health
Invoke-WebRequest http://127.0.0.1:8020/health
Invoke-WebRequest http://127.0.0.1:8001/
```

Monitor 镜像内置 `/app/frontend/monitor/index.html`。模型密钥只通过 Compose 注入 Model Service，镜像不会复制任何 `.env` 文件。

## 验收

```powershell
python scripts/test_all.py
docker compose -f infra/docker/docker-compose.yml config --quiet
docker compose -f infra/docker/docker-compose.yml --profile apps --profile gateway up -d --build
RUN_DOCKER_E2E=1 pytest tests/e2e -q
docker compose -f infra/docker/docker-compose.yml --profile apps --profile gateway ps
docker compose -f infra/docker/docker-compose.yml --profile apps --profile gateway down -v
```

真实 PLC/MES/Inventory/QMS MCP、审批身份认证和外部生产 Secret Manager 仍属于部署环境验收，不由本地 RC Demo 伪造。

完整架构说明见 [`docs/architecture/five-service-architecture.md`](../architecture/five-service-architecture.md)。
