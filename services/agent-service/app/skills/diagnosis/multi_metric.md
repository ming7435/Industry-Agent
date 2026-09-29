---
name: multi_metric_diagnosis_skill
version: 1.0
goal: 关联多个异常指标并推断共同故障原因。
trigger: multiple_abnormal_metrics
steps:
  - correlate_metrics
  - query_history
  - infer_common_causes
  - validate_result
tools:
  - get_device_history
  - get_device_logs
  - search_knowledge
---

# 多指标关联诊断

## 目标

关联多个异常指标并推断共同故障原因。

## 触发条件

`multiple_abnormal_metrics`

## 执行步骤

1. `correlate_metrics`
2. `query_history`
3. `infer_common_causes`
4. `validate_result`

## 可调用工具

- `get_device_history`
- `get_device_logs`
- `search_knowledge`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

