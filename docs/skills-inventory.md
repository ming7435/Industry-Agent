# 全项目 Agent 技能清单

核对日期：2026-10-12。事实来源是当前本地源码、真实 SkillRegistry、编译后的各 Agent Graph、ToolRegistry 和输入输出模型；未请求远程项目、模型或真实设备。

## 范围与注册事实

项目共 **30 个技能、9 个 Agent**。运行目录是 `services/agent-service/app/skills/{agent}/*.md`，并没有运行中的独立 `SKILL.md`。每个文档的 YAML 为唯一元数据来源，保留原文件和下划线运行标识，增加中文 description，不创建第二套注册配置。

这轮采用完整14部分规范（YAML加13章），但没有将内部技能迁移成外部标准 Agent Skills 包，也不宣称内部名称符合外部包命名规范。

机器可读清单：[skills-inventory.json](L:/industry_agent/docs/skills-inventory.json)。再核对命令：

```powershell
L:/anaconda/python.exe -X utf8 scripts/audit_skills.py
```

脚本只加载定义、构图、调用权限Guard和模型校验；不会调用工具处理器。脚本进程禁用.env读取，使用不可用的本地路由避免初始化业务数据库，不更改配置文件。

## 全量目录

| Agent | 数量 | 原运行标识 |
| --- | ---: | --- |
| cad | 3 | `drawing_lookup_skill`、`production_modeling_skill`、`virtual_production_skill` |
| diagnosis | 5 | `alarm_diagnosis_skill`、`multi_metric_diagnosis_skill`、`no_alarm_diagnosis_skill`、`safety_triage_skill`、`trend_diagnosis_skill` |
| knowledge | 5 | `alarm_search_skill`、`fault_case_skill`、`hybrid_search_skill`、`manual_search_skill`、`sop_search_skill` |
| maintenance | 3 | `repair_plan_skill`、`spare_part_skill`、`workorder_skill` |
| memory | 3 | `experience_extraction`、`experience_retrieval`、`memory_dedup` |
| quality | 3 | `dimension_inspection_skill`、`part_quality_inspection_skill`、`virtual_size_inspection_skill` |
| report | 2 | `closure_report_skill`、`report_generation_skill` |
| router | 1 | `intent_routing_skill` |
| workorder | 5 | `auto_assignment`、`repair_feedback`、`workorder_create`、`workorder_reopen`、`workorder_tracking` |

## Agent、Graph 与结果契约

“图节点”是编译后的实际节点，不把文档步骤、内部函数、兼容追踪标签算成新增节点。条件边只表示编排选择，不保证每次全部经过。

### cad

- 入口：[services/agent-service/app/agents/cad/agent.py](L:/industry_agent/services/agent-service/app/agents/cad/agent.py)。
- Graph：[services/agent-service/app/agents/cad/graph.py](L:/industry_agent/services/agent-service/app/agents/cad/graph.py)。
- 实际节点：`finish`、`model_3d`、`plan_engineering_query`、`prepare`、`query`、`validate_relation`、`virtual_production`。
- 编译边：

```text
__start__ --条件--> prepare
__start__ --条件--> virtual_production
model_3d --> finish
plan_engineering_query --条件--> query
plan_engineering_query --条件--> validate_relation
prepare --条件--> model_3d
prepare --条件--> plan_engineering_query
query --条件--> finish
query --条件--> plan_engineering_query
query --条件--> validate_relation
validate_relation --> finish
finish --> __end__
virtual_production --> __end__
```

### diagnosis

- 入口：[services/agent-service/app/agents/diagnosis/agent.py](L:/industry_agent/services/agent-service/app/agents/diagnosis/agent.py)。
- Graph：[services/agent-service/app/agents/diagnosis/graph.py](L:/industry_agent/services/agent-service/app/agents/diagnosis/graph.py)。
- 实际节点：`execute_observe`、`finish`、`loop_guard`、`prepare`、`reason`、`tool_guard`、`validate`。
- 编译边：

```text
__start__ --> prepare
execute_observe --条件--> finish
execute_observe --条件--> loop_guard
loop_guard --条件--> finish
loop_guard --条件--> reason
prepare --条件--> finish
prepare --条件--> reason
reason --条件--> finish
reason --条件--> loop_guard
reason --条件--> reason
reason --条件--> tool_guard
reason --条件--> validate
tool_guard --条件--> execute_observe
tool_guard --条件--> finish
tool_guard --条件--> reason
validate --条件--> finish
validate --条件--> reason
finish --> __end__
```

### knowledge

- 入口：[services/agent-service/app/agents/knowledge/agent.py](L:/industry_agent/services/agent-service/app/agents/knowledge/agent.py)。
- Graph：[services/agent-service/app/agents/knowledge/graph.py](L:/industry_agent/services/agent-service/app/agents/knowledge/graph.py)。
- 实际节点：`finish`、`prepare`、`refine_query`、`rerank`、`retrieve`、`validate`。
- 编译边：

```text
__start__ --> prepare
prepare --条件--> finish
prepare --条件--> retrieve
refine_query --> retrieve
rerank --> validate
retrieve --条件--> refine_query
retrieve --条件--> rerank
retrieve --条件--> retrieve
validate --> finish
finish --> __end__
```

### maintenance

- 入口：[services/agent-service/app/agents/maintenance/agent.py](L:/industry_agent/services/agent-service/app/agents/maintenance/agent.py)。
- Graph：[services/agent-service/app/agents/maintenance/graph.py](L:/industry_agent/services/agent-service/app/agents/maintenance/graph.py)。
- 实际节点：`build_plan`、`collect_context`、`finish`、`prepare`、`safety_validate`、`validate`。
- 编译边：

```text
__start__ --> prepare
build_plan --> safety_validate
collect_context --> build_plan
prepare --> collect_context
safety_validate --> validate
validate --> finish
finish --> __end__
```

### memory

- 入口：[services/agent-service/app/agents/memory/agent.py](L:/industry_agent/services/agent-service/app/agents/memory/agent.py)。
- Graph：[services/agent-service/app/agents/memory/graph.py](L:/industry_agent/services/agent-service/app/agents/memory/graph.py)。
- 实际节点：`extract`、`finish`、`persist`、`prepare`、`rank_results`、`retrieve_memory`、`validate_experience`。
- 编译边：

```text
__start__ --> prepare
extract --条件--> finish
extract --条件--> validate_experience
persist --> finish
prepare --条件--> extract
prepare --条件--> finish
prepare --条件--> persist
prepare --条件--> retrieve_memory
rank_results --> finish
retrieve_memory --> rank_results
validate_experience --条件--> finish
validate_experience --条件--> persist
finish --> __end__
```

### quality

- 入口：[services/agent-service/app/agents/quality/agent.py](L:/industry_agent/services/agent-service/app/agents/quality/agent.py)。
- Graph：[services/agent-service/app/agents/quality/graph.py](L:/industry_agent/services/agent-service/app/agents/quality/graph.py)。
- 实际节点：`finish`、`inspect`、`load_input`、`prepare`、`validate_part`、`virtual_size_inspection`。
- 编译边：

```text
__start__ --条件--> prepare
__start__ --条件--> virtual_size_inspection
inspect --> validate_part
load_input --条件--> finish
load_input --条件--> inspect
prepare --> load_input
validate_part --> finish
finish --> __end__
virtual_size_inspection --> __end__
```

### report

- 入口：[services/agent-service/app/agents/report/agent.py](L:/industry_agent/services/agent-service/app/agents/report/agent.py)。
- Graph：[services/agent-service/app/agents/report/graph.py](L:/industry_agent/services/agent-service/app/agents/report/graph.py)。
- 实际节点：`collect_context`、`compose`、`finish`、`persist`、`prepare`。
- 编译边：

```text
__start__ --> prepare
collect_context --条件--> compose
collect_context --条件--> finish
compose --> persist
persist --> finish
prepare --> collect_context
finish --> __end__
```

### router

- 入口：[services/agent-service/app/agents/router/agent.py](L:/industry_agent/services/agent-service/app/agents/router/agent.py)。
- Graph：[services/agent-service/app/agents/router/graph.py](L:/industry_agent/services/agent-service/app/agents/router/graph.py)。
- 实际节点：`finish`、`prepare`、`route_request`。
- 编译边：

```text
__start__ --> prepare
prepare --> route_request
route_request --> finish
finish --> __end__
```

### workorder

- 入口：[services/agent-service/app/agents/workorder/agent.py](L:/industry_agent/services/agent-service/app/agents/workorder/agent.py)。
- Graph：[services/agent-service/app/agents/workorder/graph.py](L:/industry_agent/services/agent-service/app/agents/workorder/graph.py)。
- 实际节点：`assign_order`、`create_order`、`dispatch_context`、`execute_action`、`finish`、`prepare`、`validate_plan`。
- 编译边：

