---
name: contract
title: 输入契约与真实示例
when: 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。
order: 3
---

## 输入与前置条件（Inputs）

KnowledgeQuery 输入：request_id/task_id/trace_id、device_id、query/query_type/purpose、alarm_code/component、document_id/chunk_id、required_sources、filters、limit、max_steps。limit 默认8，1–50；max_steps默认4，1–8。from_payload 兼容 user_text/fault/summary，并将已有设备/报警身份补入 filters。Graph 会重新分类，query_type 不是直接选择工具的授权。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "query": "700223 维修依据",
  "device_id": "D-01",
  "alarm_code": "700223",
  "purpose": "maintenance",
  "required_sources": [
    "alarm",
    "sop"
  ],
  "max_steps": 4
}
```

### 处理与依据

隔离检索仅返回有出处的报警目录，没有必需的SOP：保留报警证据与缺口，返回insufficient_evidence。answer中的兼容总结不等于完整维修依据，判断以status和validation_findings为准。

### 示例输出

```json
{
  "query": "700223 维修依据",
  "status": "insufficient_evidence",
  "query_type": "alarm",
  "summary": "未检索到与“700223 维修依据”直接相关的可追踪知识证据。 当前结果不满足所需证据覆盖条件。",
  "answer": "针对“700223 维修依据”，已整理出以下可执行知识：\n\n**示例报警目录：** 仅说明报警含义，不包含SOP\n\n**最后总结：** 本次按全库优先级检索，已返回 1 条可追踪证据；优先执行回答中的第一项检查，发现异常时停止相关动作并补充现场数据。",
  "evidence": [
    {
      "document_id": "ALARM-EXAMPLE",
      "title": "示例报警目录",
      "source": "isolated-example",
      "score": 0.8,
      "collection": "",
      "knowledge_type": "alarm",
      "component": "",
      "content": "仅说明报警含义，不包含SOP。"
    }
  ],
  "possible_causes": [],
  "recommended_checks": [],
  "confidence": 0.4533,
  "confidence_details": {
    "overall": 0.4533,
    "relevance": 0.8,
    "query_coverage": 0,
    "source_coverage": 0.5,
    "evidence_breadth": 0.3333,
    "agreement": 0,
    "degraded_penalty": 0
  },
  "documents": [
    {
      "document_id": "ALARM-EXAMPLE",
      "title": "示例报警目录",
      "content": "仅说明报警含义，不包含SOP。",
      "source": "isolated-example",
      "score": 0.8,
      "metadata": {
        "knowledge_type": "alarm"
      }
    }
  ],
  "sources": [
    "isolated-example"
  ],
  "filters": {},
  "total": 1,
  "backend_status": "unknown",
  "degraded": false,
  "synthetic": false,
  "warning": "",
  "source": "rag-service-compatible",
  "validation_findings": [
    "缺少必需知识来源：sop",
    "知识库检索未获得足够证据"
  ],
  "stop_reason": "insufficient_evidence",
  "retrieval_trace": [],
  "retrieval_scope": "all",
  "retrieval_fallback": false,
  "retrieval_fallback_reason": "",
  "model_metadata": {}
}
```
