# CAD Agent 生产前建模实现与验证

## 范围与入口

本次仅修改 CAD Agent 相关代码和前端。Agent API 挂载 CAD 专用路由；不修改 Document-CAD、Backend、RAG、Model、生产配置、数据库或设备控制。已有维修 CAD 查询和工单故障定位不替换。

页面：左侧“生产运营 → 生产建模”，地址 `http://127.0.0.1:8001/?view=cad`（须按项目原有方式启动监控前端和更新后的 Agent 服务）。本次未自动启动生产服务或部署；浏览器验收使用独立的 8093 端口。

本次实际完成的是零件设计文件与加工准备，不是机器自动生产。STEP 实体通过不等于公差、刀路、装夹、机床能力及生产放行均通过。没有调用虚拟工厂或真实设备的控制接口。

## 输入、建模和成果

1. 输入完整需求；简单圆柱在形状、尺寸和单位均明确时直接解析。其他需求通过现有 `ModelServiceClient` 调用聊天接口，提取参数先进入待核对状态，用户核对/补全后才建立实体。不直接使用供应商密钥，不替换本机已选模型。
2. 也可直接填写结构化 JSON，明确全部几何操作；结构化参数是建模依据，不自动追加文本中未转成参数的特征。
3. 上传 STEP/STP、DXF、PDF、PNG/JPG。最大 8 MB。STEP 直接导入真实实体；DXF 必须有闭合轮廓、明确拉伸深度和单位；PDF 文本或图片尺寸通过现有模型/视觉接口解析，无法唯一确定几何时要求补充。
4. 固定白名单解释参数，不执行模型回复、上传文件或用户输入中的 Python/脚本。
5. CadQuery/OCP 在独立工作进程中计算，有队列容量和计算超时；没有 API 密钥和数据库凭据传入子进程。
6. 校验实体有效性、实体数、体积和 STEP 回读后的尺寸/体积；只有成功任务开放成果下载。
7. 预览由生成的真实 STL 文件加载。前端不使用替代圆柱或虚构机器模型制造效果。
8. 一个任务保留自己的需求、参数、源文件摘要、执行输入/返回、文件摘要和版本关系；修改生成新版本，新版本必须重新确认。补充上传任务时继承原图和已有需求；DXF 可补齐深度/单位。STEP/DXF 不能用一段文字悄悄改变几何；完整新参数替换原图时必须明确选择替换。

成果包括 STEP、STL、三个方向的 SVG、DXF、中文 PDF 和参数 JSON，共 8 个文件。SVG 来自实体投影；DXF 是实体中截面。PDF 是三视图、包络尺寸、完整参数和技术要求，不是已经补齐全部尺寸/公差标注的机床加工图。

支持参数操作：圆柱、方块、闭合轮廓拉伸、轮廓旋转、实体并集/切除、边倒角和圆角；单位 mm/cm/inch，实体输出统一 mm。

当前明确不支持螺纹、多体装配、未列出的特征和任意自由曲面。不能唯一确定三维结构或特征未受支持时不返回默认模型，不声称“所有用户需求均已完整实现”。

示例（带通孔销轴）：

```json
{
  "units": "mm",
  "operations": [
    {"type": "cylinder", "diameter": 30, "length": 50},
    {"type": "cylinder", "diameter": 10, "length": 50, "mode": "cut"}
  ]
}
```

## 实际文件

| 位置 | 行为 |
| --- | --- |
| `services/agent-service/app/agents/cad/modeling_schemas.py` | 严格单位/特征/上传/确认契约 |
| `modeling_analysis.py` | 需求和图纸分析，复用现有模型网关，拒绝合成模型回应 |
| `modeling_engine.py` / `modeling_worker.py` | 隔离真实 CAD 内核、实体/STEP 检验与工程导出 |
| `modeling_drawings.py` | 中文 PDF，完整长文本/参数分页 |
| `modeling_service.py` | 有界队列、任务持久化、输入输出、版本摘要与确认 |
| `modeling_api.py` | CAD API；沿用令牌鉴权，路径及文件摘要校验 |
| 现有 `cad/agent.py` | 仅增加独立生产建模入口，原 Graph 不变 |
| 现有 `api/server.py` | 仅挂载上述路由；保留改前已有用户修改 |
| `frontend/monitor-react/src/app/production-cad/` | 独立页面、真实 STL 预览、状态/上传/下载辅助、测试和样式 |
| 现有 `App.jsx` / `WorkbenchShell.jsx` | 新入口、路由白名单与导航；其他页面不重做 |
| 前端 `package.json` / lock | 固定增加 `three@0.186.1`，已有代码原本已引用但未声明此依赖 |
| `services/agent-service/tests/test_cad_modeling_*.py` | 实际函数/API/内核及 HTTP 契约测试 |

