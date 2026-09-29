# 本地五服务业务修复报告

日期：2026-09-29  
范围：仅检查和修改 `L:/industry_agent` 当前工作目录；未访问 GitHub、未克隆远程项目、未按远程提交覆盖文件。

## 结论

五个服务的核心业务门禁、证据边界、幂等和设备归属问题已经在本地源码中落实，并由各服务真实函数/API 回归测试覆盖。关键原则是：**缺数据返回未验证/证据不足，不能猜测为通过；没有真实后端适配器时返回不可用，不能用演示数据冒充生产数据；维修完成不再自动控制设备。**

本次没有删除用户已有代码或数据库，也没有修改生产 `.env`、数据库数据卷或真实设备接口。工作区在开始时已有大量未提交修改，均保留；下面列出的文件是本轮新增或继续整改的相关文件，不代表工作区全部历史差异。

## 备份与恢复

- 修改前备份：`.runtime/local-five-service-fix-backups/20260929-112202/`。
- 共备份 447 个 `services/`、`shared/`、`scripts/`、`tests/` 下的 Python 源文件；不包含密钥。
- 记录文件：`.runtime/local-five-service-fix-backups/20260929-112202/manifest.json`。
- 恢复：先复制当前版本到另一个安全目录，再按原相对路径将备份目录中的目标文件复制回工作区；不要整目录覆盖本轮新增文件，也不要覆盖之后产生的新修改。

## 五服务整改明细

### 1. Agent Service：已修复

主要文件：

- `services/agent-service/app/runtime/policy.py`
- `services/agent-service/app/runtime/container.py`
- `services/agent-service/app/runtime/coordinator.py`
- `services/agent-service/app/agents/knowledge/agent.py`
- `services/agent-service/app/mcp/workorder.py`
- `services/agent-service/app/workorder/validator.py`
- `services/agent-service/app/closure/service.py`
- `services/agent-service/monitor_web_server.py`
- `services/agent-service/app/contracts.py`
- `services/agent-service/app/agents/cad/graph.py`

行为变化：

- 空知识结果不再对空集合调用 `max()`；回答明确为证据不足并保持空证据。
- 客户端传入的 `approved_capabilities`、`approval_granted`、嵌套 `context/event` 不再能自行绕过审批。恢复必须命中服务端 pending 记录，且动作类型、目标、业务参数、幂等键指纹完全一致；参数或动作变化会重新审批，并保留并发恢复控制。
- 工单幂等键绑定业务参数指纹；相同命令只复用同一结果，参数变化不会错误复用旧工单。创建、更新等操作继续按当前工单状态和本次参数对账。
- 维修验收改用设备恢复数据：设备编号、运行状态、报警清零、指标可用、时间戳/过期字段都必须满足；数据缺失、过期、设备不符或标记过期不能判定恢复正常。不猜测健康度阈值。
- 质检整改任务全部完成后才进入复检；申诉批准进入整改态；结构化质检证据不完整时不能直接关闭或沉淀经验。
- 删除了监控确认故障后的自动停机，以及工单完成后的自动启动/恢复控制；维修人员提交的是维修反馈和设备恢复证据，设备控制仍由明确的外部业务流程负责。
- CAD 组件模型保留 `device_id/device_model`；指定设备的 CAD 证据缺少归属或属于其他设备时回退为证据不足，不能进入最终定位结果。

### 2. Backend Service：已修复

主要文件：

- `services/backend-service/app/quality/inspection.py`
- `services/backend-service/app/workorder/service.py`
- `services/backend-service/app/main.py`
- `services/backend-service/tests/test_workorder_api.py`

行为变化：

- 外观、材料、功能、工艺和规格字段分别校验；缺少必需数据返回 `not_tested/insufficient_data`，不默认合格。
- `FAIL → 整改 → 复检 → Release/Close` 状态迁移增加整改任务全部完成和再次核验门禁；申诉、复检、放行、关闭不能跳过状态条件。
- `quality_validation/inspection_summary/checks` 必须形成完整结构化证据；仅提交 `result=passed` 或任意文本证据不能放行。
- 本地 SQLite/演示适配器返回值带 `synthetic/degraded/source` 标记；生产查询没有真实适配器时明确不可用，不把固定人员、库存或生产状态当作真实数据。
- 工单幂等指纹与 Agent 侧规则一致；保留已有数据库迁移和数据，不删除数据卷。

### 3. RAG Service：已修复/原有正确项已保留

主要文件：

- `services/rag-service/app/api/deps.py`
- `services/rag-service/app/ingestion/parser.py`
- `services/rag-service/app/api/indexing.py`
- `services/rag-service/app/api/routes.py`
- `services/rag-service/app/clients/model.py`
- `services/rag-service/app/milvus/writer.py`
- `services/rag-service/config/settings.py`

行为变化和核验：

- 在线查询和入库仍通过 Model Service；没有为在线链路重新引入供应商密钥直连。离线视觉/向量实现保留为显式离线流程。
- `DenseRetriever` 使用注入的模型客户端；依赖构造辅助函数不再忽略显式 endpoint/client 参数。
- 补齐文档解析中表格、图片关系和本地资源解析辅助函数，避免合法文档在解析阶段报未定义异常。
- embedding 向量维度和已有索引维度会被校验；文档 SQLite/cache 路径按当前配置目录使用，旧数据不自动删除。迁移时应先复制旧 SQLite 和 `artifacts/`，再执行现有索引/入库命令。
- 搜索超时、连接释放和有界异步卸载保留现有实现；测试未发现需要放宽超时或重复写入的问题。

### 4. Document-CAD Service：已修复

主要文件：

