---
name: closure_report_skill
description: 当需要汇总故障闭环或执行链路事实时使用。
aliases:
- trace_report_skill
version: 1.1
goal: 汇总真实业务记录和执行链路，生成闭环或链路报告。
trigger: closure
triggers:
- closure
- trace
steps:
- collect_event
- select_skills
- collect_sources
- validate_completeness
- compose_report
- validate_result
- persist
- persist_report
- build_result
- fallback
tools:
- get_diagnosis_record
- get_maintenance_record
- get_workorder
- get_quality_record
- get_trace_summary
- persist_report
- read_skill_reference
---

# 闭环与执行链路报告

运行标识：`closure_report_skill`；所属 Agent：`report`；兼容别名：`trace_report_skill`。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

汇总真实业务记录和执行链路，生成闭环或链路报告。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

closure匹配closure/closure_report/full_case_report，trace匹配trace/trace_report；trace_report_skill为兼容别名。这是技能选择，最终report_type仍由既有类型及资料推断。

不适用：不能仅因报告名含闭环就宣布工单已经关闭或机器已复机。

## 执行流程（Workflow）

### 公共编排

真实节点prepare → collect_context → compose → persist → finish。prepare初始化/加载；collect_context读取与完整性检查；compose组合正文和结果校验；persist按请求保存；finish成功或fallback。collect_event/select_skills/validate_completeness/compose_report/validate_result/persist_report/build_result是追踪映射，YAML的文件步骤不是普通Graph节点。

保留的步骤标识：`collect_event`、`select_skills`、`collect_sources`、`validate_completeness`、`compose_report`、`validate_result`、`persist`、`persist_report`、`build_result`、`fallback`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

从本事件/工单记录收集诊断、计划、实际反馈与验收及Trace；按类型检查完整性，给每个事实章节附来源；资料不足写incomplete，persist请求保存时核对回执。

## 输出规范（Output Format）

使用 ReportResult：report_id/report_type/title/summary/status、sections/source_refs/validation_findings、persisted/file_path/stop_reason/created_at。正文类型由已有规则认定diagnosis_report/maintenance_report/quality_report/incident_report/full_case_report，或既有别名；closure/trace触发选择不新建结果类型。status=completed表示报告资料校验完成，不证明设备验收或PDF已生成。

## 停止条件（Stop Conditions）

diagnosis报告要诊断；maintenance要诊断/方案/工单；quality要质检；incident要事件；full_case还要反馈或维修验收。各事实还需对应标识/正文和source_refs。满足本次报告校验后结束，无新增循环；PDF渲染成败独立报告。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `closure_report_skill`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |

## 独立运行

复制本目录后，可运行 `python scripts/run.py --check`，或使用 `python scripts/run.py --input task.json --model-url http://127.0.0.1:8040 --tool-script scripts/mcp_adapter.py` 执行业务任务。输入字段见 `references/contract.md`；真实工具连接与限制见 `references/standalone.md`。
