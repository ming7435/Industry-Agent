---
name: no_alarm_diagnosis_skill
version: 1.0
goal: 在没有报警码时依据指标、日志和历史数据诊断异常。
trigger: no_alarm_code
steps:
  - inspect_abnormal_metrics
  - query_context_if_needed
  - output_low_confidence_if_evidence_insufficient
tools:
  - get_device_history
  - get_device_logs
  - search_knowledge
  - get_device_status
---

# 无报警码诊断

## 目标

在没有报警码时依据指标、日志和历史数据诊断异常。

## 触发条件

`no_alarm_code`

## 执行步骤

1. `inspect_abnormal_metrics`
2. `query_context_if_needed`
3. `output_low_confidence_if_evidence_insufficient`

## 可调用工具

- `get_device_history`
- `get_device_logs`
- `search_knowledge`
- `get_device_status`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

