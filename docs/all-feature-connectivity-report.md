# 全功能联通修复与实际验证结果

日期：2026-10-05。依据：当前 `L:/industry_agent` 与已有本地虚拟工厂 `C:/Users/12587/Desktop/Factory`。未访问 GitHub、下载替代项目、覆盖远程版本、提交代码或改生产配置。

## 结论与验收边界

代码和隔离业务链已经完成本轮修复；当前源码已构建并重新启动。**不能据此声称全部现场业务已验收通过**：既有 CAD/BOM 工程表为空，库存接口仍有明确标记的演示结果，真实生产零件的规格和完整检验数据尚未接入，向量/重排账号返回 402、图片解析返回 403。

已实际验证：生产前实体建模与文件下载、既有维修方案读取、报告 PDF 生成/打开/下载、监控四台设备、知识全库检索及 DeepSeek 真实生成。隔离环境验证了虚拟加工执行、故障暂停、人员确认恢复、工单派发与质检整改闭环。未向当前运行工厂下发加工、故障注入或控制命令；未连接真实 PLC。

用户已允许启动现有基础设施和少量真实模型联调，并明确选择保留原向量/重排提供方，自行处理余额/权限。未切换到本地模型或更换供应商。

## 一、本轮实际修改

### Agent 与知识问答入口

- `services/agent-service/app/api/schemas/agent.py`、`app/api/server.py`：问答公开模式为 `general/knowledge`。前端不再提交内部 `required_capabilities`，消除正常页面请求被 422 拒绝的问题；内部能力注入仍返回 422。
- `app/graph/workflow.py`、`app/runtime/coordinator.py`：知识模式使用服务端顶层 `entry=knowledge`，不是由可编辑上下文声明权限。固定只读检索，跳过意图升级，并在每次派发之前检查能力/目标/副作用，覆盖重规划。测试覆盖真实 API→Graph→Runtime→Planner、工单编号、路由提示、事件式上下文及错误计划；不会因询问“怎么派工”而读取或变更他人工单。
- `app/rag/client.py`：客户端等待预算不短于 RAG 整体预算加 5 秒；默认 35 秒管道对应至少 40 秒客户端等待，保留用户更长的显式配置。
- 新增 `tests/test_knowledge_entry_connectivity.py`、`test_rag_timeout_connectivity.py`。生产 CAD 门禁测试显式使用隔离 Backend 地址，避免仅因本机 `MYSQL_HOST` 存在而在测试中打开实际 MySQL；未降低生产门禁。

### Quality：完整检测依据、整改和申诉

- Backend：`services/backend-service/app/workorder/service.py`、`repository.py`。
- Agent：`services/agent-service/app/closure/service.py`、`store.py`、`app/api/schemas/closure.py`、`app/clients/backend.py`、`app/runtime/operations.py`、`app/agents/quality/agent.py`、`validator.py`。
- 复检必须引用服务端保存的新 QC，同零件/同批次且晚于所有必需整改完成；五项检测必须完整、可信、非模拟且通过。放行再次读取检测与任务，不接受客户端 `passed=true` 作为验收证据。
- 所有必需整改未完成不能复检/放行；通过后新增整改会要求重新复检。申诉不能以任意结论跳过放行/关闭规则。
- 相关状态与审计一起提交或回滚。MySQL 闭环存储采用每事务连接；申诉事务内重读，使用 `pending` 条件比较更新，结论与审计持久化，跨实例不能重复处理。既有“数据库仍 pending、审计已经处理”的旧记录也会被识别；没有新增列或迁移/删除旧记录。
- 补齐 Backend HTTP 客户端申诉处理方法。未检测/数据不足不再被 Agent 当成检测失败。
- 新增 `test_quality_release_gate.py`（两服务）、Agent `test_quality_status_truth.py`、`test_quality_appeal_persistence.py`；原业务测试改为保存完整测试 QC 依据，不删除失败测试或跳过门禁。

### 前端：上下排版、真实结果和闭环入口

- `frontend/monitor-react/src/app/App.jsx`、`workbench.css`、`app/knowledgeScope.mjs`。
- 新增 `app/qualityWorkspace.mjs` 与测试；修改知识范围测试。
- 明确展示合格、不合格、未检测、数据不足；历史工作流 `open` 不隐藏实际检测结论。经验检索错误不阻断 QC 历史和整改任务。
- 增加历史选择、整改创建/完成、引用新 QC 复检、申诉处理、放行/关闭及错误反馈；页面上下排列。
- 兼容远程包装 QC 和本地扁平 QC。扁平整改任务不能覆盖检测明细。
- 当前源码重新构建 `frontend/monitor/`；未手工改打包 assets。构建保留已有大包警告，没有提高阈值掩盖警告。

