---
name: alarm_diagnosis_skill
version: 1.0
goal: 结合报警定义与运行证据诊断带报警码的设备事件。
trigger: exists(alarm_code)
steps:
  - query_alarm_definition
  - judge_alarm_evidence
  - enrich_with_history_or_knowledge
  - diagnose
  - validate_result
  - normalize_event
  - select_skills
  - generate_candidates
  - execute_tools
  - collect_evidence
  - build_result
tools:
  - get_alarm_definition
  - get_device_history
  - get_device_logs
  - search_knowledge
---

# 报警诊断

## 目标

结合报警定义与运行证据诊断带报警码的设备事件。

## 触发条件

`exists(alarm_code)`

## 执行步骤

1. `query_alarm_definition`
2. `judge_alarm_evidence`
3. `enrich_with_history_or_knowledge`
4. `diagnose`
5. `validate_result`
6. `normalize_event`
7. `select_skills`
8. `generate_candidates`
9. `execute_tools`
10. `collect_evidence`
11. `build_result`

## 可调用工具

- `get_alarm_definition`
- `get_device_history`
- `get_device_logs`
- `search_knowledge`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

