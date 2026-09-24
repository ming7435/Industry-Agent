# 工业智能运维 Multi-Agent 平台

本项目是一个面向工业设备运维和生产零件质检的本地演示平台，包含模拟工厂、实时监控工作台、Agent 编排服务、RAG 检索服务和 CAD 工程数据服务。

当前主链路：

~~~text
模拟工厂
  -> Monitor 采集设备快照
  -> 规则确认异常事件
  -> Agent Orchestrator
  -> Diagnosis
  -> Knowledge / CAD
  -> Maintenance
  -> WorkOrder
  -> waiting_repair

维修完成事件
  -> WorkOrder
  -> Repair Verification / Memory
  -> Report

生产零件质检
  -> Quality Agent
  -> Closure Service
  -> 质检记录、申诉、整改任务、审计日志
~~~

Quality Agent 的业务定义是**生产出来的零件质量检测**，不是设备维修验收。维修工单的创建、派工、反馈、完成、关闭和重开由 WorkOrder Agent 管理。

质检能力仅保留 `quality_inspection` / `quality_review`，统一处理生产零件。质检记录接口仅接受 `target_type=production_part`、`inspection_type=part_quality`；原工单质检入口 `/api/workorders/{workorder_id}/quality` 已移除。

## 当前能力

- 模拟工厂设备快照采集和多设备实时监控。
- Critical、Threshold、Duration、Count、Trend、MultiMetric 六类异常规则。
- 异常事件去重和按首次确认、等级升级、严重故障、恢复后再次发生触发诊断。
- 九个核心 Agent：Router、Diagnosis、Knowledge、CAD、Maintenance、WorkOrder、Quality、Report、Memory。
- LangGraph 编排、AgentState 与 Agent 内部 State、A2A 请求和 Tool Calling。
- Diagnosis 的 Reason -> Tool Guard -> Act -> Observe -> Loop Guard -> Validate -> Final/Fallback 闭环。
- 统一 Tool Registry 和 MCP 风格本地/远程适配边界。
- 报警码清洗、标准报警码提取和中文业务描述转换。
- RAG 的 PDF/DOCX/XLSX/CSV/TXT/MD/图片/CAD 解析、清洗、分块、向量检索、BM25 检索、RRF 融合、重排、证据和引用。
- SiliconFlow BGE-M3 向量化、bge-reranker-v2-m3 重排、DeepSeek 生成。
- Milvus 向量集合、Whoosh BM25 索引和 MySQL 文档/分块元数据。
- CAD 图纸、BOM、部件、装配关系和部件位置查询；配置 CAD MySQL 后从工程元数据表读取，开发环境才使用显式 Demo fallback。
- 维修计划中的 target_part、drawing_context 和 viewer_context 数据契约。
- WorkOrder 生命周期、维修反馈、维修完成、派工和可选 SQLite 持久化幂等。
- 生产零件质检、质检申诉、整改任务、审计日志和 MySQL 持久化。
- TraceRecorder 记录 Agent、Node、Tool、模块和 A2A 调用轨迹。
- React + Vite 监控工作台和内置静态前端。
- Runtime Evaluator、LoopGuard、ExecutionManager 和 CapabilityRegistry 提供统一的可控、证据驱动循环基础设施；不新增 Agent。
- 基础 Planner 只负责 Goal→Plan→ActionModel，Experience Quality Gate 控制关闭工单经验进入 Memory/RAG。

## 目录结构

~~~text
services/
├── agent-service/              Agent 编排、工具、监控和 API
│   ├── app/agents/             九个核心 Agent
│   ├── app/graph/              Orchestrator 和 AgentState
│   ├── app/tools/              按工具拆分的 Tool Calling 入口
│   ├── app/mcp/                外部系统适配器
│   ├── app/rag/                RAG HTTP 客户端和本地回退
│   ├── app/workorder/          工单业务服务
│   ├── app/closure/            生产零件质检闭环服务
│   ├── app/memory/             维修经验检索和沉淀
│   └── monitor_web_server.py   监控工作台和后台采集器
├── rag-service/                RAG 在线服务和离线入库流水线
│   ├── app/                    解析、清洗、分块、检索、融合和生成
│   ├── config/settings.py      RAG 服务唯一配置源
│   ├── scripts/                Milvus、Whoosh、CAD 入库脚本
│   └── data/                   RAG 服务本地语料和索引目录
└── document-cad-service/       CAD 工程数据 MCP 风格服务

