---
name: part_quality_inspection_skill
version: 1.0
goal: 对生产零件的尺寸、外观、材料、功能和工艺进行综合质量检测。
trigger: part_quality
steps:
  - load_part
  - load_inspection_plan
  - inspect_dimensions
  - inspect_appearance
  - inspect_material
  - inspect_function
  - inspect_process
  - validate_part
  - identify_part
  - determine_pass_fail
  - build_result
tools:
  - get_production_part
  - get_part_specification
  - inspect_part_dimensions
  - inspect_part_appearance
  - inspect_part_material
  - inspect_part_function
  - inspect_part_process
---

# 生产零件综合质检

## 目标

对生产零件的尺寸、外观、材料、功能和工艺进行综合质量检测。

## 触发条件

`part_quality`

## 执行步骤

1. `load_part`
2. `load_inspection_plan`
3. `inspect_dimensions`
4. `inspect_appearance`
5. `inspect_material`
6. `inspect_function`
7. `inspect_process`
8. `validate_part`
9. `identify_part`
10. `determine_pass_fail`
11. `build_result`

## 可调用工具

- `get_production_part`
- `get_part_specification`
- `inspect_part_dimensions`
- `inspect_part_appearance`
- `inspect_part_material`
- `inspect_part_function`
- `inspect_part_process`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

