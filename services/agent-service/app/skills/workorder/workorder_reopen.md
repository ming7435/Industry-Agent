---
name: workorder_reopen
version: 1.0
goal: 质检不通过时重新打开工单并返回返工入口。
trigger: reopen
steps:
  - initialize
  - load_skill
  - validate_plan
  - execute_action
  - validate
  - final
tools:
  - reopen_workorder
  - get_workorder
output: WorkOrderResult
---

# 返工工单重开

## 目标

质检不通过时重新打开工单并返回返工入口。

## 触发条件

`reopen`

## 执行步骤

1. `initialize`
2. `load_skill`
3. `validate_plan`
4. `execute_action`
5. `validate`
6. `final`

## 可调用工具

- `reopen_workorder`
- `get_workorder`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

