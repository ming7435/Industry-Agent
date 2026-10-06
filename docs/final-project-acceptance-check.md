# 全项目最终功能检查

检查日期：2026-10-06。目录：`L:/industry_agent`。依据为当前源码、本机只读接口、浏览器实际操作与本轮重新运行的测试，不使用远程项目或远程提交。

## 一、结论

**尚未完成全部功能的当前环境验收，不能交付为“所有功能已打通”。**

五服务和前端可以运行，大量业务门禁与隔离闭环测试通过；但当前环境缺少正式工程数据、可用于派工的库存依据及完整维修小组，模型能力没有本次实际可达证明，自动整线控制开关未启用。另复现了测试入口和日志代理两项代码问题。质检与自动加工也有明确能力范围，不能声称支持所有工业产品或任意零件。

本轮只检查：没有修改业务源码或根 `.env`，没有停止、启动、加工或故障注入，没有调用收费模型，没有删除旧数据或数据卷。新增了本报告和 `.runtime/verification/final-project-audit-browser.mjs` 只读检查脚本；构建结果输出到独立验收目录，不覆盖当前前端产物。

## 二、功能状态

| 功能 | 实际核实结果 | 最终状态 |
| --- | --- | --- |
| 本地启动、五服务 | Agent 8010、Backend 8030、RAG 8020、Document-CAD 8050、Model 8040 均返回健康 HTTP 200；健康状态含各自的就绪说明，不等于全部依赖可用 | 可运行，非全部就绪 |
| 监控中心 | 0.5 秒轮询启用，4 台虚拟设备可读，当前均运行、无报警，采样错误为空；页面和隔离异常判断测试通过 | 正常状态可用；未现场注入故障验收 |
| 智能诊断 | 当前故障切换、设备归属、证据/置信度门禁、Agent loop 有回归；当前无活动故障，模型能力尚未探测 | 代码已实现，当前真实诊断未验收 |
| 维修方案 | MySQL 51 条方案可读；独立页面、重新校验、删除标记、防旧快照复活有测试 | 查看可用，部分方案派工受阻 |
| 自动派工与工单 | 正确的状态迁移、幂等、对账、人员身份、维修反馈及可信恢复数据有隔离回归；匿名私人列表 401 是正常鉴权 | 代码已实现，当前完整派工闭环未验收 |
| 人员注册与监督 | MySQL 账号、Redis 会话；最多 4 名维修人员、1 名监督人，自动派工、监督人查看催办有测试；实际启用账号仅 1 名维修人员、无监督人 | 功能已实现，业务人员未配齐 |
| 整线自动停止、人工确认后启动 | 有 Monitor → LineController → Backend 账本与恢复核验调用链，隔离跨服务启停测试通过；**实际监控/Agent 进程的控制模式为空** | 当前未启用，不会自动控制整线 |
| 质检 | 84 条历史记录可读；人工录入、五项检测、数据不足/未检测、整改、复检、放行、关闭有实际函数/API 回归 | 有限范围已实现，不能称为通用自动质检 |
| 维修知识问答 | 页面和请求契约可用，Whoosh/Milvus 就绪；当前 RAG 的 embedding、reranker、llm 均报告 false | 当前端到端回答未验收 |
| 报告中心 | 14 份报告可读；来源生成、保存失败判断、PDF 生成、删除有隔离 API 回归；已有中文 PDF 打开/下载均 200 | 文件能力可用，历史内容仍存在缺失 |
| 经验总结 | 42 条长期业务经验存在，可信验收后的沉淀/去重/向量写入有隔离测试 | 存储可读；新的现场闭环及在线向量沉淀未验收 |
| 日志系统 | 60 条 MySQL 轨迹可读，旧日志接口能读取任务明细；真实调用关联、MD Skill 步骤、输入/上下文/输出有回归 | 主业务日志已实现，代理别名及建模统一归属仍不完整 |
| 生产前 3D 建模 | CadQuery 2.8.0 就绪；既有实体 STEP 回读有效、STL 下载有效，浏览器视角切换/缩放实际改变三维画布；上传、版本修改、人工确认有测试 | 支持范围内可用，不是任意需求都可自动建模 |
| 虚拟生产 | 当前 Factory 明确只支持圆柱和同轴通孔、固定虚拟后处理；人工确认、下发、只读对账、执行有隔离契约 | 有限虚拟功能已实现，未当前产线下发验收 |
| 存储 | 当前 Backend 为 MySQL；在线文档/工单/闭环/日志走 MySQL，临时缓存/会话走 Redis，向量走 Milvus；保留旧 SQLite 迁移/测试实现及旧文件 | 在线 SQLite 已退出；并非所有长期任务元数据都进 MySQL |

