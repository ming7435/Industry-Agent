# MySQL / Redis 存储与维修方案删除实施计划

> **执行要求：** 使用 superpowers:executing-plans 在当前本地工作区按任务实施，遵循先失败测试再修改；用户要求连续执行，不重复确认。

**目标：** 维修方案可单条/批量软删除，在线持久存储从 SQLite 改为 MySQL，临时存储使用 Redis。

**架构：** 共用 MySQL 会话和 JSON 存储支持运行状态与文档，现有 MySQL 业务仓储继续使用。Redis 只作 TTL 缓存，不作为审批和写命令认领的最终依据；Milvus 向量路径不变。

**技术栈：** Python / mysql-connector-python / redis / FastAPI / React / Vite / pytest / Node 测试。

**设计：** docs/superpowers/specs/2026-10-06-mysql-redis-maintenance-design.md

## 全局约束

- 保留现有本地修改、五服务架构、权限、状态迁移及安全门禁；不访问远程项目。
- 不改变模型供应商或工程阈值；不调用真实模型或机器控制。
- 不删除数据库、数据卷或旧 SQLite 文件；不输出/复制密钥。
- SQLite 仅供显式 testing 及旧库迁移，在线缺少 MySQL 不回退。
- 不提交其他人的修改；本任务不自动 Git 提交或部署。

## 复查重点

1. 删除后工单快照/监控快照把方案重新加入列表。
2. 缓存过期或 Redis 断连导致幂等命令重复执行。
3. 并发审批恢复、MySQL 连接跨线程、耗时任务占事务。
4. 巨大历史 JSON、迁移冲突、可恢复和原始数据保留。
5. 未登录删除、伪造用户身份、批量不存在 ID 导致部分删除。

### 任务 1：MySQL 长期 JSON 与 Redis 临时存储

文件：新增 shared/persistence.py、shared/temporary_cache.py、tests/integration/test_mysql_redis_storage.py；修改 Agent runtime/durable_store.py、event_store.py、report/store.py、runtime/operations.py、monitor/safety_store.py。

接口：MySQLJsonStore 提供 get/set/delete/keys/values/get_or_create/compare_and_set 以及方案投影读取；RedisJsonCache 提供 get/set/delete，带 TTL；测试使用独立数据库和随机 Redis 前缀。

- [x] 备份已有源码；测试真实存取、并发 CAS/认领、未知写状态、缓存过期、数据库重建后的持久性。
- [x] 运行失败测试，确认缺失实现而失败。
- [x] 实现短事务与压缩 JSON；耗时 producer 在事务外运行。
- [x] 接入已有 Runtime、报告、安全待办；测试隔离 SQLite 保持显式。
- [x] 运行针对性与 Agent 全量回归并记录。

### 任务 2：方案删除 API 与界面

文件：修改 Agent api/maintenance_plans.py、api/server.py、frontend/monitor-react/src/app/App.jsx、maintenanceWorkspace.mjs；新增/补充对应 API、前端及浏览器测试。

接口：DELETE /api/maintenance/plans/{plan_id}；POST /api/maintenance/plans/delete（plan_ids）；GET 返回 deleted_plan_ids。

- [x] 先测未登录拒绝、保留事件和关联工单、重复删除幂等、批量原子校验和刷新不复现。
- [x] 实现 MySQL 删除标记和审计；testing 通过已有隔离存储验证真实路由。
- [x] 添加单条删除、勾选、批量删除和确认提示，合并所有来源时过滤已删方案。
- [x] 运行 API 与前端全部测试，正常构建，不手工修改 assets。

### 任务 3：其余在线 SQLite 路径与迁移

文件：修改 Backend 仓储选择、Agent 工单仓储选择、RAG 文档存储、启动默认值及配置模板；新增 scripts/migrate_sqlite_storage.py 和迁移测试。

接口：在线构造器使用 MySQL；迁移支持 dry-run 与显式 apply，旧库只读，冲突不覆盖，逐条幂等。

- [x] 先测试在线禁止 SQLite 回退、MySQL 文档/分块原子更新、迁移中断恢复与冲突。
- [x] 接入已有真实 MySQL 业务实现，补 RAG 文档 MySQL 适配器；未调用的离线兼容代码不乱删。
- [x] 实现只读清点、显式迁移与恢复说明，补启动默认值；停止本地应用并一致性备份后完成现有数据切换，不自动部署生产。
- [x] 依次运行针对性→各服务测试→跨服务契约→前端构建/浏览器验证。
- [x] 新增 docs/mysql-redis-maintenance-fix-report.md，逐项报告完成、受阻、实际测试和恢复方法。

## 进度与裁决

初始化：用户明确要求当前工作区直接修改并不反复询问，因此不另建 worktree、不暂停等待设计确认、不自动提交；保留当前脏工作区。

最终：一次独立只读审阅发现三个重要问题和一个次要问题，集中修复并通过回归，不重复派发审阅。Agent 758、Backend 59、RAG 94、CAD 32、Model 17、前端 67 项通过；存储与跨服务组合 48 项通过。79 条事件的压缩原文摘要全部匹配，51 个方案在线可读，服务已统一启用。

备份例外：两个前端测试文件首次新增测试后才补做备份，副本不是原始基线；其余既有源码修改前备份。根 `.env` 未复制、未输出、未修改。早期 fixture 输出暴露的数据库连接参数已脱敏，报告提醒相关密码轮换，不在文档复制凭据。

切换裁决：用户要求当前本地项目不再在线使用 SQLite，因此仅交付新适配器而保留在线旧服务不足以完成请求；使用显式迁移、一致性备份、缺键恢复及摘要核验后启动本地服务。原 SQLite、数据卷和当前 MySQL 增量都不删除，不将此操作当作生产部署或设备验收。