### RAG：恢复、预算、模型响应与故障归因

- `services/rag-service/app/api/deps.py`、`routes.py`、`pipeline.py`、`models.py`、`app/clients/model.py`。
- 失败依赖不是永久缓存 None；冷却后允许恢复，依赖变化后重建管道。
- 构造与前置文档查询卸载并计入统一搜索预算；文档存储失败时保留仍可用检索路线。
- 在线向量/重排/聊天经过 Model 客户端。健康读取能力观测，不用收费生成接口探活；“配置完整”不等于“已实际可达”，也不禁止首次业务调用。
- 校验嵌入数量、顺序、维度、有限值；校验重排数量/索引/分数和模型正文；错误不回传上游原始正文。保留原中文带引用提示与合法离线实现。
- 现场发现 HTTP 模型错误误标为 Milvus 故障/重排超时，补 typed 能力与超时信息：向量失败归为 `embedding_unavailable`，非超时重排失败归为 `reranker_unavailable`，实际超时仍是 `rerank_timeout`。旧离线重排器的包装超时按有界异常因果链识别，不检查错误正文猜原因。
- 新增 `tests/test_online_connectivity.py`、`test_error_classification.py`。

### Document-CAD：真实数据查询与连接

- `services/document-cad-service/app/repository.py`、`main.py`、`tests/test_api_contract.py`，新增 `test_runtime_connectivity.py`。
- 连接加锁、短事务/自动提交、只读断连恢复一次、有界连接超时；配置变化清缓存并关闭旧连接。
- 精确标识与明确名称匹配、版本标签和设备/租户/项目范围传递；不以全库或无关演示替代无结果。
- 不可用/演示状态不误报生产就绪，生产禁止测试夹具。真实健康连接成功且 `records=0` 时，只表示连接可用，不表示有工程依据。

### Model：实际能力和合法路由

- `services/model-service/app/providers/gateway.py`、`main.py`，新增/扩充 `tests/test_provider_connectivity.py`。
- 不默默接受未知聊天供应商；分别验证聊天、向量、重排和视觉路由及响应。
- 健康观测按供应商/能力/默认模型路由分别记录，其他模型调用不能污染默认模型的就绪状态。区分配置完整、未探测、可达、失败和过期；健康读取不收费。
- 错误正文不泄露密钥；合法空正文工具调用仍兼容。已选择供应商与配置保留。

新增检查工具 `scripts/verify_model_connectivity.py`（默认不付费，`--live` 最多四次）和 `scripts/verify_local_workbench.py`（默认只读，`--artifacts` 显式生成联调 CAD 和既有报告 PDF，不下发机器）。

前序已经实现的 CAD/CAM 和维修读取改动未重做，详见 `cad-production-and-repair-delivery.md`、`cad-modeling-operation-guide.md`、`repair-return-fix-report.md`。

## 二、真实现场结果

| 项目 | 实际结果 | 状态 |
| --- | --- | --- |
| 本机 MySQL/Milvus | 启动已有 Docker Desktop；既有容器和卷保留，MySQL、Milvus/etcd/MinIO 可用 | 基础设施已恢复 |
| 五服务和工作台 | 当前源码重新启动；8001、8010、8020、8030、8040、8050；工厂仍为原进程 4529 | 已运行 |
| 监控 | 0.5 秒采样，enabled=true，四台设备正常，last_error=null，现场未注入故障 | 正常采样；故障现场正向验收未做 |
| 生产前建模 | 联调 CAD `CAD-0FFAEA3FDBE84E02A73A`：Ø30×50 mm，CadQuery 真实单实体，体积 35342.917 mm³，STEP 回读有效 | 已验证 |
| 建模文件 | STEP、STL、三视图 SVG、DXF、参数 JSON、中文 PDF 等共 8 文件均 HTTP 200，校验摘要已记录 | 已验证打开/下载 |
| 虚拟加工下发/执行 | 真实 CAD API→临时 HTTP 虚拟工厂→实际刀路执行、暂停与人工恢复；不操作现有产线 | 隔离闭环通过，非真实机床验收 |
| 维修方案 | 51 条已有方案；历史 79/79 读取完成；复查约 0.1 秒 | 已验证返回 |
| 工单列表 | 未登录为 401，保留人员归属边界；临时数据库注册/派发/完成/恢复链通过 | 权限正常；现场自动派工仍受工程/库存门禁限制 |
| 质检/日志/人员设备 | QC 历史 83 条；日志按运行记录 API 正常；四台人员设备接口正常 | 读取已验证；真实完整检测/整改资料未接入 |
| 报告 PDF | 14 条已有报告；RPT-CDCC35630E 由既有中文生成器输出 46697 字节 PDF，文件头有效，inline/attachment 响应均 200 | 生成/打开下载接口已验证，未做本轮浏览器视觉验收 |
| DeepSeek | 官方 `https://api.deepseek.com`；RAG 请求 deepseek-chat，上游本次返回实际模型 deepseek-flash | 实际聊天调用通过，未更换配置 |
| 无活动报警的全库知识检索 | 一次实际 `/search` 得到 4 条证据、3479 字答案，grounded/citation_status 校验通过，约 12 秒 | 可降级回答，非全部模型能力恢复 |
| 指定设备但索引无匹配资料 | 实际检索零命中、空答案，未替换成无关机器资料 | 数据不足，未声明正常回答 |
| 当前向量/重排供应商 | HTTP 402；用户选择保留并自行处理余额/权限 | 外部受阻 |
| 图片解析 | 现有视觉提供方 HTTP 403 | 外部受阻；没有擅换供应商 |

