# RabbitMQ 设备任务调度实施与验证报告

日期：2026-10-16。范围：当前本地项目的故障事件调度；不是重新实现 Agent Loop 或 Skill 优化循环。

## 1. 实际实现

```text
Monitor 确认异常
  ├─ 原有独立产线停机通道（保留，不等待诊断或 RabbitMQ）
  └─ POST /api/v1/agent/event
       → MySQL 任务与发件箱同时入库
       → HTTP 202，页面显示“排队等待诊断”
       → 发布确认 → RabbitMQ 持久分区队列
       → 单活消费者、prefetch=1
       → 有界业务 Worker
       → 原 EventResultStore → 原 Agent Runtime / 节点 / Skill / Tool
       → 原 MySQL 诊断、维修方案、工单、报告结果
       → 原 Redis 阶段进度及只读结果回查
       → 结果提交后确认消息
```

默认 16 个固定哈希分区、4 个业务执行线程。每个分区有独立 RabbitMQ I/O 消费线程，长诊断不阻断心跳；不是同时发出 16 次模型请求。

同设备的前序未结束任务由 MySQL 短事务再次核对，不能只依赖队列的投递顺序。同设备任务在原任务结果未知时继续等待，不重放外部写入。其他分区继续工作。

对当前虚拟工厂进行了只读设备目录检查，四台设备分别映射到分区 8、1、14、12，可以并行。新增设备若哈希到同一分区，会额外串行，不影响正确性，但可能降低并行度。已有任务不能直接修改分区数或队列前缀，代码会拒绝不兼容设置。

Worker 是当前 Agent 应用内的消费者线程与业务线程池，不新增第六个业务服务，也不新增一个 Agent Loop。每个 Agent 进程默认最多执行 4 个任务；多实例时的总并发是各实例上限之和，不能把这个参数解释为跨所有实例的全局限额。

## 2. 幂等、不确定状态与异常处理

- 任务编号来自租户、设备、事件编号、事件修订的稳定摘要；同一修订再次提交返回同一任务。
- 完整业务参数另存指纹。同修订改变参数返回 409；新修订是新任务，仍走原审批规则。
- 开启消息队列前已保存的作用域结果和恢复断点，也参与参数指纹校验；消费者只读对账同样校验指纹，不能借用其他参数的旧结果。
- 任务表的待发送标记就是事务发件箱：入库和待发送状态在同一 MySQL 事务中，不存在先落业务任务、再单独创建发件箱的双写缺口。
- Publisher Confirm、持久消息、durable/quorum 队列、mandatory 路由检查；确认发布后才标记已发送。发布确认后的进程退出可能带来重复投递，由数据库认领与原事件结果幂等处理。
- 消息仅携带任务编号，业务参数从 MySQL 读取。消息不能附带审批通过声明或覆盖设备参数。
- 业务开始后异常或超时，记录 `unknown`，不自动重跑。旧执行线程可能仍在工作，不能因等待超时就放行同设备的下一条任务。
- 原事件的明确最终结果晚到时，只读对账解除对应阻塞。对账使用顺序游标轮转，超过 100 条未决任务时后续记录也能被检查。
- 执行前的存储故障允许消息有限重投，间隔 5 秒，队列 delivery-limit=5；超限进入死信。死信原因归入原任务并留审计记录，不再显示无限排队。
- 消息连接/发布故障按有上限的退避间隔重新连接，发件箱保留；不会转成内存执行，也不重新运行有副作用的业务。
- RabbitMQ、MySQL 或 Redis 不可用，不伪造诊断、合格、派发或复机成功。
- RabbitMQ 是至少一次投递，不承诺消息层“恰好一次”。最终副作用仍依赖现有 Backend 幂等、审批、状态迁移与对账。
- 任务表 `succeeded` 只表示已取得并保存该次执行结果，不代表诊断高置信度、工单已派出或设备已修好；这些业务结论仍读取原结果和门禁。

## 3. 修改文件

