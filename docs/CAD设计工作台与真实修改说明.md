# CAD 设计工作台与真实修改说明

日期：2026-10-08。范围：当前本地项目的 CAD 网页，不重构服务，不改模型配置，不控制设备。

## 现在怎么使用

1. 打开 `http://127.0.0.1:8001/?view=cad`，刷新页面。
2. 输入完整需求，或选择“法兰轴套 · 中心孔与安装孔”“安装底板 · 四孔与凹槽”等设计模板。
3. 模板模式下，以显示的参数为实际建模输入，文字用于说明用途。需要只按文字生成时，点击“仅按文字建模”，清除模板参数。
4. 核对尺寸后点击“生成 3D 模型”。结果区显示实际模型及本轮生成的工程图。
5. 点击三维模型或工程图右上角的“图上编辑”，在图内选择主体或某个孔，点击尺寸直接输入；三维已有几何标注还可以拖动圆形端点修改尺寸或孔位。保持在图内完成修改，无需跳到下面表单。也可以点击“修改设计”使用完整参数表单，添加通孔、圆角、倒角或删除非主体特征。
6. 图内勾选“图上修改已核对”，点击“应用图上修改”；表单模式使用“我已核对修改后的尺寸与特征”和“应用修改，生成新版本”。修改重新经过 FreeCAD 实体构建与校验，成功后更新三维模型和本轮图纸。未应用的草稿不会改变原实体，可点击“撤销图上草稿”取消。
7. 用“设计版本”切换已有版本。刷新和切换仅查询，不重复建模。下载 STEP、STL、FCStd 或本轮实际返回的工程图文件。

新增孔和圆角的初始值是可修改的设计提案，不是设备合格阈值。圆角和倒角当前默认作用于全部边，过大尺寸或不成立的几何关系可能被服务端拒绝。

## 界面调整

- 中文“零件设计工作台”，按设计输入、模型与图纸、修改设计组织，保持上下布局。
- 不在主界面展示节点、Skill、MCP 调用链或原始参数对象。必要的完整输入、工具调用和校验记录仍在折叠的“技术记录”中保留。
- 常用参数改为中文数字表单；复杂特征默认折叠，原始结构化参数收在“专业设置”。
- 模板参数优先级、连接检查等待、人工确认、失败和未知结果均有明确提示。
- 三维预览继续读取实际导出的 STL，支持旋转、缩放、平移、复位和原有真实机构运动，不生成替代假模型。
- 新增组合特征模板：法兰包含凸台、中心孔及四个安装孔；底板包含四孔及凹槽。并非只展示基本圆柱。

## 实际修改文件

| 文件 | 作用 |
| --- | --- |
| `frontend/monitor-react/src/app/production-cad/ProductionCadWorkspace.jsx` | 用户界面、编辑提交、版本切换、模板优先提示 |
| `frontend/monitor-react/src/app/production-cad/FreeCadModelViewer.jsx` | 专业预览呈现和可点击尺寸入口，保留真实模型加载 |
| `frontend/monitor-react/src/app/production-cad/productionCad.css` | 工作台、参数编辑、图纸区及手机排版 |
| `frontend/monitor-react/src/app/production-cad/designEditor.mjs`（新增） | 真实规格转换、参数校验、增删特征、组合模板和版本元数据 |
| `frontend/monitor-react/src/app/production-cad/DesignParameterEditor.jsx`（新增） | 中文参数编辑器和无效输入门禁 |
| `frontend/monitor-react/src/app/production-cad/designEditor.test.mjs`（新增） | 十项真实转换函数回归 |
| `tests/browser/freecad-workspace.test.mjs` | 保留原有浏览器回归并补充编辑、版本与异步连接检查 |
| `frontend/monitor/index.html`、`frontend/monitor/assets/*` | 由当前源码执行 Vite 构建产生，未手工编辑打包文件 |

既有 `freecad.mjs` 本次没有修改。保留原有唯一网页建模接口 `/api/cad/freecad`；每个新版本使用独立命令编号，响应丢失后只回查，不自动重放写操作。

## 实际验证

先写失败测试再实现；观察到缺失编辑器、尺寸定位、无效输入以及提示行为的失败，再补实现。没有删除失败测试、放宽成功校验或增加跳过。

| 命令及执行目录 | 最终结果 |
| --- | --- |
| `node --test src/app/production-cad/*.test.mjs`，`frontend/monitor-react` | 49 通过，0 失败，0 跳过 |
| `node --test tests/browser/freecad-workspace.test.mjs`，项目根目录 | 24 通过，0 失败，0 跳过 |
| `node --test`，`frontend/monitor-react` | 最终两次复跑均为 205 通过，0 失败，0 跳过 |
| `npm run build`，`frontend/monitor-react` | 成功；仍有原有大于 500 kB 的包体提示，未提高警告阈值 |
| `node .runtime/verification/cad-design-workspace-live.mjs`，项目根目录 | 真实页面、Agent、Skill、MCP、FreeCAD 两版本联调通过 |
| `node .runtime/verification/cad-design-workspace-readonly.mjs`，项目根目录 | 最终构建桌面和手机复核通过，0 写请求，0 页面错误 |

