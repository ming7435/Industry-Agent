---
name: experience_extraction
description: 当需要从已关闭且具可信维修验收的工单沉淀经验时使用。
aliases: [memory_write]
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
tools: []
output: MemoryResult
---

# 已验收维修经验学习

运行标识：`experience_extraction`；所属 Agent：`memory`；兼容别名：`memory_write`。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

从已关闭且可信维修验收通过的工单中提取、验证并保存经验。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

action=learn结构化优先；memory_write为同一技能兼容别名，与always的memory_dedup组合。请求文字出现学习但action=search不会激活写入。

不适用：未关闭、无实际反馈或只有产品quality通过不能学习；顶层repair_verification不能替代工单里的验收。

## 输入与前置条件（Inputs）

MemoryQuery：task_id/trace_id、action（search/recent/learn/summarize/sync）、device_id/device_model/alarm_code/fault_type/component/part_no/query、limit（默认20，1–100），diagnosis/maintenance_plan/workorder/repair_feedback/repair_verification/quality/report/context/experience。repair_feedback可对象或字符串，其余记录用对象。参数形状合法不代表满足学习准入。

## 执行流程（Workflow）

### 公共编排

prepare组合初始化/选择/准入；检索走retrieve_memory → rank_results（dedup/rerank/validate）→ finish；学习走extract（extract_experience/dedup_experience）→ validate_experience → persist → finish。validate_closed/select_skills/score_experience/build_result等是业务或追踪标签；summarize/sync走专属保存路径，不是learn的免验收替代。

保留的步骤标识：`validate_closed`、`select_skills`、`validate_admission`、`extract_experience`、`dedup_experience`、`validate_experience`、`persist`、`build_result`、`fallback`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

核对closed、真实反馈与工单/反馈内可信恢复验收；提取当前故障、处理和来源；按旧键查重后质量评分；接纳后长期保存及RAG同步分开记回执，部分失败用稳定ID恢复。

## 业务判断规则（Reasoning Rules）

- 准入需passed严格True、source=device_recovery、device_recovery/checks对象，device_identity/operational/alarms_clear/metrics_available均True，状态未失败。
- 质量评分≥0.8且无阻断项才接纳：closed+feedback 0.45，content 0.15，未失败维修0.20，可信确认0.20；递归synthetic/degraded阻断。
- learning_idempotency_key产生稳定EXP-ID；memory_saved与rag_saved各自有实际回执，RAG的pipeline_ready=False不能被success=True覆盖。

原有约束继续适用：不授予 `get_workorder` 或工单/控制工具权限。现有经验模块完成去重、验证和保存；tools 为空不表示该路径没有持久化副作用。

## 工具使用规范（Tools）

按YAML白名单。Memory Graph主要通过experience_module/long_memory/store读写，不是每次执行注册MCP工具。tools=[]的学习仍有内部存储副作用，不能理解为只读。模型不能自行增加ingest/delete等工具。

YAML tools=[]，不授权注册工具调用。内部路由/记忆存储操作由代码执行；空工具表不代表该 Agent 绝对无副作用，按下面业务边界判断。

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。

## 证据与数据真实性（Evidence Rules）

当前工单、反馈、维修验收与产品质检分别保留来源。learn准入取workorder.repair_verification或反馈verification，顶层repair_verification/quality不能替换。历史关闭记录不重新要求当前时间新鲜，但不允许伪造当时验收。相同来源重复不升级可信度，存储与RAG回执分别记录。

## 输出规范（Output Format）

使用 MemoryResult：action/success/items/experience/count/backend/validation_findings/stop_reason/error。经验里保留experience_id/device_id/fault/content/source_workorder/source_report、learning_idempotency_key、validation_status/experience_quality_score、memory_saved/rag_saved/duplicate等实际字段。success不代表两阶段均成功；必须分别核对memory_saved与rag_saved。

## 异常处理（Error Handling）

准入或质量不满足进入validation_failed回退；空检索保留空items及实际finding。存储异常可能抛出，不保证任何异常都包装Result。长期保存成功但RAG同步失败保留部分完成状态，不能声称全链路完成，也不创建替代经验。

## 停止条件（Stop Conditions）

读流程按已取结果去重、排序及limit结束，无模型推理循环。学习须达到已有准入和质量门槛，重复已完成可结束，不同部分保存走稳定ID恢复。普通final的stop_reason=completed可能仍success=False，不把它等同新增保存成功。

## 安全与权限边界（Safety & Constraints）

search/recent不学习、不删除；learn写入需关闭且可信维修验收，生产质检不能替代它。summarize使用已保存人工确认与匹配复机事实，sync只取后端已有被接纳记录，不接受请求伪造正文。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "action": "learn",
  "workorder": {
    "workorder_id": "WO-EXAMPLE",
    "status": "closed",
    "device_id": "CNC-01"
  },
  "repair_feedback": {
    "feedback": "已更换轴承"
  }
}
```

### 处理与依据

只有关闭字样和反馈、无可信验收：请求模型合法但禁止写入经验。

### 示例输出

```json
{
  "action": "learn",
  "success": false,
  "validation_findings": [
    "缺少可信维修验收"
  ],
  "stop_reason": "validation_failed"
}
```

## 参考实现（References）

- [app/agents/memory/agent.py](L:/industry_agent/services/agent-service/app/agents/memory/agent.py)
- [app/agents/memory/graph.py](L:/industry_agent/services/agent-service/app/agents/memory/graph.py)
- [app/agents/memory/schemas.py](L:/industry_agent/services/agent-service/app/agents/memory/schemas.py)
- [app/agents/memory/validator.py](L:/industry_agent/services/agent-service/app/agents/memory/validator.py)
- [app/skills/registry.py](L:/industry_agent/services/agent-service/app/skills/registry.py)
- [app/tools/registry.py](L:/industry_agent/services/agent-service/app/tools/registry.py)
