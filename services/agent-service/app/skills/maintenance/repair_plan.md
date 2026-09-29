---
name: repair_plan_skill
version: 1.0
goal: 依据诊断结论和证据生成可执行的维修方案。
trigger: repair_plan
steps:
  - assess_diagnosis
  - request_knowledge
  - request_cad
  - plan_repair
  - validate_plan
  - validate_diagnosis
  - determine_required_parts
  - build_safety_steps
  - build_result
tools:
  - generate_repair_plan
  - query_inventory
  - query_part_availability
  - get_workorder_template
  - submit_workorder_draft
---

# 维修方案生成

## 目标

依据诊断结论和证据生成可执行的维修方案。

## 触发条件

`repair_plan`

## 执行步骤

1. `assess_diagnosis`
2. `request_knowledge`
3. `request_cad`
4. `plan_repair`
5. `validate_plan`
6. `validate_diagnosis`
7. `determine_required_parts`
8. `build_safety_steps`
9. `build_result`

## 可调用工具

- `generate_repair_plan`
- `query_inventory`
- `query_part_availability`
- `get_workorder_template`
- `submit_workorder_draft`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

