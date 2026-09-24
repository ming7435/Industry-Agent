# Five-service Compose E2E

The CI workflow starts the `apps` and `gateway` profiles with
`MODEL_PROVIDER=fake`, waits for Backend, Model, Agent, RAG, CAD, and Monitor
health, seeds one deterministic knowledge document, and runs `tests/e2e`.

For a local run:

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

If a required dependency is unavailable, the run must fail. Do not turn on a
local/demo fallback to make a production check green.
