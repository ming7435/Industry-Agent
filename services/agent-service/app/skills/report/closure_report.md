---
name: closure_report_skill
version: 1.0
goal: 结合诊断、工单和质检结果生成维修闭环报告。
trigger: closure
steps:
  - collect_sources
  - validate_closure
  - compose_report
  - persist_report
tools:
  - get_diagnosis_record
  - get_maintenance_record
  - get_workorder
  - get_quality_record
  - get_trace_summary
  - persist_report
---

# 维修闭环报告

## 目标

结合诊断、工单和质检结果生成维修闭环报告。

## 触发条件

`closure`

## 执行步骤

1. `collect_sources`
2. `validate_closure`
3. `compose_report`
4. `persist_report`

## 可调用工具

- `get_diagnosis_record`
- `get_maintenance_record`
- `get_workorder`
- `get_quality_record`
- `get_trace_summary`
- `persist_report`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。
