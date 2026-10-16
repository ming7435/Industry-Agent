# RabbitMQ 设备串行 Worker 实施计划

> 执行方式：当前本地目录内连续实施，使用 writing-plans、executing-plans、test-driven-development 和 verification-before-completion；遵照用户要求不新建工作树、不要求 Git、不逐文件请求确认。

**目标：** 将设备故障任务可靠交给 RabbitMQ，多消费者并行处理不同设备，同设备按入库顺序执行，重复投递不重复运行 Agent 或创建工单。

**架构：** MySQL 任务表同时作为事务发件箱，RabbitMQ 只传任务编号。消费者复用当前事件结果幂等边界和 Agent Runtime。设备哈希分区、单活消费者及数据库设备前序检查共同保证串行；长诊断不占数据库事务或 RabbitMQ 心跳线程。

**技术：** Python、FastAPI、MySQL/InnoDB、RabbitMQ、Pika；现有 Redis 阶段进度缓存。

**依据：** 本会话已确认的 RabbitMQ + 多消费者 Worker + 设备级串行约束 + 事件幂等方案，以及现有 monitor_web_server.py → /api/v1/agent/event → EventResultStore → Agent Runtime 调用链。

## 全局约束

- 修改前备份至 `.local-backups/rabbitmq-workers-20261016-v1/`；不备份或输出密钥，不修改 `.env`、生产覆盖配置或既有业务数据。
- 不重写 Agent Loop、Skill Loop、审批与验收规则，不调用真实设备或收费模型，不自动重启业务服务。
- 原设备停止独立通道保持不变；恢复仍由维修人员确认并通过产线统一门禁。
- 有副作用的执行一旦开始，异常、进程退出或超时必须先核对，不自动重跑；只允许尚未执行的消息重新投递。
- 无 RabbitMQ/MySQL 时明确不可用或等待投递，不静默降级为不持久化线程执行。
- 在线只使用 MySQL；隔离测试可使用明确注入的临时数据库；不删除已有表、数据卷或数据。

## 审查重点

1. 发布已确认但发件箱提交丢失：重复消息只能使用原任务结果。
2. 同设备前一任务不确定、其他设备正常：前者后续任务阻塞，后者仍能执行。
3. 同事件修订参数改变：拒绝复用编号，不沿用原审批。
4. 长模型调用期间消费连接断开：心跳继续，不能产生第二次执行。
5. 页面刷新和结果查询：只读，不投递、不清空已保存业务结果。

## Task 1：持久化任务与事务发件箱

文件：新增 `app/runtime/event_jobs.py`、`tests/test_event_jobs.py`（均在 Agent 服务内）。

- [ ] 先写测试并看到失败：重启重读、并发重复提交、参数冲突、同设备先后顺序、不同设备不阻塞、未知状态禁止重跑。
- [ ] 实现 `MySQLEventJobs.submit(event)`、`get(job_id)`、`pending(limit)`、`published(job_id)`、`claim(job_id, owner)`、`finish(job_id, owner, status)`、`defer(job_id)`；所有 SQL 参数化，事务只包本地状态操作。
- [ ] 真实临时 MySQL 验证；若权限不可用，记录并继续其他隔离测试，不冒充已验证。

## Task 2：RabbitMQ 传输与消费者

文件：新增 `app/runtime/event_queue.py`、`tests/test_event_queue.py`，修改 Agent requirements。

- [ ] 先写测试并看到失败：发布失败保留待发送、确认后更新、重复消费不执行、未知结果只读对账、失败不重跑、连接心跳不被慢任务阻塞。
- [ ] 实现分区持久队列、单活消费者、prefetch=1、发布确认、mandatory、手动 ack、死信、有界连接重试间隔及进程内执行并发上限。
- [ ] 消息只含 job_id；租户、设备、原始参数从 MySQL 读取；不信任消息中的业务参数。
- [ ] 长任务在线程池执行；连接与 ack 始终位于所属 I/O 线程。

## Task 3：实际 API 与 Monitor 调用链

