# CAD 三维建模节点、Skill、Tool 修改报告

> 历史记录（已替换）：下文记录旧本地生成流程，不代表当前代码。2026-10-07 起只保留 BuildCAD MCP；`model_3d` 节点和 Skill 保留，但旧 `generate_3d_model`/CadQuery 工具已删除。当前用法见 [操作说明](cad-modeling-operation-guide.md) 和 [接入报告](buildcad-mcp-integration.md)。

日期：2026-10-07。项目：`L:/industry_agent`。

## 结果与范围

已经实际修改本地代码：三维建模从原独立队列执行改为进入 CAD Agent 的编译图，新增一个 `model_3d` 节点。节点调用中文 Markdown Skill，Skill 的结构化步骤选择并调度已注册 Tool，Tool 执行原 CadQuery 实体建模流水线。

```text
原建模 API → 原有界队列 → CADAgent.run_modeling
                         ↓
                 CAD 图 prepare → model_3d → finish
                                      ↓
                      production_modeling_skill（中文 MD）
                                      ↓ build_model 工具步骤
                            generate_3d_model（注册 Tool）
                                      ↓
                      原需求解析 → 实体生成 → 校验 → 导出
```

这不是增加一条日志或把 Skill 当作说明文字：实际工具名称来自 Markdown 的 `steps[].tool`，通过 `SkillDefinition.execute_tool_step()` 执行。删除工具授权、缺少工具步骤或必需输入时会阻止执行。

本次仅增加一个节点、一个项目 Skill 和一个内部 Tool；没有新建 Agent。CAD 图从 5 到 6 个实际节点，九个领域图内部节点从 51 到 52。工具注册总数从 75 到 76；模型可调用的工具声明仍为 58，内部建模工具不对模型开放。原 CAD 查询分支及原有诊断、知识检索和 CAD 查询循环保留。

## 实际文件修改

下表路径均相对于 `L:/industry_agent`。

| 文件 | 行为 |
| --- | --- |
| `services/agent-service/app/agents/cad/agent.py` | 原建模服务复用当前 CAD Agent；新增可信建模入口，调用实际图并回传执行元数据。 |
| `services/agent-service/app/agents/cad/graph.py` | 增加 `model_3d` 和显式建模分支；节点按 Skill 的工具步骤执行，不在节点直接调用内核。 |
| `services/agent-service/app/agents/cad/modeling_service.py` | 原队列入口改为调用 Agent 图；原建模实现由 Tool 执行；保留队列、保存、版本和业务状态。 |
| `services/agent-service/app/skills/cad/production_modeling.md` | 新增中文建模 Skill，声明输入、工具步骤、授权工具、停止条件和安全边界。 |
| `services/agent-service/app/skills/registry.py` | 新增真实工具步骤调度方法；按显式操作选择建模 Skill，不因查询正文而误开放建模权限。 |
| `services/agent-service/app/tools/cad/generate_3d_model.py` | 新增内部 Tool 和任务级作用域绑定，执行原实体流水线并返回结构化真实结果。 |
| `services/agent-service/app/tools/registry.py` | 注册内部建模工具并保留通用权限检查、输入输出日志；通过 `local_only` 禁止误转发远程执行。 |
| `services/agent-service/tests/test_cad_modeling_graph.py` | 新增真实 API、图、Skill、Tool、实体生成和任务隔离回归。 |
| `services/agent-service/tests/test_skill_tool_dispatch.py` | 新增实际 Markdown 工具步骤调度、权限、必需输入和失败不重试回归。 |
| `services/agent-service/tests/test_stage_node_merge.py` | 同步实际编译图的严格节点计数，不降低原循环和业务行为校验。 |
| `services/agent-service/tests/test_tool_alias_contract.py` | 工具总数严格校验改为 76；模型工具声明严格校验仍为 58。 |

设计和实施记录分别位于 `docs/superpowers/specs/2026-10-07-cad-node-skill-tool-design.md`、`docs/superpowers/plans/2026-10-07-cad-node-skill-tool.md`。

## 保留的业务与日志

- 原 API 和前端契约不变：提交、上传、任务列表、实体预览、文件下载、补充需求、新版本、人工确认和摘要校验继续使用原实现。
- 完整明确的结构化需求生成真实实体；信息缺失或解析结果尚需人工核对时返回 `needs_input`，不伪造默认模型。建模失败仍返回失败状态，不开放未经校验的文件。
- 队列任务持有可信服务对象和完整输入；Tool 只接收 `design_id`。客户端不能借工具参数传入本地路径或服务对象。
- 并发任务的可信作用域通过 `ContextVar` 隔离，结束时恢复；无可信任务或任务编号不匹配时拒绝执行。
- 节点、Skill、步骤和 Tool 日志共用 `task_id` / `trace_id`，工具日志包含实际输入与返回体。任务记录增加 `execution`，其中包含节点、Skill、步骤、工具和步骤历史。
- 新增调度日志不保存上传图纸的 Base64 内容，沿用已保存的文件摘要和大小；原解析子步骤的日志规则没有在本次扩大重构。
- 写文件和建模失败不会自动重试。人工确认仍绑定当前设计摘要，新版本不继承旧确认。

