---
name: report_generation_skill
version: 1.0
goal: 生成完整、可追溯的工业事件或维修报告。
trigger: default
steps:
  - collect_sources
  - check_completeness
  - compose_report
  - validate_report
  - persist_report
  - collect_event
  - validate_completeness
  - validate_result
  - build_result
tools:
  - get_diagnosis_record
  - get_maintenance_record
  - get_workorder
  - get_quality_record
  - get_trace_summary
  - persist_report
  - generate_report_file
---

# 工业事件报告生成

## 目标

生成完整、可追溯的工业事件或维修报告。

## 触发条件

`default`

## 执行步骤

1. `collect_sources`
2. `check_completeness`
3. `compose_report`
4. `validate_report`
5. `persist_report`
6. `collect_event`
7. `validate_completeness`
8. `validate_result`
9. `build_result`

## 可调用工具

- `get_diagnosis_record`
- `get_maintenance_record`
- `get_workorder`
- `get_quality_record`
- `get_trace_summary`
- `persist_report`
- `generate_report_file`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