| 文件 | 行为 |
| --- | --- |
| `services/agent-service/app/runtime/event_jobs.py`（新增） | MySQL 任务、设备短事务认领、发件箱、参数冲突、死信状态、轮转对账 |
| `services/agent-service/app/runtime/event_queue.py`（新增） | Pika 发布确认、分区单活消费者、I/O 与业务线程分离、重投与对账、只读状态 |
| `services/agent-service/app/runtime/event_store.py` | 既有结果只读查询可附加参数指纹校验，默认读取行为保持兼容 |
| `services/agent-service/app/api/server.py` | 故障事件异步接收、精确结果回查、复用原事件执行函数、队列生命周期及鉴权 |
| `services/agent-service/monitor_web_server.py` | 并行提交/回查，正确处理 202，保留已完成诊断，未知结果不重投事件 |
| `services/agent-service/requirements.txt` | 增加固定依赖 `pika==1.3.2` |
| `scripts/start_all.py` | 正常启动默认 RabbitMQ、16 分区、4 个业务 Worker |
| `infra/docker/docker-compose.yml` | 增加 RabbitMQ、回环端口、持久卷、健康依赖；未改生产覆盖文件 |
| `frontend/monitor-react/src/app/diagnosisView.mjs` | “排队等待诊断”中文状态，不冒充诊断完成 |
| `frontend/monitor/` | 从当前 React 源码重新构建，未手工修改打包 assets |

新增测试：`queue_test_support.py`、`test_event_jobs.py`、`test_event_queue.py`、`test_event_queue_api.py`、`test_event_queue_configuration.py`、`test_event_queue_live.py`。补充原诊断回查测试与前端状态测试。

队列操作也写入现有 TraceRecorder：`event_queued`、`event_published`、`event_worker_started`、`event_waiting_predecessor`、`event_worker_completed`、`event_outcome_unknown`、`event_reconciled`、`event_dead_lettered`。记录任务编号、事件、设备、分区，不记录 RabbitMQ URL、口令或完整事件正文。

## 4. 测试环境与实际执行

测试仅使用临时 MySQL 数据库、独立 RabbitMQ 容器/虚拟主机以及测试业务适配器。没有调用收费模型，没有提交真实工单，没有控制现有虚拟工厂或真实设备。

MySQL 测试显式注入 `QUEUE_TEST_MYSQL_CONFIG`，连接配置只保留在测试进程内。测试创建 `queue_test_<随机编号>` 数据库，退出时仅清理本次测试创建的库；不会删除业务库。未显式注入时这些测试明确跳过，不隐式连接业务 MySQL。

RabbitMQ 测试显式注入 `QUEUE_TEST_RABBITMQ_URL`；没有该变量时真实消息服务测试明确跳过。初始拉取官方镜像遇到 Docker Hub TLS 和 referrers 错误，最终读取同一官方镜像的 Linux/amd64 清单后按该镜像摘要成功拉取；未下载或覆盖任何远程项目源码。

### 已执行的验证

| 范围 | 实际结果 |
| --- | --- |
| 初轮针对性（任务、消费者、API、回查、审批与监控） | 62 通过，0 失败，0 跳过 |
| 独立真实 RabbitMQ + MySQL 联调 | 4 通过，0 失败，0 跳过 |
| 审查新增复现及真实消息回归 | 6 通过，0 失败，0 跳过；两项问题均先复现失败再修复 |
| 完整 Agent 初轮 | 2733 通过，1 失败，3 跳过 |
| 完整 Agent 修复后最终回归 | 2739 通过，1 项同样的既有版本断言失败，3 跳过；耗时 1:34:24，无新增失败 |
| 完整 Backend | 468 通过，0 失败，1 跳过 |
| 跨服务/启动契约 | 10 通过，0 失败，0 跳过 |
| 全部前端源码单元测试 | 296 通过，0 失败，0 跳过 |
| 诊断/页面读取延迟/工单加载浏览器测试 | 17 通过，0 失败，0 跳过 |
| React/Vite 构建 | 成功；既有 OrbitControls 大包警告仍在，未提高阈值隐藏 |
| `docker compose ... config --quiet` | 使用隔离占位凭据验证通过，未启动业务容器 |
| `git diff --check` | 通过 |

初轮 Agent 的失败是已有 `test_each_document_loads_without_changing_runtime_contract[diagnosis-alarm_diagnosis_skill]`：当前 Skill 版本 1.1，历史预期 1.0。本次未改动该 Skill、未回退版本、未修改断言或删除失败测试。

真实消息联调覆盖：不同设备并行/同设备 FIFO、已发布未标记导致的重复发布不重复执行、孤儿认领不重跑，以及真实 API → MySQL 发件箱 → RabbitMQ → Worker → 原结果仓库 → GET 回查。

主要命令（在 `L:/industry_agent` 执行，各 Python 服务独立进程导入自己的 `app`）：

