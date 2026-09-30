---
name: trace_report_skill
version: 1.0
goal: 在报告中汇总智能体执行链路和工具证据。
trigger: trace
steps:
  - collect_trace
  - summarize_trace
  - attach_source_refs
tools:
  - get_diagnosis_record
  - get_maintenance_record
  - get_workorder
  - get_quality_record
  - get_trace_summary
  - persist_report
---

# 执行链路报告

## 目标

在报告中汇总智能体执行链路和工具证据。

## 触发条件

`trace`

## 执行步骤

1. `collect_trace`
2. `summarize_trace`
3. `attach_source_refs`

## 可调用工具

- `get_diagnosis_record`
- `get_maintenance_record`
- `get_workorder`
- `get_quality_record`
- `get_trace_summary`
- `persist_report`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。