本轮限次数真实模型链路共观察到 8 次上游请求尝试：四能力各一次，指定范围检索的一次向量尝试，全库检索的向量/重排/聊天各一次。不是健康轮询；没有自动循环付费探测。失败调用是否计费由供应商决定。

维修未派发的具体实例：`PLAN-06AB25A668` 的 `workorder_ready=false`，明确记录缺 CAD/BOM、备件型号工程依据及库存演示标记。现在 MySQL 工程四表仍为零记录，不能将联网成功伪装成派工依据完整。

## 三、回归测试

测试使用临时库、随机本机端口和显式测试适配器；不连接正式业务库/收费模型/当前工厂。五个同名 app 包独立进程运行。真实函数/API 与内部 Graph/Runtime 被执行，替换的是外部依赖边界，不是被测门禁。

| 验证 | 最终通过 | 失败 | 跳过 |
| --- | ---: | ---: | ---: |
| Model | 17 | 0 | 0 |
| Backend | 59 | 0 | 0 |
| Agent | 712 | 0 | 0 |
| RAG | 94 | 0 | 0 |
| Document-CAD | 32 | 0 | 0 |
| 集成/e2e/性能默认套件 | 11 | 0 | 3 |
| CAD 虚拟生产与注册小组跨服务契约 | 5 | 0 | 0 |
| 前端源码测试（全部目录） | 63 | 0 | 0 |
| 本地虚拟工厂 | 68 | 0 | 0 |

各行可能包含相同契约，不相加冒充唯一用例总数。五服务最终各套合计 914 次通过。`scripts/test_all.py` 最后完整执行时 RAG 为 93；末轮保留旧组件超时回归新增一项后，RAG 全套单独重跑为 94。最后更改只涉及 RAG 分类及注释，其他服务结果仍对应其当前逻辑。

3 项既有跳过：2 项要求独立 RC/five-service Compose 栈，1 项要求显式 `RAG_SMOKE_URL` 的性能检查。未扩大跳过规则；当前运行的是保留正式数据的本地服务，不能把要求 Fake 并写测试资料的 Compose 业务烟测直接对它执行。现场只读/限次检查另列上表，不算离线测试通过。

实际命令：

```powershell
# 以下变量只用于测试进程，不写配置文件。
$env:PYTHONUTF8='1'
$env:PYTHONIOENCODING='utf-8'
$env:PYTHON_DOTENV_DISABLED='1'
$env:APP_ENV='testing'
$env:MODEL_PROVIDER='fake'
$env:DEEPSEEK_API_KEY=''
$env:SILICONFLOW_API_KEY=''
$env:MYSQL_HOST='127.0.0.1'
$env:MYSQL_PORT='9'
$env:MYSQL_PASSWORD=''
$env:MILVUS_URI='http://127.0.0.1:9'
$env:FACTORY_API_BASE_URL='http://127.0.0.1:9'
& L:/anaconda/python.exe -u scripts/test_all.py
& L:/anaconda/python.exe -m pytest -c pytest-rag.ini -q
& L:/anaconda/python.exe -m pytest -c pytest-agent.ini tests/contracts/test_virtual_cad_production.py tests/integration/test_virtual_line_team_contract.py -q

# 前端目录 L:/industry_agent/frontend/monitor-react
$taskTests = @(rg --files src | Where-Object { $_ -match '\.test\.mjs$' })
& L:/nodejs/node.exe --test @taskTests
& L:/nodejs/node.exe node_modules/vite/bin/vite.js build

# 工厂测试在 C:/Users/12587/Desktop/Factory 执行
& L:/anaconda/python.exe -m pytest tests -q
```

