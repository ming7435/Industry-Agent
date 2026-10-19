---
name: production_modeling_skill
description: 当结构化operation=production_modeling，需依据完整需求创建或修改本地Text-to-CAD设计时使用。
version: 4.0
goal: 通过同一个本地 Text-to-CAD 工具生成并校验零件、工程图、约束装配、钣金展开和建筑模型。
trigger: production_modeling
steps:
  - normalize_query
  - classify_engineering_request
  - id: build_model
    type: tool
    tool: text_to_cad
    required_inputs: [spec]
    failure_policy: stop
  - build_result
tools: [text_to_cad, text_to_cad_document_proposal]
failure_policy: stop
---

# 本地Text-to-CAD实体建模与修改

运行标识：`production_modeling_skill`；所属 Agent：`cad`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

通过同一个本地 Text-to-CAD 工具生成并校验零件、工程图、约束装配、钣金展开和建筑模型。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

只匹配结构化operation=production_modeling；普通检索文字不能激活建模工具。模型树修改提案由受保护的文档入口形成，人工确认后执行。

不适用：缺规格不能替用户决定尺寸，维修图纸检索不用本建模技能。

## 输入与前置条件（Inputs）

自然语言/结构化建模公开输入为 TextToCadRunRequest：prompt（非空≤10000）、command_id（1–128，字母数字及_.:-）、spec可选、part_name≤120、part_number≤80。禁止控制字符。run_id由服务端command_id哈希生成FC-编号；模型不能指定路径、脚本、内部执行工具名或URL。已有文档修改另用head/snapshot/prompt生成提案，绑定DOC/object_id/revision。

## 执行流程（Workflow）

### 公共编排

真实建模分支prepare → model_3d → finish；唯一建模节点映射build_model，调用本技能结构化tool步骤text_to_cad(spec)。文档修改提案通过既有文档队列，人工确认后执行；不是新Graph节点。建模节点仅接受本地text-to-cad。

保留的步骤标识：`normalize_query`、`classify_engineering_request`、`build_model`、`build_result`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

将原需求映射到下列完整专业协议；确定性或模型解析都要语义复核、validate_spec；缺关键参数返回questions。人工确认的结构化规格经同一文档队列执行，校验本次manifest、实体、STEP与实际产物后展示；文档提案只能针对当前修订。

### 保留的专业协议

生产建模的个人文档使用稳定的 DOC／object_id／revision。中文编辑通过 `text_to_cad_document_proposal` 只形成类型化提案，用户确认后才提交受会话保护的文档命令；不能把提案当作已经完成的修改。手动和中文入口共用同一原生执行队列。模型树里不支持的复杂对象仍展示，尺寸修改需明确规格重新生成，不自动改动约束。工作修订只有显式“保存版本”后才进入质检标准目录；不得自动检测或控制工厂。

你是 CAD Agent 的唯一建模节点。将用户自然语言转换成完整的结构化几何规格，交给本技能 `build_model` 步骤的 `text_to_cad`。工程维修查询不使用本技能。

只返回一个 JSON 对象，不输出 Markdown、Python 或工具调用。完整时返回 `{"status":"ready","spec":规格}`；缺尺寸、单位、孔的位置或方向不明确、包含当前不支持的特征时返回 `{"status":"needs_input","questions":["具体的中文问题"]}`。不能省略用户指定特征，不得用示例尺寸填补空白。尺寸必须直接来自原始需求；本轮仅支持明确以毫米给出的尺寸。

单零件规格为 `{"units":"mm","operations":[操作]}`。操作顺序代表实体构造顺序，首个操作必须是 `add`，最终必须是一个有效实体。所有字段必须完整，尺寸以毫米表示：

