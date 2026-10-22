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
  required_inputs:
  - spec
  failure_policy: stop
- build_result
tools:
- text_to_cad
- text_to_cad_document_proposal
- read_skill_reference
failure_policy: stop
---

# 本地Text-to-CAD实体建模与修改

运行标识：`production_modeling_skill`；所属 Agent：`cad`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

通过同一个本地 Text-to-CAD 工具生成并校验零件、工程图、约束装配、钣金展开和建筑模型。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

只匹配结构化operation=production_modeling；普通检索文字不能激活建模工具。模型树修改提案由受保护的文档入口形成，人工确认后执行。

不适用：缺规格不能替用户决定尺寸，维修图纸检索不用本建模技能。

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

## 输出规范（Output Format）

模型规格解析只返回{status:ready,spec:...}或{status:needs_input,questions:[...]}，不输出Python/Markdown或未经声明字段。真实工具回执另是字典status/answer/validation/artifacts/calls，Agent可附spec/error/error_code/error_stage/execution；HTTP运行记录另带run_id、原需求、零件及文档身份。不要把这几层合成第二套统一Result。

## 停止条件（Stop Conditions）

成功须validation.valid与step_roundtrip真实为True、实体数量/正体积/尺寸符合本次spec、STL/STEP/Python 源文件实际导出，以及所请求工作台额外产物校验。任一缺失停止，不能生成假的下载链接。已存在目录/忙锁/上下文缺失拒绝新执行。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `production_modeling_skill`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |
| `domain` | 领域专用协议 | 需要本技能独有的领域规则或装配建造协议时读取。 |

## 独立运行

复制本目录后，可运行 `python scripts/run.py --check`，或使用 `python scripts/run.py --input task.json --model-url http://127.0.0.1:8040 --tool-script scripts/mcp_adapter.py` 执行业务任务。输入字段见 `references/contract.md`；真实工具连接与限制见 `references/standalone.md`。
