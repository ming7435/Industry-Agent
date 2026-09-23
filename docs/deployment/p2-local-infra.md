# P2 本地基础设施

`infra/docker/docker-compose.yml` 提供 Agent/RAG 联调所需的 MySQL、Redis、Milvus、etcd 和 MinIO。MySQL 会按顺序执行 `infra/mysql/migrations/` 下的版本化初始化脚本。

启动：

```powershell
docker compose -f infra/docker/docker-compose.yml up -d
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

启动应用服务时，将根目录环境变量指向这些地址，并设置：

```ini
APP_ENV=development
ALLOW_DEGRADED_STORAGE=false
MYSQL_HOST=127.0.0.1
REDIS_URL=redis://127.0.0.1:6379/0
MILVUS_URI=http://127.0.0.1:19530
OBJECT_STORAGE_ENDPOINT=127.0.0.1:9000
```

生产环境请替换默认密码，并通过外部密钥管理系统注入凭据。
