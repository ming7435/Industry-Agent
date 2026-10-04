# Industry-Agent：从故障发现到维修闭环的 30 分钟讲解稿

版本日期：2026-10-03。依据：`L:/industry_agent` 当前本地代码与离线回归，不依赖远程仓库或历史截图。本次增补代码—效果对应说明、三张架构/流程图及一张工作台效果地图；不修改业务源码。

## 使用方法

这是可直接讲述的中文稿，不只是提纲。每节包含时间预算、口播正文与可选代码展示。正文和两次短代码导览合计约 30 分钟；最后的问答备页不计入这 30 分钟。实际时长随语速变化，正式讲述前建议计时试讲一次。

适合听众：项目老师、业务负责人、开发人员。核心目标是让听众理解：系统由谁判断、谁执行、证据如何传递、为什么不能让模型一句话直接完成维修，以及本轮精简到底改了什么。

讲述边界：当前设备侧为虚拟工厂。本文不会把离线测试、模拟数据或服务配置完整说成真实 PLC 或生产现场验收通过。所有例子都是讲解场景或明确标注的测试夹具，不是实际故障记录。文中不包含密钥。

效果依据分三层：代码决定的页面结构、测试实际验证的数据转换、在线运行截图。本次检查时本地相关端口未监听，未取得最新运行截图；下列图都是源码对应示意，不冒充在线效果。“本轮优化”指前一轮已完成的接入层优化；本次仅增补文档和绘图产物。

四张图使用同一套中文标签生成高清 PNG 与可编辑 SVG，遵循 exact-content 的确定性排版要求，避免生成式绘图改写节点名称。图的源码与复现命令见[图稿说明](L:/industry_agent/docs/assets/agent-talk/README.md)。

| 时间 | 主题 | 讲述目标 |
| --- | --- | --- |
| 00:00–02:00 | 项目解决什么问题 | 建立业务目标 |
| 02:00–05:00 | 五服务架构 | 明确职责和数据流 |
| 05:00–08:00 | Agent、模型、节点、Tool、Skill、状态、证据 | 消除概念混淆 |
| 08:00–11:00 | 监控如何触发一轮任务 | 区分采样、预警、诊断 |
| 11:00–15:00 | Agent Loop 在哪里 | 展示真实循环和停止条件 |
| 15:00–18:00 | RAG 与 CAD 的作用 | 解释知识证据和设备归属 |
| 18:00–22:00 | 维修方案与工单闭环 | 解释派工、验收和人工确认 |
| 22:00–24:00 | 质量检测的独立流程 | 区分产品质检与维修验收 |
| 24:00–26:00 | 日志、幂等与审批 | 解释可追溯和副作用控制 |
| 26:00–28:00 | 为什么优化，具体改了什么 | 解释精简而不是删除业务 |
| 28:00–30:00 | 测试、边界与总结 | 给出有证据的结论 |

看图安排：第二节看总架构，第五节看 Agent Loop，第七节看故障闭环；八个页面的效果地图供讲解前后查阅。图用于替代原来的文字流程说明，不增加额外时段。文末“代码与效果演示卡”是查阅材料，不要求在 30 分钟内逐条朗读。

## 第一节：项目解决什么问题〔00:00–02:00〕

### 口播正文

大家好，今天我介绍的是 Industry-Agent 工业智能运维平台。先不从模型和技术名词讲起，我们先看它要解决的业务问题。

一台机器报警以后，现场通常不是看见报警就直接更换零件。维修人员需要确认这是谁的报警、当前数据是否异常、报警是否持续发生，还要查手册、看图纸、判断维修是否必要，然后才能准备工具、备件和维修任务。修好以后，还需要确认设备真的恢复，而不是在工单里填一句“已完成”就结束。

这个过程涉及大量信息传递。如果只是把报警内容发给大模型，让它返回一段建议，确实可以得到文字，但不能证明建议适用于当前设备，也不能证明工单派给了谁、是否执行、设备是否恢复。因此，这个项目的重点不只是回答问题，而是把发现异常、证据查询、诊断、方案、工单执行、验收、报告与经验沉淀连接起来。

系统还有一条独立的质量检测业务。这里的质检对象是生产出来的零件，而不是把设备维修验收重新命名为质检。两条业务都会使用 Agent，但对象、证据和结束条件不同。

今天可以记住一个总原则：**模型负责辅助理解和推理，业务规则决定能否继续，工具执行实际查询或写入，设备和业务记录提供事实。** 模型给出的置信度不是物理测量，模型说“恢复正常”也不是验收证明。

目前设备侧使用虚拟工厂，这有利于重复制造场景、做安全的离线测试。但虚拟工厂的控制接口和真实 PLC 的安全系统不是一回事。我们可以验证应用层流程，不能据此宣布真实产线已经完成安全验收。

### 讲述提示

用“报警后不能直接换零件”作为开场。不要将项目介绍成“几个大模型自动修机器”。

## 第二节：五服务分别负责什么〔02:00–05:00〕

### 口播正文

当前项目保留五个核心服务：Agent、Backend、RAG、Document-CAD 和 Model。五个服务是职责边界，不是五个大模型。

Agent 服务负责协调任务。它把用户问题或监控事件转换成目标，规划需要什么能力，选择对应 Agent，并在每一步之后检查结果是否足够。它还负责把工具权限、执行轨迹和业务门禁接入运行过程。监控采集器和工作台也位于当前 Agent 项目范围内，但监控是发现事实的入口，不等于诊断模型。

Backend 服务负责确定性的业务记录，例如工单、人员、报告和质检闭环。这里必须坚持状态迁移、数据校验和持久化规则。模型可以建议派工，但不能替代数据库中的实际派工记录。前端显示已完成，也不能绕过后端的完成条件。

RAG 服务负责文档检索。它处理文档、切分片段，组合关键词检索、向量检索和重排，然后提供知识证据。RAG 不是一个只会生成文字的模型，它首先是检索系统。回答能否准确，取决于资料是否正确、检索条件是否匹配，以及最终内容是否与证据一致。

Document-CAD 服务负责工程记录，包括图纸、BOM、零件、装配关系和安装位置。它回答的是“哪台设备的哪个部件，对应哪份工程资料”。工单页面的三维模型是展示层；工程记录的设备归属和编号关系才是定位依据。能显示一个漂亮模型，不代表已经找到了正确的故障部件。

