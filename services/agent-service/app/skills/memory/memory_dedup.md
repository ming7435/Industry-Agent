---
name: memory_dedup
version: 1.0
goal: 避免同一工单的维修经验重复写入。
trigger: always
steps:
  - dedup
  - dedup_experience
tools: []
output: MemoryResult
---

# 维修经验去重

## 目标

避免同一工单的维修经验重复写入。

## 触发条件

`always`

## 执行步骤

1. `dedup`
2. `dedup_experience`

## 可调用工具

此技能不直接调用工具。

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

