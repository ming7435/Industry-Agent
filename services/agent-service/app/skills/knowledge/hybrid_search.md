---
name: hybrid_search_skill
version: 1.0
goal: 在没有指定专业知识源时执行全库混合检索。
trigger: default
steps:
  - classify_query
  - search_knowledge
  - rerank_evidence
  - validate_evidence
  - normalize_query
  - select_sources
  - build_filters
  - search
  - build_evidence
  - rank
  - validate_sources
  - build_result
tools:
  - search_knowledge
  - search_sop
  - search_manual
  - search_fault_cases
  - search_semantic_memory
  - fetch_document
  - fetch_chunk
---

# 混合知识检索

## 目标

在没有指定专业知识源时执行全库混合检索。

## 触发条件

`default`

## 执行步骤

1. `classify_query`
2. `search_knowledge`
3. `rerank_evidence`
4. `validate_evidence`
5. `normalize_query`
6. `select_sources`
7. `build_filters`
8. `search`
9. `build_evidence`
10. `rank`
11. `validate_sources`
12. `build_result`

## 可调用工具

- `search_knowledge`
- `search_sop`
- `search_manual`
- `search_fault_cases`
- `search_semantic_memory`
- `fetch_document`
- `fetch_chunk`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