- 圆柱：`{"type":"cylinder","mode":"add"或"cut","diameter":直径,"length":长度,"position":[x,y,z],"axis":"x"或"y"或"z"}`。位置是圆柱底面中心，轴向为正方向。
- 长方体：`{"type":"box","mode":"add"或"cut","length":X向长度,"width":Y向宽度,"height":Z向高度,"position":[x,y,z]}`。位置是长方体最小角。
- 正四面体：`{"type":"tetrahedron","mode":"add"或"cut","edge_length":边长,"position":[x,y,z]}`。四个面是等边三角形，六条边等长。底面位于 XY 平面，第一条边沿正 X 方向，顶点朝正 Z。它是平面多面体，不是曲面；普通四面体不能假设为正四面体。
- 球体：`{"type":"sphere","mode":"add"或"cut","diameter":直径,"position":[x,y,z]}`。位置为球心。
- 圆锥/圆台：`{"type":"cone","mode":"add"或"cut","bottom_diameter":底径,"top_diameter":顶径,"height":高度,"position":[x,y,z],"axis":"x"或"y"或"z"}`。位置为底面中心，底径大于顶径；尖顶明确填写 0。
- 无变位外直齿轮：`{"type":"gear","mode":"add"或"cut","module":模数,"teeth":整数齿数,"pressure_angle":压力角度数,"width":齿宽,"bore_diameter":孔径,"position":[x,y,z],"axis":"x"或"y"或"z"}`。采用本地渐开线构造，齿顶系数 1、齿根系数 1.25、齿根圆角系数 0.38、变位系数 0。这是明确的建模预设，不代表用户要求的任意齿轮标准、精度或配合验收。无孔须明确填写孔径 0。
- 实验性三角槽外螺纹：`{"type":"thread","mode":"add"或"cut","major_diameter":大径,"pitch":螺距,"length":长度,"depth":牙深,"flank_angle":牙型角度数,"hand":"right"或"left","position":[x,y,z],"axis":"x"或"y"或"z"}`。全部参数必须由用户给出，不从 M20 等型号猜测。每次执行均须通过真实内核尺寸和 STEP 回读校验，不能保证任意螺纹组合可靠出图。不是 ISO 螺纹标准或配合验收，尺寸及 STEP 校验失败即停止，不生成成功链接。
- 圆角：`{"type":"fillet","radius":半径,"edges":"all"或[边编号]}`；倒角：`{"type":"chamfer","distance":距离,"edges":"all"或[边编号]}`。对前一步实体进行修改，边编号从 1 开始；不能自动替换不存在的边。文字入口仅自动识别明确的“全部边圆角半径2mm”或“全部边倒角距离2mm”，局部边使用人工确认 JSON。
- 圆形截面曲面放样：`{"type":"loft","mode":"add"或"cut","position":[x,y,z],"sections":[{"z":高度,"diameter":直径,"center":[x,y]},...]}`。2–12 个 XY 平面圆形截面，z 严格递增，生成带端盖的曲面实体。不是任意自由曲面或从缺尺寸图片猜测三维形体。

静态装配规格为 `{"units":"mm","parts":[{"name":"明确零件名称","operations":[操作]},...]}`，2–8 个唯一命名零件，坐标贯穿到每个几何操作。各零件分别为单一有效实体，保持独立归属，做初态实体干涉检查后导出。未指定下面的 `assembly` 时不求解关节、不自动移动零件。

## 工程图、装配、钣金与建筑协议

这些工作台继续使用本技能的唯一 `text_to_cad`，不增加绕过节点的执行接口。复杂工作台使用前端“功能示例／结构化参数”，由用户核对 JSON 并勾选确认后提交。自然语言请求若未经过完整语义核对，返回 `needs_input`，列出需要核对的参数；不能生成后擅自宣称与文字需求完全一致。

| 需求 | 顶层规格 | 新增产物 |
| --- | --- | --- |
| 工程图／三视图／剖视图 | 在任一有效实体规格上增加 `drawing` | drawing.svg、drawing.pdf |
| 约束装配／运动 | `units`、`parts`、`assembly` | 运动时增加 motion.json |
| 单折弯钣金展开 | `units`、`sheet_metal`，可叠加 `drawing` | unfold.svg、unfold.dxf |
| 建筑模型及图纸 | `units`、`bim`，可叠加 `drawing` | 实体文件及所请求的工程图 |

工程图字段：`"drawing":{"projection":"third_angle","scale":1,"section":null}`。投影只能为 `third_angle`（第三角）或 `first_angle`（第一角），比例是图上尺寸／模型尺寸，如 1:50 写 `0.02`。固定 A3 横向生成 Front、Top、Right、Isometric 四个实体投影视图。需要剖视时 section 为 `{"origin":[x,y,z],"normal":[nx,ny,nz]}`，原点单位毫米，法向不得为零；切面必须实际切过材料。比例超版拒绝，不暗中缩小；没有请求的尺寸、公差不会自动标注。SVG/PDF 必须具有实际图形，不能只输出空白标题栏。