```powershell
# MySQL/RabbitMQ 测试先显式注入上述隔离测试变量，不打印变量值。
$env:PYTHONPATH='L:/industry_agent;L:/industry_agent/services/agent-service'
& L:/anaconda/python.exe -m pytest services/agent-service/tests -q --tb=short

$env:PYTHONPATH='L:/industry_agent;L:/industry_agent/services/backend-service'
& L:/anaconda/python.exe -m pytest services/backend-service/tests -q --tb=short

$env:PYTHONPATH='L:/industry_agent'
& L:/anaconda/python.exe -m pytest tests/integration/test_compose_environment_contract.py tests/integration/test_runtime_rag_cad_contract.py tests/integration/test_virtual_line_team_contract.py tests/integration/test_monitor_container_layout.py -q --tb=short

$taskUnitFiles = @(rg --files frontend/monitor-react/src -g '*.test.mjs')
& L:/nodejs/node.exe --test --test-reporter=spec @taskUnitFiles
& L:/nodejs/node.exe --test tests/browser/diagnosis-status.test.mjs tests/browser/page-read-latency.test.mjs tests/browser/workorder-loading.test.mjs

# 在 frontend/monitor-react 目录：
& L:/nodejs/node.exe node_modules/vite/bin/vite.js build
```

浏览器验证使用现有 Playwright 与 Chrome 路径，通过隔离 API 适配器加载实际 React 页面，不修改被测页面函数。完整执行输出在 `.runtime/verification/rabbitmq-*-20261016.log`。

独立审查的两个 Important 问题已做 RED→GREEN 修复：旧结果参数指纹校验、超过 100 条未知任务的对账公平性。没有遗留的 Minor 审查项。

最终全量回归已包括新增的真实消息联调及审查复现用例；其余 3 项跳过为原有 Windows 符号链接与显式 FreeCAD 验收项目。新队列测试没有以跳过规避外部依赖：本次实际提供了隔离 MySQL 和 RabbitMQ 并执行通过。

## 5. 启用与配置

本次未改 `.env` 或 `docker-compose.production.yml`，未重载现有业务应用。代码和构建产物已落地，但不能把隔离联调通过写成当前运行中的业务服务已经切换。

需要为项目的正常 RabbitMQ 配置专用账户和连接 URL，密码在 URL 中必须编码；不要复用测试容器或把测试地址当作长期服务。

```dotenv
AGENT_EVENT_TRANSPORT=rabbitmq
AGENT_EVENT_PARTITIONS=16
AGENT_EVENT_WORKERS=4
AGENT_EVENT_QUEUE_PREFIX=industry.agent.events
AGENT_EVENT_QUEUE_POLL_SECONDS=1
MONITOR_EVENT_WATCHERS=16
RABBITMQ_URL=amqp://<专用账户>:<URL编码后的密码>@127.0.0.1:5672/%2F
```

Compose 本地 RabbitMQ 还使用 `RABBITMQ_USER` 和 `RABBITMQ_PASSWORD`；当前模板明确要求配置密码，不会生成或显示账户凭据。运行整个容器化应用时，Agent 容器的 URL 主机必须是 `rabbitmq`，不能是容器内的 `127.0.0.1`。

仅启动 RabbitMQ 的命令（在配置好凭据后由操作人执行；本次未执行）：

```powershell
docker compose -f infra/docker/docker-compose.yml up -d rabbitmq
```

然后在确认可以短暂中断请求后，按现有统一启动方式重载应用。不要单独混用不同 supervisor 生成的内部令牌。正常启动将走 RabbitMQ；显式开发兼容可以用 `AGENT_EVENT_TRANSPORT=inline`，生产模式拒绝 inline 和 guest 账户。

携带现有服务令牌访问 `GET /api/v1/runtime/event-queue`，可核对 publisher、连接分区、业务 Worker 数及 queued/running/unknown/failed/succeeded 计数。`/health` 仍代表应用 HTTP/Runtime 可服务，队列是否就绪应以专门队列状态中的 `ready` 为准；二者不能混为一谈。

## 6. 数据迁移与恢复