```text
__start__ --> prepare
assign_order --> finish
create_order --条件--> dispatch_context
create_order --条件--> finish
dispatch_context --条件--> assign_order
dispatch_context --条件--> finish
execute_action --> finish
prepare --> validate_plan
validate_plan --条件--> create_order
validate_plan --条件--> execute_action
validate_plan --条件--> finish
finish --> __end__
```

## 每个技能的职责、权限和边界

以下逐个列出原标识、兼容名称、实际契约和业务差异。详细参数、返回处理、停止条件、异常分支、完整示例与代码入口均在对应技能正文；机器清单保留原steps、触发条件以及结构化tool步骤。

### 设备工程图纸与部件定位 · `drawing_lookup_skill`

- 文档：[services/agent-service/app/skills/cad/drawing_lookup.md](L:/industry_agent/services/agent-service/app/skills/cad/drawing_lookup.md)。
- 所属 Agent / Graph：`cad` / `services/agent-service/app/agents/cad/graph.py`。
- 业务职责：定位设备零部件、安装位置及工程图纸，验证它们的设备归属。
- 触发及与其它技能的区别：part_or_component、bom两触发取或；part_search_skill/bom_analysis_skill是同一技能兼容别名。文本“零件/part/BOM”可选中，但工程query_type由Graph再次分类。
- 不适用：工程查询不生成3D实体，不用其它设备图纸填无结果查询。
- 兼容别名：`part_search_skill`、`bom_analysis_skill`。
- 契约：`CADQuery` → `CADResult`。
- 保留的步骤标识：`normalize_query`、`classify_engineering_request`、`resolve_part`、`plan_engineering_query`、`resolve_bom`、`merge_engineering_context`、`validate_engineering_context`、`build_result`。
- 允许工具：`query_part`、`query_drawing`、`query_bom`、`query_relation`、`fetch_engineering_record`。
- 专有判断：部件为空即不足；普通component需零件号和图纸，BOM需编号与BOM，装配需关系，位置需位置证据。 编号精确、名称模糊规则独立；相似名字不授权跨设备复用。 图纸显示可用与部件精确定位可用是两件事，不能因总图能打开而宣称故障部件已定位。
- 停止与降级：预算max_steps默认5、1–6；队列耗尽或达到预算进入关系校验。结果stop_reason沿用max_steps/validator_pass/cad_service_no_data/validation_failed；completed仅表示当前工程查询验证通过，不是模型已生产或维修已完成。
- 异常处理：工具异常写入失败观察，在有限计划内继续互补查询并最终校验；无部件、必要编号/图纸/BOM/关系/位置缺失返回insufficient_engineering_data，不补造记录。远程不可用保留backend_status/degraded/warning和实际finding。

### 本地FreeCAD实体建模与修改 · `production_modeling_skill`

- 文档：[services/agent-service/app/skills/cad/production_modeling.md](L:/industry_agent/services/agent-service/app/skills/cad/production_modeling.md)。
- 所属 Agent / Graph：`cad` / `services/agent-service/app/agents/cad/graph.py`。
- 业务职责：通过同一个本地 FreeCAD MCP 工具生成并校验零件、工程图、约束装配、钣金展开和建筑模型。
- 触发及与其它技能的区别：只匹配结构化operation=production_modeling；普通检索文字不能激活建模工具。模型树修改提案由受保护的文档入口形成，人工确认后执行。
- 不适用：缺规格不能替用户决定尺寸，维修图纸检索不用本建模技能，BuildCAD不是当前活动建模路径。
- 兼容别名：无。
- 契约：`FreeCADRunRequest` → `dict（专属工具/接口返回）`。
- 保留的步骤标识：`normalize_query`、`classify_engineering_request`、`build_model`、`build_result`。
- 允许工具：`freecad_mcp`、`freecad_document_proposal`。
- 专有判断：单位/外径/孔径/长宽高/位置必须对应原需求，不能只检查数字出现过就认定语义匹配。 每项用户特征必须保留；不支持/复杂不确定的需求要询问，不以简单圆柱冒充完成。 模型提案、实体执行、导出校验、保存版本与生产验收分开，不以旋转摄像机冒充装配运动。
- 停止与降级：成功须validation.valid与step_roundtrip真实为True、实体数量/正体积/尺寸符合本次spec、STL/STEP/FCStd实际导出，以及所请求工作台额外产物校验。任一缺失停止，不能生成假的下载链接。已存在目录/忙锁/上下文缺失拒绝新执行。
- 异常处理：尺寸、单位、孔位或方向不明确进入needs_input；unsupported特征不忽略；内核、STEP回读、文件证据失败返回failed；连接超时/仍在运行保留outcome_unknown并核对原任务，不自动重放。原有螺纹可靠性限制保留，不能保证任意形体可靠出图。

### 受限虚拟加工任务 · `virtual_production_skill`

- 文档：[services/agent-service/app/skills/cad/virtual_production.md](L:/industry_agent/services/agent-service/app/skills/cad/virtual_production.md)。
- 所属 Agent / Graph：`cad` / `services/agent-service/app/agents/cad/graph.py`。
- 业务职责：根据已校验的 CAD 版本生成并执行受限模拟加工任务。
- 触发及与其它技能的区别：通用trigger=virtual_production；实际CADAgent必须收到operation=virtual_production和服务器私有上下文，经专用单节点执行指定动作。
- 不适用：非真实机床后处理，不支持装配、圆角、多孔或任意复杂刀路；一次准备不会自动连跑下发和启动。
- 兼容别名：无。
- 契约：`Plan` → `dict（专属工具/接口返回）`。
- 保留的步骤标识：`prepare`、`submit`、`start`、`sync`。
- 允许工具：`prepare_virtual_production`、`submit_virtual_production`、`start_virtual_production`、`sync_virtual_production`。
- 专有判断：prepared只表示准备完成，不是机器正在生产。 必须核对program_digest和原job归属；相同ID不同参数不是幂等重试。 output只能来自工厂completed任务回执；模拟比较独立执行，不自动宣布合格。
- 停止与降级：prepare成功只到prepared；submit须摘要一致并实际接收；start须已接收且状态允许运行；running/completed/未知只同步。sync只记录原工厂事实。稳定同操作者+command_id身份防重复建任务，不自动修复或恢复设备。
- 异常处理：重复command_id但设计/工艺变化拒绝；任务归属、摘要、状态冲突或工厂未知返回现有VirtualProductionError/code/message/status。review/outcome_unknown不能包装接收成功，读取失败不重启任务。

### 报警诊断 · `alarm_diagnosis_skill`

- 文档：[services/agent-service/app/skills/diagnosis/alarm_diagnosis.md](L:/industry_agent/services/agent-service/app/skills/diagnosis/alarm_diagnosis.md)。
- 所属 Agent / Graph：`diagnosis` / `services/agent-service/app/agents/diagnosis/graph.py`。
- 业务职责：结合报警定义与运行证据诊断带报警码的设备事件。
- 触发及与其它技能的区别：通用注册器匹配 exists(alarm_code) 或报警相关文字；Diagnosis 专用选择器实际要求 event.alarm_code 非空，可与多指标、趋势、安全技能共选。
- 不适用：没有真实报警编号时不补造编号，按实际专用选择器交由其它诊断技能。
- 兼容别名：无。
- 契约：`AbnormalEventRequest` → `DiagnosisResult`。
- 保留的步骤标识：`query_alarm_definition`、`judge_alarm_evidence`、`enrich_with_history_or_knowledge`、`diagnose`、`validate_result`、`normalize_event`、`select_skills`、`generate_candidates`、`execute_tools`、`collect_evidence`、`build_result`。
- 允许工具：`get_alarm_definition`、`get_device_history`、`get_device_logs`、`search_knowledge`。
- 专有判断：报警定义与实际根因分开；字典命中不是零件损坏的证明。 当前运行观测优先于历史相似案例；目录严重等级可表明风险，但不能证明对应物理状态。 存在多个合理原因时在 diagnosis 保留条件及补查建议，不给没有来源的排他结论。
- 停止与降级：默认 max_steps=6，计模型 reasoning 轮数，不是单个工具个数。相同工具参数重复被 Guard 拒绝；已有 max_steps、no_new_observation 与校验回退分支。观察哈希包含步骤，不能承诺完全识别跨轮相同业务证据。缺关键事实不能强行以成功结论结束。
- 异常处理：输入缺口先在现有预算内补查；工具错误保留失败观察；空定义/空历史不证明设备正常；来源冲突降低结论确定性。模型不可用、校验无法修正、预算耗尽进入现有 fallback，source=local_fallback，保留 error/validation_errors 与人工复核要求。现有 Validator 结构校验不等于已验证业务因果。

### 多指标关联诊断 · `multi_metric_diagnosis_skill`