Model 服务统一模型调用。Agent 的对话请求和 RAG 的向量、重排请求通过这层接到对应供应商。当前代码标准配置将聊天与辅助模型分开：聊天默认使用 DeepSeek 官方兼容接口，向量和重排走辅助供应商。最终启用什么模型，仍要看本机合法配置，本文不会读取或展示用户密钥。

这种拆分的意义是减少跨层混乱。例如，RAG 不应该暗中用自己的供应商密钥绕过 Model 服务；工单状态不应该由前端文本决定；CAD 查询也不应该因为找不到当前设备，就随便返回其他设备的部件。

可以沿着这一条路径理解系统：浏览器访问监控工作台，工作台将业务请求转给 Agent；Agent 根据任务调用 Backend、RAG 或 CAD；需要模型能力时再经过 Model 服务。事实和结论沿着这条链返回，而不是由前端补出结果。

### 展示图

![五服务、工作台与虚拟工厂的主要数据和调用边界](L:/industry_agent/docs/assets/agent-talk/system-architecture.png)

[打开矢量原图](L:/industry_agent/docs/assets/agent-talk/system-architecture.svg)。绿色连线是业务/证据主干，蓝色连线包括用户输入、设备事实与模型能力调用。响应沿请求路径返回；图中没有将虚拟工厂画成真实 PLC。

看图时只讲三件事：入口从哪里来；Agent 何时去 Backend、RAG、CAD；模型能力为何集中在 Model。源码装配入口是 [container.py](L:/industry_agent/services/agent-service/app/runtime/container.py)，在线 RAG 的模型代理是 [clients/model.py](L:/industry_agent/services/rag-service/app/clients/model.py)。

地址是本地标准布局，不是存活探测结果：工作台 8001、Agent 8010、Backend 8030、RAG 8020、CAD 8050、Model 8040。虚拟工厂常用 4529。进程环境变量可覆盖默认配置。

## 第三节：七个概念不能混在一起〔05:00–08:00〕

### 口播正文

介绍系统时最容易出现的误解，是把 Agent、模型、工具和节点全部当成一种东西。这里逐个区分。

第一，模型是一个能力提供者。它接收消息，生成内容；向量模型把文本转成向量；重排模型调整候选证据的顺序。模型本身不天然知道本项目的工单状态和权限。

第二，Agent 是面向一个领域目标的执行者。它有输入模型、流程、工具范围、观察结果和验证逻辑。Diagnosis 负责诊断，WorkOrder 负责工单动作，Quality 负责零件检测。不是只有调用模型的代码才叫 Agent，也不是每个 Agent 都必须无限循环。

第三，节点是执行图中的调度单元。一个节点可以顺序执行几项真实子操作，所以节点数量不等于操作数量。比如准备阶段可以把初始化和 Skill 加载安排在同一个图节点内，但日志仍分别记录它们。节点少一些，不代表漏做了初始化。

第四，Tool 是具体可调用的能力。读取设备日志、查图纸、查询库存、创建工单都是工具。部分工具封装模型，很多工具只做 HTTP 查询或业务写入。因此，看到 Tool 列表不能就认为所有工具都是模型调用。

第五，Skill 是这个项目中由 Markdown 和 YAML 头部描述的任务配置。它声明触发条件、需要的输入、步骤和允许的工具。Skill 不会因为写了“完成维修”四个字，就自己执行维修。它必须由注册表选择，再与真实 Graph 和工具调用结合。

第六，状态描述当前执行或业务位置。执行可能是运行中、失败、超时或结果未知；工单可能是处理中、待验收、完成或关闭。这些状态属于不同层，不能为了减少代码，把超时、业务失败、数据不足全部变成同一个“失败”。特别是写请求超时，可能已经在外部执行，只是响应没有回来。

第七，Evidence，也就是证据，是支持判断的可追踪事实。设备快照、文档片段、工程记录、维修反馈和复测数据都可以成为证据，但它们的可信程度不同。标记为演示数据、降级数据的记录，不能当作真实现场验收结果。

这七个概念放在一起，就是：Agent 通过节点执行流程，Skill 限定任务范围，Tool 获取或改变事实，模型辅助推理，证据支持结论，状态记录当前进展。任何一层都不应该越权替代另一层。

### 当前九个 Agent

| Agent | 主要输入 | 主要输出 |
| --- | --- | --- |
| Router | 用户问题与上下文 | 意图、实体、目标能力 |
| Diagnosis | 当前异常事件和设备证据 | 故障判断、置信度、维修必要性 |
| Knowledge | 问题、设备/报警检索条件 | 文档证据、检索状态 |
| CAD | 设备、机型、部件、零件号 | 工程定位及归属证据 |
| Maintenance | 诊断、知识、工程信息 | 维修方案及就绪判断 |
| WorkOrder | 方案或工单动作 | 派工、状态、执行反馈结果 |
| Quality | 生产零件与检验规格 | 五类检测结果与质量判断 |
| Report | 已有业务记录与链路 | 结构化报告及完整性状态 |
| Memory | 已关闭案例或检索请求 | 经验保存/检索结果 |

## 第四节：监控怎样开始一轮故障任务〔08:00–11:00〕

### 口播正文

监控系统要连续读取设备数据，但不能每读取一次数据，就让所有 Agent 跑一遍。正常采样和业务任务要区分。

当前监控会按设备保存自己的观察状态，读取报警、状态和指标，结合阈值、持续时间、出现次数、趋势或多指标条件判断异常。阈值应来自设备的有效配置或业务规则，不能由模型临时猜一个“安全温度”。

监控首先回答的是“是否发现异常”，不是“已经确定故障根因”。例如压力下降可能说明一个系统状态异常，但不一定直接证明压力传感器坏了。根因判断还需要报警定义、历史趋势、设备日志和知识资料。

系统在首次确认异常、等级变化或满足新的触发条件时形成事件。一个事件应该带着设备身份、事件身份、报警和快照进入后续流程。对于持续的同一异常，要做去重，避免每半秒新增一张工单；对于恢复后重新发生的故障，又不能因为历史存在同类事件而永远不处理。

因此，运行记录不应该简单等于采样条数。可以把一个故障任务理解为从事件开始，到诊断、维修执行以及后续闭环的业务过程。但这个过程可能跨越多次 API 请求和多个执行 Trace，例如诊断立即执行，而维修人员第二天才提交结果。业务记录应通过事件、设备和工单关联，不能只用一个请求号覆盖全部历史。

新的故障来到时，前端应明确当前故障是谁，旧诊断不能继续冒充当前结果。不过，清空当前展示和删除历史业务记录也是两回事：当前面板可以换成新事件，历史诊断和工单仍应保留。

