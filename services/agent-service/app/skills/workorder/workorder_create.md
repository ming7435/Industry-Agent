---
name: workorder_create
version: 1.0
goal: 根据已验证的维修方案创建并派发维修工单。
trigger: repair_plan
steps:
  - initialize
  - load_skill
  - validate_plan
  - create_order
  - collect_dispatch_context
  - select_assignee
  - assign_order
  - validate
  - final
tools:
  - create_workorder
  - get_workorder_template
  - query_technicians
  - query_technician_skills
  - query_technician_workload
  - query_shift
  - query_team_availability
  - assign_workorder
output: WorkOrderResult
---

# 维修工单创建

## 目标

根据已验证的维修方案创建并派发维修工单。

## 触发条件

`repair_plan`

## 执行步骤

1. `initialize`
2. `load_skill`
3. `validate_plan`
4. `create_order`
5. `collect_dispatch_context`
6. `select_assignee`
7. `assign_order`
8. `validate`
9. `final`

## 可调用工具

- `create_workorder`
- `get_workorder_template`
- `query_technicians`
- `query_technician_skills`
- `query_technician_workload`
- `query_shift`
- `query_team_availability`
- `assign_workorder`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

