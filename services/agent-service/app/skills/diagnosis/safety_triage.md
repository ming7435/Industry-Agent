---
name: safety_triage_skill
version: 1.0
goal: 对严重事件进行安全分级并识别必须立即执行的安全控制。
trigger: severity == critical
steps:
  - identify_safety_risk
  - retrieve_safety_sop
  - mark_human_or_safety_system_required
tools:
  - get_alarm_definition
  - get_device_logs
  - search_knowledge
---

# 安全风险分级

## 目标

对严重事件进行安全分级并识别必须立即执行的安全控制。

## 触发条件

`severity == critical`

## 执行步骤

1. `identify_safety_risk`
2. `retrieve_safety_sop`
3. `mark_human_or_safety_system_required`

## 可调用工具

- `get_alarm_definition`
- `get_device_logs`
- `search_knowledge`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