frontend/monitor-react/         React + Vite 前端源码
frontend/monitor/               监控工作台构建输出
data/                           根目录数据挂载点和目录占位
shared/contracts/               Agent Runtime, WorkOrder, RAG and Trace shared schemas
tests/                          根目录测试
~~~

## 服务和端口

| 服务 | 当前本地地址 | 启动入口 | 说明 |
| --- | --- | --- | --- |
| 模拟工厂 | http://127.0.0.1:4529 | 外部模拟工厂服务 | 提供设备、状态、历史和日志 |
| 监控工作台 | http://127.0.0.1:8001 | services/agent-service/monitor_web_server.py | 采集设备并提供页面/API |
| RAG Service | http://127.0.0.1:8020 | services/rag-service/app/main.py | 当前根目录 .env 配置的 RAG 地址 |
| CAD Service | http://127.0.0.1:8011 | services/document-cad-service/app/main.py | 图纸、BOM、部件和关系查询 |
| Agent Service | http://127.0.0.1:8010 | app.api.server:app | 用户入口、异常入口和业务 API |
| Vite 开发服务 | http://127.0.0.1:5173 | npm run dev:monitor | 前端开发调试，/api 代理到 8001 |

RAG Service 和一键启动脚本统一使用 8020；如果单独启动服务，请在 services/rag-service/.env 中设置 SERVICE_PORT=8020，并保持根目录 .env 的 RAG_SERVICE_BASE_URL=http://127.0.0.1:8020。

### P2 本地基础设施

需要联调 MySQL、Redis、Milvus 或 MinIO 时，可先启动 [P2 本地基础设施说明](docs/deployment/p2-local-infra.md) 中的 Compose 栈：

```powershell
docker compose -f infra/docker/docker-compose.yml up -d
```

## 环境配置

复制 .env.example 为根目录 .env。密钥只放在本地 .env，不要提交到 Git。

配置优先级为：进程环境变量 > 服务 `.env` > 根目录 `.env` > 代码默认值。`APP_ENV=production` 时默认禁止本地 RAG、Memory、CAD、Closure 和 Report 回退；只有显式设置降级开关才会启用降级。`LEARNING_RESULT_STORE_PATH` 保存关闭工单后的 Memory/RAG/Report 结果，`REPORT_STORE_PATH` 保存结构化报告，避免服务重启后重复学习或丢失报告。

TraceRecorder 默认只保留本地记录；设置 `OTEL_ENABLED=true` 或配置 `OTEL_EXPORTER_OTLP_ENDPOINT` 后，会将 Agent、A2A、Tool、Node 记录以 OTLP span 发送到观测系统。未安装 OTEL 依赖或导出端点不可用时，本地 Trace API 仍保持可用。

### 根目录 Agent/监控配置

~~~dotenv
FACTORY_API_BASE_URL=http://127.0.0.1:4529
FACTORY_DEVICE_IDS=
FACTORY_DEVICE_ID=TRAK-TC820LTYSI-001
MONITOR_INTERVAL_SECONDS=0.5
MONITOR_WEB_HOST=127.0.0.1
MONITOR_WEB_PORT=8001
AGENT_SERVICE_BASE_URL=http://127.0.0.1:8010

DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

RAG_SERVICE_BASE_URL=http://127.0.0.1:8020
RAG_SERVICE_TIMEOUT_SECONDS=15
RAG_ALLOW_LOCAL_FALLBACK=false
MCP_CAD_URL=http://127.0.0.1:8011

MYSQL_HOST=
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=industrial_maintenance
~~~

FACTORY_DEVICE_IDS 为空时，监控服务会从模拟工厂的设备接口发现全部设备；设置它可以只监控逗号分隔的设备。FACTORY_DEVICE_ID 是兼容旧配置的单设备回退项。

