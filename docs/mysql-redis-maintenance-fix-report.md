# MySQL / Redis 与维修方案删除修复结果

## 已实现

- 维修方案单条、勾选和批量软删除；前端所有方案来源统一过滤删除标记。
- 删除接口校验服务身份和后端个人会话；批量先验证全部编号，在 MySQL 事务中标记，重复删除保持幂等。
- MySQL 长期 JSON 存储采用分段转义、压缩正文和单独轻量方案投影，列表不解析巨大的工具执行上下文；认领使用重复键排他锁，避免共享锁升级死锁。
- Runtime、审批、报告、学习、安全待办在线使用 MySQL。工单连接按操作关闭，修订号防止覆盖并发更新。
- RAG 正文和分块存独立的 MySQL 在线表，既有 93 份离线文档及 2752 个离线分块保留，避免同名表结构冲突；元数据过滤和限量在 SQL 内执行，Milvus 向量路径不变。
- 登录会话和短期上下文使用 Redis TTL；审批、控制认领等安全状态不能随缓存过期丢失。
- 在线禁止 SQLite / 内存降级；旧 SQLite 只保留隔离测试和只读迁移，原始文件不删除。
- 启动默认值、RAG 共享模块 Docker 构建复制和依赖补齐；模型供应商、机床控制行为不变。

## 关键文件

`shared/persistence.py`、`shared/temporary_cache.py`、`shared/document_store.py`；Agent runtime / report / safety / workorder / maintenance API；Backend workorder / team；RAG api/documents.py；前端 App.jsx、maintenanceWorkspace.mjs、workbench.css；scripts/start_all.py；scripts/migrate_sqlite_storage.py。

源码备份在 `.runtime/backups/20261006-mysql-redis-maintenance/`，恢复方法见该目录 `RESTORE.md`；两个前端测试文件在首次新增测试后才补做备份，其余既有源码修改前备份。根目录 `.env` 未复制、未输出、未改写（最后修改时间仍为 2026-09-28 11:45:33），生产配置未修改。

## 当前验证记录

以下为最终源码上已实际执行的结果。各服务在独立测试进程中导入；数据库测试使用随机新 MySQL 测试库与 Redis 键，不使用真实设备或收费模型。

| 验证 | 结果 |
| --- | --- |
| Agent 全量 `pytest -c pytest-agent.ini -q --tb=short` | 758 通过，0 失败，0 跳过；156.32 秒 |
| Backend `pytest -c pytest-backend.ini -q --tb=short` | 59 通过，0 失败，0 跳过 |
| RAG `pytest -c pytest-rag.ini -q --tb=short` | 94 通过，0 失败，0 跳过 |
| CAD `pytest -c pytest-cad.ini -q --tb=short` | 32 通过，0 失败，0 跳过 |
| Model `pytest -c pytest-model.ini -q --tb=short` | 17 通过，0 失败，0 跳过 |
| MySQL/Redis + 删除 + 启动 + Compose + 跨服务契约组合 | 48 通过，0 失败，0 跳过；95.40 秒 |
| 前端所有 `src/**/*.test.mjs` | 67 通过，0 失败，0 跳过 |
| Vite 正常构建 | 成功；已有单包体积超过 500KB 的警告，不降低门槛掩盖 |
| Chrome / Playwright 实际页面点击与隔离真实 FastAPI | 单条删除、批量删除、刷新、加载/失败不复活、实际门禁文本、原始记录保留通过；页面异常 0 |
| 当前 8001 页面只读验证 | 51 个方案、51 个单条删除按钮；未登录按钮禁用；页面异常 0 |

实际执行的测试命令（从项目根目录运行；下面前端命令进入前端目录）：

```powershell
$env:PYTHONUTF8 = '1'
L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q --tb=short
L:/anaconda/python.exe -m pytest -c pytest-backend.ini -q --tb=short
L:/anaconda/python.exe -m pytest -c pytest-rag.ini -q --tb=short
L:/anaconda/python.exe -m pytest -c pytest-cad.ini -q --tb=short
L:/anaconda/python.exe -m pytest -c pytest-model.ini -q --tb=short
L:/anaconda/python.exe -m pytest -c pytest-agent.ini tests/integration/test_mysql_redis_storage.py services/agent-service/tests/test_maintenance_plan_deletion.py services/agent-service/tests/test_storage_startup_environment.py tests/integration/test_compose_environment_contract.py tests/integration/test_runtime_rag_cad_contract.py tests/integration/test_virtual_line_team_contract.py -q --tb=short

Set-Location L:/industry_agent/frontend/monitor-react
$testFiles = @(rg --files src | Where-Object { $_.EndsWith('.test.mjs') })
& L:/nodejs/node.exe --test @testFiles
& L:/nodejs/node.exe node_modules/vite/bin/vite.js build
```