## 独立复核与修正

复核发现：仅使用 `server="local"` 不足以保证本地执行，既有 MCP 客户端会读取 `MCP_LOCAL_URL` 并可能转发远端，使内部任务校验失效。

先补充失败测试，复现无可信任务时远端返回体绕过校验，再增加 `ToolDefinition.local_only`。建模工具明确设为 `True`，在 ToolRegistry 完成权限检查后直接调用本地处理器，保留日志与错误处理。其他工具仍走原路由。没有修改 MCP 地址或其他环境配置来掩盖问题。

## 实际测试

以下命令均在项目根目录执行；使用已有 Python 和隔离测试配置，没有调用收费模型、生产数据库或真实设备控制。

```powershell
$env:PYTHONIOENCODING='utf-8'
$env:PYTHONUTF8='1'

# 初始失败测试，修改前执行。
& L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_cad_modeling_graph.py services/agent-service/tests/test_skill_tool_dispatch.py -q

# 独立复核后的失败测试，local_only 修复前执行。
& L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_cad_modeling_graph.py::test_local_mcp_url_cannot_bypass_modeling_task_guard -q

# 最终针对性回归。
& L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_cad_modeling_graph.py services/agent-service/tests/test_skill_tool_dispatch.py services/agent-service/tests/test_stage_node_merge.py services/agent-service/tests/test_skill_registry.py services/agent-service/tests/test_tool_alias_contract.py -q

# 最终完整 Agent 回归。
& L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q
```

| 阶段 | 通过 | 失败 | 跳过 | 说明 |
| --- | ---: | ---: | ---: | --- |
| 初始红阶段 | 0 | 10 | 0 | 原结构缺少真实图节点、Skill 调度和注册 Tool。 |
| 初始实现针对性回归 | 48 | 0 | 0 | 新调用链及原 Skill、节点测试通过。 |
| 首轮完整 Agent 回归 | 821 | 1 | 0 | 唯一失败为旧工具计数仍为 75，实际新增一个内部 Tool。 |
| 远程转发红阶段 | 0 | 1 | 0 | `MCP_LOCAL_URL` 可绕过可信建模任务校验。 |
| 最终针对性回归 | 68 | 0 | 0 | 工具计数及强制本地执行修正后通过，12.86 秒。 |
| 最终完整 Agent 回归 | 823 | 0 | 0 | 178.51 秒；没有删除失败测试、放宽校验或新增跳过。 |

新建的两份测试文件合计 11 项测试。真实 API 测试调用真实 CAD 图、Markdown Skill、ToolRegistry 和现有隔离 CadQuery 子进程；带孔销轴外径 30 mm、内孔 10 mm、长 50 mm，体积验证为约 31415.9265 mm³，STEP 回读通过。另一长度 60 mm 的并发任务验证为约 37699.1118 mm³，日志和结果不串用。网络绕过测试只替代外部 HTTP 边界，不替代被测路由和校验函数。

## 未执行与配置

- 没有重启当前运行的 Agent 或其他进程；已有进程不会自动加载此次 Python 和缓存 Skill 修改，需重启 Agent 后在运行页面验证。
- 没有重新运行全部五服务联调、前端浏览器验收、收费模型解析或生产控制。离线回归通过不代表生产验收通过。
- 没有更改前端源码或构建产物、模型配置、生产配置、数据库或数据卷；保留工作区中原有的其他修改。
- 无数据库结构变化、无数据迁移；旧设计记录和文件无需重写。旧记录不回填新增执行元数据，新任务通过新链路记录。
- 复杂图纸仍需要原模型依赖可用并按原规则人工确认；本次是结构修正，不扩大原几何和机床加工能力，也不猜测设备阈值。

## 备份和恢复

下方是目录精简前的建模节点恢复方法。如果已执行本文最后的 CAD 目录精简，应先恢复目录精简备份，再撤销节点修改，避免旧代码引用已经合并的模块。

修改前的七个已有文件保存在：

`L:/industry_agent/.runtime/backups/cad-node-skill-tool-20261007/`

备份沿用源码相对目录，包含本次修改前已存在的用户修改。备份不包含密钥、配置或数据库。

恢复前停止 Agent，并另存当前文件和本次之后的修改；以下命令会覆盖列出的七个文件，只应在明确决定撤销本次修改时执行：

```powershell
$cadRestoreProject = 'L:/industry_agent'
$cadRestoreBackup = 'L:/industry_agent/.runtime/backups/cad-node-skill-tool-20261007'
$cadRestoreFiles = @(
  'services/agent-service/app/agents/cad/agent.py',
  'services/agent-service/app/agents/cad/graph.py',
  'services/agent-service/app/agents/cad/modeling_service.py',
  'services/agent-service/app/skills/registry.py',
  'services/agent-service/app/tools/registry.py',
  'services/agent-service/tests/test_stage_node_merge.py',
  'services/agent-service/tests/test_tool_alias_contract.py'
)
foreach ($cadRestoreFile in $cadRestoreFiles) {
  Copy-Item -LiteralPath (Join-Path $cadRestoreBackup $cadRestoreFile) -Destination (Join-Path $cadRestoreProject $cadRestoreFile) -ErrorAction Stop
}
```