浏览器测试使用本机 Chrome 和实际 React、Three.js、STL 加载器；受控 API 响应用于契约测试，不把它们当作真实 FreeCAD 出图证明。环境变量如下：

```powershell
$env:PLAYWRIGHT_MODULE_PATH='C:/Users/12587/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs'
$env:CHROME_EXECUTABLE='C:/Program Files/Google/Chrome/Application/chrome.exe'
node --test tests/browser/freecad-workspace.test.mjs
```

首轮全量前端测试出现过两项工单测试 `window is not defined` 错误；最终重复运行均通过。本次没有修改这些工单模块，不将其通过归功于 CAD 修改。

### 真实修改证据

- 初版：`FC-2f339e687343184830407c8d6337304a59c467618a81e32b1ea33ca994ec0e55`，外形 `70 × 70 × 42 mm`，体积 `60507.074508139405 mm³`。
- 修改版：`FC-32056a94f1af2875fa9fce71eed79dcf95e3bf9c9ee811f9fac719272b57ecef`，法兰直径改为 80 mm，外形 `80 × 80 × 42 mm`，体积 `74644.2414492935 mm³`。
- 体积差与该法兰尺寸变更的解析计算一致；STL、STEP、SVG、PDF 文件哈希均改变。初版五个文件哈希全部保持不变。
- 每个版本真实执行一次 `model_3d → production_modeling_skill → freecad_mcp`，每次一次 `execute_code`；总共两次建模提交。切换和刷新不新增提交。本轮联调不调用收费模型，不发设备命令。
- 最终只读复核将 80 mm 编辑为 85 mm 草稿但不提交，确认旧实体仍为 80 mm，修改按钮满足连接与人工确认门禁后才启用。
- 证据在 `.runtime/verification/cad-design-workspace-live/`，包含原始记录、修改记录、文件哈希、最终页面截图及 `final-readonly.json`。

## 边界和存储

- 本次实现的是网页参数化编辑，不是完整浏览器版 FreeCAD。尚不支持任意拖拽面、交互草图约束、选择特定边进行圆角，或在二维图上任意绘制标注。需要这些操作可下载 FCStd 用 FreeCAD 编辑。
- 可编辑已有规格中的基础实体、齿轮、孔、圆角、倒角、放样截面、工程图设置、钣金、装配和建筑参数。跨特征关系不自动推断；人工要核对相关孔深和位置，最终由实际几何校验判断能否生成。
- 原有临时运行记录保留在 Redis，期限为 24 小时。版本选择元数据保留在当前浏览器会话，最多 20 条；这不等同于长期版本库。
- 设计文件在既有 `.runtime/cad-models/<运行编号>/`（配置自定义目录时以配置为准）。运行记录过期后网页接口不能据此继续下载，重要文件应及时下载保存。本次不改数据库、不迁移或删除已有产物。
- 设计生成、模型有效和工程图导出不代表材料、公差、刀路、碰撞、强度或生产验收合格；没有调用生产启动接口。

## 备份与恢复

修改前备份在 `.runtime/backups/cad-design-workspace-20261008/`，保留原有相对目录，共五个已存在文件。`freecad.mjs` 仅备份未修改。

恢复时逐个比较备份和现有源码，合并需要撤回的本次修改，不覆盖随后产生的用户修改。恢复原页面与测试后，移走不再引用的新增编辑器模块，再到 `frontend/monitor-react` 执行 `npm run build`。不要回滚整个脏工作区，不删除 Redis、数据库或模型文件。本次未改配置，亦无数据库迁移。

## 追加：图内直接编辑

本轮按“用户直接在图中修改”的要求增加图内编辑层，仍只修改 CAD 前端，保留原有节点、Skill、MCP 和实际建模接口。

### 修改内容与使用边界

- 三维图内有对象选择、尺寸标注、直接数字输入、可拖动端点、核对和应用按钮。主对象和孔特征分别对应自己的真实规格字段，不会默认改错零件。
- 根规格中的长方体、圆柱、球体、圆锥、正四面体和齿轮，按确定的源坐标生成相应尺寸引线；位置和轴向按真实规格处理。切除特征提供 X/Y 位置拖动。标注随当前相机旋转、缩放更新，拖动由屏幕投影换算成毫米，不缩放 STL 网格冒充建模结果。
- 其余有参数的特征，以及装配、钣金、建筑，通过图内参数入口编辑。尚未建立可靠几何对应关系的对象不伪造空间标注；机构运动也不套用静态零件的尺寸投影。
- 二维工程图和展开图可以在图内选择特征并修改参数，但不支持点击任意 SVG 线段修改草图约束，也不支持二维线段直接拖动。本轮未实现任意面推拉、任意三角面选择或完整草图编辑器。
- 修改过程中原实体和工程图保留，标注和参数为明确标识的“修改草稿”。确认前没有写请求；确认后才实际重新生成。空值、非法尺寸、未核对、连接未确认以及运行中状态不能直接提交。
- 原先完整表单编辑入口继续保留，图内和表单共同使用一个规格草稿。取消图上草稿取消的是这份共享草稿，不删除已生成版本。
- 同时修复空工作台的空引用错误，并纠正 X/Y 朝向齿轮的齿宽标注方向。修复端点被确认工具栏遮挡的问题，保留指向真实端点的引线。

