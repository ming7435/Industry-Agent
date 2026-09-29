# 本地五服务业务修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以当前工作目录中的实际代码为唯一依据，核实并修复 Agent、Backend、RAG、Document-CAD、Model 五个服务的可信性、幂等性、数据边界和可验证性问题，并交付测试结果报告。

**Architecture:** 保留现有五服务边界、Agent Runtime、Backend 业务状态、RAG/Model HTTP 调用和 Document-CAD 查询链路。先用真实函数/API 编写失败回归测试，再做最小修改；已经满足要求的代码只记录为已修复，不做重复改造。

**Tech Stack:** Python 3.11+、FastAPI、Pydantic、LangGraph、SQLite/MySQL 适配器、Whoosh/Milvus 适配器、pytest、React/Vite（仅核对构建，不重做前端）。

**Spec:** 当前用户请求（本地五服务修复清单）；没有使用远程提交、远程仓库或外部代码包作为源码依据。

## Global Constraints

- 只修改当前工作目录中的实际源码，不访问 GitHub，不克隆，不按远程提交覆盖。
- 保留五服务架构和已有功能，不覆盖用户已有工作区改动，不重做前端。
- 修改前备份涉及源码，并在报告中记录备份路径和恢复方法。
- 测试使用临时数据库、测试适配器和隔离配置，不调用真实设备、生产数据库或收费模型。
- 不删除数据库、数据卷、失败测试或校验标准；不猜测工业设备合格阈值。

## Review Focus

- 伪造审批/恢复字段不能绕过服务端门禁：由 Agent API 测试覆盖。
- “对象存在”不能代表本次更新成功，参数变化不能复用幂等键：由工单服务回归覆盖。
- 质检缺证据、整改未完成和复检状态不能误判合格：由 Backend/Agent 质检回归覆盖。
- 指定设备/机型的 CAD 查询不能退化为全库或混入其他设备：由 CAD SQL/Agent 回归覆盖。
- Model/RAG 的配置完整、未探测、不可达必须分离，不能用 Fake 或供应商直连伪造就绪：由 Model/RAG 配置和契约回归覆盖。

### Task 1: 基线审计、恢复备份和测试隔离

**Files:**
- Inspect: `README.md`, `.env.example`, `scripts/start_all.py`, `infra/docker/`, all five service requirements and tests
- Create: `.runtime/local-five-service-fix-backups/<timestamp>/manifest.json`
- Create/Modify: `docs/local-five-service-fix-report.md`

- [x] 列出实际服务入口、端口、依赖、测试命令和当前运行状态。
- [x] 记录工作区已有修改清单；只备份后续确实要修改的源码文件，不备份或输出密钥。
- [x] 为每个服务选择隔离 pytest 配置、临时数据库和测试适配器。
- [x] 用现有测试复现清单中的问题；已经通过的项目记录为“原本已修复”。

### Task 2: Agent Runtime、审批、幂等和维修验收

**Files:**
- Modify as required: `services/agent-service/app/runtime/{container,execution,dispatcher,policy,coordinator,approval}.py`
- Modify as required: `services/agent-service/app/agents/knowledge/agent.py`
- Modify as required: `services/agent-service/app/workorder/{service,validator}.py`
- Modify as required: `shared/` repair/authorization contracts
- Test: `services/agent-service/tests/` targeted regression tests

- [x] 先写并运行空知识结果、更新对账、幂等参数隔离、审批字段注入、审批绑定、并发恢复和设备恢复数据门禁的失败测试。
- [x] 最小实现：空结果返回证据不足；创建/更新/派工/完成/关闭分别对账；同命令不重复执行且参数变化不复用键；审批只绑定任务、动作、参数和有效期；维修验收统一使用设备身份、报警状态、时间和指标范围。
- [x] 验证长调用不持有全局锁/数据库写事务，超时保持不确定状态，不盲目重试写操作。

### Task 3: Backend 质检闭环与业务事务

**Files:**
- Modify as required: `services/backend-service/app/quality/inspection.py`
- Modify as required: `services/backend-service/app/workorder/{service,repository}.py` and APIs
- Modify as required: Agent quality validator/response models
- Test: Backend and Agent quality/workorder regression tests

- [x] 先写并运行缺少规格、外观、材料、功能、工艺证据，整改未完成、复检失败、放行/关闭状态错误的失败测试。
- [x] 实现 `pass/fail/not_tested/insufficient_data` 分离、完整整改门禁、状态迁移校验、业务与审计事务一致性。
- [x] 验证生产模式不返回固定演示库存/人员/生产状态；无适配器明确不可用；数据库迁移不删除旧数据。

### Task 4: RAG 服务模型链路、持久化和超时

**Files:**
- Modify as required: `services/rag-service/app/api/{deps,indexing,routes,documents,pipeline}.py`
- Modify as required: `services/rag-service/app/milvus/retriever.py`, `clients/model.py`, config
- Test: `services/rag-service/tests/` RAG wiring, storage, timeout and dimension tests

- [x] 先写并运行注入模型客户端未被使用、供应商密钥直连、向量维度不匹配、SQLite 路径不一致、阻塞路由和前置扫描超时的失败测试。
- [x] 确保在线入库/查询经过 Model Service，保留合法离线实现；校验模型/维度/索引兼容；连接在成功/异常/超时路径均释放；阻塞操作有界卸载且不重复写入。
- [x] 记录旧文档 SQLite 的 backup/迁移方式，不自动删除旧数据。

### Task 5: Document-CAD 设备边界和就绪状态

**Files:**
- Modify as required: `services/document-cad-service/app/{main.py,repository.py}`
- Modify as required: Agent CAD graph/validator/model conversion
- Test: `services/document-cad-service/tests/` and Agent CAD tests

- [x] 先写并运行设备/机型/部件/零件号条件缺失、JSON 零件号、精确编号、AND/OR 分组、混入其他设备和不可用就绪的失败测试。
- [x] 保证结构化条件贯穿 HTTP→Repository→Agent；指定设备无结果时返回空结果/不可用而不是全库或演示数据；SQL 全部参数化；返回证据再次核验归属。

### Task 6: Model 服务供应商配置与启动/代理核对

**Files:**
- Modify as required: `services/model-service/app/{main.py,providers/gateway.py}` and actual local startup configuration
- Inspect: `scripts/start_all.py`, `infra/docker/`, monitor/Nginx routes, frontend package/build metadata
- Test: Model tests, startup/route/build contract tests

- [x] 先写并运行生产 Fake 拒绝、供应商配置缺失、聊天/向量/重排能力分开、未探测与可达分离、视觉路由和密钥脱敏测试。
- [x] 实现配置级 readiness，不通过收费接口健康检查；保留当前合法供应商和模型选择；生产无真实配置明确不可用。
- [x] 核对启动、代理白名单、鉴权、方法限制、内部工具隔离和前端可复现构建；不手工改打包 assets。

### Task 7: 五服务回归、联调边界和交付报告

**Files:**
- Modify: `docs/local-five-service-fix-report.md`

- [x] 依次执行针对性回归、五服务独立测试、跨服务契约测试；环境允许时执行本地五服务联调，不调用真实设备/生产数据。
- [x] 运行编译、静态检查和当前项目实际构建命令；将失败按业务测试、基础设施不可用、未覆盖验证分开记录。
- [x] 报告列出实际修改文件、关键行为、每项线索结论、测试通过/失败/跳过数量、配置/迁移/恢复方法、未完成项和生产验收边界。