对自动停线也要区分：当前虚拟控制链在显式虚拟模式下，对监控确认的故障触发整线控制。它不是“用户问了一个故障问题就停机”，也不是“轻微提示一出现就启动真实 PLC 控制”。控制结果还要读回，不能只看命令提交成功。

### 场景讲法

这是讲解例子：设备 A 发生一次已确认异常，系统建立事件 E；后续样本仍属于 E，不重复制造任务。设备恢复后再次异常，应形成新的事件，而不是把旧工单中的诊断直接拿来当结论。不要给这个例子编造具体物理阈值。

## 第五节：Agent Loop 真实在哪里〔11:00–15:00〕

### 口播正文

接下来回答一个关键问题：这个系统到底有没有 Agent Loop？答案是有，但要分外层循环和领域内部循环。

外层由 RuntimeCoordinator 协调。输入先变成目标事件，再由 Planner 形成能力计划和 Action。Dispatcher 根据能力注册表选择实际 Agent；Policy 在动作执行前判断是否允许；ExecutionManager 控制一次执行及超时状态；Evaluator 检查结果和证据进展。如果结果不足，系统可以选择补证、复核或重规划，而不是固定把所有 Agent 从头跑到尾。

这不是说外层每一步都由大模型决定。当前 RuntimeInputParser 本身是确定性输入归一化逻辑，不调用模型，也不是曾经提到的 Jev 模型。能力规划和业务路由有自己的代码规则。我们应把可控编排和模型推理分开解释，不要为了听起来智能，把所有函数都包装成模型决策。

Diagnosis 的内部循环最接近常见的模型工具循环。模型读取当前事件和已有观察，提出下一步工具调用；工具 Guard 检查权限、必填参数和重复调用；合法工具执行后产生 Observation；这些观察再进入下一轮推理；最终由验证器决定是否能结束。

例如，它可能先读报警定义，再检查设备历史，发现历史证据还不够，就补查日志。这个循环的价值是让下一步查询依赖上一步事实，而不是一次生成一段无依据的维修文字。但每次调用都必须在允许范围内，不是模型想调用什么就调用什么。

Knowledge 也有内部循环，但它主要做有界检索细化。第一次没有足够证据时，可以在预算内调整查询，再检查证据是否满足条件。空结果不能抛异常，也不能假装已经找到维修依据；持续不足时要返回明确不足，并阻断依赖该证据的维修和派工。

CAD 的内部循环是工程查询循环。它根据定位目标安排零件、图纸、BOM 或关系查询，再逐次观察工程结果。不能每次都重复同一个条件，也不能因为模型喜欢某个部件，就忽略设备归属。

其他六个领域 Agent 以阶段性处理为主，当前没有内部回边。没有回边不意味着它们不能完成任务。像质检五项检测、报告汇总、工单状态动作，使用确定顺序和验证门禁往往更合适。需要复核时，可以由外层 Runtime 发起新的能力动作。

所有循环都需要停止条件：迭代次数、时间、工具预算、重复动作、新证据不足以及业务验证结果。无限循环不是智能，是资源和副作用风险。尤其创建工单这样的写操作，不应因为推理还在继续就重复执行。

### 约 45 秒代码导览

依次打开以下文件，只指出职责，不逐行朗读：

1. [RuntimeCoordinator](L:/industry_agent/services/agent-service/app/runtime/coordinator.py)：目标到计划、动作、结果、补证/重规划。
2. [RuntimeDispatcher](L:/industry_agent/services/agent-service/app/runtime/dispatcher.py)：Policy → 能力选择 → Agent/Tool → 执行记录。
3. [Diagnosis Graph](L:/industry_agent/services/agent-service/app/agents/diagnosis/graph.py)：模型决策、Guard、执行、观察和终止路径。

### 展示图

![Runtime 外层循环及 Diagnosis、Knowledge、CAD 内部循环](L:/industry_agent/docs/assets/agent-talk/agent-loop.png)

[打开矢量原图](L:/industry_agent/docs/assets/agent-talk/agent-loop.svg)。上半部分是跨领域任务编排，下半部分是领域内部逻辑。Diagnosis 的合并节点 `execute_observe` 内仍有“执行工具”和“记录观察”两个真实子步骤。

代码片段来自 [Diagnosis Graph](L:/industry_agent/services/agent-service/app/agents/diagnosis/graph.py)，不是虚构伪代码：

```python
workflow.add_node("execute_observe", chain_nodes(steps["act"], steps["observe"], stop_routes=("fallback",)))
workflow.add_conditional_edges("execute_observe", select_next_diagnosis_route, {"loop_guard": "loop_guard", "fallback": "finish"})
workflow.add_conditional_edges("loop_guard", select_next_diagnosis_route, {"reason": "reason", "fallback": "finish"})
```

讲解这三行的重点：节点合并没有删掉执行和观察，`loop_guard → reason` 才是真正回边；图中省略了部分错误回边，完整失败和重试分支仍以该文件为准。

## 第六节：RAG 和 CAD 怎样避免“每个问题答得一样”〔15:00–18:00〕

### 口播正文

维修问答经常出现一个现象：问题不同，返回的文字却几乎一样。原因不能只归结为模型不好。可能是检索范围丢了设备条件，也可能是报警代码没有正确清洗，或者检索只找到宽泛的报警目录，却被当成详细维修 SOP。

当前设计强调让结构化条件贯穿查询。明确问某台设备，就优先使用对应设备条件；没有设备范围的通用知识问题可以做更宽范围检索。两种查询应该在日志和证据中可以区分。指定设备却无结果时，不应暗中混进其他机器的记录，然后把它写成当前设备的处理方案。

RAG 的工作是找到片段并保留来源。关键词检索适合报警编号、部件名称等准确词，向量检索用于语义相似内容；融合和重排把候选整理成更相关的证据。最终回答还要看资料类型：报警代码表能说明报警名称和所属系统，但不一定包含拆装步骤、扭矩和验收标准。

这也是为什么不能承诺“任何问题都返回绝对正确的维修答案”。系统应该尽可能形成清晰、有依据的回答，但没有足够证据时必须表达数据不足，而不能为保证每次都输出长文本而虚构结论。清晰返回不足本身就是正常业务结果，不是接口崩溃。

CAD 则解决工程身份问题。设备编号、机型、部件编号和零件号不是四个随意互换的文本。编号通常需要精确匹配，名称可以按服务的明确规则做模糊匹配。查询结果经过 Agent 的模型转换后，也必须保留归属字段，否则前端可能显示“找到了部件”，实际却属于另一台机器。

