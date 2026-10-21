---
name: no_alarm_diagnosis_skill
description: 当事件无报警且未命中其它专用诊断技能，需要依据指标与快照判断异常时使用。
version: 1.0
goal: 在没有报警码时依据指标、日志和历史数据诊断异常。
trigger: no_alarm_code
steps:
- inspect_abnormal_metrics
- query_context_if_needed
- output_low_confidence_if_evidence_insufficient
tools:
- get_device_history
- get_device_logs
- search_knowledge
- get_device_status
- read_skill_reference
---

# 无报警异常诊断

运行标识：`no_alarm_diagnosis_skill`；所属 Agent：`diagnosis`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

在没有报警码时依据指标、日志和历史数据诊断异常。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

通用 trigger=no_alarm_code；专用选择器在报警、多指标、趋势均未命中时回退，缺报警本身不保证选择本技能。

不适用：已有报警或满足趋势/多指标时不强制替换其它技能，也不从无报警推断健康。

## 执行流程（Workflow）

### 公共编排

实际公共节点：prepare → reason → tool_guard → execute_observe → loop_guard → reason，模型给结论后 validate → finish，失败分支到 finish。prepare 合并初始化与技能选择；execute_observe 合并工具执行与观察。normalize_event/select_skills/generate_candidates/execute_tools/collect_evidence/validate_result/build_result 是追踪映射，不是新增节点。

保留的步骤标识：`inspect_abnormal_metrics`、`query_context_if_needed`、`output_low_confidence_if_evidence_insufficient`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

先核对设备与已观测的异常，快照为空时可读取当前状态；对指标和历史背景做对照，没有可用事实时明确不足；不为了给根因而查询虚构报警编号。

## 输出规范（Output Format）

使用 DiagnosisResult（dataclass），不另造候选/趋势/安全结果模型。保留 event_id/device_id/status/summary/diagnosis/confidence、evidence/evidence_records、recommendation、alarm_definition/tool_calls/model/source/created_at，以及 validation_errors/stop_reason/evidence_status/requires_human_review/maintenance_required/disposition。模型最终正文应为含 summary/diagnosis/confidence 的 JSON；候选差异写进 diagnosis 与证据，不新增 API 字段。

## 停止条件（Stop Conditions）

默认 max_steps=6，计模型 reasoning 轮数，不是单个工具个数。相同工具参数重复被 Guard 拒绝；已有 max_steps、no_new_observation 与校验回退分支。观察哈希包含步骤，不能承诺完全识别跨轮相同业务证据。缺关键事实不能强行以成功结论结束。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `no_alarm_diagnosis_skill`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |
