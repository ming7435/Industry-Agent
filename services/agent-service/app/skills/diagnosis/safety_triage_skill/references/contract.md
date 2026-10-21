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
    "event_id": "EV-EXAMPLE-S",
    "device_id": "D-01",
    "severity": "critical",
    "alarm_code": "700020",
    "realtime_snapshot": {
      "cycle_state": "emergency_stop"
    }
  }
}
```

### 处理与依据

输入快照包含emergency_stop，但隔离报警目录没有定义，未取得可核实SOP；真实fallback保留输入状态。ready只表示有事件证据，不证明工具执行了停机，也不允许复机；保留fallback和人工复核。

### 示例输出

```json
{
  "event_id": "EV-EXAMPLE-S",
  "device_id": "D-01",
  "status": "fallback",
  "summary": "设备 D-01 检测到设备异常，异常指标：cycle_state=emergency_stop，当前等级：严重故障。",
  "diagnosis": "当前已确认设备存在异常，但现有证据不足以确定具体根因，需要进一步查询历史趋势、设备日志或维修知识。",
  "confidence": 0.255,
  "evidence": [
    "异常事件指标：cycle_state=emergency_stop",
    "Monitor 已提供实时快照"
  ],
  "evidence_records": [],
  "recommendation": "补充历史趋势、设备日志和维修手册证据后，由维修人员现场确认。",
  "alarm_definition": {},
  "tool_calls": [],
  "model": "isolated-doc-example",
  "source": "local_fallback",
  "created_at": "2026-10-12T02:58:40.579285+00:00",
  "task_id": null,
  "triggered_at": null,
  "error": "隔离示例：未取得完整资料",
  "event_revision": 1,
  "trigger_cause": "",
  "diagnosis_run_id": "DIAG-EXAMPLE",
  "trace_id": "",
  "active_skill": "safety_triage_skill",
  "active_skills": [
    "safety_triage_skill"
  ],
  "validation_errors": [],
  "stop_reason": "",
  "cached": false,
  "alarm_code": "700020",
  "cycle_state": "emergency_stop",
  "cycle_state_label": "",
  "confidence_details": {
    "overall": 0.255,
    "retrieval_match": 0,
    "llm_probability": 0.35,
    "historical_resolution": 0.5,
    "weights": {
      "retrieval_match": 0.4,
      "llm_probability": 0.3,
      "historical_resolution": 0.3
    },
    "knowledge_degraded": false,
    "warning": ""
  },
  "knowledge_warning": "",
  "maintenance_required": true,
  "maintenance_reason": "异常等级达到维修门槛",
  "disposition": "emergency_stop",
  "evidence_status": "ready",
  "requires_human_review": true,
  "model_metadata": {}
}
```
