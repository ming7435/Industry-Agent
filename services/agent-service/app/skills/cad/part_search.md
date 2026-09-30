---
name: part_search_skill
version: 1.0
goal: 查找零件或部件及其在设备中的安装位置。
trigger: part_or_component
steps:
  - normalize_part_query
  - query_part
  - query_relation
  - resolve_location
tools:
  - query_part
  - query_bom
  - query_drawing
  - query_relation
  - fetch_engineering_record
---

# 零部件检索

## 目标

查找零件或部件及其在设备中的安装位置。

## 触发条件

`part_or_component`

## 执行步骤

1. `normalize_part_query`
2. `query_part`
3. `query_relation`
4. `resolve_location`

## 可调用工具

- `query_part`
- `query_bom`
- `query_drawing`
- `query_relation`
- `fetch_engineering_record`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。