工单里的三维图纸可以帮助维修人员看到安装位置、部件名称和装配关系，但这里还要区分实测 CAD 几何和程序化示意模型。一个 HTML 三维模型可以用于交互展示，却不能凭外观就认为其尺寸与现场完全一致。原始图纸、版本、BOM 和正确的设备映射需要单独管理。

这两类证据汇入 Maintenance：RAG 提供知识依据，CAD 提供工程定位。缺少哪一类，都应具体说明缺什么，而不是把几个类似段落拼成长篇维修步骤。

## 第七节：维修方案与工单为什么必须分离〔18:00–22:00〕

### 口播正文

维修方案和工单容易在页面上混在一起，但它们解决的是两个问题。维修方案回答“为什么修、怎么修、需要什么”，工单回答“谁来修、现在到哪里、做了什么、结果怎样”。

维修方案的输入包括诊断、知识证据和工程资料。它需要形成故障分析、步骤、工具、备件、安全提示和依据。这里还要做维修必要性判断。不是所有异常都应该开工单：可能只是观察项，可能需要操作员核查，也可能因为证据不足而要求人工复核。

进入自动工单前，有确定性的门禁。代码读取配置的置信度门槛，检查证据状态、人工复核标记、是否为 synthetic 数据、maintenance_required 判断，以及维修方案是否就绪。代码默认的置信度门槛是 0.80，它是应用业务规则，不是“工业设备安全阈值”，也不是数学上的正确概率保证。

判断通过后，WorkOrder 才负责创建和派工。工单会引用或保存对应方案信息，但前端应该把方案正文放在维修方案页面，不让工单页面再次出现两份完整方案。保留历史方案快照有利于追踪“当时按什么方案维修”，并不意味着必须在工单页面重复展示。

派工是业务行为，需要人员身份和实际派工结果。当前团队设计是一个小组，维修人员与监督身份分开：维修人员执行和反馈，监督人查看和催办。自动派工并不意味着监督人必须逐单批准，也不意味着任何登录用户都能代替被派工人员确认修复。角色人数和设备负责关系仍应以当前注册记录与有效配置为准。

工单状态也不能是一个随意输入的字符串。当前后端有明确状态迁移，例如 open 进入 in_progress，执行后进入 awaiting_verification，再达到 completed，满足条件后才可以 closed。rejected、timeout 以及重新打开是独立分支。completed 和 closed 不是同义词，完成执行不代表所有闭环责任已经结束。

维修验收最重要的一点，是不能只接收一个 passed=true。系统应核对恢复数据是否属于本设备，时间是否在允许窗口，状态是否满足当前阶段，报警是否清除，指标是否存在，是否仍有异常或互锁条件。Agent 和 Backend 使用共用的恢复检查逻辑，避免一边通过、另一边拒绝。

虚拟工厂复机路径还分为启动前确认和启动后验证。被派工的维修人员提交实际反馈，系统读取恢复快照；其他故障工单未确认、停机账本不一致或整线检查不满足时，不允许继续启动。提交启动命令后，还要读回状态并复核，而不是只依赖 HTTP 成功响应。

这套控制当前只在显式虚拟工厂模式生效。真实产线要另做控制权限、PLC 握手、互锁、现场验收和人工应急措施，不能直接拿虚拟流程上线。本轮修改没有调用控制接口，也没有因为优化日志而改变停线或复机规则。

在工单真正关闭并满足经验准入后，Memory 才沉淀维修经验，Report 汇总既有记录。一个历史故事能否成为知识，不只看文字是否漂亮，还要看来源工单、验证结果和保存状态。

### 工单生命周期主干

![故障确认、诊断补证、维修方案、派工、恢复验收与后续闭环](L:/industry_agent/docs/assets/agent-talk/fault-lifecycle.png)

[打开矢量原图](L:/industry_agent/docs/assets/agent-talk/fault-lifecycle.svg)。橙色区域突出控制与恢复门禁；底部的质检失败路径独立于设备维修。恢复验收嵌入工单迁移，在 `completed` 前检查，不是关闭后再补验收。

此图是主干概括；后端迁移表还有拒绝、超时、重开和同状态幂等路径。图不表示每次故障必定会走到关闭，也不强制 Report 与 Memory 是单次请求内的固定执行顺序。真实顺序取决于请求能力、已有记录和闭环条件。

源码依据：工单迁移表在 [BackendBusinessService](L:/industry_agent/services/backend-service/app/workorder/service.py:20)，自动派单判断在 [workorder/policy.py](L:/industry_agent/services/agent-service/app/workorder/policy.py)，恢复数据规则在 [shared/repair_recovery.py](L:/industry_agent/shared/repair_recovery.py)。页面分离由 [MaintenancePlanWorkspace](L:/industry_agent/frontend/monitor-react/src/app/App.jsx:2655) 与 [WorkorderDetail](L:/industry_agent/frontend/monitor-react/src/app/App.jsx:2866) 实现。

## 第八节：质检检测的是零件，不是维修工单〔22:00–24:00〕

### 口播正文

质量检测的对象是生产零件。输入应包含零件或批次身份、检验规格和实际检测数据，而不是把“设备现在运行”直接当作零件合格。

当前 Quality Graph 执行尺寸、外观、材料、功能、工艺追溯五类检测。尺寸需要测量值和规格范围；外观需要明确的检测记录；材料需要牌号或相应指标；功能需要测试数据；工艺追溯需要生产过程的记录。

缺少数据时不能默认通过。判断结果要结合 passed、sufficient_data、status 和来源标记，而不是只看一个绿色勾。演示夹具即使携带看似正常的数据，也不应作为真实产品的合格证据。当前本地 Backend 还包含显式标记为 synthetic/degraded 的零件夹具，讲解时必须指出它是演示数据，不是已连接真实检测仪器。

质检失败后，业务闭环包含申诉、整改任务、复检、放行和关闭。整改不是填一个统一的“已处理”就结束；关联任务需要完成，再进入复检阶段。现有后端要求复检通过携带证据，且关闭之前先放行。

但这里也必须诚实区分：现有接口的状态门禁和证据非空检查，不等于已经核验真实检测仪器的可信签名、校准状态和所有规格。质量检测是否真正可靠，还需要真实 QMS/检测适配器以及经确认的产品验收标准。本轮没有宣称这条链已经达到生产现场的“完美质检”。