历史方案中 21 条 `workorder_ready=false`、30 条为 true。**这些是保存时的标志，不表示当前 30 条都可以派工。**重新派工仍须验证当前故障、资料、库存、身份与审批条件。

## 三、本轮确认的问题和缺口

### 1. 当前自动控制未启用

只读检查实际监听进程的目标配置字段：Monitor 8001（PID 12956）和 Agent 8010（PID 27044）的 `FACTORY_CONTROL_MODE` 均为空，`virtual_control_enabled=false`。监控快照 `line_control.state=unknown`。

`app/monitor/line_control.py` 仅在该值为 `virtual` 时允许控制；`scripts/start_all.py` 不默认打开此项。当前根配置也未声明该值，尽管 `.env.example` 提供示例。因此“启停代码存在”不等于当前已启用。没有在检查中修改配置、重启或下发控制命令。

### 2. 正式维修工程数据和库存不足

Document-CAD `/health` 返回 `ready=true`，但 `records=0`。只读 SQL 确认 `cad_entities`、`cad_drawings`、`cad_entity_relations` 均为 0。

`PLAN-06AB25A668` 实际返回缺 CAD/BOM、备件型号工程依据、库存为演示数据等门禁原因。Backend `query_spare_part` 没有真实记录时仍返回明确标记 `synthetic=true`、`inventory_status=demo_only` 的固定库存；预留不接受此数据。它没有冒充正式库存，但也不能满足自动派工业务需求。

用户提供的机器 HTML 视图、生产零件几何模型和正式维修 BOM 是不同资料，不能互相代替。不能通过伪造 CAD、库存、人员或降低置信度门禁解决此阻塞。

### 3. 模型、RAG 和图片解析没有本次可用证明

当前 Model `/health`：聊天 `deepseek-chat`，向量 `BAAI/bge-m3`，重排 `BAAI/bge-reranker-v2-m3`，视觉 `Qwen/Qwen2.5-VL-72B-Instruct`，均为 `configured=true/reachable=not_probed/ready=false`。聊天配置地址为 `https://api.deepseek.com`；辅助能力仍为用户选择保留的 SiliconFlow。

当前 RAG `/health`：`milvus=true`、`whoosh=true`，`embedding=false`、`reranker=false`、`llm=false`。这是本次只读状态，不等于已经确认上游永久不可达。

2026-10-05 联调记录中的向量/重排 HTTP 402、视觉 HTTP 403 为**此前观测**，本次未进行收费调用重测，不能断言余额/权限已恢复，也不能把它们冒充为本次实际 HTTP 错误。

### 4. 一键测试入口存在收集错误

`scripts/test_all.py` 的最后一条集成测试命令没有指定 Agent 的 pytest 配置。照该入口执行收集：

```powershell
L:/anaconda/python.exe -m pytest tests/integration tests/e2e tests/performance -o addopts= --collect-only -q --tb=line
```

复现 `tests/integration/test_business_mysql_trace.py:5` 无法导入 `app.harness.trace`：`ModuleNotFoundError: No module named 'app'`。47 项已收集、1 个收集错误、退出码 1。这不是 MySQL/模型不可用，也不能被各服务单独通过的结果掩盖。

指定 `-c pytest-agent.ini` 的跨服务套件可通过，见测试表。本轮只检查，没有修复此入口。

### 5. 版本化日志接口未通过监控代理

对同一个已存在的 trace，实际只读请求：

| 路径 | 返回 |
| --- | --- |
| `8001/api/v1/trace?trace_id=...` | 404，file not found |
| `8001/api/trace?trace_id=...` | 200，12 条明细，无存储警告 |
| `8010/api/v1/trace?trace_id=...` | 200，12 条明细，无存储警告 |

根因是 `services/agent-service/monitor_web_server.py` 的 `_should_proxy` 包含旧 `/api/trace`，不包含 `/api/v1/trace`。当前前端调用旧接口，所以日志页可用，但不能称代理和版本化 API 全部一致。