浏览器验证使用 `tests/integration/maintenance_browser_server.py` 启动隔离真实 FastAPI，并执行 `node tests/maintenanceDelete.browser.mjs http://127.0.0.1:<隔离端口>`；随机端口由夹具提供，不是生产 8001。夹具的 3 个方案全部软删除后刷新为 0，原始 3 条运行记录仍存在。随后另用 Chrome 对当前 8001 页面只读验证，不删除用户方案。以上测试组有重复覆盖，不将通过数相加当作独立用例总数。

红测真实复现缺少 MySQL 存储、TTL、删除 API/UI、并发覆盖、迁移和启动导入路径，以及离线表冲突、语料别名重复迁移、未知内部身份混用、首屏快照复活、认领死锁和巨型字符串编码额外内存。修复后未删除失败测试或降低校验标准。首屏必须等待删除集合的行为改变后，既有“已加载页面”的 SSR 断言移入真实浏览器验证；SSR 保留加载期间不能判断不存在、不能冒出已删方案等断言。旧事件修订测试现在显式使用 `APP_ENV=testing`，生产鉴权测试仍对实际请求启用生产规则；Windows 隔离子进程明确 UTF-8，不扩大跳过范围。

中途 Agent 回归一轮为 747 通过 / 8 失败，原因是旧测试未显式隔离存储及 Windows 子进程编码，修正测试环境后最终 758 项通过。中途一轮真实 MySQL 并发组合测试出现 1 失败 / 37 通过，确认错误码 1213 后修复锁升级；新增压力测试时误放的结果断言造成一次 NameError，已恢复到其所属原测试，原断言未删。最终组合 48 项全部通过。RAG 全量测试最后一轮中，超时边界夹具的服务端出现 Windows 10053 断连输出，但 94 项断言通过；这是隔离测试客户端取消连接，未使用真实模型或设备。

按 Superpowers 流程完成一次最终独立只读审阅及一次集中修复：在线/离线 RAG 同名表冲突、语料别名重跑冲突、自动生成内部身份却复用旧服务三个重要问题，以及首屏删除标记未知时显示旧快照的问题均已修复，并保留对应回归测试。

早期红测的 pytest 默认 fixture 展示曾展开数据库连接参数；随后立即改为脱敏配置表示和错误码，不在源码、备份或报告复制凭据。如早期输出会被共享，建议轮换曾显示的数据库密码。模型密钥没有输出。

## 旧数据清点与迁移

只读清点：事件库 79 条运行记录（51 个方案）；Backend 298 条记录（59 工单、236 业务记录、1 账号、1 会话、1 账本）；Agent 旧工单库 39 条；学习库 10 条；安全待办 0 条；RAG 文档 211 条。源库均不删除。

只读目标预检：事件、Backend、旧工单、学习库没有发现目标 MySQL 同键记录冲突。预检不是生产验收，也不是已经迁移成功。

本地切换前统一停止应用，虚拟工厂 4529 和基础设施未停止。一致性备份在 `.runtime/backups/20261006-storage-switch/` 及 `.runtime/backups/20261006-old-workorders-archive/`。已实际迁移 Backend 298 条、学习 10 条、旧工单归档 39 条；安全待办和审批源库均为空。

RAG 210 份业务文档已迁移。另 1 条 DOC-2 经内容、语料与设备号严格核对，是本次最早隔离配置未完善时自建的测试夹具；实际迁移显式排除，旧库仍完整保留。测试已改为随机新数据库，不再写入原文档库。

事件备份为 4,643,557,376 字节，最大单条原文为 666,017,566 字节（654,182,156 个字符）。首次迁移在 77 条处中断；整条 JSON 展开会导致过高内存，因此停止本轮迁移进程，在一致性备份上恢复。大记录通过 SQLite 只读 `blobopen` 每块 65,536 字节直接压缩，不再展开全部上下文；普通在线 JSON 使用分段字符串转义。

