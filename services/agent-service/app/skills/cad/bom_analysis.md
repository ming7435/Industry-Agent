---
name: bom_analysis_skill
version: 1.0
goal: 分析物料清单条目以及零部件之间的结构关系。
trigger: bom
steps:
  - query_part
  - query_bom
  - query_relation
  - query_drawing
  - validate_relation
tools:
  - query_part
  - query_bom
  - query_relation
  - query_drawing
  - fetch_engineering_record
---

# BOM 关系分析

## 目标

分析物料清单条目以及零部件之间的结构关系。

## 触发条件

`bom`

## 执行步骤

1. `query_part`
2. `query_bom`
3. `query_relation`
4. `query_drawing`
5. `validate_relation`

## 可调用工具

- `query_part`
- `query_bom`
- `query_relation`
- `query_drawing`
- `fetch_engineering_record`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

