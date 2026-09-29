---
name: trend_diagnosis_skill
version: 1.0
goal: 诊断重复出现或持续发展的趋势性异常。
trigger: trend_or_repeated_abnormality
steps:
  - query_history
  - summarize_trend
  - infer_candidates
  - collect_evidence
tools:
  - get_device_history
  - get_device_logs
  - search_knowledge
---

# 趋势异常诊断

## 目标

诊断重复出现或持续发展的趋势性异常。

## 触发条件

`trend_or_repeated_abnormality`

## 执行步骤

1. `query_history`
2. `summarize_trend`
3. `infer_candidates`
4. `collect_evidence`

## 可调用工具

- `get_device_history`
- `get_device_logs`
- `search_knowledge`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

