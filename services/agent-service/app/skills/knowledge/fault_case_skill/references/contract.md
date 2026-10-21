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
  "query": "D-01 历史故障案例",
  "device_id": "D-01",
  "required_sources": [
    "case"
  ],
  "max_steps": 3
}
```

### 处理与依据

假设没有匹配案例：返回空证据，不能为了成功改写历史记录。

### 示例输出

```json
{
  "query": "D-01 历史故障案例",
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
