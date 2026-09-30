---
name: sop_search_skill
version: 1.0
goal: 检索标准作业规程和维修步骤。
trigger: sop_or_repair_steps
steps:
  - classify_sop_query
  - search_sop
  - fetch_document_or_chunk
  - validate_evidence
tools:
  - search_sop
  - search_manual
  - fetch_document
  - fetch_chunk
---

# 标准作业规程检索

## 目标

检索标准作业规程和维修步骤。

## 触发条件

`sop_or_repair_steps`

## 执行步骤

1. `classify_sop_query`
2. `search_sop`
3. `fetch_document_or_chunk`
4. `validate_evidence`

## 可调用工具

- `search_sop`
- `search_manual`
- `fetch_document`
- `fetch_chunk`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。
