# CAD 虚拟生产与维修返回修复交付

> 历史记录：本文 CAD 本地生成、刀路及虚拟生产部分已停用，当前只保留 BuildCAD MCP 生成，见 [操作说明](cad-modeling-operation-guide.md)。维修部分是当时的交付记录，不因 CAD 替换而删除相关维修功能。

实施日期：2026-10-05。以本地 `L:/industry_agent` 及 `C:/Users/12587/Desktop/Factory` 为依据；未下载远程项目，未提交 Git，未修改配置或删除业务数据。

## 实际完成的功能

CAD 页面现在按以下顺序工作：

```text
需求 / 上传图纸 → CAD 实体与 STEP 回读校验 → 人工确认设计版本
→ 显式填写工艺 → 生成实际刀路 → 计算加工区域几何与耗时
→ 固定虚拟后处理 → 打开 / 下载 NC、刀路及完整加工包
→ 单独人工确认生产 → 本机虚拟工厂独立校验与接收
→ 执行刀位、反馈进度及材料体积 → 完成 / 故障暂停
```

不是把启停接口当作生产下发，也不是前端固定倒计时。执行器读取当前任务的实际刀路，按转速、每转进给和明确标记的虚拟快移速度计算逐段进度；终态尺寸、体积和 CAD 实体关联。

### 必须明确的范围

- 加工首版支持 Z 轴圆柱，以及同轴、同起点、同长度的通孔套筒。单位换算为毫米。
- 现有 CAD 上传和复杂实体建模功能保留。但复杂曲面、螺纹、偏心孔、未知导入特征等不能直接生成本加工器的程序；明确拒绝，不省略特征或替换默认圆柱。
- 后处理器 `virtual-trak-turning-v1` 是此模拟器的固定方言，所有 NC 都含 `VIRTUAL ONLY - NOT FOR REAL MACHINE`。不能用于真实 TRAK 控制器。
- 验证范围是理想加工区域，不包含切断、取件、完整刀具/刀杆/卡盘碰撞或工业质量验收；完成加工不代表质检放行。
- 材料、技术要求、毛坯、夹持、退刀、切深、转速、进给、公差和刀具必须明确填写。不推测工业设备安全或合格阈值。
- 工厂在任一设备存在故障或未运行时拒绝启动加工任务；任务运行中检测到故障会暂停。故障解除后不自动恢复；维修后生产线启动仍由原工单的人员确认和设备恢复校验处理。新增加工接口不调用 `control_device`。

### 可靠性与输入输出

- 加工包绑定已确认设计的摘要，STEP 与加工成果文件再次校验；改变摘要或文件后拒绝下载/下发。
- 同命令同参数不重复生成/下发；不同参数或人员不能复用命令身份。
- 同一加工持久目录仅允许一个 OS 所有权持有者，避免不同进程重复放行。
- 生产 POST 不重试、不跟随重定向；失去响应保留 `uncertain`，只读按任务或命令身份对账。查到已接收任务也不会自动启动。
- 重启后工厂在运行的任务为 `interrupted`，人工重新确认才能恢复。
- 工厂不信任客户端 `passed=true`，独立核对毛坯、夹持、刀具、路径、NC、耗时和终态体积。异常保留暂停/中断状态与错误事件，不伪造完成，不使原遥测循环退出。
- 工具明细按设计/加工包保存真实输入、返回和工厂事件；页面上下排版、显示当前状态、文件及预览。
- 新生产写代理加入本机 Host/端口/来源及请求体边界，保留已有服务身份验证；不扩大原有内部工具访问范围。

## 维修方案与工单：为什么原来像没有返回

之前页面依赖个人工单列表，方案已经生成但尚未派工时难以看见；工单 401 还会被误显示为方案服务不可用。FastAPI 的 `detail` 没有被读取，只显示状态码。

现在方案独立从已有持久化事件结果读取，合并实时快照和实际工单方案快照，5 秒刷新。工单权限失败不会隐藏已有方案。未派发方案和工单空态都显示真实 `workorder_ready`、校验原因和流程停止原因。已删除没有用途的前端人工创建处理函数与误导文案，没有删除工单或方案记录。

实际启动复查又发现第二个根因：事件库约 4.6 GB，79 条事件，最新一条包含约 49 MB 的工具轨迹。原读取方案仍会将完整事件解码，正式接口超过 30 秒不能返回。新增 `runtime/event_plan_reader.py`，使用独立只读 SQLite 连接，仅提取方案、诊断、事件身份和流程状态七类字段，按最新顺序逐条读取；请求最多等待 0.5 秒（允许范围上限 1 秒），后续返回缓存与明确的 `loading/ready/failed` 状态。监测主库/WAL 变化和本地写入，无写事务，不改数据结构、不删历史。关闭应用会中断读连接并等待线程释放。

