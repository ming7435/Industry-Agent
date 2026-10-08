# 本地 FreeCAD MCP 接入与验证报告

日期：2026-10-07。范围：本地 CAD 建模链及其页面、启动器和回归测试。依据是当前 `L:/industry_agent` 的代码和用户批准的本地部署方案，不是远程提交。

## 结论与边界

**已经实际打通**：页面提交需求 → CAD Agent 节点 → 中文 Markdown Skill → 本地受限 Tool → 标准 MCP stdio → FreeCAD 内核创建实体 → STEP 回读校验 → STL/STEP/FCStd 导出 → 页面真实 STL 交互预览与下载。

当前页面与正式服务仅挂载 `/api/cad/freecad` 生成接口。旧 `/api/cad/buildcad` 接口未挂载；旧远端源码、工具定义和测试尚未全量清理，不能声称旧代码已全部删除。

**全量 Agent 回归尚未全绿**。加入正四面体及复核修复后，最新全量为 **1301 通过、67 失败、25 个初始化错误、0 跳过**。其中旧 BuildCAD 的四个测试文件共有 66 项失败，仍要求已经停用的远端流程；另有 1 项维修闭环测试缺少隔离 Backend 地址，25 项维修流程测试初始化使用监督角色而被同期修改后的 Backend 拒绝。完整逐项名单见 [回归未通过项](freecad-local-regression-failures.md)。没有删除失败测试、扩大跳过范围或重新启用第二套活动生成器来制造通过，也没有覆盖其他聊天的维修身份修改。

本轮不是其他服务、维修流程或真实生产设备的全面验收。不下发刀路，不控制工厂设备，不把几何校验当作加工放行。

## 架构与具体文件

```text
ProductionCadWorkspace
  │ POST /api/cad/freecad/runs（稳定 command_id、原始 prompt）
  ▼
modeling_api：Redis NX 认领 + 有界后台执行
  ▼
CADAgent.run_freecad → LangGraph model_3d
  ▼
production_modeling.md / production_modeling_skill / build_model
  ▼
ToolRegistry.freecad_mcp（local_only，未向通用模型开放）
  ▼
FreeCADClient：stdio JSON-RPC → freecad-mcp.execute_code
  ▼
本机 FreeCAD GUI → XML-RPC 127.0.0.1:9875
  ▼
固定模板建实体 → STEP 导出/回读 → STL、FCStd、manifest
  ▼
鉴权下载接口 → STLLoader + OrbitControls 实际三维预览
```

| 文件 | 本轮行为 |
| --- | --- |
| `services/agent-service/app/agents/cad/agent.py` | 新增 `run_freecad`，复用现有图、Trace 和节点，不旁路 Skill。 |
| `services/agent-service/app/agents/cad/graph.py` | `model_3d` 调用唯一建模 Skill；完整圆柱/同轴通孔可确定性解析；模型只能返回结构化参数，缺项不执行；失败与不确定状态保留真实工具回包。 |
| `services/agent-service/app/skills/cad/production_modeling.md` | 中文 Markdown，声明 `freecad_mcp` 及规范化、建模、返回步骤。 |
| `services/agent-service/app/tools/cad/freecad_mcp.py` | 校验参数、固定脚本模板、有界单实体建模、导出和归属校验；阻止同命令重复执行；不依赖会被优化模式去掉的 `assert` 做业务校验。 |
| `services/agent-service/app/clients/freecad.py` | 本机 stdio 握手、工具调用、有界响应和子进程回收；写入超时不重试；RPC 运行但 GUI 卡死不能算已就绪。 |
| `services/agent-service/app/agents/cad/modeling_api.py` | `/api/cad/freecad/status`、提交、回查与固定名称下载；稳定幂等身份、参数摘要和两席后台上限。 |
| `services/agent-service/app/api/server.py` | 仅挂载 FreeCAD 建模路由，保留鉴权。 |
| `services/agent-service/app/tools/registry.py` | 新工具是本地作用域工具，不增加通用模型的写入权限。定义数从 76 到 77；通用 schema 数仍为 58。 |
| `services/agent-service/monitor_web_server.py` | FreeCAD 写请求纳入现有本机来源/Host/Origin/正文长度保护；二进制下载保持正确响应头。 |
| `frontend/monitor-react/src/app/production-cad/ProductionCadWorkspace.jsx` | 本地连接、需求示例、原始输入、只读轮询、执行路径/回包、结果和下载；手动刷新后恢复自动轮询。 |
| `frontend/monitor-react/src/app/production-cad/FreeCadModelViewer.jsx` | 加载真实 STL；拖动、缩放、平移、复位、自动旋转、全屏及资源回收；损坏网格/WebGL 错误不伪装成功。 |
| `frontend/monitor-react/src/app/production-cad/freecad.mjs` | 状态、固定下载地址、临时浏览器会话及网络不确定状态。 |
| `frontend/monitor-react/src/app/production-cad/productionCad.css` | 三维区域和控制按钮样式，继续纵向排版。 |
| `scripts/freecad_runtime.ps1` / `freecad_bootstrap.FCMacro` | 隐藏的独立 FreeCAD 进程、项目内配置、回环 RPC、就绪确认；停止前核对路径和启动时刻。兼容 Windows PowerShell 5.1 和当前 7.x。 |
| `scripts/start_all.py` | 开发环境自动启动/复用已安装本地 CAD，启动失败不阻止其他服务；不下载依赖、不修改 `.env`。 |
| `scripts/freecad_smoke.py` | 调用真实上游 MCP、生成钻孔长方体并回读导出文件。 |