不要在上述隔离环境变量仍有效的终端启动正式本地服务；启动应使用新的正常终端。启动命令为 `L:/anaconda/python.exe -u scripts/start_all.py`。

现场检查命令：`scripts/verify_model_connectivity.py --live`、`scripts/verify_local_workbench.py --artifacts`、只读最终工作台检查，以及两次限范围 `/search`。再次执行 `--live` 会新增供应商请求，不自动重跑。

RED→GREEN 保留了：Model 畸形响应/路由与就绪隔离，CAD 查询与连接故障，RAG 依赖恢复/预算/协议，知识入口 422 与真实 Runtime 升级，前端 QC/整改误识别，完整 QC 门禁与申诉持久化、错误归因及旧超时兼容。首次全套的 2 项测试环境失败是 CAD 测试误初始化本机 MySQL；补显式隔离 Backend 后原校验通过，未改变生产逻辑。

日志位于 `.runtime/verification/all-feature-20261005/`。独立只读代码审查关闭本轮发现的 Important 项；没有把代码审查或离线通过写成生产合格。保留 WebSocket 弃用、Vite 大包及临时 HTTP 超时关闭连接的诊断信息，不降低校验标准。

最新前端 63 项结果为 `frontend-all.log`；较早 `front-all.log` 为新增回归前的 60 项，不能混用。最后一次服务重启后的只读接口结果另存 `workbench-last-readonly.log`；启动后维修历史首次为 `loading`，随后复查为 51 条方案、79/79 历史完成，耗时 0.078 秒，监控 enabled=true、四台设备、last_error=null。工厂监听仍属原 PID 20144。Model 重启后健康观测重新为 `configured=true/reachable=not_probed`，这不是新增收费探测，也不否认本轮此前的实际成功/失败记录。

## 四、配置、数据与恢复

- `.env` 和供应商选择未修改，未复制/输出密钥。启动验证仅使用进程内 UTF-8、一次供应商请求尝试设置。
- Docker Desktop 启动后原有容器按既有策略恢复；没有 Compose 覆盖、拉取新镜像、删除数据库或数据卷。
- Backend 保留当前本地 SQLite 适配器及原账户/工单，不擅自切换 MySQL 导致历史不见。Agent 闭环 MySQL 并发规则有隔离 SQL 适配器验证，但正式 MySQL 锁/断连压力仍未现场验收。
- 未迁移 RAG 文档路径、模型索引、旧报告或工程表；不删除旧数据。若以后迁移 SQLite，先确认实际配置路径，以 SQLite backup API 做一致性快照（不可仅复制忙碌的主库文件而遗漏 WAL），在新路径副本做完整性/数量校验后再停服务切换；原库和快照保留。Milvus 更换模型/维度必须用新索引验证并保留旧集合，不能直接覆盖重建。
- 源码恢复总清单：`.runtime/backups/20261005-all-feature-connectivity/RESTORE.md`，含逐文件对应、校验值和分阶段备份。恢复前另存当前版本，再逐文件比较；不要批量覆盖用户后续修改。
- 本轮新建一份明确标记非生产的联调 CAD，生成一份既有报告的衍生 PDF；没有删除用户数据。前端旧 hash assets 由标准构建替换，可从保留源码重新构建，不是业务数据删除。

## 五、仍需完成的实际验收

1. 用户处理原向量/重排余额或权限，以及视觉模型访问权限后，再限次验证这三能力。不擅自切换本地模型，不承诺提供方一定可用。
2. 导入真实设备归属、部件/备件型号、版本化 CAD/BOM 和可用库存；本轮不填演示数据绕过工单门禁。
3. 接入真实生产零件与批次、必需规格、尺寸/外观/材料/功能/工艺检测记录及业务批准的验收标准。不自行猜测工业合格阈值，CAD 理想几何或设备正常不代表产品合格。
4. 用现有人员账户完成一次现场故障→诊断→方案→派工→维修人员反馈/恢复核验→报告→经验沉淀，以及一次独立 FAIL→整改→新 QC 复检→放行/关闭的验收。当前没有为了“打通”而新增正式账户、关闭旧单、注入故障或清空资料。
5. 实际浏览器交互与布局视觉验收、正式 MySQL 并发/故障压力、真实机床后处理和 PLC 联锁验收未执行；当前 NC 仅用于虚拟工厂，不能用于真实机床。

这些是具体受阻/未验收项，不是再次提出代码修改建议。已交付本地修改、测试、运行服务与报告；后续资料/账号恢复前，不能把全部现场链路描述成已完成。
