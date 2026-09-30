---
name: manual_search_skill
version: 1.0
goal: 检索设备手册和操作说明。
trigger: manual
steps:
  - normalize_manual_query
  - search_manual
  - fetch_document_or_chunk
  - validate_evidence
tools:
  - search_manual
  - search_knowledge
  - fetch_document
  - fetch_chunk
---

# 设备手册检索

## 目标

检索设备手册和操作说明。

## 触发条件

`manual`

## 执行步骤

1. `normalize_manual_query`
2. `search_manual`
3. `fetch_document_or_chunk`
4. `validate_evidence`

## 可调用工具

- `search_manual`
- `search_knowledge`
- `fetch_document`
- `fetch_chunk`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。