文件：修改 `app/api/server.py`、`monitor_web_server.py`；新增 `tests/test_event_queue_api.py` 并扩展回查测试。

- [ ] 先写 API 测试：提交立即 202、不内联运行、回查状态准确、鉴权和冲突保留、GET 不执行。
- [ ] 抽取并复用原 `produce_event`，不改变审批与试运行逻辑；测试模式保留同步入口，正常启动使用 RabbitMQ。
- [ ] Monitor 正确处理 202，按设备并发提交与回查，禁止把“入队”显示成“诊断完成”；页面/旧事件切换不取消已入库任务。
- [ ] 未知/失败给出明确原因；兼容原同步 200 响应与只读阶段结果。

## Task 4：启动与基础设施模板

文件：修改 `scripts/start_all.py`、`infra/docker/docker-compose.yml`，新增启动行为测试。

- [ ] 补 RabbitMQ 本地基础设施、持久卷、回环端口与健康检查；不启动或覆盖用户生产环境。
- [ ] 启动默认使用 RabbitMQ，保留显式 `inline` 的开发兼容选择；正式环境不能暗中回退。
- [ ] 提供队列只读状态，错误不输出 URL、口令或外部异常原文。

## Task 5：验证与交付

- [ ] 针对性回归 → 全 Agent 服务测试 → 启动配置/跨服务相关回归。
- [ ] 使用真实 RabbitMQ + 临时 MySQL + 测试业务适配器进行投递、重复投递、并行和崩溃状态验证；不调用现场业务入口。
- [ ] 更新 `docs/rabbitmq-device-workers-20261016.md`：实际文件、测试数量、受阻项、启用步骤、恢复方法、运维风险。
- [ ] 单独自审消息重投、提交竞态、死信、跨进程认领及长事务边界；不宣称离线测试等于生产验收。

## 执行记录

- 已检查本地说明、启动方式、测试与监控/事件持久化调用链；修改前已备份 5 个现有文件，未复制配置密钥。
- 决定：直接在用户当前目录修改，保留已有修改；不创建分支或提交，不启动已有业务应用，避免生成实际工单。
- 决定：采用固定哈希分区并允许不同设备落入同一分区时排队；不同分区并行。数据库同时检查设备前序任务，防止重试或重连打乱顺序。分区数量入库后不可静默改变。
- Task 1：完成。真实临时 MySQL 仓库 12 项通过；连接、认领、顺序和未知状态均执行实际 SQL。
- Task 2：完成。真实 RabbitMQ 联调已验证消息确认、重复发布、分区并行、设备顺序与孤儿任务对账。
- Task 3：完成。实际 API → 发件箱 → RabbitMQ → Worker → 原事件结果仓库端到端测试通过；前端增加排队中文状态，296 项源码单测、17 项相关浏览器回归通过。
- Task 4：完成。增加本地 Compose 模板、Pika 固定依赖和启动参数；隔离凭据 `docker compose config --quiet` 校验通过，未启动业务 Compose。
- Final review：按 executing-plans/requesting-code-review 技能委派一次独立只读审查；发现两项 Important，未发现 Critical 或值得记录的 Minor。
- Final fixed：旧作用域结果参数冲突迁移门禁；`test_migration_rejects_different_payload_against_existing_event_result` RED→GREEN。
- Final fixed：超过 100 条未决任务导致后续对账饥饿；`test_reconciliation_visits_late_rows_after_one_hundred_unresolved_jobs` RED→GREEN。
- 修复后的审查复现与真实消息回归合计 6 项通过；最终全量 Agent 回归 2739 通过/1 既有版本断言失败/3 跳过，无新增失败。
- 已完成 Backend 全量 468 通过/1 跳过、跨服务契约 10 通过。初轮 Agent 2733 通过/1 既有版本断言失败/3 跳过；未更改 Skill 版本或失败断言。
- Task 5：完成。交付 `docs/rabbitmq-device-workers-20261016.md`，记录真实测试、未部署状态、配置、迁移与恢复路径。独立审查两项 Important 均修复；未留 Minor；未调用真实设备或收费模型。