### 6. 当前质检并非通用自动检测

Backend 当前功能检验是旋转零件的 `runout_mm` 与 `rotation_test`；外观、材料、尺寸、工艺根据保存的数据判断，不通过摄像头、材料实验室或自动量仪采集。

正式 `production_part` 在 `business_records` 中当前无记录；84 条为已有质检结果，不证明已有完整可用于新检测的零件实测源。人工录入必须提供实际规格/观测，不得默认填合格。非旋转产品需要专用规则和采集适配器；没有猜测工业验收阈值。

### 7. 3D 和生产能力范围必须明确

结构化几何支持圆柱、方块、拉伸、旋转、圆角/倒角和布尔操作；STEP 可以导入实体，DXF 需要闭合轮廓、单位、拉伸深度；PDF/图片的模型提取仍需人工确认完整尺寸，且依赖可用的模型能力。

现存 5 个建模任务：1 个 ready，4 个 needs_input。待补信息不是已经生成可用实体，也不应生成虚构预览。

当前虚拟生产能力明确声明：圆柱/同轴通孔、最多 4000 刀路点；不执行真实控制器程序，不包含切断、取件、完整刀具碰撞或产品质量校验。DXF 是实体中截面，PDF 是三视图和参数表，不是完整尺寸标注、工艺签署的生产工程图。当前没有真实 PLC 和通用机床后处理。

### 8. 建模日志与长期任务存储未完全统一

`CADAgent.production_modeling()` 返回独立 `CADModelingService`。生产建模经有界队列和真实 CAD 内核执行，并有输入/输出事件，但该入口不是现有工程查询 Graph 的 MD Skill/统一 Runtime loop。它只记录 `cad_input/cad_analyze/cad_kernel/cad_export` 工具事件，不能宣称已完整具备同一 Agent 调用、MD 技能步骤的统一日志归属。

CAD 设计和加工包 `record.json` 仍保存于 `.runtime/cad-designs/`。成果 STEP/STL/PDF 保留为文件合理，但如果要求所有长期任务元数据均进入 MySQL，则此项尚未完成。未在检查中迁移或删除这些文件。

### 9. 历史报告与说明文件仍需一致性整理

部分历史 `quality_report` 的标题/摘要实际为设备维修报告，或包含诊断、方案、质量记录缺失的旧 HTTP 404。只读检查的现有 `RPT-CDCC35630E` 中文 PDF 明确列出这些不足；不能视作维修完成/质检合格证明。本轮没有重写旧内容或补造缺失事实。

README 中根目录 npm 启动命令、日志本地存储说明、未配置 MySQL 时的回退说明有过时内容；当前根目录无 package.json，实际前端 package.json 只有 build/build:monitor。部分 RAG 文档和源码注释仍是英文，不能称此前“全部注释/文档中文”要求完全达成。

## 四、本轮实际测试结果

Python：`L:/anaconda/python.exe`；Node：`L:/nodejs/node.exe`。五服务分别在独立进程运行，避免同名 `app` 包冲突。

| 命令 | 通过 | 失败 | 跳过 |
| --- | ---: | ---: | ---: |
| `python -m pytest -c pytest-agent.ini -q --tb=line` | 782 | 0 | 0 |
| `python -m pytest -c pytest-backend.ini -q --tb=line` | 74 | 0 | 0 |
| `python -m pytest -c pytest-rag.ini -q --tb=line` | 94 | 0 | 0 |
| `python -m pytest -c pytest-cad.ini -q --tb=line` | 32 | 0 | 0 |
| `python -m pytest -c pytest-model.ini -q --tb=line` | 17 | 0 | 0 |
| `python -m pytest -c pytest-agent.ini tests/integration tests/contracts tests/e2e tests/performance -q --tb=line` | 49 | 0 | 3 |
| `python -m pytest -c pytest-agent.ini tests/test_test_all.py -q --tb=line` | 1 | 0 | 0 |
| 前端 `node --test`，参数为 `rg --files src -g '*.test.mjs'` 全部文件 | 75 | 0 | 0 |

合计本轮分别执行 **1,124 项通过、0 项断言失败、3 项原有跳过**。另有上一节所列默认测试入口 **1 项收集错误**，不计入成功合计，不声称一键测试通过。

