---
name: fault_case_skill
version: 1.0
goal: 检索历史故障案例和已验证的维修经验。
trigger: case_or_history
steps:
  - search_fault_cases
  - search_semantic_memory
  - rerank_evidence
  - validate_evidence
tools:
  - search_fault_cases
  - search_semantic_memory
  - fetch_document
  - fetch_chunk
---

# 历史故障案例检索

## 目标

检索历史故障案例和已验证的维修经验。

## 触发条件

`case_or_history`

## 执行步骤

1. `search_fault_cases`
2. `search_semantic_memory`
3. `rerank_evidence`
4. `validate_evidence`

## 可调用工具

- `search_fault_cases`
- `search_semantic_memory`
- `fetch_document`
- `fetch_chunk`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

