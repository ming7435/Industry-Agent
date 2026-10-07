# BuildCAD MCP 接入与旧建模流程替换

更新日期：2026-10-07。以本地实际代码为准，没有访问 GitHub、覆盖远程提交或修改生产配置。

## 唯一生成链核对与残留清理（2026-10-07，最新）

按用户“只保留通过 MCP 调用 BuildCAD”要求再次检查：**当前只有一套可运行的 CAD 生成逻辑**。

```text
ProductionCadWorkspace
→ POST /api/cad/buildcad/runs
→ CADAgent.run_buildcad
→ model_3d 节点
→ production_modeling_skill.build_model
→ buildcad_mcp
→ BuildCADClient 的 MCP tools/call
→ https://buildcad.ai/api/mcp
```

`list_designs`、`get_design_code`、`render_preview`、`save_design` 是同一个远端服务的四个操作，不是四套生成器。Model 服务把需求转为 llmcad 参数，`ast.parse` 只校验语法；本地没有执行这些几何代码，也不会在 MCP 失败后回退到旧内核。`modeling_api.py` 虽保留名称，内容已完全是 BuildCAD 接口，不应删除。

本轮核对前，旧本地建模源文件及前端入口已经删除，因此没有制造新的生产源码重构。实际清理内容：

- 备份并删除 12 个已无对应源码的 `.pyc`：CAD 目录的 `manufacturing_client/owner/schemas/service`、`modeling_analysis/drawings/engine/schemas/service/worker`、`turning_program`，以及工具目录的 `generate_3d_model`。当前模块缓存保留。
- 更新 README 和 `cad-modeling-operation-guide.md`，现行说明只介绍 BuildCAD。
- 四份历史 CAD 报告及 2026-10-07 的旧节点设计/计划增加“已替换/停用”标记；历史正文留作记录，不再作为操作指南。
- 不删除旧图纸、旧环境、数据库、Redis 数据、备份或维修模块。Document-CAD、`/api/cad/resolve`、BOM 与三台设备的维修图纸/故障定位是查询展示功能，继续保留。

### 本轮验证

| 实际执行命令 | 结果 |
| --- | --- |
| `L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_buildcad_alignment.py services/agent-service/tests/test_buildcad_node.py services/agent-service/tests/test_buildcad_api.py services/agent-service/tests/test_buildcad_http_contract.py services/agent-service/tests/test_buildcad_client.py -q` | 150 通过、0 失败、0 跳过；包含真实 API → 节点 → Skill → Tool → 隔离 MCP 边界。 |
| `L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q --tb=short` | 1026 通过、0 失败、0 跳过，含上述 BuildCAD 测试。 |
| `L:/anaconda/python.exe -m pytest -c pytest-cad.ini -q` | 66 通过、0 失败、1 跳过。现有 `test_local_drawings.py:133` 因主机不允许隔离文件系统符号链接而跳过，未修改跳过范围。 |
| `$cadFrontendTests = @(rg --files frontend/monitor-react/src -g '*.test.mjs'); node --test @cadFrontendTests` | 121 通过、0 失败、0 跳过。 |
| `node --test tests/browser/buildcad-workspace.test.mjs` | 16 通过、0 失败、0 跳过；浏览器环境变量沿用下文配置。 |
| `git diff --check -- README.md docs/cad-modeling-operation-guide.md docs/cad-node-skill-tool-report.md docs/production-cad-modeling-report.md docs/cad-production-and-repair-delivery.md docs/cad-interactive-preview-report.md docs/superpowers/specs/2026-10-07-cad-node-skill-tool-design.md docs/superpowers/plans/2026-10-07-cad-node-skill-tool.md` | 通过；仅换行符转换提示。 |

只读检查当前运行服务的 `8010/openapi.json`：CAD 路由仅为 `/api/cad/resolve` 与 `/api/cad/buildcad/*`。通过 8001 分别 GET `/api/cad/designs`、`/api/cad/designs/CAD-RETIRED`、`/api/cad/designs/CAD-RETIRED/manufacturing`，三者均为 404。

本轮没有调用收费模型、向 BuildCAD 保存设计或控制机器；未改前端源码，因此不重复构建/重启。上述测试不证明远端渲染已恢复；此前实际收到的 `fetch failed` 仍是独立的外部依赖问题。

### 本轮恢复

