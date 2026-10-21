---
name: experience_extraction
description: 当需要从已关闭且具可信维修验收的工单沉淀经验时使用。
aliases:
- memory_write
version: 1.1
goal: 从已关闭且可信维修验收通过的工单中提取、验证并保存经验。
trigger: learn
steps:
- validate_closed
- select_skills
- validate_admission
- extract_experience
- dedup_experience
- validate_experience
- persist
- build_result
- fallback
tools:
- read_skill_reference
output: MemoryResult
---

# 已验收维修经验学习

运行标识：`experience_extraction`；所属 Agent：`memory`；兼容别名：`memory_write`。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

从已关闭且可信维修验收通过的工单中提取、验证并保存经验。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

action=learn结构化优先；memory_write为同一技能兼容别名，与always的memory_dedup组合。请求文字出现学习但action=search不会激活写入。

不适用：未关闭、无实际反馈或只有产品quality通过不能学习；顶层repair_verification不能替代工单里的验收。

## 执行流程（Workflow）

### 公共编排

prepare组合初始化/选择/准入；检索走retrieve_memory → rank_results（dedup/rerank/validate）→ finish；学习走extract（extract_experience/dedup_experience）→ validate_experience → persist → finish。validate_closed/select_skills/score_experience/build_result等是业务或追踪标签；summarize/sync走专属保存路径，不是learn的免验收替代。

保留的步骤标识：`validate_closed`、`select_skills`、`validate_admission`、`extract_experience`、`dedup_experience`、`validate_experience`、`persist`、`build_result`、`fallback`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

核对closed、真实反馈与工单/反馈内可信恢复验收；提取当前故障、处理和来源；按旧键查重后质量评分；接纳后长期保存及RAG同步分开记回执，部分失败用稳定ID恢复。

## 输出规范（Output Format）

使用 MemoryResult：action/success/items/experience/count/backend/validation_findings/stop_reason/error。经验里保留experience_id/device_id/fault/content/source_workorder/source_report、learning_idempotency_key、validation_status/experience_quality_score、memory_saved/rag_saved/duplicate等实际字段。success不代表两阶段均成功；必须分别核对memory_saved与rag_saved。

## 停止条件（Stop Conditions）

读流程按已取结果去重、排序及limit结束，无模型推理循环。学习须达到已有准入和质量门槛，重复已完成可结束，不同部分保存走稳定ID恢复。普通final的stop_reason=completed可能仍success=False，不把它等同新增保存成功。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `experience_extraction`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |
