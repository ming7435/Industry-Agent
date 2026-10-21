---
name: drawing_lookup_skill
description: 当需按设备、部件或零件编号查询工程图、BOM、位置及装配关系时使用。
aliases:
- part_search_skill
- bom_analysis_skill
version: 1.2
goal: 定位设备零部件、安装位置及工程图纸，验证它们的设备归属。
trigger: part_or_component
triggers:
- part_or_component
- bom
steps:
- normalize_query
- classify_engineering_request
- resolve_part
- plan_engineering_query
- resolve_bom
- merge_engineering_context
- validate_engineering_context
- build_result
tools:
- query_part
- query_drawing
- query_bom
- query_relation
- fetch_engineering_record
- read_skill_reference
---

# 设备工程图纸与部件定位

运行标识：`drawing_lookup_skill`；所属 Agent：`cad`；兼容别名：`part_search_skill`、`bom_analysis_skill`。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

定位设备零部件、安装位置及工程图纸，验证它们的设备归属。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

part_or_component、bom两触发取或；part_search_skill/bom_analysis_skill是同一技能兼容别名。文本“零件/part/BOM”可选中，但工程query_type由Graph再次分类。

不适用：工程查询不生成3D实体，不用其它设备图纸填无结果查询。

## 执行流程（Workflow）

### 公共编排

工程公共节点 prepare → plan_engineering_query ↔ query → validate_relation → finish；prepare合并初始化、加载、目标识别，query合并工具查询与观察。normalize_query/classify_engineering_request/resolve_part/resolve_bom/merge_engineering_context/validate_engineering_context/build_result是兼容追踪标签。model_3d和virtual_production是另两条受控分支。

保留的步骤标识：`normalize_query`、`classify_engineering_request`、`resolve_part`、`plan_engineering_query`、`resolve_bom`、`merge_engineering_context`、`validate_engineering_context`、`build_result`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

按query优先BOM（bom/物料/零件/part）、位置、装配关系，最后普通部件。BOM计划part→bom→relation→drawing；位置part→drawing→relation；装配part→relation→drawing→bom。合并后核对本次类型必需资料及设备归属。

## 输出规范（Output Format）

工程查询返回 CADResult：request_id/device_id/device_model/query/status/query_type/component/part_no，components/parts/drawings/bom_items/assembly_relations/locations、drawing_refs/drawing_ref_details/viewer_context/location、evidence/sources/confidence/total、validation_findings/steps/stop_reason/backend_status/degraded/warning。synthetic不是该Result声明字段，不能承诺一定从该对象暴露。

## 停止条件（Stop Conditions）

预算max_steps默认5、1–6；队列耗尽或达到预算进入关系校验。结果stop_reason沿用max_steps/validator_pass/cad_service_no_data/validation_failed；completed仅表示当前工程查询验证通过，不是模型已生产或维修已完成。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `drawing_lookup_skill`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |
