---
name: workorder_tracking
version: 1.0
goal: 查询和更新工单生命周期状态。
trigger: query
steps:
  - initialize
  - load_skill
  - validate_plan
  - execute_action
  - validate
  - final
tools:
  - get_workorder
  - query_workorder
  - update_workorder
  - list_workorders
output: WorkOrderResult
---

# 工单状态跟踪

## 目标

查询和更新工单生命周期状态。

## 触发条件

`query`

## 执行步骤

1. `initialize`
2. `load_skill`
3. `validate_plan`
4. `execute_action`
5. `validate`
6. `final`

## 可调用工具

- `get_workorder`
- `query_workorder`
- `update_workorder`
- `list_workorders`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