完整恢复时，还应将以下四个新增文件移入另一个备份目录，不要永久删除；尤其不能在恢复旧 ToolRegistry 后继续加载新增 Skill，否则会出现工具引用不匹配：

- `services/agent-service/app/skills/cad/production_modeling.md`
- `services/agent-service/app/tools/cad/generate_3d_model.py`
- `services/agent-service/tests/test_cad_modeling_graph.py`
- `services/agent-service/tests/test_skill_tool_dispatch.py`

说明文档可保留。恢复完成后重跑 Agent 测试再启动服务，不使用 `git reset` 或远程文件覆盖本地代码。

## 后续 CAD 目录精简（2026-10-07）

核对实际 Python 引用及独立工作进程启动后，没有将正在使用的模块误判为死代码。本次减少的是过度拆分的文件，保留其中的完整实现：CAD 目录从 17 个 Python 文件减为 13 个。

| 已删除的源码文件 | 实现合入的现有文件 |
| --- | --- |
| `app/agents/cad/modeling_schemas.py` | `app/agents/cad/schemas.py`：几何、上传、版本和确认参数。 |
| `app/agents/cad/manufacturing_schemas.py` | `app/agents/cad/schemas.py`：严格加工参数与独立生产确认。 |
| `app/agents/cad/manufacturing_owner.py` | `app/agents/cad/manufacturing_service.py`：加工目录单执行器锁。 |
| `app/agents/cad/modeling_drawings.py` | `app/agents/cad/modeling_engine.py`：真实投影与中文 PDF 导出。 |

路径相对于 `services/agent-service`。同步更新 `modeling_api.py`、`modeling_service.py`、`modeling_analysis.py`、`turning_program.py` 和四份测试的导入引用；只调整测试导入路径，没有删除测试或放宽断言。顺便移除加工服务未使用的 `Path` 导入。没有留下旧模块的生产或测试代码引用。

保留 `modeling_worker.py`，因为它是隔离 CAD 依赖、终止超时计算和避免继承密钥的进程边界；保留 `manufacturing_client.py`，因为它限制本机模拟工厂地址、禁止重定向及写入重试；保留刀路生成器和专用环境依赖文件。没有修改节点、Skill、Tool 的数量或调度链，没有删除 API、图纸、建模任务或数据库数据。

本次是业务行为不变的结构整理，先运行已有行为测试确认绿基线，再合并并重复运行；没有人为制造失败测试来证明文件移动。

实际验证：

| 验证 | 通过 | 失败 | 跳过 | 说明 |
| --- | ---: | ---: | ---: | --- |
| 清理前 CAD 行为基线 | 49 | 0 | 0 | 104.29 秒。 |
| 清理后同组 CAD 回归 | 49 | 0 | 0 | 112.99 秒。 |
| 隔离虚拟工厂契约 | 4 | 0 | 0 | 40.73 秒；2 个既有 websockets 弃用警告，没有隐藏警告。 |
| 清理后完整 Agent 回归 | 823 | 0 | 0 | 255.47 秒；所有现有测试保留。 |

```powershell
# 清理前后均执行同一命令。
& L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_cad_modeling_api.py services/agent-service/tests/test_cad_modeling_details.py services/agent-service/tests/test_cad_manufacturing_api.py services/agent-service/tests/test_cad_modeling_graph.py -q

# 完整 Agent 回归。
& L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q

# 单独隔离虚拟工厂验证；禁用本地 .env，使用临时数据和临时 HTTP 服务。
$env:PYTHON_DOTENV_DISABLED='1'
$env:APP_ENV='testing'
$env:FACTORY_API_BASE_URL='http://127.0.0.1:9'
$env:AGENT_API_TOKEN=''
& L:/anaconda/python.exe -m pytest -c pytest-agent.ini tests/contracts/test_virtual_cad_production.py -q
```

测试进程均设置 `PYTHONIOENCODING=utf-8`、`PYTHONUTF8=1`。跨服务测试使用本地 Factory 源码建立隔离模拟器，未操作正在运行的产线。未重新验收全部五服务或前端，未调用收费模型、真实设备控制；当前运行进程没有重启。

恢复此次目录精简的备份：`L:/industry_agent/.runtime/backups/cad-cleanup-20261007`，共 16 个文件（11 份源码、4 份测试、本文档），包含本次清理前的本地修改和被删除文件，不包含配置、密钥或数据。恢复前停止 Agent 并另存之后的新修改，再将备份文件按相对目录复制回项目根目录即可。此次清理没有新增源码文件，恢复会重新建立四个旧模块；如还要撤销更早的节点修改，应在此之后使用前一节备份。

生成的 `__pycache__` 未删除：测试结束后尝试清理时，执行环境拒绝了缓存删除命令，未继续绕过限制。缓存不属于业务源码，可以由 Python 自动重建，后续启动出现属于正常行为。四个旧源码文件已经通过文件编辑工具实际删除，缓存限制不影响本次源码精简。