- 文档：[services/agent-service/app/skills/diagnosis/multi_metric.md](L:/industry_agent/services/agent-service/app/skills/diagnosis/multi_metric.md)。
- 所属 Agent / Graph：`diagnosis` / `services/agent-service/app/agents/diagnosis/graph.py`。
- 业务职责：关联多个异常指标并推断共同故障原因。
- 触发及与其它技能的区别：注册器接受 abnormal_metrics/metrics 的 list或tuple长度>1；Diagnosis专用选择器仅检查 abnormal_metrics 为list且长度>1。无报警多指标不一定共选 no_alarm 技能。
- 不适用：单指标不假装多指标关联；不同设备的样本不合并为同一故障。
- 兼容别名：无。
- 契约：`AbnormalEventRequest` → `DiagnosisResult`。
- 保留的步骤标识：`correlate_metrics`、`query_history`、`infer_common_causes`、`validate_result`。
- 允许工具：`get_device_history`、`get_device_logs`、`search_knowledge`。
- 专有判断：时间相关不等于因果；两个指标偏离不能单独证明共同部件损坏。 采样时间、负载和工况不同要记录，代码未实现完整时间对齐时不能声称已对齐。 一个指标回归正常而另一个持续异常时重新审查共同原因，不删除矛盾观测。
- 停止与降级：默认 max_steps=6，计模型 reasoning 轮数，不是单个工具个数。相同工具参数重复被 Guard 拒绝；已有 max_steps、no_new_observation 与校验回退分支。观察哈希包含步骤，不能承诺完全识别跨轮相同业务证据。缺关键事实不能强行以成功结论结束。
- 异常处理：输入缺口先在现有预算内补查；工具错误保留失败观察；空定义/空历史不证明设备正常；来源冲突降低结论确定性。模型不可用、校验无法修正、预算耗尽进入现有 fallback，source=local_fallback，保留 error/validation_errors 与人工复核要求。现有 Validator 结构校验不等于已验证业务因果。

### 无报警异常诊断 · `no_alarm_diagnosis_skill`

- 文档：[services/agent-service/app/skills/diagnosis/no_alarm_diagnosis.md](L:/industry_agent/services/agent-service/app/skills/diagnosis/no_alarm_diagnosis.md)。
- 所属 Agent / Graph：`diagnosis` / `services/agent-service/app/agents/diagnosis/graph.py`。
- 业务职责：在没有报警码时依据指标、日志和历史数据诊断异常。
- 触发及与其它技能的区别：通用 trigger=no_alarm_code；专用选择器在报警、多指标、趋势均未命中时回退，缺报警本身不保证选择本技能。
- 不适用：已有报警或满足趋势/多指标时不强制替换其它技能，也不从无报警推断健康。
- 兼容别名：无。
- 契约：`AbnormalEventRequest` → `DiagnosisResult`。
- 保留的步骤标识：`inspect_abnormal_metrics`、`query_context_if_needed`、`output_low_confidence_if_evidence_insufficient`。
- 允许工具：`get_device_history`、`get_device_logs`、`search_knowledge`、`get_device_status`。
- 专有判断：无报警只表示编号缺失，不意味着没有故障或已经恢复。 区分指标缺测、设备未找到与测得正常；未知不能写成正常。 没有基准与运行工况时不自行设设备阈值，使用已有指标定义或说明待补标准。
- 停止与降级：默认 max_steps=6，计模型 reasoning 轮数，不是单个工具个数。相同工具参数重复被 Guard 拒绝；已有 max_steps、no_new_observation 与校验回退分支。观察哈希包含步骤，不能承诺完全识别跨轮相同业务证据。缺关键事实不能强行以成功结论结束。
- 异常处理：输入缺口先在现有预算内补查；工具错误保留失败观察；空定义/空历史不证明设备正常；来源冲突降低结论确定性。模型不可用、校验无法修正、预算耗尽进入现有 fallback，source=local_fallback，保留 error/validation_errors 与人工复核要求。现有 Validator 结构校验不等于已验证业务因果。

### 严重事件安全分级 · `safety_triage_skill`

- 文档：[services/agent-service/app/skills/diagnosis/safety_triage.md](L:/industry_agent/services/agent-service/app/skills/diagnosis/safety_triage.md)。
- 所属 Agent / Graph：`diagnosis` / `services/agent-service/app/agents/diagnosis/graph.py`。
- 业务职责：对严重事件进行风险识别，并提出需人工或安全系统核查的处置建议。
- 触发及与其它技能的区别：通用注册器对 severity==critical 接受 critical/fatal/严重；专用选择器仅在 severity=critical 或原因含 critical/严重时追加本技能。单独 fatal 不保证激活。
- 不适用：选中技能不自动执行急停，也不自动设置专属安全验收字段。
- 兼容别名：无。
- 契约：`AbnormalEventRequest` → `DiagnosisResult`。
- 保留的步骤标识：`identify_safety_risk`、`retrieve_safety_sop`、`mark_human_or_safety_system_required`。
- 允许工具：`get_alarm_definition`、`get_device_logs`、`search_knowledge`。
- 专有判断：风险等级、停机事实和安全动作完成是三件事，必须分别有来源。 不能因严重目录项就声称机器已经停机或允许复机。 安全建议不得包含未经授权的互锁旁路；不制造 Result 没有的 safety_system_required 字段。
- 停止与降级：默认 max_steps=6，计模型 reasoning 轮数，不是单个工具个数。相同工具参数重复被 Guard 拒绝；已有 max_steps、no_new_observation 与校验回退分支。观察哈希包含步骤，不能承诺完全识别跨轮相同业务证据。缺关键事实不能强行以成功结论结束。
- 异常处理：输入缺口先在现有预算内补查；工具错误保留失败观察；空定义/空历史不证明设备正常；来源冲突降低结论确定性。模型不可用、校验无法修正、预算耗尽进入现有 fallback，source=local_fallback，保留 error/validation_errors 与人工复核要求。现有 Validator 结构校验不等于已验证业务因果。

### 趋势与重复异常诊断 · `trend_diagnosis_skill`

- 文档：[services/agent-service/app/skills/diagnosis/trend_diagnosis.md](L:/industry_agent/services/agent-service/app/skills/diagnosis/trend_diagnosis.md)。
- 所属 Agent / Graph：`diagnosis` / `services/agent-service/app/agents/diagnosis/graph.py`。
- 业务职责：诊断重复出现或持续发展的趋势性异常。
- 触发及与其它技能的区别：通用注册器按 trend/趋势/重复/持续/历史/案例等文字命中；Diagnosis专用 requires_history 按 duration_seconds、occurrence_count、event_type及触发规则判定，两个机制不能混为一谈。
- 不适用：仅当前单点值不构成趋势，历史检索失败不伪造上升或下降曲线。
- 兼容别名：无。
- 契约：`AbnormalEventRequest` → `DiagnosisResult`。
- 保留的步骤标识：`query_history`、`summarize_trend`、`infer_candidates`、`collect_evidence`。
- 允许工具：`get_device_history`、`get_device_logs`、`search_knowledge`。
- 专有判断：必须区分次数、持续时间和样本趋势，不用报警频率替代物理指标变化。 检查缺失值、采样质量与单位；工具给的 direction 只描述该样本窗，不推广为长期因果。 用当前事实复核历史候选；窗口过短或样本空时保留不确定性。
- 停止与降级：默认 max_steps=6，计模型 reasoning 轮数，不是单个工具个数。相同工具参数重复被 Guard 拒绝；已有 max_steps、no_new_observation 与校验回退分支。观察哈希包含步骤，不能承诺完全识别跨轮相同业务证据。缺关键事实不能强行以成功结论结束。
- 异常处理：输入缺口先在现有预算内补查；工具错误保留失败观察；空定义/空历史不证明设备正常；来源冲突降低结论确定性。模型不可用、校验无法修正、预算耗尽进入现有 fallback，source=local_fallback，保留 error/validation_errors 与人工复核要求。现有 Validator 结构校验不等于已验证业务因果。

### 报警知识检索 · `alarm_search_skill`

- 文档：[services/agent-service/app/skills/knowledge/alarm_search.md](L:/industry_agent/services/agent-service/app/skills/knowledge/alarm_search.md)。
- 所属 Agent / Graph：`knowledge` / `services/agent-service/app/agents/knowledge/graph.py`。
- 业务职责：检索报警定义以及与报警相关的技术知识。
- 触发及与其它技能的区别：exists(alarm_code) 或上下文含报警/alarm/故障码；purpose=maintenance 可另选 hybrid_search 技能，不单靠报警技能扩大到SOP工具。
- 不适用：仅相似编号命中不等于同一设备报警；没有实际定义时不自行补表。
- 兼容别名：无。
- 契约：`KnowledgeQuery` → `KnowledgeResult`。
- 保留的步骤标识：`normalize_alarm_code`、`search_alarm_knowledge`、`fetch_document_or_chunk`、`validate_evidence`。
- 允许工具：`search_alarm_knowledge`、`search_knowledge`、`fetch_document`、`fetch_chunk`。
- 专有判断：报警目录给编号含义，不给当前故障确定原因。 跨设备降级命中必须明示作用范围，不能替换本设备原始字典。 报警知识缺少SOP时只返回解释与不足，下游另检索维修规程。
- 停止与降级：工具调用预算默认4，max_steps为1–8；无剩余计划或预算用尽后重排与校验。空结果仅在有余预算时一次固定细化。结果 stop_reason 是 evidence_ready 或 insufficient_evidence，不能擅自添加独立预算状态。知识充分也只交给下游判断，不直接维修。
- 异常处理：空结果保留 insufficient_evidence；指定来源不覆盖则记录 validation_findings。工具失败和授权拒绝保留 retrieval_trace，不造文档。远端回答生成失败可保留证据并标记 degraded。当前 Validator 检查身份、来源覆盖与数值，不检查空正文、最低相关度或语义冲突；使用者必须按正文事实进一步核对。