最大记录压缩为 66,433,861 字节。第一次普通文本 SQL 参数写入因转义膨胀超过本机 67,108,864 字节限制，出现连接错误；已改为二进制预编译参数，并防止清理时的二次回滚异常掩盖原脱敏错误。未修改 MySQL 服务参数或根 `.env`。最后从一致性备份仅补入缺少的 2 条，未重跑业务动作、未覆盖已有不同数据。

最终 MySQL 保留全部 **79 条事件及 51 个方案**。对每条旧事件流式计算相同 zlib 压缩正文的 SHA-256，与 MySQL `SHA2(payload,256)` 核对：检查 79、匹配 79、缺失 0、差异 0。列表通过轻量投影读取，不展开巨大日志。

实际迁移命令包括：

```powershell
L:/anaconda/python.exe -u scripts/migrate_sqlite_storage.py --apply --backup-dir .runtime/backups/20261006-storage-switch --source .runtime/backend.sqlite3 --source .runtime/events.sqlite3 --source .runtime/learning.sqlite3 --source .runtime/line_safety.sqlite3 --source runtime_pending_tasks.sqlite3 --source services/rag-service/data/rag_documents.sqlite3 --exclude-document-id DOC-2
L:/anaconda/python.exe -u scripts/migrate_sqlite_storage.py --apply --backup-dir .runtime/backups/20261006-storage-switch --source .runtime/learning.sqlite3 --source .runtime/line_safety.sqlite3 --source runtime_pending_tasks.sqlite3 --source services/rag-service/data/rag_documents.sqlite3 --exclude-document-id DOC-2
L:/anaconda/python.exe -u scripts/migrate_sqlite_storage.py --apply --archive-workorders --backup-dir .runtime/backups/20261006-old-workorders-archive --source .runtime/workorders.sqlite3
```

第一条命令中断后，第二条完成后段迁移；剩余事件通过受限内联 Python 调用实际迁移函数 `_runtime_record` 和实际 MySQL 存储，仅处理目标缺键记录。最终另执行只读流式摘要核对，而不是声称首次完整迁移成功。已迁移巨大库的检查应使用有界摘要核对，避免再次全量展开 JSON。

最终只读清点：权威工单 59、业务记录 236、账号 1、产线账本 1；在线 RAG 文档/分块各 210；离线原表文档 93、分块 2752；事件 79、方案投影 51、删除标记 0；旧工单归档 39、学习命名空间各 5。旧会话已按剩余有效期迁移 Redis，不再作为长期 MySQL 会话使用。

## 本地启用结果

迁移核对后使用 `scripts/start_all.py` 统一启动当前源码，启动日志为 `.runtime/storage-switch-20261006-153636.out.log` 和对应 `.err.log`。Agent 8010、RAG 8020、Backend 8030、Model 8040、CAD 8050 的 `/health` 均 HTTP 200；Monitor 8001 的首页与 `/api/monitor/snapshot` 均 HTTP 200（Monitor 没有独立 `/health`）。Backend 报告 `MySQLRepository` 且就绪，CAD 就绪。模拟工厂 4529 与已有基础设施一直保留。

Model 的 HTTP 200 不代表模型能力已经探测：聊天、向量、重排、视觉配置均完整，能力仍为 `not_probed`，因此汇总 `ready=false`。本轮没有为健康检查调用收费生成接口，也没有更改已选供应商。

Monitor 代理 `/api/maintenance/plans` 返回 51 个方案，历史状态 `ready`、存储 `mysql`。当前页面截图在 `.runtime/maintenance-mysql-redis-live.png`；登录维修小组后可删除，匿名按钮禁用。未在真实账号上删除任何用户方案。

## 验证边界与未执行项

- 未调用真实机器控制、未调用收费模型、未重建 Milvus 索引。
- 浏览器自动化已运行，但未在真实账号上删除用户的方案；删除业务使用隔离真实 API 验证。
- 工程文件仍存原文件目录，未将 PDF/STEP/STL 二进制放入临时 Redis 或 Milvus。

本轮范围已完成；已有 Monitor 代理支持 DELETE 和维修接口白名单，无需无意义改动。模型、生产下发及其他历史功能不属于本轮验收；真实业务适配器、设备恢复阈值与生产验收仍需对应环境确认，不能把本地测试通过写成生产验收通过。

恢复、配置和迁移操作见 `docs/mysql-redis-maintenance-storage.md` 及源码备份目录的 `RESTORE.md`。恢复前停止本地应用并保存切换后 MySQL 增量，按文件恢复，不覆盖其他已有修改，不删除新数据。生产模式仍要求显式内部身份，本任务不猜测工业设备合格阈值。
