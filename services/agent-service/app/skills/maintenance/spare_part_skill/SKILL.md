---
name: spare_part_skill
description: 当维修目标涉及零部件或零件号，需要核查实际备件需求与可用性时使用。
version: 1.0
goal: 确定维修所需备件，并核对库存和可用性。
trigger: part_or_component
steps:
- resolve_target_part
- query_inventory
- query_part_availability
- validate_parts
tools:
- query_inventory
- query_part_availability
- read_skill_reference
---

# 备件需求与可用性核查

运行标识：`spare_part_skill`；所属 Agent：`maintenance`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

确定维修所需备件，并核对库存和可用性。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

part_or_component 由结构化目标或零件/部件/part/BOM文字触发，与repair_plan可组合；仍执行同一Maintenance Graph。

不适用：没有独立SparePartQuery/Result，不能上传顶层part_no当作已实现字段，也不因库存存在判必须更换。

## 执行流程（Workflow）

### 公共编排

真实节点 prepare → collect_context → build_plan → safety_validate → validate → finish。prepare 包括初始化/技能选择/诊断评估；collect_context 包含知识及CAD收集；build_plan 包含草案及备件核查；finish 包含草稿准备与结果构建。validate_diagnosis/determine_required_parts/build_safety_steps/build_result等是追踪标签，不是独立节点。已有知识/CAD可复用；runtime_managed=True交外层Runtime检索，不再自行远程补查。

保留的步骤标识：`resolve_target_part`、`query_inventory`、`query_part_availability`、`validate_parts`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

从诊断和工程记录定位维修目标，先判断是否需要备件；普通维修在check_parts_tools查询库存与可用性，固定inspection/完整液压核查可跳过；按精确编号匹配需求并把不足反映在计划。

## 输出规范（Output Format）

使用 MaintenancePlan，必需 plan_id/diagnosis；保留 plan_kind/inspection_required、repair_target/target_part/engineering_context、repair_steps/required_tools/required_parts/safety_requirements、pre_checks/post_checks、inventory_status/part_availability、evidence/memory_evidence/source_documents、validation_findings、maintenance_required/cad_required/workorder_ready/workorder_draft 等真实字段。没有公开 stop_reason，终止原因在 Graph 状态，计划通过 findings 与 workorder_ready 表达不足。

## 停止条件（Stop Conditions）

完成条件是方案结构、安全和适用工程/知识依据均校验通过；只有维修必要性和相关门禁满足才 workorder_ready=True。普通提示可观察，可靠预警可进入固定只读检查；资料不足、范围错配、安全校验失败保持False。既有一次方案流程不因正文增加独立循环预算。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `spare_part_skill`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |

## 独立运行

复制本目录后，可运行 `python scripts/run.py --check`，或使用 `python scripts/run.py --input task.json --model-url http://127.0.0.1:8040 --tool-script scripts/mcp_adapter.py` 执行业务任务。输入字段见 `references/contract.md`；真实工具连接与限制见 `references/standalone.md`。
