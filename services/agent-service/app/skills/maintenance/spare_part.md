---
name: spare_part_skill
version: 1.0
goal: 确定维修所需备件，并核对库存和可用性。
trigger: part_or_component
steps:
  - resolve_target_part
  - query_inventory
  - query_part_availability
  - validate_parts
tools:
  - query_inventory
  - query_part_availability
---

# 备件分析

## 目标

确定维修所需备件，并核对库存和可用性。

## 触发条件

`part_or_component`

## 执行步骤

1. `resolve_target_part`
2. `query_inventory`
3. `query_part_availability`
4. `validate_parts`

## 可调用工具

- `query_inventory`
- `query_part_availability`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