### 历史案例检索 · `fault_case_skill`

- 文档：[services/agent-service/app/skills/knowledge/fault_case.md](L:/industry_agent/services/agent-service/app/skills/knowledge/fault_case.md)。
- 所属 Agent / Graph：`knowledge` / `services/agent-service/app/agents/knowledge/graph.py`。
- 业务职责：检索历史故障案例和已验证的维修经验。
- 触发及与其它技能的区别：case_or_history 匹配 trend/趋势/重复/持续/历史/案例/case；同问题也可选择其它专业技能，不会按重复触发复制一份技能。
- 不适用：历史换件记录不是本次换件事实，语义记忆工具也不只返回已验收经验。
- 兼容别名：无。
- 契约：`KnowledgeQuery` → `KnowledgeResult`。
- 保留的步骤标识：`search_fault_cases`、`search_semantic_memory`、`rerank_evidence`、`validate_evidence`。
- 允许工具：`search_fault_cases`、`search_semantic_memory`、`fetch_document`、`fetch_chunk`。
- 专有判断：优先比较机型、症状、部件、工况和处理结果；没有这些字段就说明可比性不足。 已验证历史只说明当次成立，不能证明当前结论。 同一来源经两条检索命中只算一份参考；没有文档验收字段不擅自贴已验证标签。
- 停止与降级：工具调用预算默认4，max_steps为1–8；无剩余计划或预算用尽后重排与校验。空结果仅在有余预算时一次固定细化。结果 stop_reason 是 evidence_ready 或 insufficient_evidence，不能擅自添加独立预算状态。知识充分也只交给下游判断，不直接维修。
- 异常处理：空结果保留 insufficient_evidence；指定来源不覆盖则记录 validation_findings。工具失败和授权拒绝保留 retrieval_trace，不造文档。远端回答生成失败可保留证据并标记 degraded。当前 Validator 检查身份、来源覆盖与数值，不检查空正文、最低相关度或语义冲突；使用者必须按正文事实进一步核对。

### 混合维修依据检索 · `hybrid_search_skill`

- 文档：[services/agent-service/app/skills/knowledge/hybrid_search.md](L:/industry_agent/services/agent-service/app/skills/knowledge/hybrid_search.md)。
- 所属 Agent / Graph：`knowledge` / `services/agent-service/app/agents/knowledge/graph.py`。
- 业务职责：为维修依据补充混合资料源，或在没有指定专业知识源时执行混合检索。
- 触发及与其它技能的区别：default 在没有专业命中时回退；maintenance_evidence 只检查 purpose=maintenance，此时可与专业技能共选。普通报警文本不会自行授权全部资料源。
- 不适用：不是无条件全库查询；已有精确文档或片段时优先相应获取，不重复检索代替它。
- 兼容别名：无。
- 契约：`KnowledgeQuery` → `KnowledgeResult`。
- 保留的步骤标识：`classify_query`、`search_knowledge`、`rerank_evidence`、`validate_evidence`、`normalize_query`、`select_sources`、`build_filters`、`search`、`build_evidence`、`rank`、`validate_sources`、`build_result`。
- 允许工具：`search_knowledge`、`search_sop`、`search_manual`、`search_fault_cases`、`search_semantic_memory`、`fetch_document`、`fetch_chunk`。
- 专有判断：多个来源一致也需判断是否其实引用同一资料，不累加重复可信度。 解释、步骤和案例有不同用途；单有报警目录不能标记完整维修依据。 answer不等于证据融合验收；明确模型回答与原文摘录的区别。
- 停止与降级：工具调用预算默认4，max_steps为1–8；无剩余计划或预算用尽后重排与校验。空结果仅在有余预算时一次固定细化。结果 stop_reason 是 evidence_ready 或 insufficient_evidence，不能擅自添加独立预算状态。知识充分也只交给下游判断，不直接维修。
- 异常处理：空结果保留 insufficient_evidence；指定来源不覆盖则记录 validation_findings。工具失败和授权拒绝保留 retrieval_trace，不造文档。远端回答生成失败可保留证据并标记 degraded。当前 Validator 检查身份、来源覆盖与数值，不检查空正文、最低相关度或语义冲突；使用者必须按正文事实进一步核对。

### 设备手册检索 · `manual_search_skill`

- 文档：[services/agent-service/app/skills/knowledge/manual_search.md](L:/industry_agent/services/agent-service/app/skills/knowledge/manual_search.md)。
- 所属 Agent / Graph：`knowledge` / `services/agent-service/app/agents/knowledge/graph.py`。
- 业务职责：检索设备手册和操作说明。
- 触发及与其它技能的区别：manual 匹配 manual/手册/说明书；document_id/chunk_id 是否优先获取由Graph计划决定，不是新增技能。
- 不适用：只有标题没有正文不当作手册步骤已读取，模糊机型不能声称匹配原设备。
- 兼容别名：无。
- 契约：`KnowledgeQuery` → `KnowledgeResult`。
- 保留的步骤标识：`normalize_manual_query`、`search_manual`、`fetch_document_or_chunk`、`validate_evidence`。
- 允许工具：`search_manual`、`search_knowledge`、`fetch_document`、`fetch_chunk`。
- 专有判断：版本、机型、来源正文共同决定适用性；不因文件名匹配确认步骤正确。 页码与片段编号只用实际返回，禁止模型自编页码。 检索结果结构通过不意味着正文完整，空正文必须说明无法据此提供具体操作。
- 停止与降级：工具调用预算默认4，max_steps为1–8；无剩余计划或预算用尽后重排与校验。空结果仅在有余预算时一次固定细化。结果 stop_reason 是 evidence_ready 或 insufficient_evidence，不能擅自添加独立预算状态。知识充分也只交给下游判断，不直接维修。
- 异常处理：空结果保留 insufficient_evidence；指定来源不覆盖则记录 validation_findings。工具失败和授权拒绝保留 retrieval_trace，不造文档。远端回答生成失败可保留证据并标记 degraded。当前 Validator 检查身份、来源覆盖与数值，不检查空正文、最低相关度或语义冲突；使用者必须按正文事实进一步核对。

### 标准作业规程检索 · `sop_search_skill`

- 文档：[services/agent-service/app/skills/knowledge/sop_search.md](L:/industry_agent/services/agent-service/app/skills/knowledge/sop_search.md)。
- 所属 Agent / Graph：`knowledge` / `services/agent-service/app/agents/knowledge/graph.py`。
- 业务职责：检索标准作业规程和维修步骤。
- 触发及与其它技能的区别：sop_or_repair_steps 匹配 sop/步骤/规程/怎么修/怎么检查。技能选择与Graph重新分类不同；仅“怎么检查”可能仍形成混合计划，未授权工具必须被拒绝。
- 不适用：报警名称或零散历史描述不能直接变成完整SOP，也不推定已具现场操作授权。
- 兼容别名：无。
- 契约：`KnowledgeQuery` → `KnowledgeResult`。
- 保留的步骤标识：`classify_sop_query`、`search_sop`、`fetch_document_or_chunk`、`validate_evidence`。
- 允许工具：`search_sop`、`search_manual`、`fetch_document`、`fetch_chunk`。
- 专有判断：顺序与前置条件不能丢弃；检索到单个步骤不等于完整工序。 参数冲突保留双方出处，不择一编成确定操作值。 只做资料整理，不执行旁路、控制、拆换或派工。
- 停止与降级：工具调用预算默认4，max_steps为1–8；无剩余计划或预算用尽后重排与校验。空结果仅在有余预算时一次固定细化。结果 stop_reason 是 evidence_ready 或 insufficient_evidence，不能擅自添加独立预算状态。知识充分也只交给下游判断，不直接维修。
- 异常处理：空结果保留 insufficient_evidence；指定来源不覆盖则记录 validation_findings。工具失败和授权拒绝保留 retrieval_trace，不造文档。远端回答生成失败可保留证据并标记 degraded。当前 Validator 检查身份、来源覆盖与数值，不检查空正文、最低相关度或语义冲突；使用者必须按正文事实进一步核对。