- 新增表：`agent_event_jobs`、`agent_event_devices`、`agent_event_queue_meta`，只做 `CREATE TABLE IF NOT EXISTS`，不删除或重写现有业务表。
- 旧事件结果、维修方案、工单、报告仍使用原存储，不批量重投历史事件，不把历史失败任务自动恢复执行。
- 已存参数不同的事件返回冲突，必须核对原事件及审批；不能通过换一个随机编号规避。
- 第一次启用前，使用现有安全凭据方式备份业务数据库；已启用后备份新任务表和 RabbitMQ 数据卷，保留两者一致的停写时间点。
- 代码备份：`.local-backups/rabbitmq-workers-20261016-v1/`，按相同相对路径恢复已有源码与前端构建即可；未复制任何 `.env` 或密钥。新增模块可保留为未引用文件，不需要破坏性清理。
- Vite 构建按源码替换了 4 个旧哈希 JavaScript 包，生成对应新包；原包及入口文件可从该备份恢复，没有删除零件图纸或业务源文件。
- 恢复旧运行方式前先停止接收新事件，等待正在运行的业务结束并核对 unknown 任务，然后由操作人恢复旧源码/构建和原启动方式。不要带着未决写操作直接启动另一套执行器。
- 不删除新任务表、历史回执或 RabbitMQ 数据卷；它们是重复防护与未决对账依据。

## 7. 未执行与验收边界

- 未重启或部署现有业务应用，未向现有业务环境创建故障事件/工单。
- 未进行收费模型调用、真实 PLC、真实机床或实际产线动作验收；维修阈值和复机标准未猜测或放宽。
- 没有声称单节点 quorum 队列具有多节点高可用；本次未验证多节点网络分区、灾难恢复或生产 broker 策略。
- 队列本身不缩短模型推理耗时，不保证模型回答正确，也不等于页面所有慢查询已消失。页面仍只读取已保存结果，原缓存/列表详情分离机制保留。
- 原有产线停止/复机和审批门禁继续生效。严重故障仍按用户既定要求先审批；没有以新增 Worker 绕过审批。
- 联调完成后只清理本次 `industry-agent-queue-test-20261016` 隔离容器及临时测试库，不删除现有业务库或既有数据卷；测试数据不作为业务历史保留。

## 8. 用户授权后的实际启动验证

2026-10-16，用户随后要求“启动服务试一试”，已实际启动本地应用，本节更新前文实施时“尚未切换”的状态。

- 已创建正常使用的持久化 RabbitMQ 容器 `industry-agent-infra-rabbitmq-1`，只绑定回环地址的 5672/15672 端口，数据存于新建 RabbitMQ 专用卷。未重启或覆盖原 MySQL、Redis、Milvus 或虚拟工厂。
- 本地 RabbitMQ 专用随机凭据仅通过进程环境与 Docker 容器配置保存/复用，不输出、不写入 `.env` 或生产覆盖文件。以后应复用当前容器及凭据，不应重新生成密码覆盖已有数据卷。
- 通过统一启动器拉起 Model、Backend、RAG、Document-CAD、Agent、CAD 文档后台任务及 Monitor 网页，共享同一次生成的内部鉴权身份。
- 网页 `http://127.0.0.1:8001/` 与五服务健康接口均返回 HTTP 200。队列接口实际返回 `ready=true`、`publisher_ready=true`、16 个连接分区、4 个业务 Worker，已切换为 RabbitMQ。
- FreeCAD 原进程标记指向已被系统复用的 PID，未结束该无关进程。确认没有现存 FreeCAD 进程及 9875 监听后，将旧标记归档到本次日志目录并重新启动；最终 `running=true`、`rpc_ready=true`。
- 新建隔离测试虚拟主机和临时 MySQL，再次执行 `test_event_queue_live.py`：4 通过，0 失败，0 跳过。验证后仅删除本次测试虚拟主机与临时库，正常业务队列与新 RabbitMQ 持久卷保留。未向业务队列投递合成故障，也未调用真实设备或收费模型。
- Model 的聊天、向量、重排和视觉配置均完整，健康接口中的可达状态是 `not_probed`；没有把“未进行付费探测”解释为已确认可达或服务故障。

本次启动日志：`.runtime/startup-rabbitmq-20261016/stdout.log`、`stderr.log`；隔离消息验证：`smoke.log`。活动日志目录标记已更新。

本次本地启动辅助为 `.runtime/verification/start-rabbitmq-session-20261016.py`，会在内存中复用现有本地 RabbitMQ 容器凭据，再调用原 `scripts/start_all.py`。根配置尚无 RabbitMQ URL 时，不要绕过此辅助入口单独启动第二套应用；它会造成内部身份不一致。这个辅助只用于 development，不用于生产部署。