前端部署产物通过 `npm run build` 从当前源码生成，没有手工修改打包 JS。工作区有其他聊天的诊断/工单修改；这里不把这些修改计入 CAD 工作。

## 修复的实际问题

- BuildCAD 远端 `render_preview` 的失败被本地可验证 FreeCAD 生成链替代，不再用“工具发现成功”冒充“出图成功”。
- STEP 导出后 FreeCAD 的缓存三角化可能令 `BoundBox` 显示 29.96 而非解析几何的 30 mm。修复为 `optimalBoundingBox(False, False)` 做解析尺寸对照，**没有放宽原有体积/尺寸回读容差**。
- 手动刷新令原轮询版本失效后，旧页面可能不再继续取结果；现在重新触发轮询，仍然只读。
- 执行失败的默认正文曾仍为“请补形状和尺寸”；现在正文和错误状态一致。
- 上游可能以普通文本返回 GUI 超时且 `isError=false`；现在按 `outcome_unknown` 保留实际回包，不自动重放。
- RPC 进程存在但 GUI 任务已卡死时，不再显示已连接可建模。
- manifest 归属、单位、实体个数、体积、尺寸、文件完整性使用显式校验；布尔值不能冒充数字。
- Windows PowerShell 5.1 在参数默认值求值时缺少 `PSScriptRoot`，以及无 BOM 的中文脚本解码问题已复现并修复；默认目录在脚本体解析，脚本采用 UTF-8 BOM。
- 新增正四面体结构化操作，固定顶点和面朝向构造真正实体。构造时校验四个等边三角面、六条等长边及解析体积；沿用 STEP 回读和同一 MCP 工具，不另建生成链。
- 复核发现原始需求仅校验全局数字集合可能借用长度充当孔径、丢掉键槽/多孔、交换长和高。新增复现测试后，改为完整形状与尺寸语义逐字段比对；有未解析残余特征不能自动执行。
- 上游 stdlib XML-RPC 在响应断连时可能隐式重发。目录认领外再加入模板执行端原子 `.execution-claimed`，底层重发不再执行第二次几何；仅可读取同一任务已验证文件，否则仍不确定。
- `type/mode/axis` 收到数组及尺寸超大整数时，原先可能抛 TypeError/OverflowError 成为 HTTP 500；现在受控校验并返回 422，未认领、未执行。
- 已有 FreeCAD GUI 但 RPC 未启动时，启动器曾只凭进程存在误报就绪。现在核对就绪文件与 PID、端口归属和实际只读 RPC 状态；统一启动器明确要求 `rpc_ready=true`。

## 真实出图证据

真实页面最新运行：

```text
FC-1caefa4da09f57f0517616e6da63b42188386529ef10f52d814b7225f37e5f80
需求：外径30mm、长50mm的销轴，带同轴通孔直径10mm
status: completed
solid_count: 1
bounds_mm: [30, 30, 50]
volume_mm3: 31415.926535897932
step_roundtrip: true
```

真实页面检查没有替换 API：使用运行中的 Monitor、Agent、Redis、MCP 和 FreeCAD。一次 CAD POST、一次实际 `execute_code`；拖动改变实际画布，STL/STEP/FCStd 的下载均 HTTP 200，STEP 文件头为 `ISO-10303-21;`；刷新恢复原运行，无第二次生成 POST，页面 JS 错误 0 个。

证据：`.runtime/verification/freecad-live/result.json`、`page.png`。完整实际文件位于 `.runtime/cad-models/上述运行编号/`。

独立真实内核 smoke：20 × 15 × 10 mm 长方体切除半径 3 mm 的贯穿孔，1 实体、体积 `2717.256661176919 mm³`，STEP 回读一致、STL 120 个三角面。证据：`.runtime/verification/freecad-20261007-212303/verification.json` 和三种导出文件。