新增 `directEditing.mjs`、`InlineDimensionEditor.jsx`、`directEditing.test.mjs`；修改 `ProductionCadWorkspace.jsx`、`FreeCadModelViewer.jsx`、`productionCad.css` 和浏览器回归。新增真实法兰 STL 回归夹具及来源说明在 `tests/fixtures/freecad-workbenches/flange/`。运行证据脚本位于 `.runtime/verification/cad-direct-edit-live.mjs` 和 `cad-direct-edit-readonly.mjs`，不属于生产接口。

### 本轮测试

先观察缺少图内编辑入口、可拖动端点被遮挡、齿轮朝向错误以及使用说明缺失的失败，再补实现。回归中的空页面崩溃真实复现后修正，没有删除失败用例或扩大跳过。

| 命令及执行目录 | 最终结果 |
| --- | --- |
| `node --test src/app/production-cad/*.test.mjs`，`frontend/monitor-react` | 56 通过，0 失败，0 跳过 |
| `node --test tests/browser/freecad-workspace.test.mjs`，项目根目录 | 29 通过，0 失败，0 跳过 |
| `node --test`，`frontend/monitor-react` | 最终 215 通过，0 失败，0 跳过；期间其他并行本地修改增加了两项非 CAD 测试，未将其归为本轮新增 |
| `npm run build`，`frontend/monitor-react` | 成功；保留原有包体警告 |
| `node .runtime/verification/cad-direct-edit-live.mjs`，项目根目录 | 真实图内修改及实体重建通过；只提交一次，0 页面错误 |
| `node .runtime/verification/cad-direct-edit-readonly.mjs`，项目根目录 | 最终构建真实产物复核通过；0 写请求，0 页面错误 |

浏览器回归实际执行图内输入、鼠标拖动、孔特征选择、取消和非法输入阻止提交；通过受控响应检查真正发送的参数。另做当前构建的真实 FreeCAD 联调，不混同两类验证。

按照代码审查技能进行独立只读审查，发现并修复三项：多视图打开的输入值未同步、跨视图撤销后非法输入仍显示但门禁被清空、短尺寸标签遮住实际拖动端点。新增真实交互回归均经历失败后通过。当前图内、图纸和表单的草稿与取消操作同步；不相关字段的修改不能清除另一个空字段的校验错误。引线在文字下层、拖动圆点在标注上层，避免文字或确认栏遮住端点。

### 真实联调证据

- 在当前网页三维图内将原 80 mm 法兰直径输入为 90 mm。核对前未提交，原模型仍为 `80 × 80 × 42 mm`。
- 新运行：`FC-d5fe68329a81634e1afb68c163fa4afea7be9d9a37982c23c28554ccb3883e75`。实际 FreeCAD 外形为 `90 × 90 × 42 mm`，体积从 `74644.2414492935` 增至 `90666.36398260147 mm³`，体积差与解析计算一致。
- 实际执行仍为 `model_3d → production_modeling_skill → freecad_mcp`，一次 `execute_code`。STL、STEP、工程图 SVG、PDF 文件哈希变化；旧版全部五个文件哈希不变。
- 桌面和手机图内输入截图、二维图内修改截图及完整记录在 `.runtime/verification/cad-direct-edit-live/`。手机页面没有横向溢出；二维和手机后续草稿均未新增提交。
- 最终只读复核在当前构建中实际拖动法兰厚度端点改变草稿，确认空字段阻止其他视图提交；撤销时即使源值未改变，已打开输入也恢复。三维与二维有效输入同步，全部当前文件哈希仍与真实 90 mm 版本一致，写请求为零。
- 本次结构化输入不调用收费模型，也不调用设备控制；这不是生产加工放行验证。

### 本轮恢复

修改前五个既有文件备份在 `.runtime/backups/cad-direct-edit-20261008/`，保持相对目录。恢复本轮时逐文件比较、撤回本轮变化，避免覆盖其他用户修改；去掉对新增图内编辑模块的引用后再移走新增文件，重新执行 `npm run build`。不要直接手改打包产物。本轮没有配置变化、数据库迁移或原图删除。

以上是 CAD 设计工作台的本地验证结果，不是全项目或工业生产验收结论。