### 维修方案制定 · `repair_plan_skill`

- 文档：[services/agent-service/app/skills/maintenance/repair_plan.md](L:/industry_agent/services/agent-service/app/skills/maintenance/repair_plan.md)。
- 所属 Agent / Graph：`maintenance` / `services/agent-service/app/agents/maintenance/graph.py`。
- 业务职责：依据诊断结论和证据生成可执行的维修方案。
- 触发及与其它技能的区别：repair_plan 匹配维修/修复/repair/故障相关上下文；具体可执行性由诊断评估与方案Validator决定，不由触发词决定。
- 不适用：不因用户写“维修”就认定必须换件或已具派工依据。
- 兼容别名：无。
- 契约：`MaintenanceQuery` → `MaintenancePlan`。
- 保留的步骤标识：`assess_diagnosis`、`request_knowledge`、`request_cad`、`plan_repair`、`validate_plan`、`validate_diagnosis`、`determine_required_parts`、`build_safety_steps`、`build_result`。
- 允许工具：`generate_repair_plan`、`query_inventory`、`query_part_availability`、`get_workorder_template`、`submit_workorder_draft`。
- 专有判断：主报警优先，正常温度等背景文字不能把刀塔或互锁故障改成主轴温度故障。 只读互锁核查不得升级为拆换部件；液压停机核查必须有同一来源覆盖液压、油位、泄漏和压力的依据。 必须区别推荐维修与maintenance_required事实；不足时说明待核实项而非自动形成正式工单。
- 停止与降级：完成条件是方案结构、安全和适用工程/知识依据均校验通过；只有维修必要性和相关门禁满足才 workorder_ready=True。普通提示可观察，可靠预警可进入固定只读检查；资料不足、范围错配、安全校验失败保持False。既有一次方案流程不因正文增加独立循环预算。
- 异常处理：缺诊断或证据时输出未就绪计划；工具草案、查询或库存失败保留来源和finding；互锁/液压与诊断范围错配不能套用普通换件。资料不足不补编库存、工时、备件或安全步骤已执行。Graph本身不执行无限重试；外部协作故障交原状态返回。

### 备件需求与可用性核查 · `spare_part_skill`

- 文档：[services/agent-service/app/skills/maintenance/spare_part.md](L:/industry_agent/services/agent-service/app/skills/maintenance/spare_part.md)。
- 所属 Agent / Graph：`maintenance` / `services/agent-service/app/agents/maintenance/graph.py`。
- 业务职责：确定维修所需备件，并核对库存和可用性。
- 触发及与其它技能的区别：part_or_component 由结构化目标或零件/部件/part/BOM文字触发，与repair_plan可组合；仍执行同一Maintenance Graph。
- 不适用：没有独立SparePartQuery/Result，不能上传顶层part_no当作已实现字段，也不因库存存在判必须更换。
- 兼容别名：无。
- 契约：`MaintenanceQuery` → `MaintenancePlan`。
- 保留的步骤标识：`resolve_target_part`、`query_inventory`、`query_part_availability`、`validate_parts`。
- 允许工具：`query_inventory`、`query_part_availability`。
- 专有判断：可用数量必须为有限正数且不是布尔值；available=False阻断，没有数量时需明确available=True。 当前兼容库存会返回synthetic/degraded/demo_only，不能拿示例stock成为正式派单依据。 有库存不等于诊断已证明损坏；核查阶段不预留、扣减或领用库存。
- 停止与降级：完成条件是方案结构、安全和适用工程/知识依据均校验通过；只有维修必要性和相关门禁满足才 workorder_ready=True。普通提示可观察，可靠预警可进入固定只读检查；资料不足、范围错配、安全校验失败保持False。既有一次方案流程不因正文增加独立循环预算。
- 异常处理：缺诊断或证据时输出未就绪计划；工具草案、查询或库存失败保留来源和finding；互锁/液压与诊断范围错配不能套用普通换件。资料不足不补编库存、工时、备件或安全步骤已执行。Graph本身不执行无限重试；外部协作故障交原状态返回。

### 维修工单草稿准备 · `workorder_skill`

- 文档：[services/agent-service/app/skills/maintenance/workorder.md](L:/industry_agent/services/agent-service/app/skills/maintenance/workorder.md)。
- 所属 Agent / Graph：`maintenance` / `services/agent-service/app/agents/maintenance/graph.py`。
- 业务职责：结合维修方案与工程资料生成工单草稿。
- 触发及与其它技能的区别：trigger=workorder按上下文匹配；是否提交由constraints.need_workorder和workorder_ready共同决定。与WorkOrderAgent正式创建技能不同。
- 不适用：不接收顶层maintenance_plan作为MaintenanceQuery输入，不直接创建/派发正式工单。
- 兼容别名：无。
- 契约：`MaintenanceQuery` → `MaintenancePlan`。
- 保留的步骤标识：`build_workorder_draft`、`attach_repair_target`、`attach_drawing_context`、`submit_workorder_draft`。
- 允许工具：`get_workorder_template`、`submit_workorder_draft`。
- 专有判断：模板、草稿、正式工单是不同事实；submitted只能来自工具实际成功回执。 附图沿用已有drawing_url/model_url/mesh_name/location，不用标题造图纸地址。 未就绪计划仍可保留ready=False的草稿，不把它显示成已派发维修。
- 停止与降级：完成条件是方案结构、安全和适用工程/知识依据均校验通过；只有维修必要性和相关门禁满足才 workorder_ready=True。普通提示可观察，可靠预警可进入固定只读检查；资料不足、范围错配、安全校验失败保持False。既有一次方案流程不因正文增加独立循环预算。
- 异常处理：缺诊断或证据时输出未就绪计划；工具草案、查询或库存失败保留来源和finding；互锁/液压与诊断范围错配不能套用普通换件。资料不足不补编库存、工时、备件或安全步骤已执行。Graph本身不执行无限重试；外部协作故障交原状态返回。

### 已验收维修经验学习 · `experience_extraction`

- 文档：[services/agent-service/app/skills/memory/experience_extraction.md](L:/industry_agent/services/agent-service/app/skills/memory/experience_extraction.md)。
- 所属 Agent / Graph：`memory` / `services/agent-service/app/agents/memory/graph.py`。
- 业务职责：从已关闭且可信维修验收通过的工单中提取、验证并保存经验。
- 触发及与其它技能的区别：action=learn结构化优先；memory_write为同一技能兼容别名，与always的memory_dedup组合。请求文字出现学习但action=search不会激活写入。
- 不适用：未关闭、无实际反馈或只有产品quality通过不能学习；顶层repair_verification不能替代工单里的验收。
- 兼容别名：`memory_write`。
- 契约：`MemoryQuery` → `MemoryResult`。
- 保留的步骤标识：`validate_closed`、`select_skills`、`validate_admission`、`extract_experience`、`dedup_experience`、`validate_experience`、`persist`、`build_result`、`fallback`。
- 允许工具：`tools=[]`；内部代码操作并不等于没有副作用。
- 专有判断：准入需passed严格True、source=device_recovery、device_recovery/checks对象，device_identity/operational/alarms_clear/metrics_available均True，状态未失败。 质量评分≥0.8且无阻断项才接纳：closed+feedback 0.45，content 0.15，未失败维修0.20，可信确认0.20；递归synthetic/degraded阻断。 learning_idempotency_key产生稳定EXP-ID；memory_saved与rag_saved各自有实际回执，RAG的pipeline_ready=False不能被success=True覆盖。
- 停止与降级：读流程按已取结果去重、排序及limit结束，无模型推理循环。学习须达到已有准入和质量门槛，重复已完成可结束，不同部分保存走稳定ID恢复。普通final的stop_reason=completed可能仍success=False，不把它等同新增保存成功。
- 异常处理：准入或质量不满足进入validation_failed回退；空检索保留空items及实际finding。存储异常可能抛出，不保证任何异常都包装Result。长期保存成功但RAG同步失败保留部分完成状态，不能声称全链路完成，也不创建替代经验。

### 历史维修经验读取 · `experience_retrieval`

