# 工单整机图纸检索与部件定位分离说明

日期：2026-10-09。依据当前本地项目实施；没有访问或覆盖远程项目。

## 本次完成的范围

四台机器使用同一条整机图纸检索链路，不再由工单页面根据设备名称猜 HTML 文件名。图纸文件仍保存于本地图纸目录，设备、机型、图号、版本、文件名等目录信息保存于 MySQL，由服务查询返回。

实际调用链：

```text
工单设备编号与已保存的机型/版本
  → Monitor 白名单代理 GET /api/cad/drawings
  → Agent API 调用现有 query_drawing 工具（reference_only=true）
  → Document-CAD 查询 MySQL cad_device_drawings
  → 校验设备、版本、文件地址
  → 网页加载返回的 HTML 三维查看器
```

这是只读图纸查询，不重新执行诊断、不重新派工、不调用设备控制。复用已有 ToolRegistry/MCP 调用与工具输入输出记录，没有新增智能体、节点或技能，也不会把一次只读工具查询伪记为完整 Agent/Skill 执行。

| 设备编号 | 本地现有资料 | 最新本地只读联调 |
| --- | --- | --- |
| TRAK-TC820LTYSI-001 | TC820si.html，原始 eDrawings 设备图纸 | available，查看地址 HTTP 200 |
| LNS-QL-SERVO-80-S2-001 | QLS80S2.html，设备图纸与参考模型 | available，查看地址 HTTP 200 |
| RENISHAW-EQUATOR300-001 | Equator300.html，设备图纸与参考模型 | available，查看地址 HTTP 200 |
| ELITE-CS612-ROBOT-001 | 当前目录没有该机器的图纸 | not_found，明确提示未登记 |

机器人查询、登记、显示使用与其它三台相同的代码路径，但本次没有它的真实资料，不能拿车床图冒充机器人。隔离测试验证了取得真实文件并登记后可通过同一路径返回；测试夹具未写入项目数据库或发布为机器图纸。

## 页面行为

- 按工单的设备编号检索；存在机型时一并限定，版本编号无值时使用已有版本标签。
- 默认返回已登记的当前图纸；工单指定版本时精确检索该版本。多个返回版本可以选择。
- 图纸显示在原有工单故障定位区域，保留原 HTML 查看器的旋转、缩放与全屏。
- 切换工单会清除旧图纸；取消旧请求，迟到结果不覆盖当前设备。
- 未登记、检索失败、等待结果分开显示；刷新图纸仅发起只读查询。
- 不再用遮挡模型的红色“CAD 部件关系暂不可用”浮层。整机图纸与部件定位状态分开显示。
- “刀塔旋转超时”等故障文本不作为部件编号查询，也不冒充图纸名称。原工单目标文本仍保留。
- 仅明确的结构化部件/零件号才调用部件查询；即使返回部件资料，也不宣称已在模型中自动高亮。

## 已修改的文件

原有文件（修改前已有逐文件备份）：

- `shared/local_drawings.py`：本地查看器地址校验、文件存在及目录边界校验、已有三份资料的设备归属。已知文件大小写变化不能绕过归属校验。
- `services/document-cad-service/app/repository.py`：MySQL 整机图纸目录、登记、查询、纯元数据校验、大小写不敏感数据库上的精确回查。
- `services/document-cad-service/app/main.py`：`query_drawing` 增加整机目录模式，与原部件工程查询分开，保留原查询功能。
- `services/agent-service/app/api/server.py`：只读 `/api/cad/drawings`，复用工具执行器，验证返回设备、机型、版本和已知文件归属，保留现有鉴权。
- `frontend/monitor-react/src/app/App.jsx`：移除工单页面硬编码文件推测，接入独立图纸面板。
- `services/document-cad-service/tests/test_runtime_connectivity.py`：临时 SQL 测试适配器增加目录表及大小写不敏感排序规则。

新增文件：

- `frontend/monitor-react/src/app/WorkorderDrawingPanel.jsx`：四设备通用的查询、查看、版本选择与定位状态。
- `services/document-cad-service/register_device_drawing.py`：真实文件登记入口，默认只核查，显式 `--apply` 才写目录。
- `services/document-cad-service/tests/test_device_drawing_catalog.py`：实际仓库/API/登记入口回归。
- `services/agent-service/tests/test_workorder_drawing_api.py`：实际 API 回归。
- `services/agent-service/tests/test_workorder_drawing_http_contract.py`：实际 API→ToolRegistry/MCP HTTP→CAD API→隔离 SQL 仓库契约测试。
- `tests/browser/workorder-drawings.test.mjs`：实际工单组件的浏览器回归。
- 本说明文档。