- `services/document-cad-service/app/main.py`
- `services/document-cad-service/app/repository.py`
- `services/agent-service/app/agents/cad/graph.py`
- `services/agent-service/app/contracts.py`

行为变化和核验：

- 设备、机型、图纸、部件编号和零件号沿 HTTP → Repository → Agent 结构化传递；指定设备不会悄悄退化为全库查询。
- 编号按精确匹配，名称/位置才按模糊规则；JSON `raw_json` 中的 `part_no` 会参与标准化返回。
- MySQL 查询使用参数化 SQL；关系查询按结果集分组，避免无关记录混入。
- `CAD_ALLOW_DEMO_FALLBACK` 未显式启用时没有 MySQL 就绪返回失败/不可用；不会用演示目录冒充生产工程数据。
- Agent 最终校验再次核对设备归属，跨设备或没有设备归属的指定设备证据都会被拒绝。

### 5. Model Service：已修复

主要文件：

- `services/model-service/app/providers/gateway.py`
- `services/model-service/app/main.py`
- `services/model-service/tests/test_api.py`

行为变化：

- 生产环境拒绝隐式 Fake provider；Fake 仅可在显式开发/测试配置中使用。
- 当前本地聊天供应商配置保持为 DeepSeek 官方 OpenAI 兼容端点（`https://api.deepseek.com`）；向量/重排仍是独立的可选 SiliconFlow 能力，不替换聊天模型，也不输出任何密钥。
- 健康信息按 chat、embedding、rerank、vision 分开报告。远程能力未主动探测时为 `configured/not_probed`，不会因为配置了 key 就把整个服务固定报告为 ready；健康检查不调用收费生成接口。
- 错误日志和响应不打印 API key；视觉请求继续按已选择的视觉模型路由。

## 本地启动、配置和代理核对

- `scripts/start_all.py` 的实际端口为：Model `8040`、Backend `8030`、RAG `8020`、Document-CAD `8050`、Agent `8010`、Monitor `8001`。
- 根 `.env.example` 和启动默认值中的 `CAD_SERVICE_BASE_URL/MCP_CAD_URL` 均为 `http://127.0.0.1:8050`；本轮没有覆盖真实 `.env`。
- `infra/nginx/nginx.conf` 只代理 Monitor 和受控 Agent `/api/`；RAG/CAD/Backend/Model 内部路径返回 404，保留内部端点隔离。
- `frontend/monitor-react/package.json` 和 `package-lock.json` 是本轮补齐的最小构建配置，未重做前端业务。使用锁定依赖执行 `npm run build:monitor`，产物由当前源码生成到 `frontend/monitor`。
- 构建完成但 Vite 给出 chunk 大于 500 KB 的性能提示；不是构建失败，本轮不做无关代码分包重构。

## 测试结果

所有 Python 测试均使用独立 `pytest` 配置和测试适配器；没有调用真实设备、生产数据库或收费模型。

| 范围 | 命令 | 结果 |
|---|---|---|
| Agent | `pytest -c pytest-agent.ini -q` | **234 passed** |
| Backend | `pytest -c pytest-backend.ini -q` | **14 passed** |
| RAG | `pytest -c pytest-rag.ini -q` | **45 passed** |
| Document-CAD | `pytest -c pytest-cad.ini -q` | **5 passed** |
| Model | `pytest -c pytest-model.ini -q` | **5 passed** |
| 跨服务契约/集成 | `pytest tests/integration tests/e2e tests/performance -o addopts= -q -rs` | **10 passed, 3 skipped** |
| Python 编译 | `python -m compileall -q services shared scripts` | 通过 |
| 生产代码静态检查 | `python -m pyflakes services/agent-service/app services/agent-service/monitor_web_server.py services/backend-service/app services/rag-service/app services/document-cad-service/app services/model-service/app shared` | 无输出/通过 |
| 前端单测 | `node --test`（`src/**/*.test.mjs`） | **22 passed** |
| 前端构建 | `npm run build:monitor` | 通过（仅 chunk 大小提示） |
| 项目总入口 | `python scripts/test_all.py` | 通过：5 + 14 + 234 + 45 + 5 + 10 passed；另 3 skipped |

3 个跳过项均是需要正在运行的 RC Compose/五服务环境或 RAG 服务的 Docker/性能冒烟测试，不是业务断言失败：

- `tests/e2e/test_docker_runtime_smoke.py`：RC compose 未运行；
- `tests/e2e/test_docker_runtime_smoke.py`：五服务 compose 未运行；
- `tests/performance/test_rag_smoke_budget.py`：RAG 性能服务未按测试要求单独启动。

修改后查询到的现有本地进程曾返回：Agent/Backend 可用、RAG Whoosh 可用但 Milvus 不可用、Document-CAD 因本机 MySQL 拒绝连接而不可用。Model 进程当时仍是修改前启动的旧进程，因此其旧健康响应不能作为新源码 readiness 的证明；源码行为已由 Model 测试验证。重启本地服务后才会加载本轮修改。

## 尚需真实业务验收的边界

- CAD 正式结果需要真实 MySQL 工程库、设备/机型/部件归属和图纸版本数据；当前本机 MySQL 不可达，所以不能宣称生产 CAD 已验收。
- RAG 的 Milvus、真实 embedding/rerank/vision endpoint 需要按现场配置验收；本地 Whoosh/测试适配器通过不等同于生产向量库验收。
- 维修恢复数据的“正常”只能由设备适配器提供运行状态、报警列表、指标和采样时间；代码没有自行猜测工业阈值。
- 质检的规格上下限、材料牌号和功能测试判定仍需现场质量标准/设备适配器提供；缺少时系统会保持未检测或数据不足，不会自动合格。
