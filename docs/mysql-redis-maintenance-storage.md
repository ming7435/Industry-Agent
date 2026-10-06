# 维修方案删除与 MySQL / Redis 存储

## 页面操作

登录维修小组后进入“维修方案”。每条方案旁有“删除此方案”，也可以勾选方案后点击“删除选中方案”。每批最多 100 条，操作前有确认提示。

这里的删除是**软删除**：列表不再展示该方案；原始诊断、维修证据、执行日志、幂等记录、关联工单不删除。重复操作不会重复变更审计人和删除时间。监控快照、工单快照中的同一方案也不再重新显示。

接口保留服务令牌检查和后端个人会话校验。客户端不能通过 `actor_id`、`approved` 等参数伪造身份。

## 存储分工

| 数据 | 在线存储 |
| --- | --- |
| 运行结果、审批、学习结果、控制命令认领、安全待办 | MySQL `runtime_records_mysql` / `runtime_claims_mysql` |
| 维修方案列表投影、删除时间和操作人 | MySQL `maintenance_plan_projection` / `maintenance_plan_deletions` |
| 工单、质检、报告、账号和产线账本 | 既有 MySQL 业务表；本地报告适配器使用 MySQL JSON 命名空间 |
| 在线文档正文、元数据和分块 | MySQL `rag_online_documents` / `rag_online_chunks`；离线既有 `rag_documents` / `rag_chunks` 保持原结构 |
| 登录会话、近期上下文 | Redis，分别按会话剩余时长、`SHORT_MEMORY_TTL_SECONDS` 过期 |
| 向量 | 现有 Milvus，模型和索引不改变 |
| PDF、STEP、STL、原始上传文件和检索索引文件 | 现有文件目录；它们不是 SQLite 数据库，不转为 Redis 临时对象 |

在线构造器不使用 SQLite，也不在 MySQL 不可用时暗中回退。SQLite 适配器只保留在显式 `APP_ENV=testing` 的隔离测试，以及旧数据只读迁移中。内存中的计算变量、锁、客户端连接对象不是持久化数据库。

业务幂等和审批不能放进会过期的 Redis：Redis 丢失或过期不能授权再次派工、恢复审批或重复执行控制命令。耗时模型/设备调用在数据库事务外执行；不确定写操作必须对账，不能盲目重试。

## 配置

根目录 `.env` 仍是唯一配置文件。填写已有 MySQL 连接项，并配置：

```dotenv
BACKEND_STORAGE=mysql
WORKORDER_BACKEND=mysql
REDIS_URL=redis://127.0.0.1:6379/0
SHORT_MEMORY_TTL_SECONDS=3600
```

`MYSQL_HOST`、`MYSQL_USER`、`MYSQL_DATABASE` 必须明确存在；密码继续使用现有配置，不在文档中复制。旧 `EVENT_STORE_PATH`、`WORKORDER_STORE_PATH` 等文件路径在线不再启用 SQLite，不用删除原文件。

本地 `scripts/start_all.py` 默认补齐 MySQL / Redis 配置和共享模块导入路径。开发环境未配置内部令牌时，启动器只在进程环境中创建一个共享的随机内部身份，不写回 `.env`，不输出令牌；生产模式仍必须显式配置 `BACKEND_INTERNAL_TOKEN`。

自动生成内部身份时，启动器拒绝复用身份未知的旧服务，必须先统一停止本地应用。这样避免新 Agent 和旧 Backend 使用不同令牌。模拟工厂与数据库不需要停止。

## 迁移与恢复

迁移工具是 `scripts/migrate_sqlite_storage.py`。默认不写入，先逐文件清点，再只读检查目标冲突。示例（在项目根目录运行）：

```powershell
L:/anaconda/python.exe scripts/migrate_sqlite_storage.py --source .runtime/events.sqlite3 --source .runtime/backend.sqlite3
L:/anaconda/python.exe scripts/migrate_sqlite_storage.py --check-target --source .runtime/backend.sqlite3
```

实际迁移前停止本地应用写入，保留 MySQL / Redis / Milvus。显式指定 `--apply` 才写入；每个源库先通过 SQLite 在线备份接口保存一致性副本，源文件本身只读。

```powershell
L:/anaconda/python.exe scripts/migrate_sqlite_storage.py --apply --backup-dir .runtime/backups/storage-migration --source .runtime/events.sqlite3 --source .runtime/backend.sqlite3
```

可以再指定学习、安全待办、审批、报告和 RAG 文档库。不能证明已完成的旧认领迁移为“不确定”，不会因迁移重跑业务。逐条提交支持中断后恢复；相同记录跳过，不同记录冲突时停止，已迁移数据与原库都保留。

禁止在应用仍写入时把多个旧库当作同一个最新工单真相。运行中 Backend 使用的工单库为权威来源，旧 Agent 本地工单库需要保留为归档或逐条确认，不能覆盖较新的状态。

旧 Agent 工单可以用 `--archive-workorders` 导入 MySQL 的 `legacy_workorder_archive` 命名空间，不进入权威工单列表。`--exclude-document-id` 仅用于已经核实归属的测试文档，源文件仍完整保留，不用于随意丢弃无法解析的数据。在线与离线 RAG 表互不覆盖；语料别名规范化由写入和迁移对账共用，允许原样重跑。

普通记录压缩采用 JSON 片段流式编码。巨大旧日志先验证 JSON 有效性，再通过只读 `blobopen` 分块读取原文字节、直接压缩，保留原始正文，不展开多份上下文。MySQL 使用二进制预编译参数，避免文本 SQL 转义导致包体膨胀，不需要修改数据库服务的包体参数。同源重复导入优先比较压缩字节；不同内容仍拒绝覆盖。已迁移巨大库使用流式摘要核对，不建议对全部大型正文运行展开式目标预检。

本次本地迁移已保留 79 条事件、51 个方案、59 个权威工单及 210 份在线 RAG 文档；79 条事件的压缩正文摘要全部与一致性备份匹配。旧 Agent 的 39 条工单仅归档，不覆盖权威工单；原有离线 RAG 文档与分块不变。应用已在迁移核对后统一启动。具体过程与验证边界见修复报告。

源码备份：`.runtime/backups/20261006-mysql-redis-maintenance/`，按原相对路径镜像保存。停止服务后将所需文件从备份复制回原路径，再重新构建前端。原库未删除，数据回滚可以重用迁移前源库；回滚前先保存切换后 MySQL 中新增的业务记录，不能直接覆盖。

## 验证边界

隔离测试使用随机新 MySQL 测试库、随机 Redis 键和临时 SQLite 源库；不删除数据库、不调用真实设备、不调用收费模型。测试通过只代表本地行为验证，不代表工业设备生产验收。具体测试结果与本地激活情况记录在 `docs/mysql-redis-maintenance-fix-report.md`。