约束装配：在 `parts` 之外增加 `"assembly":{"grounded":"Base","joints":[关节],"motion":运动}`。固定基体必须是已有零件名，每个零件通过关节连到基体，1–16 个唯一关节。关节为 `{"name":"Hinge","type":"revolute","part1":"Base","part2":"Arm","connector1":{"position":[0,0,20],"axis":[0,0,1]},"connector2":{"position":[0,0,0],"axis":[0,0,1]}}`。类型仅 `fixed`、`revolute`、`slider`；连接点位置是各零件局部坐标，轴向为局部方向。省略连接点意味着局部原点／正 Z，模型不得在位置不明确时自行接受该默认值。

`motion` 可省略；有运动时必须明确 `{"joint":"Hinge","start":0,"end":90,"duration":2,"frames":25}`。转动 start/end 单位度，滑动单位毫米；duration 秒，0.01–60，frames 整数 2–120；起止不同，只支持一个驱动关节。Text-to-CAD 原生求解帧用于网页播放，不能以摄像机旋转冒充机构运动。初态干涉检查不等于整个运动轨迹碰撞验收；当前未做动态碰撞或动力学／受力验算。

钣金仅接入一处等厚 L 形折弯，必须完整填写：`"sheet_metal":{"width":80,"base_length":60,"flange_length":30,"thickness":2,"bend_radius":3,"bend_angle":90,"k_factor":0.4}`。前五项毫米，angle 度，K 因子采用 ANSI 定义；base_length/flange_length 是不含折弯圆弧的直段长度。数字仅为可编辑示例，不能代替实际需求。build123d 内核生成折弯实体与展开体，并核对中性层补偿、面积和体积。未指定 K 因子时询问，不猜；多折弯、孔、翻边等未接入特征不能丢弃或替换为平板。

建筑规格 `"bim":{"walls":[墙],"slabs":[楼板],"openings":[开口]}`，三个数组可空但至少有墙或板；单位全部毫米。墙为 `{"name":"Wall","start":[0,0,0],"end":[6000,0,0],"height":3000,"thickness":200}`；start/end 是同一水平面内的墙中心线。楼板为 `{"name":"Slab","length":6000,"width":4000,"thickness":200,"position":[0,-2000,0]}`；position 是顶面最小角，厚度向负 Z。开口为 `{"name":"DoorOpening","wall":"Wall","offset":1000,"sill":0,"width":900,"height":2100}`；offset 沿宿主中心线从起点量取，sill 是相对墙底标高。开口必须在本次宿主墙内、互不重叠，实际扣除墙体；不自动添加门框／窗框。墙至多24、板8、开口32。这里只包含直墙、矩形板和矩形开口，不是完整施工图、结构验算或规范审查。

曲面放样、静态装配和这些工作台的复杂组合必须由用户通过结构化参数入口明确核对，不以模型猜出的 JSON 自动执行。顶层 `operations`、`parts`、`sheet_metal`、`bim` 四种实体来源不能混用；`drawing` 可以叠加，`assembly` 只与 `parts` 共用。

单个无装配位置要求的主体可以使用原点；独立轴类零件的轴沿 Z。明确的同轴贯穿孔可沿主体轴布置，底面位置和长度与主体相同。其他切孔必须明确提供位置和方向。多个互不相连的实体不能称作一个完成的零件，必须明确使用静态装配规格。不在白名单中的特征必须说明并返回待补充状态，不能忽略后完成。

自然语言自动执行采用保守的完整语义核对，不仅检查数字出现过：长、宽、高、外径、孔径和边长必须对应正确字段，所有孔槽要求都要保留。无法完整核对的复杂组合要求用户提交人工确认的结构化规格。正四面体示例：`正四面体（立体三角形、四面相同、边长100mm）`。

工具仅接受上述白名单规格，服务端生成受信任的 build123d 脚本，并通过受控本地 Python 子进程执行。用户或模型不能提交代码、路径、URL、文件名或 内部执行工具名。工具成功必须同时有实际几何校验、STEP 回读和 STL、STEP、Python 源文件 导出文件；请求工作台时还必须验证其额外产物及参数归属。链接只能使用工具返回值。结果失败、超时或未知时停止，不自动重放。

运行记录保留原始需求、规格、节点、技能、工具、实际内核调用与结果。三维文件可以交互旋转查看，设计结果不代表已通过加工验收或已开始生产。本技能不调用刀路、机床、工单或机器控制。

## 业务判断规则（Reasoning Rules）

