# MySQL schema ownership

Agent Service 的 Alembic 是运行时 MySQL schema 的唯一迁移来源：

```powershell
python -m alembic -c services/agent-service/alembic.ini upgrade head
```

本地 Compose 使用 `agent-migrate` profile 执行同一命令：

```powershell
docker compose -f infra/docker/docker-compose.yml --profile migrate run --rm agent-migrate
```

`migrations/001_core.sql` 是保留给外部初始化工具的兼容快照。Compose 不会挂载或自动执行它；新的 schema 变更必须添加到 `services/agent-service/migrations/versions/`，不要再编辑 SQL 快照作为迁移手段。
