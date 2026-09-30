---
name: alarm_search_skill
version: 1.0
goal: 检索报警定义以及与报警相关的技术知识。
trigger: exists(alarm_code)
steps:
  - normalize_alarm_code
  - search_alarm_knowledge
  - fetch_document_or_chunk
  - validate_evidence
tools:
  - search_alarm_knowledge
  - search_knowledge
  - fetch_document
  - fetch_chunk
---

# 报警知识检索

## 目标

检索报警定义以及与报警相关的技术知识。

## 触发条件

`exists(alarm_code)`

## 执行步骤

1. `normalize_alarm_code`
2. `search_alarm_knowledge`
3. `fetch_document_or_chunk`
4. `validate_evidence`

## 可调用工具

- `search_alarm_knowledge`
- `search_knowledge`
- `fetch_document`
- `fetch_chunk`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。
