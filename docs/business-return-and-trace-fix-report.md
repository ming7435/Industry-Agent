# 维修方案、派工、报告、质检与执行日志整改结果

日期：2026-10-06。依据：当前 `L:/industry_agent` 本地代码与本机接口。

## 结论与边界

本轮落实了业务返回入口、正式质检数据录入、报告查询及生成、中文 PDF 既有能力的 Agent/Tool 调用关联和长期日志存储。没有重做前端、替换模型提供方或放宽业务门禁；没有复制密钥、修改根 `.env`、删除既有数据或调用设备启停接口。

“返回结果”包括真实成功、数据不足、业务阻断和外部调用失败，不能把这些全部包装成成功。目前正式 CAD/BOM 与库存适配数据仍不完整，因此部分旧方案不能自动派工。这不是通过伪造备件、人员或解除门禁可以解决的问题。本报告不将隔离回归通过写成生产验收通过。

## 实际修复

| 项目 | 核实与处理 | 状态 |
| --- | --- | --- |
| 报告中心列表 500 | 复现 MySQL 1038：大 JSON 参与排序。改为先排序记录编号，再读取正文；不扩大数据库排序内存 | 已修复；本机返回 14 份报告 |
| 历史报告结构不同 | 兼容包装与扁平报告，保留存储编号及原报告编号，支持读取原业务内容 | 已修复 |
| 报告生成入口缺少 | 增加从已保存 PLAN、WO、QC 编号生成报告的入口，不接受用户上传假的执行结果 | 已修复 |
| 报告持久化失败仍完成 | 明确 `persisted=false`、资料不完整或保存失败状态，不返回伪造完成 | 已修复 |
| PDF 生成无法核对调用 | 实际经过 Report Agent、MD 技能步骤、`generate_report_file` 工具；保留打开/下载接口 | 已修复，隔离接口验证通过 |
| 复检关闭后报告仍只显示未通过 | 同时保留初检失败及复检通过、最终放行/关闭；摘要与前端质量卡片一致 | 已修复 |
| 质检只读固定样例 | 正式服务从 MySQL 中读取录入的实测值、规格、材料等记录；无记录不回退固定样例 | 已修复；隔离测试保留显式夹具 |
| 不完整或非法规格误判通过 | 五项检验区分通过、失败、未检测/数据不足；非法范围、非有限数值、倒置范围、无效材料牌号不能通过 | 已修复 |
| 质检 FAIL 闭环 | 整改任务全部完成后才允许复检，引用新持久化合格记录；放行再次核对，关闭生成报告 | 原有 Backend 门禁保留，Agent/Tool 日志与页面接通 |
| 方案重新校验 | 读取当前同设备、同报警、有效时间数据，重新走真实诊断→维修→工单路径；已有工单先对账 | 已修复；不重复创建同一命令工单 |
| 派工前读取失败永久 uncertain | 已明确未执行的前置拒绝单独保存；前端修正数据后可发新命令；写入未知仍保留原命令核对 | 已修复 |
| 日志重启丢失 | 新增 MySQL 长期轨迹表，索引查询；存储失败明确警告，并保留本进程内失败记录 | 已修复；隔离 MySQL 重建记录器验证通过 |
| Agent、Skill、Tool 混在一起 | 每次调用分别关联 `agent_run_id`、`step_run_id`、`tool_call_id`，展示真实输入、输出、上下文、步骤、耗时、失败 | 已修复 |
| 业务阻断显示全部完成 | 工单阻断、质检缺数据不因为函数正常返回或报告生成完成而变成业务完成 | 已修复 |
| 报告取材误生成质检任务 | 读取 `get_quality_record` 不是一次检测；按真实 Agent 和显式运行归属划分阶段 | 已修复 |

## 页面操作

1. **维修方案**：查看已保存方案与门禁原因。登录维修账号后，未关联工单且保留故障身份的方案可“重新校验”。系统校验当前报警并自动处理派工，不上传审批通过标志，也不提供越过门禁的按钮。
2. **工单系统**：登录后查看分配给自己的工单，保留人员、状态、接单和反馈职责。未登录查询私人列表返回 401 是鉴权正常，不是派工接口故障。
3. **报告中心**：选择来源类型，输入已保存 PLAN、WO、QC 编号，点击生成报告。然后生成 PDF、打开、下载。资料不足的报告会明示不足，不能作为维修验收通过凭证。
4. **质检中心**：输入真实零件编号，展开“实测数据与检验规格（需登录）”，填写真实记录并保存，再执行检测。当前检验器的功能规则适用于旋转类零件；非此类零件需要专用检验规则，不能声称支持所有工业产品。
5. **质检失败后**：建立整改任务→完成全部必需任务→重新执行检测生成新 QC→原记录引用新 QC 复检→校验并放行→关闭。新旧记录须满足零件、批次及原有验收约束，不能仅提交一个 `passed=true`。
6. **日志系统**：选择一个故障、RAG 或质检任务，在其执行明细中查看每次 Agent 的输入/上下文/输出、中文 MD Skill 步骤及实际 Tool 调用。重复调用分别编号，不伪造未执行的步骤。