### RAG 配置

RAG 配置文件是 services/rag-service/.env，模板是 services/rag-service/.env.example。重要配置如下：

~~~dotenv
SERVICE_HOST=0.0.0.0
SERVICE_PORT=8020

SILICONFLOW_API_KEY=
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_EMBEDDING_MODEL=BAAI/bge-m3
SILICONFLOW_RERANKER_MODEL=BAAI/bge-reranker-v2-m3

MILVUS_URI=http://127.0.0.1:19530
MILVUS_DATABASE=industry_agent
MILVUS_COLLECTION=industry_rag_alarm_codes
MILVUS_COLLECTIONS=
RAG_EXPERIENCE_COLLECTION=maint_fault_events

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=industry_rag

DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
~~~

向量模型和重排模型通过 SiliconFlow API 调用；L:/models/bge-m3、L:/models/bge-reranker-v2-m3 不是当前 RAG 在线代码默认读取的本地模型目录。Milvus 数据库名为 industry_rag_documents，集合由 MILVUS_COLLECTIONS 或入库时依据语料目录自动生成，不是只有一张表。

## 启动顺序

以下命令以 Windows PowerShell 和项目使用的 Python 路径为例。先确认模拟工厂已经运行。

### 一键启动本地演示服务

~~~powershell
python scripts/start_all.py
~~~

也可以使用 npm 脚本调用当前环境中的 Python：

~~~powershell
npm run start:all
~~~

该脚本会依次启动 RAG Service、CAD Service、Agent Service API 和监控工作台，并把日志按服务名前缀输出到同一个终端。默认地址如下：

| 服务 | 地址 |
| --- | --- |
| RAG Service | http://127.0.0.1:8020 |
| CAD Service | http://127.0.0.1:8011 |
| Agent Service API | http://127.0.0.1:8010 |
| 监控工作台 | http://127.0.0.1:8001 |

按 Ctrl+C 会统一停止这些子进程。模拟工厂仍需单独提前启动。

### Release Candidate Docker 包

RC/生产部署使用 `infra/docker/docker-compose.yml`（生产覆盖层为
`infra/docker/docker-compose.production.yml`），当前运行时包包含 Agent、RAG、CAD
和 Monitor。`backend-service`、`model-service` 是预留边界，不属于本地 Runtime
启动链；外部 PLC/MES/Inventory/QMS MCP、审批身份认证和生产 Secret Manager
需要在部署环境中提供。完整的密钥注入、持久化卷、健康检查和 fallback 策略见
[`docs/deployment/rc-packaging.md`](docs/deployment/rc-packaging.md)。

### 1. 启动 RAG Service

~~~powershell
Push-Location services/rag-service
L:/anaconda/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8020
Pop-Location
~~~

检查：

~~~powershell
Invoke-RestMethod http://127.0.0.1:8020/health
~~~

### 2. 启动 CAD Service

~~~powershell
L:/anaconda/python.exe -m uvicorn app.main:app --app-dir services/document-cad-service --host 127.0.0.1 --port 8011
~~~

检查：

~~~powershell
Invoke-RestMethod http://127.0.0.1:8011/health
~~~

### 3. 启动 Agent Service API

~~~powershell
L:/anaconda/python.exe -m uvicorn app.api.server:app --app-dir services/agent-service --host 127.0.0.1 --port 8010
~~~

检查 Agent API：

~~~powershell
Invoke-RestMethod http://127.0.0.1:8010/api/rag/status
~~~

### 4. 启动监控工作台

~~~powershell
L:/anaconda/python.exe services/agent-service/monitor_web_server.py
~~~

打开 http://127.0.0.1:8001。监控服务会按照 MONITOR_INTERVAL_SECONDS 采样，并异步提交确认后的异常事件，避免页面轮询被诊断模型阻塞。

### 5. 前端开发服务（可选）

~~~powershell
npm install
npm run dev:monitor
~~~

