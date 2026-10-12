---
name: memory_dedup
description: 当Memory流程读取或学习经验，需要抑制同源重复并核对部分保存时使用。
version: 1.0
goal: 避免同一工单的维修经验重复写入。
trigger: always
steps:
  - dedup
  - dedup_experience
tools: []
output: MemoryResult
---

# 维修经验去重与部分保存恢复

运行标识：`memory_dedup`；所属 Agent：`memory`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

避免同一工单的维修经验重复写入。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

always只在Memory技能范围内附加，不是所有Agent全局触发；不单独提供新的去重API。

不适用：不删除历史或做语义合并，不以重复标志遮盖RAG未同步事实。

## 输入与前置条件（Inputs）

MemoryQuery：task_id/trace_id、action（search/recent/learn/summarize/sync）、device_id/device_model/alarm_code/fault_type/component/part_no/query、limit（默认20，1–100），diagnosis/maintenance_plan/workorder/repair_feedback/repair_verification/quality/report/context/experience。repair_feedback可对象或字符串，其余记录用对象。参数形状合法不代表满足学习准入。

## 执行流程（Workflow）

### 公共编排

prepare组合初始化/选择/准入；检索走retrieve_memory → rank_results（dedup/rerank/validate）→ finish；学习走extract（extract_experience/dedup_experience）→ validate_experience → persist → finish。validate_closed/select_skills/score_experience/build_result等是业务或追踪标签；summarize/sync走专属保存路径，不是learn的免验收替代。

保留的步骤标识：`dedup`、`dedup_experience`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

读结果在rank_results用四元组去重；学习在extract用device_id/fault/source_workorder查重。匹配experience_id且rag_saved=False时保持原ID继续validate/persist恢复同步，其它重复按原分支结束。

## 业务判断规则（Reasoning Rules）

- 读键为experience_id/source_workorder/device_id/content，写键为device_id/fault/source_workorder；不能统一成只看工单号。
- 缺learning_idempotency_key可能产生随机ID，不保证命中原记录的部分保存恢复。
- duplicate不等于新增保存；writer可memory_saved=False而rag_saved按实情，分别返回。

原有约束继续适用：不直接调用注册工具，也不单独执行新增、删除工单或设备控制；去重不能隐藏部分保存失败。

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
  "action": "recent",
  "limit": 5
}
```

### 处理与依据

假设近期经验为空：只读返回空列表，不创建或删除任何经验。

### 示例输出

```json
{
  "action": "recent",
  "success": false,
  "items": [],
  "count": 0,
  "stop_reason": "completed"
}
```

## 参考实现（References）

- [app/agents/memory/agent.py](L:/industry_agent/services/agent-service/app/agents/memory/agent.py)
- [app/agents/memory/graph.py](L:/industry_agent/services/agent-service/app/agents/memory/graph.py)
- [app/agents/memory/schemas.py](L:/industry_agent/services/agent-service/app/agents/memory/schemas.py)
- [app/agents/memory/validator.py](L:/industry_agent/services/agent-service/app/agents/memory/validator.py)
- [app/skills/registry.py](L:/industry_agent/services/agent-service/app/skills/registry.py)
- [app/tools/registry.py](L:/industry_agent/services/agent-service/app/tools/registry.py)
