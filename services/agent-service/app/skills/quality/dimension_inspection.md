---
name: dimension_inspection_skill
version: 1.0
goal: 对生产零件的关键尺寸执行专项质量检测。
trigger: part_quality
steps:
  - load_part
  - load_inspection_plan
  - inspect_dimensions
  - validate_part
tools:
  - get_production_part
  - get_part_specification
  - inspect_part_dimensions
---

# 尺寸专项质检

## 目标

对生产零件的关键尺寸执行专项质量检测。

## 触发条件

`part_quality`

## 执行步骤

1. `load_part`
2. `load_inspection_plan`
3. `inspect_dimensions`
4. `validate_part`

## 可调用工具

- `get_production_part`
- `get_part_specification`
- `inspect_part_dimensions`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