打开 http://127.0.0.1:5173。生产/静态页面由监控工作台直接提供，前端源码和构建输出分别位于 frontend/monitor-react 和 frontend/monitor。

## RAG 入库

RAG 离线流水线位于 services/rag-service/scripts，处理链路为：

~~~text
PDF/DOCX/XLSX/CSV/TXT/MD/图片/CAD
  -> ingestion 解析
  -> clean 清洗
  -> chunk 分块
  -> BGE-M3 向量化
  -> Milvus 向量集合
  -> Whoosh BM25 索引
  -> MySQL 文档/分块元数据
~~~

默认扫描 services/rag-service/.env 的 RAG_DATA_DIR。当前仓库中的可用语料位于 services/rag-service/data，包含报警码、案例、手册、SOP 和 CAD 数据。

### 使用仓库语料入库

~~~powershell
Push-Location services/rag-service
L:/anaconda/python.exe scripts/ingest_to_milvus.py --data-dir data
Pop-Location
~~~

常用选项：

~~~powershell
# 重建本次数据涉及的类型集合和 Whoosh 索引
L:/anaconda/python.exe scripts/ingest_to_milvus.py --data-dir data --drop-collection

# 只重建 Whoosh
L:/anaconda/python.exe scripts/build_whoosh_index.py --all-configured

# 禁用 MySQL 文档元数据
L:/anaconda/python.exe scripts/ingest_to_milvus.py --data-dir data --no-mysql

# 使用本地 OCR 处理扫描页
L:/anaconda/python.exe scripts/ingest_to_milvus.py --data-dir data --local-ocr
~~~

危险操作 --drop-all-collections 会删除当前 Milvus 数据库中的全部集合，只适用于可丢弃的本地环境。

### 在线 RAG 接口

~~~text
POST http://127.0.0.1:8020/search
GET  http://127.0.0.1:8020/health
~~~

Agent Service 对 RAG 的代理接口：

~~~text
GET  http://127.0.0.1:8010/api/rag/status
GET  http://127.0.0.1:8010/api/rag/search?query=主轴温度&limit=5
POST http://127.0.0.1:8010/api/rag/ingest
~~~

RAG 不可用时，RAG_ALLOW_LOCAL_FALLBACK=true 才会使用 Agent Service 的本地演示索引；生产联调建议配置独立 RAG 地址并将其设为 false，这样可以明确暴露 RAG 服务不可用问题。

## Agent 和业务接口

### 用户问题和异常事件

~~~text
POST /api/agent/question
POST /api/agent/event
~~~

### 工单生命周期

~~~text
GET  /api/workorders
POST /api/workorders
GET  /api/workorders/{workorder_id}
POST /api/workorders/{workorder_id}/action
POST /api/v1/workorders/{workorder_id}/feedback
POST /api/v1/workorders/{workorder_id}/complete
~~~

/action 支持 assign、update、submit_feedback、mark_repair_completed、close、reopen。这些操作最终进入 WorkOrder Agent，不直接由 API 操作底层工单存储。

### 生产零件质检和闭环

~~~text
POST /api/quality/parts/{part_id}
POST /api/v1/quality/checks
GET  /api/v1/quality/checks
POST /api/v1/quality/checks/{quality_check_id}/appeal
POST /api/v1/closure-tasks
GET  /api/v1/closure-tasks
POST /api/v1/closure-tasks/{task_id}/complete
GET  /api/v1/audit-logs
GET  /api/v1/closure/status
~~~

当 MYSQL_HOST 为空时，质检闭环和长期 Memory 使用进程内存回退；配置后会自动初始化 quality_checks、quality_appeals、closure_tasks、closure_audit_logs 和 maintenance_experience 等表。通过下面接口确认是否真正启用持久化：

~~~powershell
Invoke-RestMethod http://127.0.0.1:8010/api/v1/closure/status
~~~

返回 backend=mysql 且 persistent=true 才表示已接入 MySQL。

### 其他接口

~~~text
GET /api/trace
GET /api/memory/recent
GET /api/memory/search
POST /api/experience/search
~~~

## 架构边界