前端在历史尚未读取完整或读取失败时不会声称当前方案不存在。最终真实接口返回 200、51 条已有方案、79/79 条事件读取完成，复查约 0.1 秒；加载期间也可以先查看已读出的方案。

现场已保存方案 `PLAN-06AB25A668` 不是生成失败：诊断置信度 0.886、证据状态 ready，但缺 CAD/BOM 工程依据、具体备件依据，库存还是演示数据，因而 `workorder_ready=false`。本次没有绕过这些门禁去制造“成功工单”。完整诊断和文件清单见 `docs/repair-return-fix-report.md`。

## 修改的本地文件

CAD Agent：

- `services/agent-service/app/agents/cad/modeling_api.py`
- 新增同目录 `turning_program.py`、`manufacturing_schemas.py`、`manufacturing_client.py`、`manufacturing_owner.py`、`manufacturing_service.py`
- 新增 `services/agent-service/tests/test_cad_turning_program.py`、`test_cad_manufacturing_api.py`、`test_monitor_cad_production_proxy.py`

CAD 前端：

- `frontend/monitor-react/src/app/production-cad/ProductionCadWorkspace.jsx`、`productionCad.mjs`、`productionCad.css`、`productionCad.test.mjs`
- 新增同目录 `ManufacturingPanel.jsx`、`manufacturingUi.test.mjs`
- 用当前 Vite 源码构建更新 `frontend/monitor/` 生成产物，没有手工改打包 assets。

维修：

- `frontend/monitor-react/src/app/App.jsx` 及新增 `apiRequest.mjs`、`maintenanceWorkspace.mjs` 和真实组件/契约测试。
- `services/agent-service/app/api/server.py`、新增 `api/maintenance_plans.py`；`runtime/event_store.py`、`runtime/durable_store.py` 加只读列表；新增 `runtime/event_plan_reader.py` 及后台读取关闭钩子。
- `services/agent-service/monitor_web_server.py` 的方案代理、方案 Evidence 和 CAD 生产写边界。
- 新增 `services/agent-service/tests/test_maintenance_plan_returns.py`。

本地虚拟工厂（不在 Industry-Agent 仓库内）：

- `C:/Users/12587/Desktop/Factory/server.py`
- 新增 `simulator/production.py`、`tests/test_production.py`

跨服务：新增 `tests/contracts/test_virtual_cad_production.py`，默认读取本地 Factory 源码，可通过仅测试进程 `VIRTUAL_FACTORY_SOURCE` 指定其他本地目录。缺少源码时明确失败，不下载替代实现或自动跳过。

工作期间另有 `app/tools/router/intent_classifier_tool.py` 出现修改，它不属于本任务，没有覆盖或纳入本任务修改说明。

## 测试与验证

全部使用临时目录/数据库或真实临时 HTTP 端口，没有将被测逻辑 mock 掉；没有向 4529 发送生产或控制命令，没有调用收费模型、生产数据库。测试进程设置 `PYTHONUTF8=1`、`PYTHONIOENCODING=utf-8`，保持生产配置不变。

验证记录位于 `.runtime/verification/production-cam-20261005/`。

已执行的命令：

```powershell
$env:PYTHONUTF8='1'
$env:PYTHONIOENCODING='utf-8'
& 'L:/anaconda/python.exe' -m pytest -c pytest-agent.ini -q
& 'L:/anaconda/python.exe' -m pytest -c pytest-backend.ini -q
& 'L:/anaconda/python.exe' -m pytest -c pytest-rag.ini -q
& 'L:/anaconda/python.exe' -m pytest -c pytest-cad.ini -q
& 'L:/anaconda/python.exe' -m pytest -c pytest-model.ini -q
& 'L:/anaconda/python.exe' -m pytest -c pytest-agent.ini services/agent-service/tests/test_cad_manufacturing_api.py -q
& 'L:/anaconda/python.exe' -m pytest -c pytest-agent.ini services/agent-service/tests/test_cad_turning_program.py -q
& 'L:/anaconda/python.exe' -m pytest -c pytest-agent.ini services/agent-service/tests/test_monitor_cad_production_proxy.py -q
& 'L:/anaconda/python.exe' -m pytest -c pytest-agent.ini services/agent-service/tests/test_maintenance_plan_returns.py -q
```

五个同名 `app` 包分别在独立测试进程导入。非 Agent 测试同样禁用 dotenv、清空供应商密钥/正式服务地址，使用测试模式和临时数据库；Model 仅在隔离测试进程显式使用 Fake。RAG 配置合法的 `MYSQL_HOST=127.0.0.1`、`MYSQL_PORT=1`、隔离测试用户名及空密码，不能连接正式数据库。没有改生产配置使测试通过。

