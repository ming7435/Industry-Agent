---
name: alarm_search_skill
description: 当问题提供报警编号或明确询问报警含义及关联资料时使用。
version: 1.0
goal: 检索报警定义以及与报警相关的技术知识。
trigger: exists(alarm_code)
steps:
  - normalize_alarm_code
  - search_alarm_knowledge
  - fetch_document_or_chunk
  - validate_evidence
tools:
  - search_alarm_knowledge
  - search_knowledge
  - fetch_document
  - fetch_chunk
---

# 报警知识检索

运行标识：`alarm_search_skill`；所属 Agent：`knowledge`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

检索报警定义以及与报警相关的技术知识。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

exists(alarm_code) 或上下文含报警/alarm/故障码；purpose=maintenance 可另选 hybrid_search 技能，不单靠报警技能扩大到SOP工具。

不适用：仅相似编号命中不等于同一设备报警；没有实际定义时不自行补表。

## 输入与前置条件（Inputs）

KnowledgeQuery 输入：request_id/task_id/trace_id、device_id、query/query_type/purpose、alarm_code/component、document_id/chunk_id、required_sources、filters、limit、max_steps。limit 默认8，1–50；max_steps默认4，1–8。from_payload 兼容 user_text/fault/summary，并将已有设备/报警身份补入 filters。Graph 会重新分类，query_type 不是直接选择工具的授权。

## 执行流程（Workflow）

### 公共编排

真实公共节点：prepare → retrieve（可重复）→ refine_query（最多一次空结果细化）→ rerank → validate → finish。prepare 内初始化/加载/分类/计划，retrieve 内执行与观察。normalize_query/select_sources/build_filters/search/build_evidence/rank/validate_sources/build_result 是追踪映射；专业步骤标签不新增节点。明确 document_id/chunk_id 优先获取后进入重排，否则执行互补计划。purpose=maintenance 可并行最多4个检索，仍逐项消耗预算。

保留的步骤标识：`normalize_alarm_code`、`search_alarm_knowledge`、`fetch_document_or_chunk`、`validate_evidence`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

准确传 query、alarm_code及设备过滤；常规计划检索报警与通用知识；明确编号的文档/片段才精确获取；按 required_sources 检查目录覆盖并返回原来源状态。

## 业务判断规则（Reasoning Rules）

- 报警目录给编号含义，不给当前故障确定原因。
- 跨设备降级命中必须明示作用范围，不能替换本设备原始字典。
- 报警知识缺少SOP时只返回解释与不足，下游另检索维修规程。

原有约束继续适用：允许通用 `search_knowledge` 作为既有检索补充；模型不得自行移除设备限制。后端现有明确的空结果回退可能扩大范围，须保留 retrieval_scope、retrieval_fallback 与原因并标为跨设备参考，不能冒充本设备证据；不得写工单或控制设备。

## 工具使用规范（Tools）

仅使用当前合并白名单。计划中的工具未获授权时应保留拒绝结果；不能因 fallback 想查 search_knowledge 而扩大专业技能权限。普通命中不自动 fetch，必须有明确编号。Runtime/Harness 传递执行上下文；直接 run 的状态工具列表不能等同完整授权边界。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `search_alarm_knowledge` | 需要准确报警资料时传 query、alarm_code，可选 limit/filters。 | 设置 alarm 知识类型，核对实际报警与设备来源；未命中不自行发明定义。 |
| `search_knowledge` | 互补检索且权限允许时传非空 query，可选 limit（1–50）、filters。 | 读取 documents/answer 和 backend_status/degraded/retrieval_fallback；相似度不是诊断置信度，失败保留真实状态。 |
| `fetch_document` | 请求明确 document_id 时传 document_id。 | 读取实际文档及来源；搜索命中不会自动触发全文获取，空正文不能补造操作规范。 |
| `fetch_chunk` | 已知 document_id 与 chunk_id 时传两个编号。 | 保留片段归属和来源；缺任一编号拒绝，无法取得片段不伪装全文。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。

## 证据与数据真实性（Evidence Rules）

KnowledgeDocument 的 document_id/title/content/source/score/metadata 保持来源。检索分数只是排序分数，不是当前故障概率。区分文档摘录、模型生成回答与已经观察到的设备事实；去重按 document_id 保留较高分。RAG 客户端可能在设备空结果时显式降级全库，必须保留 retrieval_scope/retrieval_fallback/retrieval_fallback_reason，跨设备命中只能作参考，不能声称设备范围未放宽。

## 输出规范（Output Format）

使用 KnowledgeResult：query/status/query_type/summary/answer、documents/evidence/sources/total/filters、possible_causes/recommended_checks、confidence/confidence_details、backend_status/degraded/synthetic/warning、validation_findings/stop_reason、retrieval_trace/retrieval_scope/retrieval_fallback/retrieval_fallback_reason/model_metadata。completed 只表示当前校验通过，不保证语义相关或步骤完整。answer 首选工具已有回答，否则摘录前三文档；Graph 本身不调用生成模型。

## 异常处理（Error Handling）

空结果保留 insufficient_evidence；指定来源不覆盖则记录 validation_findings。工具失败和授权拒绝保留 retrieval_trace，不造文档。远端回答生成失败可保留证据并标记 degraded。当前 Validator 检查身份、来源覆盖与数值，不检查空正文、最低相关度或语义冲突；使用者必须按正文事实进一步核对。

## 停止条件（Stop Conditions）

工具调用预算默认4，max_steps为1–8；无剩余计划或预算用尽后重排与校验。空结果仅在有余预算时一次固定细化。结果 stop_reason 是 evidence_ready 或 insufficient_evidence，不能擅自添加独立预算状态。知识充分也只交给下游判断，不直接维修。

## 安全与权限边界（Safety & Constraints）

只读检索不等于维修操作授权；不能把历史案例当本次已修复，不用文字扩大工具范围，不因来源标题看似相关而输出确定换件/机器启动结论。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "query": "700223 报警含义",
  "device_id": "D-01",
  "alarm_code": "700223",
  "required_sources": [
    "alarm"
  ],
  "max_steps": 3
}
```

### 处理与依据

假设设备报警资料未命中：返回 insufficient_evidence，不编造编号说明。

### 示例输出

```json
{
  "query": "700223 报警含义",
  "status": "insufficient_evidence",
  "confidence": 0,
  "documents": [],
  "evidence": [],
  "sources": [],
  "validation_findings": [
    "缺少当前请求所需来源"
  ],
  "stop_reason": "insufficient_evidence",
  "backend_status": "unknown"
}
```

## 参考实现（References）

- [app/agents/knowledge/agent.py](L:/industry_agent/services/agent-service/app/agents/knowledge/agent.py)
- [app/agents/knowledge/graph.py](L:/industry_agent/services/agent-service/app/agents/knowledge/graph.py)
- [app/agents/knowledge/schemas.py](L:/industry_agent/services/agent-service/app/agents/knowledge/schemas.py)
- [app/agents/knowledge/validator.py](L:/industry_agent/services/agent-service/app/agents/knowledge/validator.py)
- [app/contracts.py](L:/industry_agent/services/agent-service/app/contracts.py)
- [app/tools/query_contracts.py](L:/industry_agent/services/agent-service/app/tools/query_contracts.py)
- [app/rag/client.py](L:/industry_agent/services/agent-service/app/rag/client.py)
- [app/skills/registry.py](L:/industry_agent/services/agent-service/app/skills/registry.py)
- [app/tools/registry.py](L:/industry_agent/services/agent-service/app/tools/registry.py)