~~~text
API / Monitor
    -> Agent Orchestrator / Agent
    -> Service
    -> Tool Registry
    -> MCP Client / 外部系统适配器
~~~

- Agent 负责意图理解、LangGraph 编排、A2A 协作和结果组织。
- Service 负责确定性业务规则和持久化边界。
- Tool Registry 负责工具注册、参数和调用记录。
- MCP 层负责 PLC、MES、RAG、CAD 等外部能力适配；未配置远程地址时使用本地兼容处理器。
- WorkOrder Agent 负责工单生命周期；Quality Agent 只负责生产零件质量检测。
- Memory Agent 负责有效维修经验的检索和沉淀，工单关闭且存在有效维修反馈后才允许学习。
- RAG_SERVICE_BASE_URL 配置远程 RAG；MCP_RAG_URL 是可选 MCP 风格地址，二者不是同一个配置项。
- 配置 `WORKORDER_STORE_PATH` 后，WorkOrder 使用 SQLite 唯一键持久化幂等；生产集群仍建议使用 MySQL 唯一键或等价共享数据库。

### Runtime 最终控制流

当前 Graph 只负责保存状态并提供 Runtime 生命周期入口，不再通过 Graph 边决定
Diagnosis、Knowledge、CAD、Maintenance 或 WorkOrder 的业务顺序。统一控制流为：

```text
Goal/Event
  -> JEVParser
  -> Planner
  -> ActionModel(required_capability)
  -> CapabilityRegistry
  -> LoopEngine
  -> ExecutionManager
  -> Agent / Tool / MCP
  -> Evidence
  -> Evaluator
  -> Continue / Replan / Final
```

九个已有 Agent 都声明自己的能力并通过统一 `BaseAgent.execute()` 边界接入；
Runtime 根据 `required_capability` 选择已有 Agent，不新增业务 Agent。一次任务的
Trace 可以还原 Planner、能力选择、Action 执行、Evidence 和 Evaluator 决策。

## 测试

完整回归（两个服务的 `app` 包在独立 pytest 进程中运行）：

~~~powershell
python scripts/test_all.py
~~~

也可以分别运行：

~~~powershell
pytest -c pytest-agent.ini -q
pytest -c pytest-rag.ini -q
pytest -c pytest-cad.ini -q
~~~

前端构建：

~~~powershell
npm run build:monitor
~~~

测试不要求调用真实大模型；联调 RAG、Milvus、MySQL、模拟工厂时，需要分别启动对应依赖并配置相应 .env。

Runtime 和跨服务契约说明见：

- [Runtime 契约](docs/contracts/runtime-contracts.md)
- [Runtime 验证手册](docs/runbooks/runtime-validation.md)
- [共享 JSON Schema](shared/contracts/)

## 常见问题

### 页面能打开但设备不更新

确认模拟工厂地址可访问，并检查 FACTORY_API_BASE_URL。多设备场景不要把 FACTORY_DEVICE_ID 配成单台设备；清空 FACTORY_DEVICE_IDS 后监控服务会自动发现模拟工厂返回的全部设备。

### 诊断结果慢

监控采样和诊断提交是两个线程路径。检查 AGENT_TIMEOUT_SECONDS、DeepSeek 网络、RAG 服务响应和 GET /api/trace；不要在监控线程中同步执行模型调用。

### RAG 显示降级

依次检查 http://127.0.0.1:8020/health、根目录 RAG_SERVICE_BASE_URL、RAG 服务的 SiliconFlow 密钥、Milvus 连接和 MILVUS_COLLECTIONS。如果集合名配置了不存在的集合，dense health 会失败。

### 质检结果没有入库

检查 MYSQL_HOST、账号权限和数据库连接，再调用 /api/v1/closure/status。返回 backend=memory 说明当前是内存回退，并不是 MySQL 持久化。

## 安全和提交约定

- .env、服务本地 .env 和 API 密钥不得提交。
- 只提交 .env.example、源码、测试、文档和必要的示例数据。
- Milvus、MySQL、Whoosh 的运行时数据不要作为源码提交。
