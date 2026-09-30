---
name: drawing_lookup_skill
version: 1.0
goal: 定位工程图纸，并验证图纸与目标部件的归属关系。
trigger: part_or_component
steps:
  - resolve_component
  - query_part
  - query_drawing
  - validate_relation
  - normalize_query
  - classify_engineering_request
  - resolve_part
  - resolve_bom
  - merge_engineering_context
  - validate_engineering_context
  - build_result
tools:
  - query_part
  - query_drawing
  - query_bom
  - query_relation
  - fetch_engineering_record
---

# 工程图纸定位

## 目标

定位工程图纸，并验证图纸与目标部件的归属关系。

## 触发条件

`part_or_component`

## 执行步骤

1. `resolve_component`
2. `query_part`
3. `query_drawing`
4. `validate_relation`
5. `normalize_query`
6. `classify_engineering_request`
7. `resolve_part`
8. `resolve_bom`
9. `merge_engineering_context`
10. `validate_engineering_context`
11. `build_result`

## 可调用工具

- `query_part`
- `query_drawing`
- `query_bom`
- `query_relation`
- `fetch_engineering_record`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。
