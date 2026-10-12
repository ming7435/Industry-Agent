---
name: experience_retrieval
description: 当需要查询匹配维修经验或列出近期记录时使用。
version: 1.1
goal: 检索或列出已验证的历史维修经验。
trigger: search
triggers: [search, recent]
steps:
  - validate_closed
  - select_skills
  - validate_search
  - retrieve_memory
  - dedup
  - score_experience
  - validate
  - build_result
  - fallback
tools:
  - search_semantic_memory
output: MemoryResult
---

# 历史维修经验读取

运行标识：`experience_retrieval`；所属 Agent：`memory`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

检索或列出已验证的历史维修经验。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

action=search或recent；结构化动作优先正文，experience_retrieval与memory_dedup共选。

不适用：不因检索文字含“学习”切换到写入，不宣称检索Graph再次验收了所有旧记录。

## 输入与前置条件（Inputs）

MemoryQuery：task_id/trace_id、action（search/recent/learn/summarize/sync）、device_id/device_model/alarm_code/fault_type/component/part_no/query、limit（默认20，1–100），diagnosis/maintenance_plan/workorder/repair_feedback/repair_verification/quality/report/context/experience。repair_feedback可对象或字符串，其余记录用对象。参数形状合法不代表满足学习准入。

## 执行流程（Workflow）

### 公共编排

prepare组合初始化/选择/准入；检索走retrieve_memory → rank_results（dedup/rerank/validate）→ finish；学习走extract（extract_experience/dedup_experience）→ validate_experience → persist → finish。validate_closed/select_skills/score_experience/build_result等是业务或追踪标签；summarize/sync走专属保存路径，不是learn的免验收替代。

保留的步骤标识：`validate_closed`、`select_skills`、`validate_search`、`retrieve_memory`、`dedup`、`score_experience`、`validate`、`build_result`、`fallback`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

search需至少一种设备/报警/故障/部件/query条件，recent仅limit；通过内部experience_module/long_memory/store读取，按四元组去重，再以query词命中数稳定降序取limit。

## 业务判断规则（Reasoning Rules）

- 当前排序是词包含计数，不是向量重排；元数据允许search_semantic_memory但Graph没有实际调用它。
- 检索结果可信性主要靠保存准入及后端；没有validation_status过滤事实就不补标签。
- 同ID/工单/设备/content全同才读去重，不把不同内容悄悄丢弃。

原有约束继续适用：只允许已有语义查询工具；recent 可由现有记忆模块读最近记录，不补写历史，不因问题出现“学习”而获得写权限。

## 工具使用规范（Tools）

按YAML白名单。Memory Graph主要通过experience_module/long_memory/store读写，不是每次执行注册MCP工具。tools=[]的学习仍有内部存储副作用，不能理解为只读。模型不能自行增加ingest/delete等工具。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `search_semantic_memory` | 需要互补历史知识时传非空 query，可选 limit（1–50）/filters。 | 实现会移除 knowledge_type/alarm_code 过滤，不能声称仅命中已验收经验；当前 Memory Graph 主要使用内部存储检索。 |

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
  "action": "search",
  "device_id": "CNC-01",
  "query": "学习过的冷却泵维修经验",
  "limit": 5
}
```

### 处理与依据

假设检索无匹配：返回空items与实际finding，completed不冒充有经验或已学习。

### 示例输出

```json
{
  "action": "search",
  "success": false,
  "items": [],
  "count": 0,
  "validation_findings": [
    "未检索到匹配的维修经验"
  ],
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
