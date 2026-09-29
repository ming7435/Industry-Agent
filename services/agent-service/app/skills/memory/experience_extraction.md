---
name: experience_extraction
version: 1.0
goal: 从已关闭且质检通过的工单中提取维修经验。
trigger: learn
steps:
  - initialize
  - load_skill
  - validate_admission
  - extract_experience
  - dedup_experience
  - validate_experience
  - persist
  - final
  - validate_closed
  - score_experience
  - build_result
tools:
  - get_workorder
output: MemoryResult
---

# 维修经验提取

## 目标

从已关闭且质检通过的工单中提取维修经验。

## 触发条件

`learn`

## 执行步骤

1. `initialize`
2. `load_skill`
3. `validate_admission`
4. `extract_experience`
5. `dedup_experience`
6. `validate_experience`
7. `persist`
8. `final`
9. `validate_closed`
10. `score_experience`
11. `build_result`

## 可调用工具

- `get_workorder`

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