总结这一节：维修验收证明设备恢复，产品质检证明零件满足规格。它们可以共享基础设施和日志，但不能共享一个含糊的 passed 字段当作完整判断。

## 第九节：日志、幂等和审批怎样支撑追溯〔24:00–26:00〕

### 口播正文

一个能追溯的系统，不只是保存一段“诊断成功”的文字。我们至少要能看出这是哪个任务、哪个事件、哪个工单，调用了哪个 Agent、哪个工具，输入了什么、得到什么以及为什么停止。

这里有不同粒度的日志。Runtime 记录能力、动作、策略和结果；Agent 子步骤记录步骤与 Skill 关系；Tool 和 A2A 边界记录相应调用信息。当前子步骤日志的 input_keys、output_keys 只是字段名摘要，不是完整上下文，也不是全部模型原始请求。需要完整输入输出时，必须结合相应调用记录查看，不能把字段名列表说成完整返回体。

本轮修复了一处容易误导人的日志行为：显式选择不存在的 Skill，原包装器却回退到默认 Skill，把步骤标成已映射。现在显式空值和未知名称保持未映射，已知旧别名仍显示规范 Skill 名，同时保留原请求名。没有指定 Skill 时，才按上下文选择。日志映射只说明归属，不会替代工具授权。

幂等解决的是同一个业务命令被重复提交的问题。创建工单、更新、派工、完成、关闭是不同动作，参数变化也不是同一条命令。工单存在，只能证明它存在，不能证明本次更新已经完成。超时以后也不能盲目再写一次，而应保留结果未知并按照权威业务状态对账。

审批同样必须绑定任务、动作和业务参数。客户端发一个 approval=true，或在嵌套 context 里写“已经批准”，不能成为服务端的可信授权。审批通过某一步，也不能自动授权下一步不同动作。它与账号身份、工单被派工人是不同维度的控制。

因此，日志不是为了好看，幂等不是为了缓存，审批也不是一个按钮。这些机制分别回答：做了什么、是否重复、是否有权做。它们共同支撑可信执行，但依然需要按具体业务和异常路径验证。

## 第十节：最近的优化到底减少了什么〔26:00–28:00〕

### 口播正文

最近几轮优化不是重做前端，也不是换模型，而是减少重复实现和模糊边界。

领域图节点从历史的 96，先精简到 85，再把相关阶段组合到 51。初始化、查询准备或结果处理可以少一些图调度，但原子步骤、验证器、工具输入输出和失败路径仍保留。Diagnosis、Knowledge、CAD 的三个内部循环也没有删掉。当前九个 Agent 仍然都在。

工具默认模型候选由 65 减到 58，执行入口仍是 66。七个重叠查询不再默认同时展示给模型，旧名称仍可通过显式白名单声明和执行。没有把创建、派工、完成、关闭等不同写操作合并为一个模糊接口。

Skill 文档从历史的 32 先到 30，再到 27。CAD 的图纸/BOM 定义、Memory 的经验学习定义、Report 的闭环/链路定义做了合并，多触发条件只激活一次，旧名继续解析。其他不同权限的 Skill 和安全门禁没有为了凑数量而删除。

上一轮还为 18 个只读 RAG/CAD 入口共用参数模型，既生成工具 schema，也在调用前校验。空问题、错误类型和超范围 limit 在传输前拒绝；直接 Python 调用和现有 RAG 搜索 API 也不能绕过该契约。其余工具不能因此宣称已经全部完成同样的参数改造。

本轮继续把接入层接齐：Diagnosis 使用显式白名单向 Registry 请求 schema，所以旧工具名称不会只被执行端接受，却无法向模型声明；旧式零参数适配器仍兼容，提供者内部 TypeError 不会被误当成旧接口而重复调用。另一项就是刚才提到的真实日志 Skill 映射。

这些优化改善的是结构、权限一致性和可解释性。我们没有运行性能基准，所以不能说延迟减少了多少、费用下降了多少。数量减少不是性能证明，也不是业务能力减少。

### 约 30 秒代码导览

打开 [tool_policy.py](L:/industry_agent/services/agent-service/app/agents/diagnosis/tool_policy.py)，指出 `tool_schemas_for` 使用原名白名单，而不是自动把旧名改成新名授权。

再打开 [base.py](L:/industry_agent/services/agent-service/app/agents/base.py)，指出 `trace_skill_node` 区分未声明选择与显式空/未知选择。不要展开一大屏代码逐行讲述。

## 第十一节：验证了什么，最后怎样总结〔28:00–30:00〕

### 口播正文

最后讲验证。修改不是只生成了一份建议文档，本地源码已经改变，回归测试也已经补充。

本轮先在隔离环境运行基线，Agent 全量 471 项通过。然后新增 22 项真实函数或 Graph 边界测试，其中 14 项先复现预期失败，随后修复并全部通过。最终 Agent 全量 493 项通过，相关 Backend 测试 6 项通过，跨服务契约 12 项通过。这些数字存在用例重叠，不能简单加起来冒充独立测试覆盖数。

测试禁用真实 dotenv 配置、清除供应商密钥和外部连接，使用临时存储与测试传输适配器。工具和业务校验函数本身没有被替换成永远成功的 mock。备份保存了本轮开始时的文件，并核对摘要，所以如果后续发现兼容性问题，可以按文件恢复，不需要覆盖整个项目。

但是离线回归不等于上线验收。本轮没有重启服务、没有部署、没有调用真实设备控制，也没有验证付费模型和生产数据库。真实适配器、工业验收标准、控制互锁、在线并发恢复和长期稳定性仍需要独立验收。能返回一份报告，也不代表报告中所有结论都已经成为现场事实。

如果用三句话总结这个项目：第一，它把故障处理拆成可验证的业务阶段，而不是一次模型回答；第二，它让模型、工具、知识证据和业务记录各自承担明确职责；第三，它用权限、状态、验收与执行日志限制自动化边界，不把缺少证据包装成成功。

而这几轮优化的核心，是让同样的业务更容易理解和维护，同时保持必要的分支。不是 Agent 越多越智能，也不是节点越少越好。真正要看的是：任务有没有完成、证据是不是属于当前对象、失败有没有明确返回、写操作是不是可控、最终结果能不能追溯。

我的讲解到这里，谢谢。

## 讲解后的问答备页〔不计入 30 分钟〕

### 1. 为什么不是一个模型直接处理全部事情？

因为查询、推理、写业务记录和控制设备具有不同权限与可信要求。一个模型可以辅助多个阶段，但不应拥有不受限制的工单和控制权限。分层还便于测试来源不可信、数据缺失和外部超时等场景。

