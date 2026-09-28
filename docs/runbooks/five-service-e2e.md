# 五服务 Compose E2E

CI 工作流使用 `MODEL_PROVIDER=fake` 启动 `apps` 和 `gateway` profile，等待 Backend、
Model、Agent、RAG、CAD 和 Monitor 健康检查通过，写入一份确定性的知识文档，然后运行
`tests/e2e`。

本地运行方式：

```powershell
$env:MODEL_PROVIDER = "fake"
$env:APP_ENV = "ci"
$env:RAG_ALLOW_LOCAL_FALLBACK = "false"
$env:CAD_ALLOW_DEMO_FALLBACK = "false"
$env:RAG_UPSERT_WHOOSH_ENABLED = "true"
$env:RAG_UPSERT_MILVUS_ENABLED = "true"
docker compose -f infra/docker/docker-compose.yml --profile apps --profile gateway up -d --build
RUN_DOCKER_E2E=1 python -m pytest tests/e2e -q
docker compose -f infra/docker/docker-compose.yml --profile apps --profile gateway down -v
```

如果必需依赖不可用，运行必须失败。不要打开本地或 Demo fallback 来让生产检查变绿。