跳过为：两项独立 Fake Compose RC/五服务栈烟测、一项显式 RAG 性能测试。没有扩大跳过规则，不将带正式历史数据的当前服务用于写入 E2E 测试资料。两条 websockets 弃用警告保留。

测试环境仅用于子进程：`PYTHON_DOTENV_DISABLED=1`、`APP_ENV=testing`、`MODEL_PROVIDER=fake`、模型密钥为空、`FACTORY_API_BASE_URL=http://127.0.0.1:9`、默认 MySQL 端口 9。跨服务测试额外使用 `BACKEND_STORAGE=sqlite`，清空外部 Model/Backend/CAD 地址。MySQL 专项从配置读取凭据但只在独立随机测试库验证，不输出凭据、修改业务表或删除库。没有调用收费模型或当前工厂控制。

部分套件包含结构/源码契约和隔离替身，不能把用例数量等同于 1,124 次真实工厂操作；实际 API/业务函数和隔离跨服务闭环验证与现场只读结果分开列出。

## 五、构建、页面和文件检查

1. 在 `frontend/monitor-react` 执行 `node node_modules/vite/bin/vite.js build --outDir L:/industry_agent/.runtime/verification/final-project-audit-build --emptyOutDir false`：61 个模块构建通过。主 bundle 886.81 KB，保留超过 500 KB 警告。入口和主 JS SHA256 与当前部署产物一致，未手工修改打包 assets。
2. `python scripts/verify_local_workbench.py` 默认只读：监控/方案/报告/质检/运行记录/CAD 状态/设备列表均 200，匿名工单为预期 401。
3. `node tests/browser/business-returns-readonly.test.mjs`：四个业务页面通过，0 页面异常、0 非预期失败 API、0 业务变更请求。
4. `node .runtime/verification/final-project-audit-browser.mjs`：九个导航入口通过，0 页面异常、0 非预期失败 API、0 业务变更请求。工单只验登录提示，不冒充已经验过授权工单操作。既有 3D STL 画布视角和缩放改变通过。
5. STEP、STL、建模 PDF 下载均为 200；STEP 标头和二进制 STL 长度有效。已有报告 PDF 打开/下载均为 200，响应分别为 inline/attachment。
6. PDF 技能检查：只读提取和 Poppler 渲染现有报告与建模图纸，各 2 页，全部相关页面均查看。中文可读，无乱码/黑块/重叠截断；建模图纸英文参数字距较疏，且页脚仍有未接入刀路的旧说明。报告业务依据不完整另列为缺口，不因可读而判断内容正确。

原 PDF 未编辑或再导出：`.runtime/report-files/report-RPT-CDCC35630E.pdf`、`.runtime/cad-designs/CAD-0FFAEA3FDBE84E02A73A/artifacts/drawing.pdf`。页面截图及渲染仅保存在 `.runtime/verification/final-project-audit/`。

浏览器扩展检查首次因监控导航含 LIVE 标签、严格名称选择器不符超时；修正为核对实际选中项与页面名称后全部通过，没有跳过监控页或移除导航断言。工作区依赖查询工具不可用，改用本机已有 Python/Poppler；没有安装替代依赖。Poppler 的字体替代提示仍保留，实际全部页面可读。

## 六、完成验收还缺什么

- 修复一键测试导入路径与版本化日志代理映射；这些是本轮实际复现的代码问题。
- 在明确的虚拟控制配置下验收整线故障停止、人员确认、可信恢复数据、重启与失败回停；本轮不擅自启用。
- 导入正式设备归属的维修 CAD/BOM 和可用库存/预留适配器，配齐实际小组人员；保持现有门禁。
- 用户恢复辅助模型权限/余额后，另行授权少量真实调用，完成问答、实际诊断和图片解析验收。
- 提供真实产品规格与测量数据，验收 FAIL → 整改 → 新记录复检 → 放行/关闭；通用自动检测需额外采集适配器和产品规则。
- 完成生产建模的统一 Skill/调用归属及长期元数据存储要求；任意零件、完整 CAM、真实机床/PLC 不属于当前已实现能力。
- 用完整业务资料完成一次当前现场故障至经验总结的全过程，处理历史不完整报告，并更新过时说明。

本报告是检查结果，不是生产验收证书，也没有将未执行的真实模型/设备验证记为成功。