### 2. 为什么只有三个 Agent 有内部循环？

当前 Diagnosis、Knowledge、CAD 有回边。其他领域使用阶段图完成确定性工作。外层 Runtime 仍可以补证、复核或重规划。Agent 是否成立，不取决于内部必须有一个 while 循环。

### 3. 58 个工具和 66 个工具哪个数字正确？

都正确，但统计对象不同：58 是默认向模型暴露的工具候选，66 是保留的执行入口，其中包含兼容查询及内部工具。显式合法白名单可以声明旧名称，内部验收失败工具仍不可向模型暴露。

### 4. 合并 Skill 会不会把权限放大？

合并对象使用相同或已核对的工具范围。旧名称解析为规范定义，不自动授权另一个名字的工具。Memory 学习定义移除了实际图未使用的 get_workorder 授权；Report 合并不自动增加 PDF 或删除权限。

### 5. 为什么有些日志现在是 mapped=false？

这表示步骤没有匹配到当前声明的有效 Skill，不能假装默认 Skill 已经激活。初始化前尚未选择、显式空选择和未知名称都可能出现未映射。应结合之后的 load_skill 和权限记录判断；未映射不是“业务一定失败”，映射成功也不是“已经授权”。

### 6. root .env 是模型的全部总开关吗？

它是本地环境配置的主入口，进程环境变量优先。模型供应商、模型名和 Model 服务地址共同影响路由；生产禁止 Fake 等安全规则还在代码里。不能认为更改一个 API key，就自动授权全部能力或证明模型可达。

### 7. DeepSeek 为什么还会看到另一个供应商？

当前代码标准路由将聊天与向量/重排分开。DeepSeek 聊天默认使用官网兼容地址；向量和重排使用辅助供应商。看见辅助供应商名称不等于聊天也走该供应商。应查看 Model 的具体能力元数据，不只看一个 provider 字段。

### 8. Model 的 health 成功是否证明所有模型可用？

不能。代码区分配置完整和尚未探测的可达性，并分别列出聊天、向量、重排等能力。未探测不能写成实际可达，也不应频繁调用收费生成接口当健康检查。

### 9. 系统能保证所有维修答案都正确吗？

不能承诺绝对正确。当前系统用设备范围、来源与验证减少无依据结论，证据不足要明确返回。模型置信度、引用数量和长文本都不能替代准确证据；工业操作仍需经过真实业务和设备验收。

### 10. 工单完成后是否立即无条件启动？

不是。显式虚拟模式下，需要被派工人员确认、实际反馈、恢复样本、未解决故障核对和整线检查，再执行启动及运行复核。当前不等于真实 PLC 自动复机授权；本轮测试未执行任何控制写操作。

### 11. 质检是否已经接入真实测量设备？

本文不作这种结论。当前 Backend 有明确标记的演示零件夹具，Quality 会检查 synthetic/degraded 与数据完整性。真实检测设备、校准信息和可信来源仍需专门适配与验收。

### 12. 少了节点是否减少模型调用费用？

不一定。合并的是图调度，真实子操作和循环通常仍在。默认候选减少可能改善选择范围，但没有线上模型调用和性能基准，就不能报告具体费用或延迟下降。

## 讲解前准备与安全演示

1. 预先打开本稿和代码文件，不展示 `.env`、数据库连接串或个人密码。
2. 用时间表排练一次。第五节代码导览控制在 45 秒，第十节控制在 30 秒；避免现场逐行解释整个文件。
3. 不为演示主动制造真实故障、执行真实停机/启动、提交生产工单或调用收费模型。需要现场运行时只使用本轮隔离测试命令。
4. 浏览器如果展示当前页面，明确说明服务是否已重启。本次代码保存与测试通过，不代表此前运行的进程已经加载新版本。
5. 中文 PDF 是已有报告文件能力，不等于本讲解稿必须输出 PDF。当前交付是可编辑 Markdown、SVG 与 PNG；制图只使用当前已有 Pillow 和系统中文字体，没有添加项目依赖。

安全复现本轮专项测试（工作目录为 `L:/industry_agent`）：

```powershell
powershell -NoProfile -Command "& ./.runtime/verification/agent-entry-20261003/run-tests.ps1 -Log demo-entry.log -Targets @('services/agent-service/tests/test_agent_entry_contracts.py')"
```

截至本稿版本，该命令预期 22 passed。演示可展示三类结果：旧查询名声明和原名授权一致；未知 Skill 不冒充默认映射；真实 Report 准备阶段加载后才形成有效选择。

## 代码与效果演示卡〔查阅材料，不追加讲述时长〕

![八个工作台页面的输入与展示内容](L:/industry_agent/docs/assets/agent-talk/workbench-effects.png)

[打开矢量原图](L:/industry_agent/docs/assets/agent-talk/workbench-effects.svg)。这里的“效果”是源码对应展示和真实函数测试结果，不是页面截图或生产验收。可以在讲述相关阶段时选择一张演示卡，不必逐页操作。

### 演示卡 1：监控中心——没有证据不显示满分健康度

源码：[monitorDisplay.mjs](L:/industry_agent/frontend/monitor-react/src/app/monitorDisplay.mjs)，页面 [DeviceAlertBoard](L:/industry_agent/frontend/monitor-react/src/app/App.jsx:836)。

输入：设备样本为 `emergency_stop`、旧健康度为 `100`，且 `fault_evidence.evidence_status="unavailable"`。

输出效果：`formatMonitorHealth` 返回“待复核”，而不是“100/100”；原因文字指出没有取得停机前具体报警码或异常指标。页面展示异常依据，不把急停状态包装成健康。它仍然不是每台机器根因都已确定的证明。

验证：[monitorDisplay.test.mjs](L:/industry_agent/frontend/monitor-react/src/app/monitorDisplay.test.mjs) 的两个真实函数用例，本次通过。

### 演示卡 2：智能诊断——新故障不会显示旧诊断

源码：[diagnosisView.mjs](L:/industry_agent/frontend/monitor-react/src/app/diagnosisView.mjs)，页面 [DiagnosisWorkspace](L:/industry_agent/frontend/monitor-react/src/app/App.jsx:2351)。

输入：同一测试设备 `MACHINE-1` 当前报警变为 `700013`，已保存的旧诊断属于 `700012`。

实际函数输出摘要：

```json
{
  "isCurrent": false,
  "summary": "正在等待报警 700013 的诊断结果",
  "evidence": []
}
```