备份位于 `.runtime/backups/buildcad-only-cleanup-20261007/`，保留原相对路径。删除缓存前已确认路径位于项目内、对应源码不存在，并逐文件验证备份 SHA-256 一致。可用 `Copy-Item -LiteralPath` 从该目录逐文件恢复文档或缓存；正常使用无需恢复失效缓存。不整体覆盖共享工作区，避免回退其它任务的修改。

## 登录后的实际调用修复（2026-10-07）

用户已完成授权；真实 `tools/list` 和 `list_designs` 已成功。当前账号设计列表为 `[]`，并不是连接失败。授权成功后前端不再显示连接按钮，失效时才显示重连入口。

这次失败有三层原因：

1. 原模型把 CadQuery 代码发送给要求 llmcad 的 `render_preview`。已为中文 Skill 补充 [llmcad 官方 API](https://llmcad.org/api-reference/) 的明确用法，并在工具入口解析语法，拒绝 CadQuery/Workplane/show_object；不在本地执行生成代码。
2. 正确的 llmcad 示例 `Cylinder(30, 50) - Cylinder(10, 50)` 单独调用真实 `render_preview` 后，仍得到 `isError: true` 和 `fetch failed`。**这是实际收到的远端工具错误；尚未得到成功预览，不能声称已经修复 BuildCAD 的渲染服务。**
3. 前端原先把空 JSON 列表与 `isError` 文本拼进答案。现在设计列表、设计代码、预览图片、工具错误各自展示，原始参数和返回体保留在实际调用明细。

四个动作都复用原来的一个 CAD 建模节点、一个 Skill、一个 `buildcad_mcp` 工具：

| 页面动作 | 实际调用与约束 |
| --- | --- |
| 读取我的设计 | `list_designs({})`；直接读取，不消费模型生成接口；空列表是正常读取结果。 |
| 读取设计代码 | `get_design_code({designId})`；必须选择已有设计；空代码与没有读取结果区分。 |
| 仅生成预览（默认） | 现有 Model 服务生成 llmcad 代码，调用 `render_preview({code, views?})`；禁止保存。 |
| 保存到已选设计 | 核对实际账号列表、读取最新代码、得到有效预览后，只能把同一代码保存到同一指定设计；失败不自动重复提交。 |

真实 schema 中 `save_design` 要求 `designId` 和 `code`，没有 `create_design`。新建空设计、交互三维编辑和导出需要在 BuildCAD 官网进行；本地不伪造相应 API。预览没有有效图片时不能解锁保存，也不能把“已连接”或“已列出设计”当作建模成功。

运行接口增加 `action` 和 `design_id`；幂等摘要同时绑定动作、设计与需求。读取动作仍通过该节点留下执行记录，但不依赖聊天模型。前端保留草稿与当前运行，刷新只回查，不重新执行。原失败记录保留，不覆盖为成功。

本轮只修改 CAD 调用、CAD Skill、CAD 前端及对应测试；未修改供应商配置、数据库、机器控制或其它中心的业务代码。真实探测只读取设计/预览，并做一次既有 Model 服务代码生成检查，未向账号保存设计。该模型检查确实返回 llmcad 代码，不再使用 CadQuery；它不等于远端预览或保存已通过验收。

新增备份：`.runtime/backups/buildcad-alignment-20261007/`，按原相对路径保留本轮修改前文件。恢复时逐文件对比，使用 `Copy-Item -LiteralPath` 恢复需要回退的文件，再从源码构建；不要覆盖共享工作区其它任务的改动。没有数据迁移或数据删除。

### 本轮最终回归

本轮新增测试先复现了参数、动作权限、展示和回执问题再修复。复核补充覆盖：仅执行列表/代码读取之后的尺寸追问仍保留为 `needs_input`；实际预览/保存达成目标后立即结束，不再让最后一次模型总结的超时覆盖真实结果；重复保存（包括改写保存说明）仍被阻止。读取工具必须提供能解析的字段，合法空列表和空代码不等于缺失字段。

前端显示“读取的设计代码 / 本轮预览代码 / 已保存代码”的真实来源，保存失败不会把预览标为已保存；工具异常或结果未知显示对应状态和受控错误码。嵌入图片与后端使用相同的 PNG/JPEG/WebP 签名判定，无效 Base64 不再生成预览框。没有用模型文本伪造图片、链接或成功回执。

以下是最终修改后实际执行的命令；除明确列出的真实联调外，均使用隔离适配器，不调用收费模型或真实设备。

| 命令（在仓库根执行，构建除外） | 通过 | 失败 | 跳过 |
| --- | ---: | ---: | ---: |
| `L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_buildcad_alignment.py services/agent-service/tests/test_buildcad_node.py services/agent-service/tests/test_buildcad_api.py services/agent-service/tests/test_buildcad_http_contract.py services/agent-service/tests/test_buildcad_client.py -q` | 150 | 0 | 0 |
| `L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q --tb=short` | 1003 | 0 | 0 |
| `L:/anaconda/python.exe -m pytest -c pytest-cad.ini -q --tb=short` | 32 | 0 | 0 |
| `$cadFrontendTests = @(rg --files frontend/monitor-react/src -g '*.test.mjs'); node --test @cadFrontendTests` | 116 | 0 | 0 |
| `node --test tests/browser/buildcad-workspace.test.mjs` | 16 | 0 | 0 |

BuildCAD 的 150 项已包含在 Agent 总数中，不能重复计入总覆盖数。浏览器运行环境与下方历史阶段配置相同。`npm run build`（`frontend/monitor-react`）成功；仍有现有大 chunk 提示。产物为 `index-CQC_JsaU.js` 与 `index-oHGPaWdv.css`，由源码构建，未手工编辑 assets。`git diff --check` 通过，仅有换行符转换提示。

共享工作区同时有另一任务修改维修派工逻辑：中间 Agent 全量运行曾有 20 个非 CAD 失败；没有修改/跳过这些失败来让本任务通过，最终以重新执行的 1003 项全绿为准，不把其它任务的修复归为本轮 CAD 改动。

### 真实服务验证边界

- OAuth 与真实 `tools/list` 成功，四个工具名称/schema 已读取。
- `list_designs` 返回空列表，表明当前连接的账号暂无设计；不是连接失败。
- 一次实际模型生成检查返回符合 llmcad 的代码；这只是模型到 MCP 参数的检查。
- 使用正确 llmcad 圆柱通孔示例直接调用 `render_preview`，仍收到远端 `isError: true` / `fetch failed`。本地错误信息现已明确指出该阶段，停止保存且不自动重试。
- 没有向用户账号执行真实 `save_design`、新建或覆盖远端设计，也没有执行设备控制。
- 尚未验证成功的真实预览、远端保存和官网交互编辑/导出。需要 BuildCAD 的渲染工具恢复，并由用户准备目标设计后才能继续验收；上述离线测试不能视为这部分已通过。

已重启项目现有启动器及其六个应用子进程，未停止模拟工厂和 Docker 基础设施。启动日志位于 `.runtime/buildcad-alignment-20261007-152103.out.log` 与对应 `.err.log`，原配置和授权凭据保留。

重启后用真实构建页面执行 `node .runtime/verify-buildcad-alignment-live.mjs`：连接成功，登录入口隐藏；在空需求输入下点击“读取我的设计”，经过 `model_3d → production_modeling_skill → buildcad_mcp → list_designs` 返回 `completed`、0 个设计。该读取没有调用聊天模型或保存接口。无目标设计时保存不可选，输入需求后预览提交可用，浏览器无脚本错误。运行号为 `BC-f43f2529b57b05198addc6c6e1a2c7f6d4a14dab4d62f838fdf3fdb24de3afc0`；页面截图保存在 `.runtime/buildcad-alignment-live-20261007.png`。此处成功仅指真实连接和设计读取，不代表远端渲染已恢复。

## 实际改动

生产建模现在只有一个业务入口：前端需求 → CAD Agent 的 `model_3d` 节点 → 中文 `production_modeling_skill` → `buildcad_mcp` 工具 → `https://buildcad.ai/api/mcp`。

复用已有节点，没有新增一套 Agent 或本地几何引擎。通用的图入口和结果节点仍保留。工具注册是一换一，维修用图纸、BOM、设备归属和故障定位查询不变。

| 文件 | 作用 |
| --- | --- |
| `services/agent-service/app/agents/cad/agent.py`、`graph.py` | 进入一个建模节点，读取实际远端工具 schema 和初始化说明；现有 Model 服务把中文需求转换为工具参数，最多六次远端工具调用。 |
| `services/agent-service/app/skills/cad/production_modeling.md` | 一个中文 Markdown Skill，声明唯一工具和使用边界。 |
| `services/agent-service/app/tools/cad/buildcad_mcp.py`、`app/tools/registry.py` | 单一 MCP 工具，校验可信作用域和实际参数，禁止 JSON Schema 外部引用隐式联网；沿用日志记录输入输出。 |
| `services/agent-service/app/clients/buildcad.py` | Streamable HTTP、JSON/SSE、会话握手、真实工具发现、OAuth 授权与刷新。 |
| `services/agent-service/app/agents/cad/modeling_api.py` | 授权接口及需求提交、只读回查；Redis 临时记录，无原本地建模队列。 |
| `frontend/monitor-react/src/app/production-cad/` | 单个竖排面板：连接、需求输入、返回结果、可展开的真实工具参数和返回体。 |
| `services/agent-service/monitor_web_server.py` | 同源代理、请求体边界、OAuth Cookie 转发；原内部接口隔离保留。 |
| `scripts/verify_local_workbench.py` | 改为只读检查 BuildCAD 连接，不再提交旧本地建模任务。 |

建模节点只通过已发现的 `list_designs`、`get_design_code`、`render_preview`、`save_design` 工具工作，不推测参数字段。公开能力与地址核对自 [BuildCAD 官方 MCP 页面](https://buildcad.ai/mcp)。该页面将 `render_preview` 定义为多视图 PNG；界面不把图片冒充可旋转模型，也不拼接虚构的设计或下载链接。实际返回的链接可以打开，进一步三维编辑可进入 BuildCAD 官网。

## 删除范围与数据保留

已移除旧生产专用文件：

- `app/agents/cad/modeling_analysis.py`、`modeling_engine.py`、`modeling_worker.py`、`modeling_service.py`。
- `app/agents/cad/manufacturing_client.py`、`manufacturing_service.py`、`turning_program.py`、`requirements-modeling.txt`。
- `app/tools/cad/generate_3d_model.py`。
- `schemas.py` 中旧实体、导入、修订、确认及制造请求模型；保留 `CADQuery`。
- 前端 `CadSolidPreview.jsx`、`ManufacturingPanel.jsx` 和旧本地建模表单、文件上传、人工确认、刀路及虚拟加工下发界面。

旧 `/api/cad/designs` 接口已撤销，返回 404，不会偷偷转到旧引擎。机器控制不属于新的建模入口。

没有删除 `.runtime/cad-designs`、既有图纸、数据库、数据卷或 Python 环境。报告 PDF 所需的 PyMuPDF 保留。新的设计保存在用户授权的 BuildCAD 账号；公开或私有取决于 BuildCAD 账号能力，前端已提示保存可能公开设计。

## 配置、授权与运行

入口：[本机生产建模](http://127.0.0.1:8001/?view=cad)。

1. 点击“连接 BuildCAD”，在官网完成账号登录与授权。
2. 回到页面后，只有真实 `tools/list` 成功才显示已连接。
3. 默认选择“仅生成预览”，输入需求，例如：`设计一个外径 30 mm、长度 50 mm、中心通孔直径 10 mm 的销轴。` 输入的数字是示例，不是现场加工合格阈值。
4. 要保存时，先在 BuildCAD 官网新建或准备好设计，点击“读取我的设计”并选择目标，再选择“保存到已选设计”。
5. 查看真实返回和“实际工具调用”；设计进一步编辑在实际返回链接或 BuildCAD 官网中进行。远端渲染报错时本地不伪造图片或继续保存。

自然语言仍使用现有 `MODEL_SERVICE_BASE_URL`、`MODEL_CHAT_MODEL`，没有替换供应商或密钥。新增显式依赖 `httpx>=0.27,<1`、`jsonschema>=4.22,<5`；移除的独立建模依赖清单不再要求安装 CadQuery。未修改 `.env`。

OAuth 使用发现元数据、授权码、PKCE S256；state 和浏览器 HttpOnly Cookie 绑定并原子消费，页面清除回调参数。凭据只在服务端 Redis，不输出至前端或日志；刷新与断开使用同一 Redis 锁防并发覆盖。MCP 请求超时为 60 秒，不自动重试写入。

Redis 默认沿用 `REDIS_URL`：

- `industry:buildcad:oauth:*`：授权临时状态，10 分钟。
- `industry:buildcad:token`、`client`：授权凭据与客户端注册信息。断开会清除本地访问/刷新令牌；这不等于代替用户撤销官网授权。
- `industry:buildcad:runs:*`：运行记录及幂等结果，24 小时。相同命令参数冲突返回 409，同一命令不会重复执行；过期后不承诺跨日去重。

前端提交走一个业务接口 `POST /api/cad/buildcad/runs`，返回运行编号；`GET /runs/{run_id}` 只读查询，不触发重跑。辅助 `/status` 与 `/auth/*` 用于连接和授权。最多两个并发运行，过载返回 429；长时间未返回、远端写入超时或回执不可信时显示待核对。

## 首次接入阶段测试（历史结果，非本轮最终结果）

先补复现测试再实现：原节点不支持 BuildCAD 的六项测试先失败；另外复现并修复了参数 schema 外部引用、异常泄漏、刷新令牌并发以及不确定写入回执问题。最终没有跳过测试或降低校验来制造通过。

以下命令在仓库根执行，前端 build 除外；测试使用隔离配置、内存存储与本地 HTTP/浏览器边界，不调用真实设备或收费模型。

| 命令 | 最终结果 |
| --- | --- |
| `L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q --tb=short` | 890 通过，0 失败，0 跳过。 |
| `L:/anaconda/python.exe -m pytest -c pytest-cad.ini -q --tb=short` | 32 通过，0 失败，0 跳过。 |
| `L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_buildcad_http_contract.py -q --tb=short` | 1 通过；真实 FastAPI → 节点 → Skill → ToolRegistry → MCP HTTP，与真实 Model HTTP 客户端联通，远端服务由隔离适配器提供。此项也包含在 Agent 总数中。 |
| `$files=rg --files frontend/monitor-react/src \| Where-Object { $_ -match '\.test\.mjs$' }; node --test @files` | 103 通过，0 失败，0 跳过。 |
| `node --test tests/browser/buildcad-workspace.test.mjs` | 6 通过，0 失败，0 跳过。 |
| `npm run build`（目录 `frontend/monitor-react`） | 成功；仅现有大 chunk 提示。通过源码重建，没有手工编辑打包 assets。 |
| `git diff --check` | 通过；Git 提示部分文件换行符转换，不是测试失败。 |

浏览器测试环境：`PLAYWRIGHT_MODULE_PATH=C:/Users/12587/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs`；`CHROME_EXECUTABLE=C:/Program Files/Google/Chrome/Application/chrome.exe`。

随着用户明确撤销旧功能，旧 CadQuery/刀路专用测试 `test_cad_modeling_api.py`、`test_cad_modeling_graph.py`、`test_cad_modeling_details.py`、`test_cad_modeling_review.py`、`test_cad_turning_program.py`、`test_cad_manufacturing_api.py`、`tests/contracts/test_virtual_cad_production.py` 及三个旧前端专用测试退休。对应边界由新的 `test_buildcad_client.py`、`test_buildcad_node.py`、`test_buildcad_api.py`、`test_buildcad_http_contract.py`、`buildcad.test.mjs` 和 `buildcad-workspace.test.mjs` 覆盖。旧共享模型 HTTP、代理、PDF 下载头、设备归属、技能权限和节点数量回归仍保留。

中途并行测试曾在新增协议实现尚未完成时报告 13 失败、876 通过；已按失败项修复并完整重跑为上述最终结果，不将中间失败隐瞒或标记为跳过。

首次接入时曾重启本机六个应用进程，模拟工厂和已有基础设施未停止、未控制设备。当时真实 `/api/cad/buildcad/status` 返回 `authorization_required`，因此首次交付没有验证登录后的工具。用户随后已授权；最新实际调用情况以上方“登录后的实际调用修复”为准，不把这些历史离线结果当作远端建模验收通过。

## 备份与恢复

修改和删除前已备份到 `.runtime/backups/buildcad-20261007/`：

- `source/`：旧 CAD 源码、工具注册、Skill、API 挂载文件、Monitor、依赖、核验脚本和相关旧测试。
- `frontend/`：旧前端源文件、组件及浏览器测试。
- `served-frontend/`：重建前实际对外提供的前端目录。
- `client-refresh-race/`、`client-receipts/`：本次新增客户端的中间版本，仅供排查。

恢复前停止相关应用并对比当前文件，逐个恢复所需文件，不整体覆盖其他任务的新修改。示例：在仓库根用 `Copy-Item -LiteralPath '.runtime/backups/buildcad-20261007/source/services/agent-service/app/agents/cad/modeling_engine.py' -Destination 'services/agent-service/app/agents/cad/modeling_engine.py'` 恢复单个旧文件。完整回退还需配套恢复旧 API、图、Skill、工具注册和前端源码，移除本次新增接入文件后重新构建前端、按原启动器启动；不要只恢复一个文件后混用新旧接口。

无需数据库迁移，未自动删除 Redis 或任何旧业务数据。备份恢复操作没有在本次交付中执行。
