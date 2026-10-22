---
name: report_generation_skill
description: 当需要依据真实事件资料生成正文报告，或为已保存报告导出文件时使用。
version: 1.0
goal: 生成完整、可追溯的工业事件或维修报告。
trigger: default
steps:
- collect_sources
- check_completeness
- compose_report
- validate_report
- persist_report
- generate_report_file
- collect_event
- validate_completeness
- validate_result
- build_result
tools:
- get_diagnosis_record
- get_maintenance_record
- get_workorder
- get_quality_record
- get_trace_summary
- persist_report
- generate_report_file
- read_skill_reference
---

# 结构化报告与受控文件导出

运行标识：`report_generation_skill`；所属 Agent：`report`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

生成完整、可追溯的工业事件或维修报告。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

default作为普通报告默认技能；指定闭环/链路时可选择专用技能，不因默认文件权限就自动渲染PDF。

不适用：生成正文、持久化、PDF产物三件事分开，不把file_path默认空值替换成下载链接。

## 执行流程（Workflow）

### 公共编排

真实节点prepare → collect_context → compose → persist → finish。prepare初始化/加载；collect_context读取与完整性检查；compose组合正文和结果校验；persist按请求保存；finish成功或fallback。collect_event/select_skills/validate_completeness/compose_report/validate_result/persist_report/build_result是追踪映射，YAML的文件步骤不是普通Graph节点。

保留的步骤标识：`collect_sources`、`check_completeness`、`compose_report`、`validate_report`、`persist_report`、`generate_report_file`、`collect_event`、`validate_completeness`、`validate_result`、`build_result`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

按ReportQuery收集、检查、组成结构化报告，persist按请求执行。真实PDF另由POST /api/reports/{report_id}/pdf读取已持久报告及服务端路径，私有REPORT_FILE_AUTHORITY允许文件工具；GET仅打开已有文件，未生成为404。

## 输出规范（Output Format）

使用 ReportResult：report_id/report_type/title/summary/status、sections/source_refs/validation_findings、persisted/file_path/stop_reason/created_at。正文类型由已有规则认定diagnosis_report/maintenance_report/quality_report/incident_report/full_case_report，或既有别名；closure/trace触发选择不新建结果类型。status=completed表示报告资料校验完成，不证明设备验收或PDF已生成。

## 停止条件（Stop Conditions）

diagnosis报告要诊断；maintenance要诊断/方案/工单；quality要质检；incident要事件；full_case还要反馈或维修验收。各事实还需对应标识/正文和source_refs。满足本次报告校验后结束，无新增循环；PDF渲染成败独立报告。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `report_generation_skill`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |

## 独立运行

复制本目录后，可运行 `python scripts/run.py --check`，或使用 `python scripts/run.py --input task.json --model-url http://127.0.0.1:8040 --tool-script scripts/mcp_adapter.py` 执行业务任务。输入字段见 `references/contract.md`；真实工具连接与限制见 `references/standalone.md`。