跨服务另设 `PYTHON_DOTENV_DISABLED=1`、`APP_ENV=testing`、空 `AGENT_API_TOKEN`、`FACTORY_API_BASE_URL=http://127.0.0.1:9`，实际调用的 Factory 客户端注入临时 HTTP 地址：

```powershell
& 'L:/anaconda/python.exe' -m pytest -c pytest-agent.ini tests/contracts/test_virtual_cad_production.py -q
& 'L:/anaconda/python.exe' -m pytest -c pytest-agent.ini tests/integration/test_virtual_line_team_contract.py tests/contracts/test_virtual_cad_production.py -q
# 以下命令工作目录为 C:/Users/12587/Desktop/Factory：
& 'L:/anaconda/python.exe' -m pytest -q
# 以下命令工作目录为 L:/industry_agent/frontend/monitor-react：
$testFiles = @(rg --files src -g '*.test.mjs')
& 'L:/nodejs/node.exe' --test $testFiles
& 'L:/nodejs/node.exe' node_modules/vite/bin/vite.js build
```

已验证结果：

| 验证 | 通过 | 失败 / 跳过 | 实际日志 |
| --- | ---: | --- | --- |
| Agent 无排除最终全量 | 652 | 0 / 0 | agent-stream-final.log |
| Backend 全量 | 35 | 0 / 0 | backend-all-final.log |
| RAG 全量 | 48 | 0 / 0 | rag-all-reverified.log |
| Document-CAD 全量 | 8 | 0 / 0 | cad-all-final.log |
| Model 全量（隔离 Fake） | 5 | 0 / 0 | model-all-final.log |
| CAD 加工 API 专项 | 13 | 0 / 0 | api-final.log |
| 真实生成器，包含两次实际 CADKernel | 54 | 0 / 0 | turning-final.log |
| 维修独立读取 / 大轨迹投影 / 跨连接更新专项 | 9 | 0 / 0 | maintenance-stream-final.log |
| 真实 CAD API → 工厂 HTTP → 执行 / 暂停 / 人工恢复 / 重启 | 4 | 0 / 0 | workbench-http-final.log |
| CAD + 注册/停线/派工/维修确认/恢复跨服务契约 | 5 | 0 / 0 | cross-workflows-final.log |
| 工厂完整测试（62 个新增、6 个原有） | 68 | 0 / 0 | factory-all-verified-2.log |
| 全部前端行为 / 辅助函数 / 真实组件测试 | 51 | 0 / 0 | frontend-loading-final.log |
| Vite 从当前源码构建 | 成功 | 原有大 bundle 警告，未抬高警告阈值 | frontend-loading-build.log |

上述专项已包含在相关全量中，不将专项与全量相加制造通过数量。跨服务测试有 2 项现有 websockets 弃用警告；构建保留现有大包警告。

HTTP 验收覆盖工作台代理 → 真实 Agent API → 真实 CadQuery → 实际本地 Factory 源码的临时 HTTP 服务，打开八类设计产物（含中文 PDF 文本验证）、设计确认、刀路文件、人工生产确认、幂等、实际执行终态尺寸/体积。维修契约使用临时 Backend/Agent 和隔离工厂适配器验证真实业务函数，不向正式产线写入。

中途失败未删除：首次功能缺失的 API、生成器和前端 RED，审查发现的所有权/UI 对账/编码/数值问题，以及一次 Windows 拒绝 HTTP 请求时的连接中止。大历史库投影先 2 失败 / 7 通过，前端状态先 1 失败 / 6 通过，加载中误报先 1 失败 / 7 通过（frontend-loading-red.log），修改后通过。RAG 首轮因测试隔离时把必需 MYSQL_HOST 留空为 1 失败 / 47 通过（rag-all-final.log）；改为合法但不可连接正式库的隔离地址后 48 通过，未改被测代码或校验标准。初次维修暂态 RED 与 Windows 子进程编码失败细目在维修报告保留。

最终独立只读复核没有 Critical/Important：并发 16 次快照只启一个 reader，WAL 外部写入可以刷新，执行中的读连接可关闭，新旧结果格式与人工诊断标记保留。唯一新增的 Minor 加载误报已经按上述 RED → GREEN 修复。最终 `git diff --check` 无差异格式错误。

## 配置、持久化与恢复