前端产物通过 `npm run build` 从当前源码生成，没有手工修改打包后的 assets。本工作目录有其它并行改动；上述清单是本次图纸检索范围，不将质量/虚拟生产等并行改动记作本次成果。

## 数据和登记方法

长期目录数据保存在 Document-CAD 当前配置使用的 MySQL 新表 `cad_device_drawings`。本次没有加入产品 SQLite、改写生产配置、复制密钥、删除旧数据库或数据卷。

表包含图号、版本编号、设备编号、机型、名称、HTML 文件名、版本标签、当前版本标记、资料类型。主键为图号与版本编号；设备/当前版本有索引。SQL 参数化，条件按设备与其它限定组合；查询后再次逐字核对标识，避免 MySQL 排序规则造成范围放宽。

服务初始化以 `CREATE TABLE IF NOT EXISTS` 建立新目录。只对确实存在的三份已知资料执行 `INSERT IGNORE`，不覆盖已有目录元数据；没有编造 BOM、部件关系或机器人记录。原有 `cad_drawings`、`cad_entities`、`cad_entity_relations` 的数据保留，原工程查询保持可用。启动需要现有数据库账号具备必要建表权限；权限/数据库不可用时返回不可用，不退化成假数据。

目前已知三份资料没有版本标注，保留空值并显示“版本未标注”，不猜测为 V1。新版本用新的真实版本编号登记；工具不会覆盖相同图号/版本对应的其它设备或文件，也不会自动将旧版本取消为当前版本。

取得机器人真实 HTML 查看器后，可使用相同入口：

1. 将实际文件放入 `L:/industry_agent/frontend/monitor-react/public/drawings/EliteCS612.html`。该文件现在不存在，下面命令不是已完成的登记。
2. 在 `L:/industry_agent/frontend/monitor-react` 执行 `npm run build`，发布本地静态文件到当前 Monitor 目录。
3. 在项目根目录执行核查：

```powershell
L:/anaconda/python.exe services/document-cad-service/register_device_drawing.py `
  --device-id ELITE-CS612-ROBOT-001 `
  --device-model CS612 `
  --drawing-id DEVICE-REFERENCE-CS612 `
  --name "CS612 机器人整机图" `
  --filename EliteCS612.html
```

4. 确认设备与文件归属、实际版本后，再以相同参数追加 `--apply` 登记。已核实版本可填写 `--version`、`--version-label`；历史版本可加 `--historical`。只登记可信 HTML，查看器会执行其中原有脚本。

默认核查会校验真实文件、目录边界、已知设备归属、必填字段和长度，不连接数据库。但只有实际登记才能检查 MySQL 中已有主键是否冲突；核查成功不意味着已保存。

本次目录迁移是新增表及幂等登记已有文件，不搬移或删除旧数据。未来批量导入前，应使用现有受控备份流程同时备份目录元数据与对应静态文件；本次没有导出业务数据或密钥。

## 测试和联调结果

每个新增修复先补失败用例再修改：观察到旧链路 API 404、页面硬编码；另外实际复现了已知文件串图、文件大小写绕过、数据库大小写不敏感匹配、版本标签/机型丢失、登记预核查漏校验。失败测试保留，没有放宽通过条件。

最终相关回归：

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| CAD 服务全量 | `L:/anaconda/python.exe -m pytest -c pytest-cad.ini -q` | 100 通过、0 失败、1 跳过 |
| Agent 图纸/模型既有契约与工具回归 | 下方 Agent 命令 | 78 通过、0 失败 |
| 真实工单/维修方案组件浏览器 | 下方浏览器命令 | 14 通过、0 失败、0 跳过 |
| 前端全量单元测试 | `node --test`，目录 `frontend/monitor-react` | 225 通过、0 失败、0 跳过 |
| 前端构建 | `npm run build`，同上目录 | 成功；仍有现有大于 500 kB 分包警告 |
| 源码空白检查 | 对上述原有文件执行 `git diff --check -- ...` | 通过；仅现有 LF/CRLF 提示 |
| 实际登记入口，默认核查 | TC820 原文件参数，不加 `--apply` | 核查通过，未写入目录 |

Agent 命令（项目根目录）：

```powershell
L:/anaconda/python.exe -m pytest -c pytest-agent.ini `
  services/agent-service/tests/test_workorder_drawing_api.py `
  services/agent-service/tests/test_workorder_drawing_http_contract.py `
  services/agent-service/tests/test_local_drawings_returns.py `
  services/agent-service/tests/test_local_drawing_evidence.py `
  services/agent-service/tests/test_cad_modeling_contract.py `
  services/agent-service/tests/test_tool_optimization.py -q