`frontend/monitor` 由当前源码执行 Vite 构建更新，没有手改打包 assets。构建会替换旧生成的哈希文件，不删除业务源文件或数据。

## API 与状态

- `POST /api/cad/designs`：需求/参数建模。
- `POST /api/cad/designs/import`：上传图纸建模。
- `GET /api/cad/designs` / `GET /api/cad/designs/{id}`：任务列表/当前详情。
- `GET /api/cad/designs/status`：实际探测 CAD 引擎；不是固定返回就绪。
- `POST /api/cad/designs/{id}/revisions`：新版本。
- `POST /api/cad/designs/{id}/confirm`：确认已经校验的指定摘要。
- `GET /api/cad/designs/{id}/artifacts/{kind}`：查看；增加 `?download=1` 下载。

状态：排队 → 解析 → 建模 → 校验/导出 → 已生成 → 已确认；另有待补充信息、失败、中断。服务重启不会盲目恢复旧写任务，而是保留资料并标记中断。计算失败不开放半成品，文件被改动不能继续下载或确认。

原有监控代理已经允许 CAD API 和 PDF 响应，不修改代理白名单、鉴权或其他业务。代理不转发任意自定义头，因此命令身份同时置于 CAD 请求体；同一身份参数改变返回 409。

## 依赖与数据

CadQuery 2.8.0、OCP 7.9.3.1.1 安装在项目 `.runtime/cad-modeling-venv`，未改基础 Python、其他服务依赖或模型配置。生产建模依赖文件位于 CAD Agent 的 `requirements-modeling.txt`。

当前 Windows 环境安装方式：

```powershell
& 'L:/anaconda/python.exe' -m venv 'L:/industry_agent/.runtime/cad-modeling-venv'
& 'L:/industry_agent/.runtime/cad-modeling-venv/Scripts/python.exe' -m pip install --only-binary=:all: -r 'L:/industry_agent/services/agent-service/app/agents/cad/requirements-modeling.txt'
```

安装命令用于重建缺失的独立环境；当前已经安装，不需要重复覆盖。PDF 使用基础环境已有 PyMuPDF；前端使用已有 React/Vite 和新增 Three.js。换机器后需重新创建虚拟环境，不能直接复制包含绝对路径的 venv。

任务及上传资料存储在 `.runtime/cad-designs`，不改 MySQL/SQLite 业务数据。验证使用临时数据库配置、临时任务目录和 `.runtime/verification/production-cad-20261004/browser-designs`，后者仅为测试数据，不进入正式任务列表。

当前文件任务存储面向一个 Agent API 进程，不能把多个独立工作进程同时指向相同任务目录作为分布式任务系统使用；没有为此修改其他服务或加入业务数据库。

## 实际验证与限制

首轮 API：9 项先因 404 失败，再全部通过。追加特征/长 PDF 测试：先发现 5 项失败，修复后 14 项通过。代理命令身份：API 和前端各一项先失败再通过。

初轮完整 Agent 回归：519 passed，0 failed，0 skipped；全部前端 Node 回归：29 passed，0 failed，0 skipped。最终独立审查后的回归结果见下方追加记录。

已执行命令（项目根目录，前端构建除外）：

```powershell
& 'L:/anaconda/python.exe' -m pytest -c pytest-agent.ini -q
& 'L:/anaconda/python.exe' -m pytest -c pytest-agent.ini services/agent-service/tests/test_cad_modeling_api.py services/agent-service/tests/test_cad_modeling_details.py services/agent-service/tests/test_cad_modeling_contract.py -q
$cadTests = @(rg --files frontend/monitor-react/src | Where-Object { $_ -match '\.test\.mjs$' })
& 'L:/nodejs/node.exe' --test @cadTests
# 工作目录 frontend/monitor-react
& 'L:/nodejs/npm.cmd' run build
```

隔离浏览器 6 项验收通过：新入口、真实 STL、8 个成果下载链接、尺寸展示、确认后新版本重置确认、刷新持久化。浏览器初次暴露 React 清空 Three.js 画布问题，修复专用容器后通过，未捕获页面脚本异常。

最终浏览器扩展为 8 组：逐一真实下载 8 个成果文件并核对响应/大小；注入“服务端接收但客户端响应丢失”，再次提交命令身份相同、任务只增一条；上传 PNG 后补充结构化参数，新版本继续保留同一原图摘要。仅在隔离适配器和任务目录执行。

中文 PDF 经 Poppler 渲染并视觉核对；完整长技术要求/轮廓点通过正文提取断言，不删失败测试或放宽几何标准。

HTTP 契约两项通过：实际 `ModelServiceClient` 向本地聊天/视觉适配器发送请求；实际监控 HTTP 代理传递 CAD 请求体和 PDF 下载响应。适配器只替代外部系统，未替代被测客户端/代理逻辑。