- 文档：[services/agent-service/app/skills/memory/experience_retrieval.md](L:/industry_agent/services/agent-service/app/skills/memory/experience_retrieval.md)。
- 所属 Agent / Graph：`memory` / `services/agent-service/app/agents/memory/graph.py`。
- 业务职责：检索或列出已验证的历史维修经验。
- 触发及与其它技能的区别：action=search或recent；结构化动作优先正文，experience_retrieval与memory_dedup共选。
- 不适用：不因检索文字含“学习”切换到写入，不宣称检索Graph再次验收了所有旧记录。
- 兼容别名：无。
- 契约：`MemoryQuery` → `MemoryResult`。
- 保留的步骤标识：`validate_closed`、`select_skills`、`validate_search`、`retrieve_memory`、`dedup`、`score_experience`、`validate`、`build_result`、`fallback`。
- 允许工具：`search_semantic_memory`。
- 专有判断：当前排序是词包含计数，不是向量重排；元数据允许search_semantic_memory但Graph没有实际调用它。 检索结果可信性主要靠保存准入及后端；没有validation_status过滤事实就不补标签。 同ID/工单/设备/content全同才读去重，不把不同内容悄悄丢弃。
- 停止与降级：读流程按已取结果去重、排序及limit结束，无模型推理循环。学习须达到已有准入和质量门槛，重复已完成可结束，不同部分保存走稳定ID恢复。普通final的stop_reason=completed可能仍success=False，不把它等同新增保存成功。
- 异常处理：准入或质量不满足进入validation_failed回退；空检索保留空items及实际finding。存储异常可能抛出，不保证任何异常都包装Result。长期保存成功但RAG同步失败保留部分完成状态，不能声称全链路完成，也不创建替代经验。

### 维修经验去重与部分保存恢复 · `memory_dedup`

- 文档：[services/agent-service/app/skills/memory/memory_dedup.md](L:/industry_agent/services/agent-service/app/skills/memory/memory_dedup.md)。
- 所属 Agent / Graph：`memory` / `services/agent-service/app/agents/memory/graph.py`。
- 业务职责：避免同一工单的维修经验重复写入。
- 触发及与其它技能的区别：always只在Memory技能范围内附加，不是所有Agent全局触发；不单独提供新的去重API。
- 不适用：不删除历史或做语义合并，不以重复标志遮盖RAG未同步事实。
- 兼容别名：无。
- 契约：`MemoryQuery` → `MemoryResult`。
- 保留的步骤标识：`dedup`、`dedup_experience`。
- 允许工具：`tools=[]`；内部代码操作并不等于没有副作用。
- 专有判断：读键为experience_id/source_workorder/device_id/content，写键为device_id/fault/source_workorder；不能统一成只看工单号。 缺learning_idempotency_key可能产生随机ID，不保证命中原记录的部分保存恢复。 duplicate不等于新增保存；writer可memory_saved=False而rag_saved按实情，分别返回。
- 停止与降级：读流程按已取结果去重、排序及limit结束，无模型推理循环。学习须达到已有准入和质量门槛，重复已完成可结束，不同部分保存走稳定ID恢复。普通final的stop_reason=completed可能仍success=False，不把它等同新增保存成功。
- 异常处理：准入或质量不满足进入validation_failed回退；空检索保留空items及实际finding。存储异常可能抛出，不保证任何异常都包装Result。长期保存成功但RAG同步失败保留部分完成状态，不能声称全链路完成，也不创建替代经验。

### 零件尺寸与设计参数比对 · `dimension_inspection_skill`

- 文档：[services/agent-service/app/skills/quality/dimension_inspection.md](L:/industry_agent/services/agent-service/app/skills/quality/dimension_inspection.md)。
- 所属 Agent / Graph：`quality` / `services/agent-service/app/agents/quality/graph.py`。
- 业务职责：核对生产零件与权威设计规格的尺寸或参数一致性。
- 触发及与其它技能的区别：part_quality依据零件身份或质量文字匹配，与综合技能通常共选；选择本技能本身不提供客户端只检尺寸开关。
- 不适用：不能拿前端草稿参数替代已保存设计，也不自行猜制造公差或允许偏差。
- 兼容别名：无。
- 契约：`QualityQuery` → `QualityResult`。
- 保留的步骤标识：`load_part`、`load_inspection_plan`、`inspect_dimensions`、`validate_part`。
- 允许工具：`get_production_part`、`get_part_specification`、`inspect_part_dimensions`。
- 专有判断：cad_parameters使用Decimal严格一致，完整参数集以及choice/edge_set规则；不是制造公差判定。 scope由权威part.comparison_scope决定，production_context只能约束版本不能授权改范围。 少测一项为insufficient_data，测得不一致为fail，不能因其余项目相同算合格。
- 停止与降级：适用参数完整且比较通过才passed/qualified=True。缺数据、证据错配、来源不可信或Validator失败按既有结果返回；没有模型自由推理循环。整改未全部完成不可复检，复检失败不可放行，released才可Close。
- 异常处理：生产记录未找到、身份未核实、规格缺失或版本不符不能判合格。工具失败保留失败体；缺必需参数为insufficient_data，已测不一致为fail，需人工核实为review。查到记录不等于完成检测，录入passed也不代替独立比较。

### 零件适用范围质检与整改闭环 · `part_quality_inspection_skill`

- 文档：[services/agent-service/app/skills/quality/part_quality_inspection.md](L:/industry_agent/services/agent-service/app/skills/quality/part_quality_inspection.md)。
- 所属 Agent / Graph：`quality` / `services/agent-service/app/agents/quality/graph.py`。
- 业务职责：按权威设计参数或适用检验范围检测生产零件，并支持受控质检闭环。
- 触发及与其它技能的区别：part_quality与尺寸技能共选；闭环operation仅受私有QUALITY_CLOSURE_AUTHORITY授权，常规inspect不依次执行所有闭环动作。
- 不适用：cad_parameters只比较参数，不声称外观/材料/功能/工艺均已检测；不能用客户端标记申请放行。
- 兼容别名：无。
- 契约：`QualityQuery` → `QualityResult`。
- 保留的步骤标识：`load_part`、`load_inspection_plan`、`inspect_dimensions`、`inspect_appearance`、`inspect_material`、`inspect_function`、`inspect_process`、`validate_part`、`identify_part`、`determine_pass_fail`、`build_result`、`create_quality_check`、`create_closure_task`、`complete_closure_task`、`submit_quality_appeal`、`resolve_quality_appeal`、`reinspect_quality_check`、`release_quality_check`、`close_quality_check`。
- 允许工具：`create_quality_check`、`get_production_part`、`get_part_specification`、`inspect_part_dimensions`、`inspect_part_appearance`、`inspect_part_material`、`inspect_part_function`、`inspect_part_process`、`create_closure_task`、`complete_closure_task`、`submit_quality_appeal`、`resolve_quality_appeal`、`reinspect_quality_check`、`release_quality_check`、`close_quality_check`。
- 专有判断：普通范围外观需五项明确布尔，材料按已声明牌号/硬度，功能需跳动标准与rotation_test，工艺需cycle_complete/traceable/operator_confirmed；缺数据不默认通过。 申诉批准进入rectification而非放行；全部整改完成后才复检，通过需整改后新检测、同零件/批次/scope/设计版本。 Release再次核对整改与复检，released才允许Close；质检记录关闭不授权机器启动。
- 停止与降级：适用参数完整且比较通过才passed/qualified=True。缺数据、证据错配、来源不可信或Validator失败按既有结果返回；没有模型自由推理循环。整改未全部完成不可复检，复检失败不可放行，released才可Close。
- 异常处理：生产记录未找到、身份未核实、规格缺失或版本不符不能判合格。工具失败保留失败体；缺必需参数为insufficient_data，已测不一致为fail，需人工核实为review。查到记录不等于完成检测，录入passed也不代替独立比较。

### 模拟加工产出尺寸比较 · `virtual_size_inspection_skill`

- 文档：[services/agent-service/app/skills/quality/virtual_size_inspection.md](L:/industry_agent/services/agent-service/app/skills/quality/virtual_size_inspection.md)。
- 所属 Agent / Graph：`quality` / `services/agent-service/app/agents/quality/graph.py`。
- 业务职责：对工厂已保存的模拟加工尺寸与原设计版本执行确定性比较。
- 触发及与其它技能的区别：专用inspection_type=virtual_profile_dimensions_v1与服务器virtual_context；不是通过文字切换常规质检范围。
- 不适用：不能把模拟记录作为实物制造或正式产品放行依据，不能传客户端passed覆盖后端结果。
- 兼容别名：无。
- 契约：`QualityRequest` → `QualityResponse`。
- 保留的步骤标识：`inspect`。
- 允许工具：`inspect_virtual_output`。
- 专有判断：outer_diameter_mm/length_mm及适用inner_diameter_mm精确比较，缺值不默认等于设计。 simulation_only/synthetic标记必须保留；模型不能把虚拟产出包装实测。 同任务同摘要重复检查先核验已保存check，不随机生成新结果。
- 停止与降级：只比较加工区outer_diameter_mm/length_mm，有通孔时比较inner_diameter_mm，采用Decimal精确比较，不推断制造公差。同产出+rule的既有检测核验后幂等返回，不新增随机观察。结果写模拟记录，不写正式质检放行表。
- 异常处理：任务或摘要/归属不符拒绝；身份错误review，实际值缺失insufficient_data，实测不一致fail，全部一致pass。私有授权上下文缺失时A2A端点抛A2AError，不会生成failed QualityResponse；不得用用户输入测量替代后端产出。