```

浏览器命令（项目根目录；使用本机已安装的 Chrome/Playwright）：

```powershell
$env:PLAYWRIGHT_MODULE_PATH='C:/Users/12587/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs'
$env:CHROME_EXECUTABLE='C:/Program Files/Google/Chrome/Application/chrome.exe'
node --test --test-concurrency=1 tests/browser/workorder-drawings.test.mjs tests/browser/maintenance-drawings.test.mjs
```

CAD 跳过项为已有符号链接用例：主机不允许创建隔离符号链接；没有扩展跳过范围。测试 SQL 文件仅在临时目录使用，测试连接断言隔离地址；没有调用正式数据库、收费模型或设备控制。HTTP 契约测试启动单独 CAD 测试进程，避免同名 `app` 包混淆，并核查 Monitor API 白名单保留、内部工具端点不对外开放。

本轮早些时候还执行过 Agent 全量 `L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q`，结果为 **1923 通过、70 失败、2 跳过**。失败涉及已停用 BuildCAD 的旧预期，以及报告/工单生命周期适配器等非本次范围；没有删除失败用例，也没有宣称整个项目全量通过。并行代码修改期间曾出现技能目录与工具注册暂不一致导致收集失败，后续相关测试已恢复并通过。本次未逐项修复这 70 个失败，不能把相关回归通过写成项目全量或生产验收通过。

完成前独立只读复核发现的归属、精确限定、UI 版本、预核查问题均已先复现再修复，复核没有新的本次范围阻断项。

最后仅重载本地 Document-CAD（8050）和 Agent（8010），沿用其原进程启动参数与环境，未写配置；Monitor（8001）未重启。经 Monitor 真实 GET 查询，三份目录结果均来自 `mysql-device-drawings`，三个 HTML 地址均为 HTTP 200；机器人为 `not_found`。工单页 HTTP 200，引用本轮新构建产物。联调没有执行诊断、派工、模型生成或设备控制。

## 恢复方法

修改前备份位于 `L:/industry_agent/.local-backups/workorder-drawings-20261009/`，保留上面六个原有文件的相对路径。备份包含修改前已有的用户改动，不包含 `.env`、密钥或数据库。

恢复时先停止修改相关源码，逐个将当前文件与该备份比较，只撤销本次新增段落/导入/组件替换；工作目录有后续并行改动，不能将整个目录或旧 `App.jsx`、`server.py` 直接覆盖回去。若确认某个文件此后没有其它变化，才可用对应备份恢复该单个文件。回退新增文件前先移除其导入及测试引用，再重新执行相关测试和前端构建，以原启动方式重载两个本地服务。

源码回退不要求删除新 MySQL 表；保留它不会删除旧数据，今后重新启用仍可使用。不要为了回退执行 DROP、清空原 CAD 表或删除图纸目录/数据卷。若以后需要撤销个别登记，应先核对图号与版本、备份记录，再走授权的数据管理流程；本次没有实现或执行批量删除。

## 尚未完成的精确部件定位

整机图纸可查看不代表能自动定位故障部件。当前部件工程目录缺少真实记录；“刀塔旋转超时”是故障描述，不是部件编号。精确定位还需要每台设备的实际部件号/零件号、设备归属、装配/BOM 关系、安装位置、对应图纸版本，以及查看器模型对象 ID 的映射和可调用的高亮接口。

本次保留原部件查询，防止用故障文本全库模糊检索并假装定位成功。未新增虚构 BOM、故障部件坐标或机器人模型，也未将整机参考资料提升成工程维修证据。取得上述真实资料后才能继续接入精确高亮；不能仅靠整机 HTML 外观可靠推断装配和维修位置。