未执行收费模型的真实图片/PDF识别联调、生产环境部署、Docker/多进程部署和机器加工验收。图纸识别不是“保证所有复杂图纸都正确”的承诺；必须核对生成的完整参数和视图。生产能力、公差、装夹与后处理仍需后续明确的业务接口和加工验收标准。

已有前端 Vite/esbuild 的 npm audit 仍报告 1 high、1 moderate；这是原有构建工具依赖，不是新增 Three.js。未在本次无关升级打包工具；验收使用构建静态文件，不开放 Vite 开发服务。构建有包体大于 500 kB 的提示，构建本身通过。

## 备份与恢复

修改前六个已有源码/依赖文件原样备份在 `.runtime/backups/production-cad-20261004`，按项目相对路径保存，包含用户改前已有修改。没有备份或复制密钥/生产配置。

恢复时先另存现有改后文件，再把备份中的以下同路径文件复制回项目：CAD `agent.py`、Agent `api/server.py`、前端 `App.jsx`、`WorkbenchShell.jsx`、`package.json`、`package-lock.json`。此操作撤回页面/API挂载，不删除任何业务数据。新 CAD 模块可以保留为未挂载文件，原上传资料/模型文件也保留；不要递归删除 `.runtime`。

构建产物不是源码备份对象；恢复页面源码后按需重新构建。旧源码本来引用 Three.js 却未声明依赖：若需要构建恢复后的旧页面，可保留 Three.js 的明确依赖，不必删除它。不会自动用远程提交覆盖文件。

全部输出、失败复现、测试和浏览器截图保留在 `.runtime/verification/production-cad-20261004`。本报告记录的是离线/隔离功能验证，不是生产加工验收。

## 最终审查修复

独立审查确认 4 个重要问题。本次没有再次派审查者，而是先补复现测试再修复，并重新跑全套：

| 发现 | 修复及回归 |
| --- | --- |
| STEP 多根导入仅取首件 | 检查全部根对象，拒绝多根/多实体；用 OCP 导出真实两根 STEP 先复现，再核对拒绝。STEP 回读与 DXF 导入也检查完整根对象 |
| 网络响应丢失后重试新建重复任务 | 命令身份绑定有效请求；未知结果重试复用身份，参数变化或明确新任务才换身份；Node 与实际浏览器断网注入覆盖 |
| 新版本丢失原上传资料 | 原图按不可变摘要继承、补充上下文和导入参数；图片、DXF 实际 API 及浏览器覆盖；资料被改动不继承 |
| 模型尺寸无来源门禁 | 合法模型 JSON 只是建议参数，未核对不得建模/下载；模型故障注入仍保持待输入，再由用户提交明确参数 |
| DXF 源单位记录错误 | 根据真实导入单位和深度记录 PDF；cm → mm 实体转换保持正确；正文断言并渲染核对 |
| CAD 队列没有应用关闭钩子 | CAD 专用路由受控排空本路由创建的队列；真实 FastAPI 生命周期测试，不再仅依赖测试手动清理 |

后两项原审查标为 Minor；重新按用户实际影响评为 Important：源单位错误会造成资料误读，缺少关闭处理会在应用结束后继续写入。已与其他重要项一起修复，未遗留审查 Minor。

视觉验收还发现小尺寸零件的 SVG 线宽会随模型缩放被放大，遮盖轮廓。补真实 SVG 输出断言先失败（约 54 px），改为内核自动按缩放计算线宽，并再次渲染 PDF 核对。没有降低几何标准。

进一步真实内核覆盖：英寸/X 轴圆柱、旋转体、台阶并集、圆角、倒角；验证尺寸/体积或特征确实改变体积。

最终实际结果：Agent 全套 **531 passed / 0 failed / 0 skipped**（包含 38 项新增 CAD 回归）；前端全套 **30 passed / 0 failed / 0 skipped**（包含 6 项新增 CAD 回归）；浏览器 **8 组通过**；当前源码 Vite 构建退出码 **0**。以 `agent-delivery-final.log`、`frontend-reviewed-final.log`、`browser-delivery.log`、`build-final.log` 为依据。所有关联失败复现记录保留。

审查未执行项的处理决定：

1. 未验证收费视觉/OCR准确率；保留人工参数核对门槛，不将其写作已验收能力。未核对的误读可能造成错误设计。
2. 未进行恶意原生图纸的漏洞/压力测试；已有大小、数量、队列及计算超时限制，但不把独立进程当成完备安全沙箱。未经加固的恶意资料仍可能造成解析器/资源风险。
3. 未验证跨进程共享存储；明确只支持单个 Agent API 进程。多进程共享目录可能造成重复/竞争，不能擅自扩大部署。
4. CAM/刀路/机床下发、其他四服务与数据库按用户明确范围延期；本功能只提供设计成果，不能直接触发机器生产。