- 未修改 `.env`、供应商、模型、端口或工业合格阈值。加工客户端读取现有 `FACTORY_API_BASE_URL`，仅允许本机 HTTP；不接受外部 PLC 地址。
- 设计仍在原 `.runtime/cad-designs/`；每个加工包新增在该设计的 `manufacturing/CAM-*/`，有记录、NC、刀路、包和文件摘要。
- 工厂生产任务新增独立 `output/production/jobs.json` 与执行器所有权文件。没有迁移/删除现有数据库、原图、方案或工单。测试未创建正式工厂的生产任务。
- CAD 源码备份：`.runtime/backups/20261005-cad-production/README.md` 与同路径源码，含 SHA256。
- 维修备份：`.runtime/backups/20261004-repair-return/restore-manifest.md`。
- 生产代理接手备份：`.runtime/backups/20261005-cad-proxy/`，不覆盖上一次备份。
- 工厂 `server.py` 备份：`.runtime/backups/20261005-virtual-factory-production/`；工厂交付明细见验证目录 `factory-delivery.md`。
- 大历史库读取改动：`.runtime/backups/20261005-maintenance-read-stream/RESTORE.md`。
- 工作台完整 HTTP 验收测试改动：`.runtime/backups/20261005-cad-workbench-acceptance/RESTORE.md`。
- 恢复前先保留当前文件及后来用户改动，再逐文件复制备份回原路径；新增模块可以先取消路由挂载而不删除记录。前端通过原 Vite 命令重建。不得删除业务目录或数据库；后续生产记录不随代码恢复回滚。

## 当前运行生效与尚需环境验收

前一阶段旧实例曾返回 maintenance 列表 404、production 能力 404，不能用离线测试冒充当时现场可用。按用户要求先完成 3D、再测试全链路，后续确认端口空闲后已启动本地虚拟 Factory 与原 `scripts/start_all.py`，并在确认进程归属后重载本任务的服务实例；没有调用真实 PLC，没有在正式工厂提交加工/控制命令。最新前端构建已由 8001 提供。

2026-10-05 最后一次真实只读核对：

| 入口 | 实际结果 |
| --- | --- |
| 8001 `/api/cad/designs/status` | HTTP 200，内核 ready=true、production_connected=true |
| 4529 `/api/production/capabilities` | HTTP 200，虚拟执行器 ready=true |
| 8001 `/api/maintenance/plans` | HTTP 200，51 条方案，79/79 事件读取完成；113 ms |
| 8001 `/api/monitor/snapshot` | HTTP 200，4 台设备 |
| 8001 `/api/reports` | HTTP 200，14 份记录 |
| 8001 `/api/v1/quality/checks` | HTTP 200，83 条记录 |
| 8001 `/api/workorders`、`/api/team/me`（无会话） | HTTP 401，仍要求维修账号登录；没有取消身份门禁 |
| 8030 Backend health | HTTP 200、ready=true；当前适配器为 SQLite |
| 8050 Document-CAD health | HTTP 200，但正文 status/backend=unavailable；依赖 MySQL 未连接，不能只凭 200 声称就绪 |
| 8040 Model health | HTTP 200，配置存在但各能力 reachable=not_probed、ready=false，未调用收费接口探测 |
| 8020 RAG health | HTTP 200；Milvus 不可用，其余组件标记不代表收费供应商实际可达 |
| 8001 `/?view=cad` | HTTP 200，加载本轮构建的 index-DaxlV0sb.js |

再次启动时仍使用现有方式；不要重复开同端口实例，不复制或覆盖 `.env`：

```powershell
# Factory 原启动终端（先正常停止旧进程，保留其数据）：
& 'L:/anaconda/python.exe' 'C:/Users/12587/Desktop/Factory/server.py'
# Industry-Agent 原启动终端，工作目录 L:/industry_agent：
$env:PYTHONPATH='L:/industry_agent'
$env:PYTHONUTF8='1'
& 'L:/anaconda/python.exe' scripts/start_all.py
```

一键脚本会复用已占用端口的服务；以后修改 Python 源码要辨明实例归属再正常重载，不能靠启动第二个同端口进程更新。操作说明见 `docs/cad-modeling-operation-guide.md`。

**仍受阻而未冒充完成的部分：** Document-CAD 的 MySQL 连接不可用，现场未发现运行的 MySQL/MariaDB 服务或 3306 监听；正式 CAD/BOM/备件库存依据不足会继续阻止自动派工。本轮没有凭空补 CAD/BOM、人员/库存演示数据，没有自动安装或删改数据库。RAG Milvus 不可用；先前向量/重排 HTTP 402 余额错误未通过收费调用复验。Model 配置完整不代表模型可达；图片需求解析和全新 RAG 模型问答仍需实际供应商能力/额度验收。明确尺寸的本地圆柱/套筒建模不依赖收费解析。

未执行正式故障注入、正式加工任务、正式派工完成、现场浏览器手动点击、真实机器生产或工业质检验收；这里只是已有服务的只读现场连通与隔离真实函数/HTTP 业务回归。所有测试通过不等于所有生产依赖已恢复，也不等于生产验收通过。