这些是真实几何与协议证据，不是离线测试替身生成的生产数据。

### 新增正四面体及修改尺寸的实际页面验收

输入：`正四面体（立体三角形、四面相同、边长100mm）`。实际页面运行：

```text
FC-cb3fd68a48a072c95248db5a4972f12a6af616937adb881d586df07bc0958ef6
completed；1 实体；4 面、6 边；六边均为 100 mm
volume_mm3: 117851.1301977579
bounds_mm: [100, 86.60254037844386, 81.6496580927726]
step_roundtrip: true
```

将边长改为 120 mm 后，再次通过同一个页面提交得到新的运行 `FC-2b56234666b1322e2d0f6191350df24a6292c0cde93f06e411cfd0769bf04c3d`，六边均约 120 mm、体积 `203646.75298172564 mm³`。两次真实出图均可旋转，三种导出均 HTTP 200；刷新保留第二版本，无额外生成 POST、无页面 JS 错误。证据：`.runtime/verification/freecad-tetrahedron-live/result-100.json`、`result-120.json` 与对应页面截图。独立真实节点检验还保存在 `freecad-tetrahedron-100.json`、`freecad-tetrahedron-120.json`。

## 实际执行的测试

下列数字是执行结果，不将不同套件重复计数相加为唯一总测试数。

| 命令 / 范围 | 结果 |
| --- | --- |
| 下方专项 Python 命令 | 159 通过、0 失败、0 跳过。 |
| `L:/anaconda/python.exe -m pytest tests/test_freecad_runtime.py tests/test_freecad_smoke.py tests/test_freecad_start_all.py -q` | 16 通过、0 失败、0 跳过。含真实 Windows 进程身份核对和 5.1 默认目录复现回归。 |
| `node --test tests/browser/freecad-workspace.test.mjs` | 10 通过、0 失败、0 跳过。API 边界是测试响应；React、STLLoader、WebGL 与交互真实执行。 |
| 前端全部 `*.test.mjs` + `npm run build` | 最近执行 158 通过、0 失败、0 跳过；构建成功，有原有大 bundle 警告。 |
| `L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q --tb=no --junitxml=.runtime/verification/freecad-tetrahedron-agent-regression.xml` | **1301 通过、67 失败、25 个初始化错误、0 跳过**。逐项名单见附录。 |
| `.runtime/freecad-mcp-venv/Scripts/python.exe scripts/freecad_smoke.py` | 真实 MCP 和钻孔长方体成功，STEP/STL 回读成功。 |
| `node .runtime/verify-freecad-page.mjs` | 最新真实页面运行成功：交互、三种下载、刷新恢复，无重复 POST、无页面 JS 错误。 |
| `L:/anaconda/python.exe .runtime/verify-freecad-tetrahedron.py` / `node .runtime/verify-freecad-tetrahedron-page.mjs` | 正四面体 100 与 120 mm，实际内核、节点/Skill/Tool、页面交互、STEP 回读、导出下载及新版本通过；未调用收费模型。 |
| `.runtime/freecad-mcp-venv/Scripts/python.exe -m pip check` | 无损坏依赖。 |
| 真实 `powershell.exe ... freecad_runtime.ps1 start` 和 `_start_optional_freecad(_default_env())` | 复用正确的 FreeCAD 进程，后者实际返回 `ready=True`。 |

专项命令：

```powershell
& L:/anaconda/python.exe -m pytest -c pytest-agent.ini `
  services/agent-service/tests/test_freecad_api.py `
  services/agent-service/tests/test_freecad_graph.py `
  services/agent-service/tests/test_freecad_client.py `
  services/agent-service/tests/test_freecad_tool.py `
  services/agent-service/tests/test_freecad_http_contract.py `
  services/agent-service/tests/test_tool_alias_contract.py `
  services/agent-service/tests/test_monitor_cad_production_proxy.py `
  services/agent-service/tests/test_start_all.py `
  tests/test_freecad_start_all.py -q