### 闭环与执行链路报告 · `closure_report_skill`

- 文档：[services/agent-service/app/skills/report/closure_report.md](L:/industry_agent/services/agent-service/app/skills/report/closure_report.md)。
- 所属 Agent / Graph：`report` / `services/agent-service/app/agents/report/graph.py`。
- 业务职责：汇总真实业务记录和执行链路，生成闭环或链路报告。
- 触发及与其它技能的区别：closure匹配closure/closure_report/full_case_report，trace匹配trace/trace_report；trace_report_skill为兼容别名。这是技能选择，最终report_type仍由既有类型及资料推断。
- 不适用：不能仅因报告名含闭环就宣布工单已经关闭或机器已复机。
- 兼容别名：`trace_report_skill`。
- 契约：`ReportQuery` → `ReportResult`。
- 保留的步骤标识：`collect_event`、`select_skills`、`collect_sources`、`validate_completeness`、`compose_report`、`validate_result`、`persist`、`persist_report`、`build_result`、`fallback`。
- 允许工具：`get_diagnosis_record`、`get_maintenance_record`、`get_workorder`、`get_quality_record`、`get_trace_summary`、`persist_report`。
- 专有判断：建议方案与实际维修反馈分别放对应章节，计划中步骤不当作已执行操作。 Trace计数或任务存在不是业务完成证据，未执行步骤不补工具记录。 full_case需要诊断/计划/工单及反馈或维修验收，缺任一不得写完整闭环成功。
- 停止与降级：diagnosis报告要诊断；maintenance要诊断/方案/工单；quality要质检；incident要事件；full_case还要反馈或维修验收。各事实还需对应标识/正文和source_refs。满足本次报告校验后结束，无新增循环；PDF渲染成败独立报告。
- 异常处理：读记录异常保留found=False/success=False/error；资料不足但有章节时可compose并status=incomplete，可按persist要求保存。保存未确认保留incomplete/report_persistence_failed。空资料按原fallback。不能把空默认file_path填成不存在文件。

### 结构化报告与受控文件导出 · `report_generation_skill`

- 文档：[services/agent-service/app/skills/report/report_generation.md](L:/industry_agent/services/agent-service/app/skills/report/report_generation.md)。
- 所属 Agent / Graph：`report` / `services/agent-service/app/agents/report/graph.py`。
- 业务职责：生成完整、可追溯的工业事件或维修报告。
- 触发及与其它技能的区别：default作为普通报告默认技能；指定闭环/链路时可选择专用技能，不因默认文件权限就自动渲染PDF。
- 不适用：生成正文、持久化、PDF产物三件事分开，不把file_path默认空值替换成下载链接。
- 兼容别名：无。
- 契约：`ReportQuery` → `ReportResult`。
- 保留的步骤标识：`collect_sources`、`check_completeness`、`compose_report`、`validate_report`、`persist_report`、`generate_report_file`、`collect_event`、`validate_completeness`、`validate_result`、`build_result`。
- 允许工具：`get_diagnosis_record`、`get_maintenance_record`、`get_workorder`、`get_quality_record`、`get_trace_summary`、`persist_report`、`generate_report_file`。
- 专有判断：generate_report_file在YAML允许，但普通Report Graph没有文件节点或自动调用。 只有generated/success与实际文件回执成立才展示文件，HTTP才提供open_url/download_url。 文件内容引用原报告事实，不能补造验收数据来凑完整PDF。
- 停止与降级：diagnosis报告要诊断；maintenance要诊断/方案/工单；quality要质检；incident要事件；full_case还要反馈或维修验收。各事实还需对应标识/正文和source_refs。满足本次报告校验后结束，无新增循环；PDF渲染成败独立报告。
- 异常处理：读记录异常保留found=False/success=False/error；资料不足但有章节时可compose并status=incomplete，可按persist要求保存。保存未确认保留incomplete/report_persistence_failed。空资料按原fallback。不能把空默认file_path填成不存在文件。

### 工业请求路由与实体抽取 · `intent_routing_skill`

- 文档：[services/agent-service/app/skills/router/intent_routing.md](L:/industry_agent/services/agent-service/app/skills/router/intent_routing.md)。
- 所属 Agent / Graph：`router` / `services/agent-service/app/agents/router/graph.py`。
- 业务职责：识别工业请求意图、提取业务实体并形成已校验的路由结果。
- 触发及与其它技能的区别：default；entity_extraction_skill为同一技能兼容别名。合法context route_hint→intent→task_type→target_agent先于文字分类。
- 不适用：路由到workorder不等于已经读取工单，抽取报警不等于诊断执行成功。
- 兼容别名：`entity_extraction_skill`。
- 契约：`AgentTask` → `RouteResult`。 AgentTask是外层请求样例，Router实际接收转换后的文字/上下文，不新增RouterInput模型。
- 保留的步骤标识：`normalize_request`、`select_target_agent`、`classify_intent`、`extract_entities`、`validate_route`、`build_runtime_goal`。
- 允许工具：`tools=[]`；内部代码操作并不等于没有副作用。
- 专有判断：合法结构化意图优先；最高同分且不能按已有工单规则区分时need_more_context，不强行选一个业务。 工单查询及非create动作需workorder_id；零件质检需生产身份或明确inspection_type，不能猜上一任务编号。 part_no可同步part_id，文本WO/BATCH/PO按既有规范转换；抽取值仍需领域服务核实。
- 停止与降级：一次既有分类与实体校验完成就返回。unknown置信度0.2，缺上下文或findings为0.55；正常含实体0.95，否则0.88。数值是现有规则分级，不宣称真实概率或外部模型置信度。
- 异常处理：无分类匹配返回unknown；最高同分无法区分或关键实体缺失返回need_more_context/target_agent=router。工单非create动作缺workorder_id、质检缺生产身份时不能盲目转发。无模型重试或无限分类循环。

### 工单派发与负责人核验 · `auto_assignment`

- 文档：[services/agent-service/app/skills/workorder/auto_assignment.md](L:/industry_agent/services/agent-service/app/skills/workorder/auto_assignment.md)。
- 所属 Agent / Graph：`workorder` / `services/agent-service/app/agents/workorder/graph.py`。
- 业务职责：按设备登记负责关系、在线可用状态和负载选择或核验派工人员。
- 触发及与其它技能的区别：trigger=assign；action=assign直走execute_action提交指定assignee，创建后的自动派发另走dispatch_context/select_assignee。不能把这两条路径合并描述。
- 不适用：现有assign请求不会自动运行技能/班次/区域加权评分；score_candidate不是当前排序算法。
- 兼容别名：无。
- 契约：`WorkOrderQuery` → `WorkOrderResult`。
- 保留的步骤标识：`collect_dispatch_context`、`select_assignee`、`assign_order`。
- 允许工具：`query_technicians`、`query_technician_skills`、`query_technician_workload`、`query_shift`、`query_team_availability`、`assign_workorder`。
- 专有判断：responsible_device_ids明确空或格式错误不扩大资格；仅旧账号缺该字段可按primary_device_id兼容。 无候选等待登录，人员查询失败单独标记，不从固定人员列表凑成功。 当前候选dispatch_score统一100，技能和班次可not_recorded，不能对外宣称已做多维优化匹配。
- 停止与降级：本次动作返回且最终校验满足才成功。waiting_for_personnel/personnel_query_failed、输入或结果校验失败按既有回退返回，不构造固定负责人。创建/派发不等于维修完成，完成不等于关闭或复机。审批只绑定特定动作、参数和任务；并发恢复由服务端领取状态控制。
- 异常处理：输入门禁失败转fallback；执行异常仍经过最终校验。人员查询失败与无人可用分别表达；授权不足、库存不足、非法迁移、空工单不伪装成功。写操作响应超时后先查询权威结果，不把底层可能仍在运行的动作盲目重放；参数改变不能共用原幂等键或审批。

### 维修反馈与完成核验 · `repair_feedback`

- 文档：[services/agent-service/app/skills/workorder/repair_feedback.md](L:/industry_agent/services/agent-service/app/skills/workorder/repair_feedback.md)。
- 所属 Agent / Graph：`workorder` / `services/agent-service/app/agents/workorder/graph.py`。
- 业务职责：接收现场维修反馈并标记维修执行结果。
- 触发及与其它技能的区别：trigger=feedback匹配反馈上下文；真实action为submit_feedback或mark_repair_completed，不存在feedback业务动作。
- 不适用：反馈保存不是维修验收，通用工单动作也不代替登录人员确认与整线复机。
- 兼容别名：无。
- 契约：`WorkOrderQuery` → `WorkOrderResult`。
- 保留的步骤标识：`initialize`、`load_skill`、`validate_plan`、`execute_action`、`validate`、`final`。
- 允许工具：`submit_repair_feedback`、`mark_repair_completed`。
- 专有判断：完成需要已派工且开始、实际反馈，以及设备身份/可运行状态/报警清除/指标/新鲜度恢复数据。 passed=true不能自证；inspection只读核查任务不提供维修完成证明。 工具反馈参数feedback来自输入repair_feedback；身份确认和复机有另行受保护链路，不能宣称本工具自行验证登录人。
- 停止与降级：本次动作返回且最终校验满足才成功。waiting_for_personnel/personnel_query_failed、输入或结果校验失败按既有回退返回，不构造固定负责人。创建/派发不等于维修完成，完成不等于关闭或复机。审批只绑定特定动作、参数和任务；并发恢复由服务端领取状态控制。
- 异常处理：输入门禁失败转fallback；执行异常仍经过最终校验。人员查询失败与无人可用分别表达；授权不足、库存不足、非法迁移、空工单不伪装成功。写操作响应超时后先查询权威结果，不把底层可能仍在运行的动作盲目重放；参数改变不能共用原幂等键或审批。