实测输入不自动填“正常”，也不猜测公差、硬度、跳动或安全阈值。人工录入标记为 `manual-inspection` 并保存登录人员、录入时间，不能冒充自动测量设备采集。

## 改动文件

Backend：

- `services/backend-service/app/workorder/repository.py`：报告索引排序与短连接读取。
- `services/backend-service/app/workorder/service.py`：报告兼容、质检证据字段及正式数据服务。
- `services/backend-service/app/quality/inspection.py`：实测输入、正式查找和规格有效性检测。
- `services/backend-service/app/main.py`：内部 QMS 录入工具，保留鉴权。

Agent：

- `app/harness/trace_store.py`（新增）、`trace.py`、`runs.py`、`runtime.py`：长期日志、脱敏有界内容、任务归属和禁止报告 Harness 自动重试。
- `app/agents/base.py`：真实步骤输入输出与重复步骤身份。
- `app/agents/quality/agent.py`：服务器授权的闭环动作经过实际技能步骤/工具。
- `app/agents/report/agent.py`、`graph.py`：实际保存判断、摘要及文件生成调用。
- `app/tools/report/generate_report_file.py`：补充质检字段及状态的中文标签，区分报告生成状态与检测结论。
- `app/tools/registry.py`：新增内部质检动作工具，保留原公共模型工具权限；公共模型工具 schema 数仍为 58。
- `app/runtime/container.py`、`operations.py`：实际 QA、Report Harness 与持久化、闭环操作接通。
- `app/api/business_returns.py`（新增）、`server.py`：录入、重试、报告生成、PDF 和日志返回。
- `app/skills/quality/part_quality_inspection.md`、`app/skills/report/closure_report.md`、`report_generation.md`：补齐实际闭环及 PDF 步骤；仍为中文 Markdown，不新增假的 Agent 节点。

上述 `app/` 路径属于 `services/agent-service`。

前端：

- `src/app/App.jsx`、`maintenanceWorkspace.mjs`：入口与实际返回展示。
- `src/app/InspectionInput.jsx`、`inspectionInput.mjs`（新增）：人工实测数据入口。
- `src/app/apiRequest.mjs`、`reportView.mjs`、`traceLog.mjs`：保留确定性拒绝信息、最终质量结果、任务内调用关联。
- `src/workbench.css`：长文本上下布局。
- `frontend/monitor`：由当前源码正常 Vite 构建生成，没有手工修改打包 JS。

上述 `src/` 路径属于 `frontend/monitor-react`。已有脏工作区的其他改动不归本轮冒认或覆盖。

新增回归文件：Agent 的 `test_business_trace_returns.py`、`test_business_returns_api.py`、`test_maintenance_retry_api.py`；Backend 的 `test_report_and_inspection_returns.py`、`test_mysql_report_sorting.py`、`test_inspection_invalid_specifications.py`；集成的 `test_business_mysql_trace.py`；前端的 `businessTrace.test.mjs`、`inspectionInput.test.mjs`、`maintenanceRetry.test.mjs`、`businessReturnReview.test.mjs`；浏览器只读检查 `tests/browser/business-returns-readonly.test.mjs`。既有两处夹具/技能权限契约测试同步调整，不降低原业务断言。

## 测试命令与结果

执行解释器为 `L:/anaconda/python.exe`。五服务使用独立测试进程，避免同名 `app` 包互相覆盖。

| 实际命令 | 最终结果 |
| --- | --- |
| `python -m pytest -c pytest-agent.ini -q --tb=line` | 782 通过，0 失败，0 跳过；155.35 秒 |
| `python -m pytest -c pytest-backend.ini -q --tb=line` | 74 通过，0 失败，0 跳过 |
| `python -m pytest -c pytest-rag.ini -q --tb=line` | 94 通过，0 失败，0 跳过 |
| `python -m pytest -c pytest-cad.ini -q --tb=line` | 32 通过，0 失败，0 跳过 |
| `python -m pytest -c pytest-model.ini -q --tb=line` | 17 通过，0 失败，0 跳过 |
| 隔离配置下 `python -m pytest -c pytest-agent.ini tests/integration tests/contracts -q --tb=line` | 49 通过，0 失败，0 跳过；2 条 websockets 弃用警告 |
| `node --test`，参数为 `rg --files src -g '*.test.mjs'` 的全部文件 | 75 通过，0 失败，0 跳过 |
| 在 `frontend/monitor-react` 运行 `L:/nodejs/npm.cmd run build:monitor` | 通过；61 个模块，仍有大于 500 KB 的 bundle 提示，未调高门槛掩盖 |
| `python scripts/verify_local_workbench.py`，默认只读 | 本机监控/方案/报告/质检/日志/CAD 状态均 200；匿名工单 401 |
| 最终重启后 GET 五服务 `/health` | Agent 8010、Backend 8030、RAG 8020、CAD 8050、Model 8040 均 200；不代表收费提供方探测或工业验收 |
| `node tests/browser/business-returns-readonly.test.mjs` | 维修方案/报告/质检/日志 4 个页面可读，页面异常 0，失败 API 0，业务变更请求 0 |
| `python -m pyflakes`，检查本轮新增业务入口/日志存储与修改的 QA、Report、检测模块 | 通过，无输出 |

