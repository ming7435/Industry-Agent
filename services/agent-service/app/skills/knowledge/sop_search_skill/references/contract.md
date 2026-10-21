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
  "query": "液压系统 SOP 维修步骤",
  "device_id": "D-01",
  "component": "液压系统",
  "required_sources": [
    "sop"
  ],
  "max_steps": 2
}
```

### 处理与依据

隔离检索返回一份有来源的手册，但不是必需的SOP：真实Graph保留该文档、证据与来源，并返回insufficient_evidence。当前answer兼容文案可能含“可执行知识”，不能覆盖status/validation_findings的不足判定，也不能据此执行维修。

### 示例输出

```json
{
  "query": "液压系统 SOP 维修步骤",
  "status": "insufficient_evidence",
  "query_type": "sop",
  "summary": "未检索到与“液压系统 SOP 维修步骤”直接相关的可追踪知识证据。 当前结果不满足所需证据覆盖条件。",
  "answer": "针对“液压系统 SOP 维修步骤”，已整理出以下可执行知识：\n\n**示例设备手册：** 示例手册资料，不是SOP\n\n**最后总结：** 本次按全库优先级检索，已返回 1 条可追踪证据；优先执行回答中的第一项检查，发现异常时停止相关动作并补充现场数据。",
  "evidence": [
    {
      "document_id": "MAN-001",
      "title": "示例设备手册",
      "source": "isolated-example",
      "score": 0.8,
      "collection": "",
      "knowledge_type": "manual",
      "component": "",
      "content": "示例手册资料，不是SOP。"
    }
  ],
  "possible_causes": [],
  "recommended_checks": [],
  "confidence": 0.4033,
  "confidence_details": {
    "overall": 0.4033,
    "relevance": 0.8,
    "query_coverage": 0.2,
    "source_coverage": 0,
    "evidence_breadth": 0.3333,
    "agreement": 0,
    "degraded_penalty": 0
  },
  "documents": [
    {
      "document_id": "MAN-001",
      "title": "示例设备手册",
      "content": "示例手册资料，不是SOP。",
      "source": "isolated-example",
      "score": 0.8,
      "metadata": {
        "knowledge_type": "manual"
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