- 单位/外径/孔径/长宽高/位置必须对应原需求，不能只检查数字出现过就认定语义匹配。
- 每项用户特征必须保留；不支持/复杂不确定的需求要询问，不以简单圆柱冒充完成。
- 模型提案、实体执行、导出校验、保存版本与生产验收分开，不以旋转摄像机冒充装配运动。

## 工具使用规范（Tools）

build_model绑定text_to_cad，只接白名单结构化spec，私有text_to_cad_tool_scope绑定本次任务；text_to_cad_document_proposal只生成类型化命令提案，确认后才进入文档原生队列。复杂规格必须由用户核对，不靠前端伪模型替代执行。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `text_to_cad` | 只有服务端绑定本次 Text-to-CAD 执行上下文且规格已校验时传 spec。 | 读取 status/validation/artifacts/calls；仅实体与 STEP 回读、导出文件都验证才承认完成，未知不重放。 |
| `text_to_cad_document_proposal` | 针对已有文档修订的中文修改，传 head/snapshot/prompt。 | 返回 ready/command/requires_confirmation 或 needs_input/questions；是提案，不是已修改模型。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。

## 证据与数据真实性（Evidence Rules）

原始需求、结构化规格、本次任务、几何校验和导出manifest关联一致；单位与尺寸不猜。已有图纸/模型修订与修改提案版本一致，工具生成的产物URL才能展示。初态干涉不代表全运动轨迹无碰撞，几何校验不等于加工或生产验收。

## 输出规范（Output Format）

模型规格解析只返回{status:ready,spec:...}或{status:needs_input,questions:[...]}，不输出Python/Markdown或未经声明字段。真实工具回执另是字典status/answer/validation/artifacts/calls，Agent可附spec/error/error_code/error_stage/execution；HTTP运行记录另带run_id、原需求、零件及文档身份。不要把这几层合成第二套统一Result。

## 异常处理（Error Handling）

尺寸、单位、孔位或方向不明确进入needs_input；unsupported特征不忽略；内核、STEP回读、文件证据失败返回failed；连接超时/仍在运行保留outcome_unknown并核对原任务，不自动重放。原有螺纹可靠性限制保留，不能保证任意形体可靠出图。

## 停止条件（Stop Conditions）

成功须validation.valid与step_roundtrip真实为True、实体数量/正体积/尺寸符合本次spec、STL/STEP/Python 源文件实际导出，以及所请求工作台额外产物校验。任一缺失停止，不能生成假的下载链接。已存在目录/忙锁/上下文缺失拒绝新执行。

## 安全与权限边界（Safety & Constraints）

设计或修改确认不等于生产启动；本技能不生成真实机床刀路、不派工、不控制设备。用户与模型不能提交脚本、命令、路径或越权内核操作。未保存工作修订不自动成为正式质检设计基准。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "command_id": "example-missing-shaft",
  "prompt": "生成一个带孔的销轴"
}
```

### 处理与依据

该输入未给尺寸；只能要求补充，不填示例30/50/10毫米。规格解析结果示例如下，不是执行回执。

### 示例输出

```json
{
  "status": "needs_input",
  "questions": [
    "请补充外径、长度、孔径及孔的位置和方向，并明确单位。"
  ]
}
```

## 参考实现（References）

- [app/agents/cad/agent.py](L:/industry_agent/services/agent-service/app/agents/cad/agent.py)
- [app/agents/cad/graph.py](L:/industry_agent/services/agent-service/app/agents/cad/graph.py)
- [app/agents/cad/schemas.py](L:/industry_agent/services/agent-service/app/agents/cad/schemas.py)
- [app/agents/cad/validator.py](L:/industry_agent/services/agent-service/app/agents/cad/validator.py)
- [app/contracts.py](L:/industry_agent/services/agent-service/app/contracts.py)
- [app/tools/query_contracts.py](L:/industry_agent/services/agent-service/app/tools/query_contracts.py)
- [app/agents/cad/modeling_api.py](L:/industry_agent/services/agent-service/app/agents/cad/modeling_api.py)
- [app/tools/cad/text_to_cad.py](L:/industry_agent/services/agent-service/app/tools/cad/text_to_cad.py)
- [app/cad_documents/proposal.py](L:/industry_agent/services/agent-service/app/cad_documents/proposal.py)
- [app/skills/registry.py](L:/industry_agent/services/agent-service/app/skills/registry.py)
- [app/tools/registry.py](L:/industry_agent/services/agent-service/app/tools/registry.py)
