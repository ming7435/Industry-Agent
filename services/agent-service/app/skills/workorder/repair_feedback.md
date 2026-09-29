---
name: repair_feedback
version: 1.0
goal: 接收现场维修反馈并标记维修执行结果。
trigger: feedback
steps:
  - initialize
  - load_skill
  - validate_plan
  - execute_action
  - validate
  - final
tools:
  - submit_repair_feedback
  - mark_repair_completed
output: WorkOrderResult
---

# 维修执行反馈

## 目标

接收现场维修反馈并标记维修执行结果。

## 触发条件

`feedback`

## 执行步骤

1. `initialize`
2. `load_skill`
3. `validate_plan`
4. `execute_action`
5. `validate`
6. `final`

## 可调用工具

- `submit_repair_feedback`
- `mark_repair_completed`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

