---
name: repair_plan_skill
description: 当已有诊断需形成受证据和安全约束的维修方案时使用。
version: 1.0
goal: 依据诊断结论和证据生成可执行的维修方案。
trigger: repair_plan
steps:
- assess_diagnosis
- request_knowledge
- request_cad
- plan_repair
- validate_plan
- validate_diagnosis
- determine_required_parts
- build_safety_steps
- build_result
tools:
- generate_repair_plan
- query_inventory
- query_part_availability
- get_workorder_template
- submit_workorder_draft
- read_skill_reference
---

# 维修方案制定

运行标识：`repair_plan_skill`；所属 Agent：`maintenance`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

依据诊断结论和证据生成可执行的维修方案。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

repair_plan 匹配维修/修复/repair/故障相关上下文；具体可执行性由诊断评估与方案Validator决定，不由触发词决定。

不适用：不因用户写“维修”就认定必须换件或已具派工依据。

## 执行流程（Workflow）

### 公共编排

真实节点 prepare → collect_context → build_plan → safety_validate → validate → finish。prepare 包括初始化/技能选择/诊断评估；collect_context 包含知识及CAD收集；build_plan 包含草案及备件核查；finish 包含草稿准备与结果构建。validate_diagnosis/determine_required_parts/build_safety_steps/build_result等是追踪标签，不是独立节点。已有知识/CAD可复用；runtime_managed=True交外层Runtime检索，不再自行远程补查。

保留的步骤标识：`assess_diagnosis`、`request_knowledge`、`request_cad`、`plan_repair`、`validate_plan`、`validate_diagnosis`、`determine_required_parts`、`build_safety_steps`、`build_result`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

先保留主报警及诊断证据，确定是观察、固定检查还是维修；复用/补查匹配知识与工程资料，再生成步骤，按故障profile筛选工具与备件；安全和就绪校验后输出完整或未就绪计划。

## 输出规范（Output Format）

使用 MaintenancePlan，必需 plan_id/diagnosis；保留 plan_kind/inspection_required、repair_target/target_part/engineering_context、repair_steps/required_tools/required_parts/safety_requirements、pre_checks/post_checks、inventory_status/part_availability、evidence/memory_evidence/source_documents、validation_findings、maintenance_required/cad_required/workorder_ready/workorder_draft 等真实字段。没有公开 stop_reason，终止原因在 Graph 状态，计划通过 findings 与 workorder_ready 表达不足。

## 停止条件（Stop Conditions）

完成条件是方案结构、安全和适用工程/知识依据均校验通过；只有维修必要性和相关门禁满足才 workorder_ready=True。普通提示可观察，可靠预警可进入固定只读检查；资料不足、范围错配、安全校验失败保持False。既有一次方案流程不因正文增加独立循环预算。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `repair_plan_skill`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |

## 独立运行

复制本目录后，可运行 `python scripts/run.py --check`，或使用 `python scripts/run.py --input task.json --model-url http://127.0.0.1:8040 --tool-script scripts/mcp_adapter.py` 执行业务任务。输入字段见 `references/contract.md`；真实工具连接与限制见 `references/standalone.md`。
