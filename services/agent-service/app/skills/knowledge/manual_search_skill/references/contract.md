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
  "query": "D-01 设备手册",
  "device_id": "D-01",
  "document_id": "MAN-001",
  "required_sources": [
    "manual"
  ],
  "max_steps": 2
}
```

### 处理与依据

隔离检索已找到MAN-001，文档身份、来源与manual元数据齐全，但content为空。当前Validator只检查结构、来源覆盖和置信度，仍返回completed/evidence_ready；下面保留实际空正文，不声称已提供手册步骤。completed不是正文完整性的保证，模型不得依据空正文编造操作。

### 示例输出

```json
{
  "query": "D-01 设备手册",
  "status": "completed",
  "query_type": "manual",
  "summary": "检索到 1 条相关知识证据：示例设备手册。",
  "answer": "暂未检索到直接相关知识。请补充设备编号、报警码或故障现象后重试。",
  "evidence": [
    {
      "document_id": "MAN-001",
      "title": "示例设备手册",
      "source": "isolated-example",
      "score": 0.8,
      "collection": "",
      "knowledge_type": "manual",
      "component": "",
      "content": ""
    }
  ],
  "possible_causes": [],
  "recommended_checks": [],
  "confidence": 0.7033,
  "confidence_details": {
    "overall": 0.7033,
    "relevance": 0.8,
    "query_coverage": 0.6,
    "source_coverage": 1,
    "evidence_breadth": 0.3333,
    "agreement": 0,
    "degraded_penalty": 0
  },
  "documents": [
    {
      "document_id": "MAN-001",
      "title": "示例设备手册",
      "content": "",
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
  "validation_findings": [],
  "stop_reason": "evidence_ready",
  "retrieval_trace": [],
  "retrieval_scope": "all",
  "retrieval_fallback": false,
  "retrieval_fallback_reason": "",
  "model_metadata": {}
}
```
