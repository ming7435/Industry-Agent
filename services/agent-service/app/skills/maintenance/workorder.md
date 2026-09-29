---
name: workorder_skill
version: 1.0
goal: 结合维修方案与工程资料生成工单草稿。
trigger: workorder
steps:
  - build_workorder_draft
  - attach_repair_target
  - attach_drawing_context
  - submit_workorder_draft
tools:
  - get_workorder_template
  - submit_workorder_draft
---

# 工单草稿准备

## 目标

结合维修方案与工程资料生成工单草稿。

## 触发条件

`workorder`

## 执行步骤

1. `build_workorder_draft`
2. `attach_repair_target`
3. `attach_drawing_context`
4. `submit_workorder_draft`

## 可调用工具

- `get_workorder_template`
- `submit_workorder_draft`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

