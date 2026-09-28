# Agent Service 数据库迁移

此目录包含 Agent Service 的规范 Alembic 环境。

从仓库根目录运行迁移：

```powershell
python -m alembic -c services/agent-service/alembic.ini upgrade head
```

迁移 URL 优先读取 `DATABASE_URL`；未设置时读取服务使用的
`MYSQL_*` 环境变量。

Compose 通过 `agent-migrate` profile 调用同一个迁移运行器。`infra/mysql/migrations/`
下的 SQL 文件只是供外部初始化工具使用的兼容快照，Compose 不会执行它。
