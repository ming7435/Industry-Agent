# 阿里云单机 Docker 部署

当前方案复用已有 Compose：MySQL、Redis、Milvus（含 etcd/MinIO）同机运行；模拟工厂和生产遥测接收端作为外部依赖。连接现有云数据库需要另写覆盖配置，不要直接改为公网裸连接。

## 1. 准备

服务器安装 Docker Engine 和 Compose 插件，拉取 `dev` 分支。在仓库根目录执行以下命令；本文件不负责推送或改写远端分支。

```bash
git checkout dev
git pull --ff-only origin dev
cp .env.production.example .env.production
chmod 600 .env.production
```

填写独立的 MySQL root/应用密码、MinIO 密码、SiliconFlow 密钥、虚拟工厂私网地址及 OTEL 接收端。空必填参数会在 Compose 解析时阻止启动。不要复制 Windows 本地路径，不要提交真实 `.env.production`。

创建入口账号（使用服务器 `htpasswd`，交互输入密码，不将密码放命令行）：

```bash
htpasswd -cB infra/nginx/production.htpasswd operator
chmod 644 infra/nginx/production.htpasswd
```

该文件只含密码哈希，且必须禁止进入 Git。Basic Auth 是入口保护，不替代内部服务的细粒度权限；共享部署仍需要业务鉴权。不要通过公网明文 HTTP 使用账号密码。

## 2. 校验与启动

```bash
docker compose --env-file .env.production -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.production.yml --profile apps config --quiet
docker compose --env-file .env.production -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.production.yml --profile apps up -d --build
docker compose --env-file .env.production -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.production.yml --profile apps ps
```

内部服务、数据库和存储的宿主机端口仅绑定回环地址；应用通过 Compose 服务名互访。不要在阿里云安全组开放 3306、6379、19530、8001、8010、8011、8020、8030、8040、9000、9001、4318。

入口默认 `127.0.0.1:8080`。首次验收可使用 SSH 隧道：

```bash
ssh -L 8080:127.0.0.1:8080 user@server
```

正式访问应由宿主机 HTTPS 反向代理转发至该地址，仅开放 443；证书、域名和 HTTPS 代理不包含在本次配置中。若增加另一容器作为 HTTPS 代理，应与 gateway 使用共享网络，而不是直接将内部端口全部开放。

## 3. 数据和验收

- MySQL、Milvus、MinIO、Redis、etcd、Agent 任务状态和 RAG 语料/Whoosh/离线缓存使用持久卷。
- 空服务器不会自动拥有原电脑的数据库、向量集合、CAD 元数据或 Whoosh 索引。启动容器不等于已迁移知识库。
- 将语料放入 RAG 卷 `/data/rag`，通过容器内 `services/rag-service/ingest.py` 执行预检和入库；先检查模型、维度、目标集合，勿直接删除线上集合。已有数据库按对应工具备份/恢复，注意 MySQL 初始化脚本仅对首次创建的空卷执行。
- 如需运行项目 Alembic 迁移，先备份，再使用相同 Compose 文件及环境执行 `--profile migrate run --rm agent-migrate`；不要在不核对现有 schema 的情况下盲目迁移。
- 检查 RAG `/health` 返回的每个依赖字段。HTTP 200 和容器 healthy 只证明现有探针通过，不证明向量库完整、模型有余额或整个业务闭环成功。
- 检查虚拟工厂可访问、设备编号一致、CAD 元数据可查；停机/恢复命令会产生真实控制请求，验收前应明确模拟环境和操作授权。
- 生产不使用 fake 模型、不允许演示数据回退。模型配置集中在 model-service。

只读检查示例：

```bash
docker compose --env-file .env.production -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.production.yml --profile apps logs --tail=100 agent-service rag-service monitor-web
curl http://127.0.0.1:8020/health
```

## 4. 更新与回滚

更新前记录提交号、备份数据库和持久卷，再 `git pull --ff-only origin dev` 并重复构建启动命令。回滚应使用确认过的旧提交重新构建；数据库迁移需另行确认兼容性，回滚镜像不会回滚数据库。

不要执行 `docker compose down -v`，它会删除持久卷。普通 `down` 不加 `-v`，应用更新通常只需要 `up -d --build`。

本配置尚未在实际阿里云服务器完成镜像构建及闭环验收；服务器资源、镜像仓库访问、域名证书和外部依赖地址需部署时确认。