合计 1,123 项代码回归通过，另完成 4 个页面的实际浏览器只读检查。浏览器检查前两次因测试选择器与实际新增折叠入口名称不符超时，按实际可见入口修正后通过；未移除入口校验或跳过质检页面。

集成测试使用进程隔离环境：`APP_ENV=testing`、`BACKEND_STORAGE=sqlite`、`FACTORY_API_BASE_URL=http://127.0.0.1:9`，模型/Backend/CAD 外部 URL 清空；这些值不写入根 `.env`。SQLite 仅为隔离测试，线上长期记录仍使用 MySQL，临时幂等状态仍由现有 Redis 层负责。

测试调用实际 API、业务函数、Agent 图、技能包装与工具注册表；替身仅隔离外部模型、设备及业务适配点。另在新建隔离 MySQL 库实测大报告排序、日志重建和此前存储契约。没有调用收费聊天/向量/重排或真实设备控制。

开发过程先复现失败再修正：报告大 JSON 查询、轨迹身份/持久化、质检录入闭环等；独立只读审阅新增 11 个非法规格失败用例，随后修复通过；另外复现并修复了复检摘要、质检任务状态、前置校验 uncertain、报告取材归组问题。最终统计以重跑结果为准，不把中间失败测试删除。

执行环境记录：跨服务测试前两次分别因为缺少正确测试配置/隔离环境而收集失败，正确配置后 49 通过；一次构建在仓库根目录找不到 package.json，改在实际前端目录构建通过；重启刚开始端口未监听的一次只读检查连接拒绝，服务就绪后通过。这些与业务断言失败分开记录。

## 存储、迁移与恢复

- 新表 `agent_execution_trace` 位于现有配置的 MySQL 库，包含递增索引、任务/轨迹索引和 JSON 负载。建表使用 `IF NOT EXISTS`，不删除旧表、旧库或数据卷。
- 既有业务报告采用读取时兼容，不重写原正文，不需要破坏性迁移。
- 新日志由新版本实际执行开始记录。旧版本没有保存的内存执行明细无法补造，不宣称已经回填全部旧日志。
- 输入/输出有界保存，密码、令牌和密钥脱敏；超大内容明确截断，避免递归历史令日志无限膨胀，不声称日志是无限大小原始文件副本。
- MySQL 不可用时记录存储警告；当前进程内的失败记录仍可查询，进程退出前未落库内容不能保证持久化。
- 不新增环境变量，不改变 root `.env`。本地应用正常重启加载源码，外部 Factory 与 MySQL/Redis/Milvus 未被停止或删除。
- 最终应用管理进程编号为 27316；既有 Factory 进程 20144 保留。最终只读检查时监控启用、四台设备可读、诊断任务数 0，原有 51 条方案、14 份报告、84 条质检记录仍可读取。
- 源码备份：`.runtime/backups/20261006-business-return-and-trace/`，恢复方法见其中 `RESTORE.md`。原有源码备份包含此前用户修改；新增文件单独列出，不回滚其他历史改动。
- 恢复前先停止本项目应用，比较后逐文件恢复备份，再运行对应测试与前端构建；后续又改过的文件不能批量覆盖。新增表与隔离测试库保留，代码回退无需删数据。

## 尚需业务资料或外部验收

1. 自动派工必须具备正式设备归属的 CAD/BOM、真实零件编号、可用库存/预留适配器及注册人员；当前机器 HTML 展示不是正式工程 BOM，不能代替这些资料。
2. 质检需实际规格和测量来源；当前旋转零件规则不覆盖焊接、电子功能、化学成分等所有产品。传感器/QMS 自动采集仍需相应真实适配器。
3. 前轮向量/重排提供方曾返回 HTTP 402。按用户选择保留原提供方，本轮未调用付费接口再次探测，不能宣称其余额问题已消除。
4. 未通过真实设备恢复标准、生产负载和控制故障注入验收；本轮不执行产线停止/重启，既有启停规则未被修改。
5. 终态报告包含真实历史结果，不能因为文件成功生成而断言设备或产品合格。

## 技能使用

使用 Superpowers 的系统排查、测试先行、实施计划、完成前验证及一次独立只读审阅流程；依据用户连续实施要求不逐文件暂停确认。PDF 技能用于检查现有中文 PDF 的实际显示，不仅核对 HTTP 成功。

修正后的隔离 PDF 共 1 页，已通过 Poppler 渲染和图像检查：标题为真实零件编号，中文无乱码、正文无截断重叠。Poppler 提示内置字体替代，但实际图像可读。样例为测试资料，不作为生产报告交付；真实报告的生成、打开、下载接口另由实际 API 回归覆盖。
