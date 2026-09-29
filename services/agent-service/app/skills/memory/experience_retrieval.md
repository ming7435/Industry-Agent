---
name: experience_retrieval
version: 1.0
goal: 检索已验证的历史维修经验。
trigger: search
steps:
  - initialize
  - load_skill
  - retrieve_memory
  - dedup
  - rerank
  - validate
  - final
tools:
  - search_semantic_memory
output: MemoryResult
---

# 维修经验检索

## 目标

检索已验证的历史维修经验。

## 触发条件

`search`

## 执行步骤

1. `initialize`
2. `load_skill`
3. `retrieve_memory`
4. `dedup`
5. `rerank`
6. `validate`
7. `final`

## 可调用工具

- `search_semantic_memory`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