这是[既有测试用例](L:/industry_agent/frontend/monitor-react/src/app/diagnosisView.test.mjs)的输入输出，不是现场记录。相同文件还验证选定设备的诊断优先于其他设备结果，以及从模型结构字段提取结论、根因、建议。页面用上下排列展示正文和证据；对应 `.diagnosis-content-grid` 当前为单列。

### 演示卡 3：维修方案——字段拆分但不删除原数据

源码：[workorderSheet.mjs](L:/industry_agent/frontend/monitor-react/src/workorderSheet.mjs)，页面 [MaintenancePlanWorkspace](L:/industry_agent/frontend/monitor-react/src/app/App.jsx:2655)。

输入：测试工单 `WO-1` 引用方案快照 `PLAN-1`，其中有步骤“检查过滤器”、工具“万用表”、备件 `CP-1` 和 SOP 证据。

实际输出：`buildMaintenancePlanView` 保留以上方案信息；`buildWorkorderSheet` 保留 `workorderId`、`assignee` 等执行字段，不包含 `steps/tools/parts/safety/evidence`。历史快照来源明确标记为 `legacy-workorder-snapshot`，不是伪造新的方案。

页面效果：分析、步骤、工具、备件与证据放到独立维修方案页；长内容单列上下排列。原工单记录仍保留方案快照和关联，不删除数据。原始 OCR 表格片段不会直接进入可执行步骤列表。

验证：[workorderSeparation.test.mjs](L:/industry_agent/frontend/monitor-react/src/workorderSeparation.test.mjs) 的字段分离、文本清洗和 OCR 过滤用例，本次通过。

### 演示卡 4：工单系统——机器名称、图纸与反馈各有来源

源码：[WorkorderDetail](L:/industry_agent/frontend/monitor-react/src/app/App.jsx:2866)、[RepairCadPanel](L:/industry_agent/frontend/monitor-react/src/app/App.jsx:3045)、[workorderSheet.mjs](L:/industry_agent/frontend/monitor-react/src/workorderSheet.mjs)。

输入：测试工单设备为 `ELITE-CS612-ROBOT-001`，历史标题误写为“主轴电机组件维修”，当前故障为“控制器通讯异常”。

实际标题输出：`ELITE ROBOTS CS612 六轴协作机器人 · 控制器通讯异常`，不继续沿用错误主轴标题。验证入口是[工单标题测试](L:/industry_agent/frontend/monitor-react/src/workorderSeparation.test.mjs:5)。

页面由上到下：机器和故障标题 → 对应图纸/故障定位 → 人员、状态与反馈。图纸解析与 CAD 部件关系查询是不同的链路；CAD API 错误有单独提示，不把错误包装成已经找到部件。没有机器图纸匹配时显示“未匹配到工单图纸”，不生成无关机器模型。

提交维修结果使用 `action="mark_repair_completed"` 和实际反馈；前端不会制造验收通过字段，也不凭输入的人员名制造可信身份。后端和虚拟控制链再核对当前会话、被派工人员与恢复数据。

本次未打开在线图纸页面、未提交维修结果、未调用停机或启动接口；这些入口不能据此写成已联调成功。

### 演示卡 5：质检系统——五类检测，缺数据不默认合格

源码：[QualityValidator](L:/industry_agent/services/agent-service/app/agents/quality/validator.py)、[Quality Graph](L:/industry_agent/services/agent-service/app/agents/quality/graph.py)、[Backend 质检闭环](L:/industry_agent/services/backend-service/app/workorder/service.py:430)。

输入：零件身份、检验规格，以及尺寸、外观、材料、功能、工艺追溯五类检测返回值。

核心代码：

```python
passed = payload.get("passed") is True
sufficient_data = payload.get("sufficient_data") is True and str(payload.get("status") or "").lower() not in {"not_tested", "pending", "insufficient_data"}
trusted = payload.get("synthetic") is not True and payload.get("degraded") is not True
item_passed = passed and sufficient_data and trusted
```

输出效果：一项只有 `passed=true` 而没有有效数据完整性标记，不能成为合格依据。整体验证还要求规格和零件身份。产品质检的 FAIL、未检测与演示来源需要区分展示，不能只看颜色。

失败处理主干是整改任务 → 复检 → 放行 → 关闭，申诉是可选分支。它与维修工单的设备恢复验收分开。当前证据字段和状态门禁不等于已经接入校准合格的真实检测仪器；本次没有新增工业合格阈值。

### 演示卡 6：知识问答——输入范围会随当前报警变化

源码：[knowledgeScope.mjs](L:/industry_agent/frontend/monitor-react/src/app/knowledgeScope.mjs)，验证：[knowledgeScope.test.mjs](L:/industry_agent/frontend/monitor-react/src/app/knowledgeScope.test.mjs)。

输入：测试设备 `MACHINE-001` 有活动报警 `ALM-001`。`buildKnowledgeContext` 输出以下范围字段，随后随问题进入业务请求：

```json
{
  "required_capabilities": ["document_search"],
  "alarm_active": true,
  "device_id": "MACHINE-001",
  "alarm_code": "ALM-001"
}
```

没有活动报警时，输出只有 `required_capabilities=["document_search"]` 与 `alarm_active=false`，不把选中但正常运行的设备强行当作当前故障范围。两条转换路径本次测试通过；此处只截取关键字段，不伪造模型答案。

范围正确并不证明回答必然正确：RAG 的检索片段、资料类型、设备归属和回答验证仍要共同检查。没有证据时返回明确不足，不能为了展示效果编造完整维修答案。

### 演示卡 7：日志系统——明细归属一次任务和一次调用

源码：[traceLog.mjs](L:/industry_agent/frontend/monitor-react/src/app/traceLog.mjs)，页面 [LogsWorkspace](L:/industry_agent/frontend/monitor-react/src/app/App.jsx:2416)。

输入：带 `run_id/event_id/task_id/trace_id/agent_run_id` 的事件；`buildAgentInvocations` 将开始、工具调用、观察和结束归入对应调用。`runEventMatches` 先确定事件属于当前选择的业务运行。

页面结构与[真实转换测试](L:/industry_agent/frontend/monitor-react/src/app/traceLog.test.mjs)相对应：

```text
选择一个业务运行记录（故障 / RAG / 独立质检）
└─ 第 1 次 Diagnosis 调用：AGENT-RUN-1
   ├─ Input：device_id=TRAK-001、alarm_code=700001
   ├─ Context：phase=diagnosis、当前设备/报警
   ├─ Tool #1：search_knowledge
   │  ├─ 输入：query="报警 700001"
   │  └─ 输出：total=1、items=[{"title":"SOP"}]
   └─ Output：diagnosis="冷却回路异常"
```

