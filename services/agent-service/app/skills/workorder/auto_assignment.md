---
name: auto_assignment
version: 1.0
goal: 基于技能、班次、区域和负载选择维修人员。
trigger: assign
steps:
  - collect_dispatch_context
  - select_assignee
  - assign_order
tools:
  - query_technicians
  - query_technician_skills
  - query_technician_workload
  - query_shift
  - query_team_availability
  - assign_workorder
output: WorkOrderResult
---

# 工单自动派发

## 目标

基于技能、班次、区域和负载选择维修人员。

## 触发条件

`assign`

## 执行步骤

1. `collect_dispatch_context`
2. `select_assignee`
3. `assign_order`

## 可调用工具

- `query_technicians`
- `query_technician_skills`
- `query_technician_workload`
- `query_shift`
- `query_team_availability`
- `assign_workorder`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