### 维修工单创建与条件派发 · `workorder_create`

- 文档：[services/agent-service/app/skills/workorder/workorder_create.md](L:/industry_agent/services/agent-service/app/skills/workorder/workorder_create.md)。
- 所属 Agent / Graph：`workorder` / `services/agent-service/app/agents/workorder/graph.py`。
- 业务职责：根据已验证的维修方案创建并派发维修工单。
- 触发及与其它技能的区别：repair_plan按上下文触发；显式选择仍受validate_request/审批/自动门禁约束。auto_dispatch优先，manual/manual_draft默认留open，其它就绪/事件请求可进入自动派工。
- 不适用：不是每个异常都开单，不把创建成功等同派发成功或维修完成。
- 兼容别名：无。
- 契约：`WorkOrderQuery` → `WorkOrderResult`。
- 保留的步骤标识：`initialize`、`load_skill`、`validate_plan`、`create_order`、`collect_dispatch_context`、`select_assignee`、`assign_order`、`validate`、`final`。
- 允许工具：`create_workorder`、`get_workorder_template`、`query_technicians`、`query_technician_skills`、`query_technician_workload`、`query_shift`、`query_team_availability`、`assign_workorder`。
- 专有判断：默认自动置信度门槛AUTO_WORKORDER_MIN_CONFIDENCE为0.80，还需非synthetic、无需人工复核、证据和维修必要性、workorder_ready通过。 固定预警inspection有独立严格门禁，不能将低置信度维修降级成普通检查绕过校验。 相同命令复用必须业务参数一致；负责人已存在不被创建时旧缓存覆盖。
- 停止与降级：本次动作返回且最终校验满足才成功。waiting_for_personnel/personnel_query_failed、输入或结果校验失败按既有回退返回，不构造固定负责人。创建/派发不等于维修完成，完成不等于关闭或复机。审批只绑定特定动作、参数和任务；并发恢复由服务端领取状态控制。
- 异常处理：输入门禁失败转fallback；执行异常仍经过最终校验。人员查询失败与无人可用分别表达；授权不足、库存不足、非法迁移、空工单不伪装成功。写操作响应超时后先查询权威结果，不把底层可能仍在运行的动作盲目重放；参数改变不能共用原幂等键或审批。

### 工单合法重开 · `workorder_reopen`

- 文档：[services/agent-service/app/skills/workorder/workorder_reopen.md](L:/industry_agent/services/agent-service/app/skills/workorder/workorder_reopen.md)。
- 所属 Agent / Graph：`workorder` / `services/agent-service/app/agents/workorder/graph.py`。
- 业务职责：按实际状态迁移规则重开已有工单，不重复创建任务。
- 触发及与其它技能的区别：trigger=reopen；action=reopen且workorder_id非空。不要把任何质检失败都当成允许open的依据。
- 不适用：completed/in_progress/awaiting_verification不能直接reopen到open；不是新建单或隐式改派。
- 兼容别名：无。
- 契约：`WorkOrderQuery` → `WorkOrderResult`。
- 保留的步骤标识：`initialize`、`load_skill`、`validate_plan`、`execute_action`、`validate`、`final`。
- 允许工具：`reopen_workorder`、`get_workorder`。
- 专有判断：closed/rejected/timeout可到open，open同态可保留；completed回到in_progress是另一合法更新，不等于reopen。 保留已冻结的关闭/诊断/方案/验收事实，不修改历史来证明新操作完成。 旧审批只绑定旧动作，不为重开或新参数自动授权。
- 停止与降级：本次动作返回且最终校验满足才成功。waiting_for_personnel/personnel_query_failed、输入或结果校验失败按既有回退返回，不构造固定负责人。创建/派发不等于维修完成，完成不等于关闭或复机。审批只绑定特定动作、参数和任务；并发恢复由服务端领取状态控制。
- 异常处理：输入门禁失败转fallback；执行异常仍经过最终校验。人员查询失败与无人可用分别表达；授权不足、库存不足、非法迁移、空工单不伪装成功。写操作响应超时后先查询权威结果，不把底层可能仍在运行的动作盲目重放；参数改变不能共用原幂等键或审批。

### 工单查询与受控状态更新 · `workorder_tracking`

- 文档：[services/agent-service/app/skills/workorder/workorder_tracking.md](L:/industry_agent/services/agent-service/app/skills/workorder/workorder_tracking.md)。
- 所属 Agent / Graph：`workorder` / `services/agent-service/app/agents/workorder/graph.py`。
- 业务职责：查询和更新工单生命周期状态。
- 触发及与其它技能的区别：trigger=query按上下文匹配；query/get有编号读取单单，query无编号列出设备/状态过滤结果。update由实际action决定，不因工具白名单自动写入。
- 不适用：不支持通过通用update任意透传验收字段，不以工单存在代替动作对账。
- 兼容别名：无。
- 契约：`WorkOrderQuery` → `WorkOrderResult`。
- 保留的步骤标识：`initialize`、`load_skill`、`validate_plan`、`execute_action`、`validate`、`final`。
- 允许工具：`get_workorder`、`query_workorder`、`update_workorder`、`list_workorders`。
- 专有判断：open可到in_progress/rejected/timeout；in_progress可到awaiting_verification/rejected/timeout；awaiting_verification可到completed/in_progress；completed可到closed/in_progress；closed/rejected/timeout可到open，均允许同态。 in_progress必须有负责人；退回处理和完成关闭另需验证条件，prestart验证不能替代运行复核关闭。 空列表是成功查询，单单未找到可success=False但stop_reason=completed，不伪造不存在的not_found枚举。
- 停止与降级：本次动作返回且最终校验满足才成功。waiting_for_personnel/personnel_query_failed、输入或结果校验失败按既有回退返回，不构造固定负责人。创建/派发不等于维修完成，完成不等于关闭或复机。审批只绑定特定动作、参数和任务；并发恢复由服务端领取状态控制。
- 异常处理：输入门禁失败转fallback；执行异常仍经过最终校验。人员查询失败与无人可用分别表达；授权不足、库存不足、非法迁移、空工单不伪装成功。写操作响应超时后先查询权威结果，不把底层可能仍在运行的动作盲目重放；参数改变不能共用原幂等键或审批。

## 实际关系与兼容说明

- Diagnosis可共选报警、多指标、趋势、安全等技能；通用注册器和Diagnosis专用选择器不同，正文分别说明，不能用触发文字扩权。
- Knowledge为有预算的确定性检索图，支持空查询修正和多来源计划；不是一个由LLM无限选择工具的循环。允许的工具与本次已执行工具分开。
- Maintenance整理维修计划、备件和草案；WorkOrder负责工单执行动作。维修方案不自动等于已派工，也不取代审批与人员可用性判断。
- Quality普通生产检测、CAD参数比较和模拟产出比较分域；模拟A2A完成不等于检测pass或正式放行。
- CAD图纸查找、FreeCAD建模和虚拟生产按实际分支拆开；建模专业协议完整保留，原BuildCAD兼容实现不当作当前FreeCAD激活路径。
- Memory的空工具权限不取消内部存储写入；去重、提取、检索的事实源和失败边界分别说明。
- Report Graph构建和持久化结构化报告；PDF接口是独立路径，generate_report_file在白名单中不表示常规Graph已执行导出。
- Router仅路由，不借文档执行业务工具。所有别名均解析到原定义，不增加工具权限。

## 公共事实来源

- [技能注册及加载](L:/industry_agent/services/agent-service/app/skills/registry.py)
- [工具定义、参数模型与Guard](L:/industry_agent/services/agent-service/app/tools/registry.py)
- [只读清单核对](L:/industry_agent/scripts/audit_skills.py)
- [兼容快照](L:/industry_agent/services/agent-service/tests/fixtures/skill-runtime-contracts.json)
- [回归测试](L:/industry_agent/services/agent-service/tests/test_skill_standardization.py)
- [整改与验证报告](L:/industry_agent/docs/skills-standardization-report.md)

