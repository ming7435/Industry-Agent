---
name: contract
title: 输入契约与真实示例
when: 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。
order: 3
---

## 输入与前置条件（Inputs）

入口为 DiagnosisAgent.run 的事件映射，HTTP 对应 AbnormalEventRequest.event。需保留 event_id/device_id，按已有事实填写 alarm_code、abnormal_metrics、realtime_snapshot、event_type、severity、occurrence_count、duration_seconds、trigger_reason/trigger_cause、trigger_rules、timestamp、event_revision；未取得的数据保持空或未知。模型消息不得把历史摘要冒充本次实时快照。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "event": {
    "event_id": "EV-EXAMPLE-N",
    "device_id": "D-01",
    "alarm_code": null,
    "abnormal_metrics": [],
    "realtime_snapshot": {}
  }
}
```

### 处理与依据

假设所有事实均为空：保留低确定性及所需补充数据，不输出正常验收。

### 示例输出

```json
{
  "event_id": "EV-EXAMPLE-N",
  "device_id": "D-01",
  "status": "fallback",
  "summary": "当前证据不足",
  "diagnosis": "原因待核实，不能确认部件损坏",
  "confidence": 0.2,
  "alarm_definition": {},
  "tool_calls": [],
  "model": "示例标识，实际值由运行时提供",
  "source": "local_fallback",
  "created_at": "2026-10-12T00:00:00+00:00",
  "evidence": [],
  "evidence_records": [],
  "recommendation": "补充本设备当前数据与匹配资料",
  "evidence_status": "insufficient",
  "requires_human_review": true
}
```