```

浏览器测试使用已存在的 Playwright 与 Chrome：

```powershell
$env:PLAYWRIGHT_MODULE_PATH='C:/Users/12587/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs'
$env:CHROME_EXECUTABLE='C:/Program Files/Google/Chrome/Application/chrome.exe'
node --test tests/browser/freecad-workspace.test.mjs
```

前端单元与构建在 `frontend/monitor-react` 执行：

```powershell
$cadTestFiles = @(rg --files src -g '*.test.mjs')
node --test $cadTestFiles
npm run build
```

失败历史也保留：新增错误处理/启动用例先得到 7 失败后修复；新增证据类型/GUI 卡死用例先得到 5 失败后修复；手动刷新浏览器用例、示例按钮用例以及 PowerShell 5.1 默认目录用例都经历真实失败与修复。两次全量 Agent 回归的 XML 保存在 `.runtime/verification/`。

旧 BuildCAD 的 66 项失败分布：`test_buildcad_alignment.py` 48、`test_buildcad_api.py` 9、`test_buildcad_http_contract.py` 1、`test_buildcad_node.py` 8。新增实际服务装配测试要求旧 BuildCAD 路由返回 404，并验证新 FreeCAD 路由继续鉴权；不能用旧测试的“必须公开 BuildCAD”断言反向恢复停用入口。新增正四面体/语义校验/重复 RPC/无效 JSON 共 16 项先失败后修复；启动就绪另 2 项、前端示例另 1 项先失败后通过。其余 26 个未通过项来自当前维修测试的配置或注册规则不一致，按原名保留，不归入 CAD 已通过项。

## 配置、存储及恢复

- 未修改生产 `.env`，未复制/打印模型或 BuildCAD 密钥。
- FreeCAD 1.1.4 与 freecad-mcp 0.1.26 部署在 Git 忽略的 `.runtime` 中；来源与校验和见 [安装说明](freecad-local-setup.md)。没有访问 GitHub、克隆仓库或按提交号覆盖项目。
- FreeCAD RPC 只监听 `127.0.0.1:9875`；MCP 本身使用 stdio，不新增公开 HTTP MCP 端口。内部 RPC 仅适用于本机受信任进程，不能直接暴露给局域网或公网。
- 可在**进程环境**指定 `FREECAD_MCP_EXECUTABLE` / `FREECAD_ARTIFACT_ROOT`；不是新建第二份模型总配置。
- 运行记录使用 `industry:freecad:runs` Redis 临时键，默认 24 小时；导出文件在 `.runtime/cad-models`。未引入 SQLite、未改变 MySQL/Milvus 结构、不需要数据库迁移、不删除数据卷。
- Redis 记录过期不自动删除实际文件，但下载接口需要有效记录。长期设计应下载归档；当前没有自动长期归档/清理模块。
- 首轮 CAD 接入在诊断队列为空时统一重启应用。新增正四面体时发现其他聊天已独立重载 Backend，故本次只重载 Agent：原进程环境及内部身份仅在内存继承并核对，无凭据落盘；7 个其他服务/设备进程保留、设备控制调用 0 次。Factory、数据库、Redis/Milvus 和独立 FreeCAD 不被停止。

源码备份：`.runtime/backups/freecad-local-20261007/`。

- `services/agent-service/app/...`：CAD Agent、图、API 和 Skill 的原文件。
- `frontend/production-cad/`：原前端文件。
- `root/registry.py`、`root/server.py`、`root/monitor_web_server.py`：对应修改前文件。
- `final-hardening/`：收尾前的 `scripts/start_all.py`、启动脚本、操作指南、FreeCAD 客户端/工具/图和工具计数测试，按原目录保存。
- `tetrahedron-and-semantic-guard/`：新增多面体及复核修复前的 13 个源码、测试和文档文件，按原目录保存，可逐文件恢复。恢复前比较其他聊天的后续改动，不能整体覆盖。

恢复时先停止受管理应用、核对是否有后续人工或其他聊天修改，再逐文件比较/恢复。不能整体覆盖当前工作区。例如恢复启动器时，确认后执行：

```powershell
Copy-Item -LiteralPath 'L:/industry_agent/.runtime/backups/freecad-local-20261007/final-hardening/scripts/start_all.py' -Destination 'L:/industry_agent/scripts/start_all.py'
```

前端源码恢复后重新执行 `npm run build`，不要把新旧打包 assets 手动混用。新建的 FreeCAD 文件可先移到另一个备份目录，不能顺手删除 `.runtime/cad-models` 里的设计或数据库数据。恢复到旧 BuildCAD 版本不代表远端渲染故障已恢复。

## 未完成与未验证

- 历史 BuildCAD 测试迁移及死代码最终清理未完成；全量回归不能标记成功。
- 不支持任意复杂机械零件、自动补出未知工程尺寸，也不保证任意自然语言需求都能生成完整设计。
- FCStd 当前保存最终实体，不是完整草图约束/参数化特征树。人工继续编辑与重新按尺寸生成的区别已在页面和指南说明。
- 未验证图纸上传解析、二维工程制图、公差/材料验收、CAM、后处理、FEM 求解器或真实加工。
- 本轮 CAD 成功示例未调用收费模型；任意其他自然语言模型解析的真实费用和质量不作为本轮已验收项。
- 当前工作区由多个聊天共享，其他业务修改另行验证；本轮没有声称五服务全部功能通过生产验收。