以上内容是测试夹具，不是实际工具返回。相同 Agent 再调用一次会有新的独立编号；运行未结束显示“执行中”，错误显示“异常”。下面仍保留原始事件以核对，不把原始事件数当作业务任务数。

注意：页面只能展示实际记录的内容。某条 `agent_step` 只有 `input_keys/output_keys`，意味着只有字段摘要，不是完整 payload；缺失的上下文不能由页面补造。

### 演示卡 8：报告中心——章节与 PDF 操作分开核对

源码：[reportView.mjs](L:/industry_agent/frontend/monitor-react/src/app/reportView.mjs)，页面 [ReportWorkspace](L:/industry_agent/frontend/monitor-react/src/app/App.jsx:2566)。

输入：报告列表和已持久化报告的 `sections`。转换函数提取“诊断结论、维修步骤、工单安排、维修反馈、质量结果”等中文章节；报告内容来源于业务记录，不是图表里的示意文案。

页面效果：选择报告 → 查看中文摘要和章节 → 点击“生成 PDF” → 成功后显示打开/下载链接。对应请求为 `POST /api/reports/{report_id}/pdf`，打开为同一路径的 GET，下载增加 `?download=1`。生成失败显示错误，不能只画一个下载按钮就宣称文件生成成功。

本次未执行该写请求、未生成新的业务 PDF、未删除任何报告。24 项前端测试没有涵盖实际 PDF 内容、中文字体及浏览器下载，所以没有把这部分列为本次已验证通过。

## 本次图文增补的验证记录

日期：2026-10-03。本次只修改本稿、增加图稿及其生成程序，不修改五服务、前端或生产配置。

实际执行的前端数据转换测试：

```powershell
$talkTests = @(rg --files frontend/monitor-react/src -g '*.test.mjs')
& L:/nodejs/node.exe --test @talkTests
```

结果：24 passed、0 failed、0 skipped。日志：[frontend-tests.log](L:/industry_agent/.runtime/verification/talk-visuals-20261003/frontend-tests.log)。用例覆盖诊断展示、报警检索范围、监控证据提示、历史问答缺失判断、日志聚合、注册身份与工单字段分离；不是浏览器截图或付费模型联调。

另以隔离测试配置复核图中涉及的 Agent 接入契约、节点合并、Quality 数据门禁和恢复数据新鲜度：42 passed、0 failed、0 skipped。日志：[agent-source-tests.log](L:/industry_agent/.runtime/verification/talk-visuals-20261003/agent-source-tests.log)。这四个文件的专项结果不是重新执行 Agent 全量 493 项，也不能与前一轮回归数量叠加。

图稿通过几何/文字边界检查，导出为 3200 像素宽的 PNG 与包含精确中文标签的 SVG，并逐张视觉检查。源码链接、图像引用、SVG XML、两处展示代码与 30 分钟时间预算另外校验，全部通过：[document-validation.log](L:/industry_agent/.runtime/verification/talk-visuals-20261003/document-validation.log)。执行命令和结果见[图稿说明](L:/industry_agent/docs/assets/agent-talk/README.md)。

原文备份：[agent-architecture-30-minute-talk.md](L:/industry_agent/.runtime/backups/agent-talk-visuals-20261003/agent-architecture-30-minute-talk.md)，SHA256：`B837580E26B674A6FA040BEB1B28B8306DC6EDF57955073FE696B2473D399BB6`。恢复时只复制该文档到原路径，不覆盖其他本地源码；本次新增图稿可独立保留，无需删除任何业务数据。

## 源码导览与查证入口

| 讲解主题 | 本地入口 |
| --- | --- |
| 容器及九个 Agent 装配 | [container.py](L:/industry_agent/services/agent-service/app/runtime/container.py) |
| 外层规划协调 | [coordinator.py](L:/industry_agent/services/agent-service/app/runtime/coordinator.py)、[planner.py](L:/industry_agent/services/agent-service/app/runtime/planner.py) |
| 动作授权与执行 | [policy.py](L:/industry_agent/services/agent-service/app/runtime/policy.py)、[execution.py](L:/industry_agent/services/agent-service/app/runtime/execution.py) |
| Skill 加载与多触发 | [SkillRegistry](L:/industry_agent/services/agent-service/app/skills/registry.py) |
| 工具注册、原名权限及参数 | [ToolRegistry](L:/industry_agent/services/agent-service/app/tools/registry.py)、[query_contracts.py](L:/industry_agent/services/agent-service/app/tools/query_contracts.py) |
| 监控异常事件 | [monitor.py](L:/industry_agent/services/agent-service/app/monitor/monitor.py) |
| 维修/自动派单门禁 | [workorder/policy.py](L:/industry_agent/services/agent-service/app/workorder/policy.py) |
| 工单迁移及质检闭环 | [Backend service.py](L:/industry_agent/services/backend-service/app/workorder/service.py) |
| 共用恢复数据规则 | [repair_recovery.py](L:/industry_agent/shared/repair_recovery.py) |
| 虚拟整线控制 | [line_control.py](L:/industry_agent/services/agent-service/app/monitor/line_control.py) |
| Quality 确定性判断 | [QualityValidator](L:/industry_agent/services/agent-service/app/agents/quality/validator.py) |
| 在线 RAG 模型代理 | [clients/model.py](L:/industry_agent/services/rag-service/app/clients/model.py) |
| CAD 工程 API | [CAD main.py](L:/industry_agent/services/document-cad-service/app/main.py) |
| Model 能力及供应商 | [Model main.py](L:/industry_agent/services/model-service/app/main.py)、[gateway.py](L:/industry_agent/services/model-service/app/providers/gateway.py) |
| 本轮回归 | [test_agent_entry_contracts.py](L:/industry_agent/services/agent-service/tests/test_agent_entry_contracts.py) |
| 最近工具/Skill 优化报告 | [修改报告](L:/industry_agent/docs/agent-tools-skills-optimization-report.md) |
| 本轮执行入口优化和验证 | [继续优化报告](L:/industry_agent/docs/agent-entry-optimization-report.md) |

## 演讲最后一页可用的结论

保留五服务、九个 Agent；当前领域节点 51、Markdown Skill 27、默认模型工具候选 58，执行入口 66。自动化由证据与业务门禁约束，不由模型一句话授权。最近优化完成本地回归，尚未代替真实工业现场验收。
