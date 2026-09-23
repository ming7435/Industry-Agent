# P2 本地基础设施

`infra/docker/docker-compose.yml` 提供 Agent/RAG 联调所需的 MySQL、Redis、Milvus、etcd、MinIO 和 OTLP Collector。带 `apps` profile 时还会启动 Agent、Monitor、RAG、CAD 服务，带 `gateway` profile 时额外启动 Nginx 入口。MySQL 会按顺序执行 `infra/mysql/migrations/` 下的版本化初始化脚本。

启动：

```powershell
docker compose -f infra/docker/docker-compose.yml up -d
```

启动完整本地联调栈（应用 + Nginx）：

```powershell
docker compose -f infra/docker/docker-compose.yml --profile apps --profile gateway up -d --build
```

Agent Service 的正式 Alembic 迁移从仓库根目录执行：

```powershell
python -m alembic -c services/agent-service/alembic.ini upgrade head
```

也可以复用 Agent 镜像中的正式迁移运行器（会等待 MySQL 健康）：

```powershell
docker compose -f infra/docker/docker-compose.yml --profile migrate run --rm agent-migrate
```

停止：

```powershell
docker compose -f infra/docker/docker-compose.yml down
```

默认端口：

- MySQL `3306`
- Redis `6379`
- Milvus `19530`
- MinIO API `9000`，控制台 `9001`
- OTLP HTTP `4318`
- Nginx Gateway `8080`（启用 `gateway` profile）
- Agent `8010`、CAD `8011`、RAG `8020`、Monitor `8001`（启用 `apps` profile）

启动应用服务时，将根目录环境变量指向这些地址，并设置：

```ini
APP_ENV=development
ALLOW_DEGRADED_STORAGE=false
MYSQL_HOST=127.0.0.1
REDIS_URL=redis://127.0.0.1:6379/0
MILVUS_URI=http://127.0.0.1:19530
 OBJECT_STORAGE_ENDPOINT=127.0.0.1:9000
```

观测配置默认由 Agent 的 OTLP HTTP exporter 发送到 `otel-collector:4318`；基础配置使用 `debug` exporter 便于本地联调。生产环境使用 overlay，将 Collector 转发到外部 OTLP/Tempo/Jaeger 兼容后端：

```powershell
$env:OTEL_BACKEND_ENDPOINT = "https://otel.example.com/v1/traces"
$env:OTEL_BACKEND_AUTH = "Bearer <injected-by-secret-manager>"
docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.production.yml --profile apps --profile gateway up -d --build
```

生产 overlay 不在仓库中保存凭据，并且通过 `OTEL_BACKEND_ENDPOINT` 缺失即失败，避免无意中把生产 Trace 丢到本地 debug 输出。

生产环境请替换默认密码，并通过外部密钥管理系统注入凭据。
