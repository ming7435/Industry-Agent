---
name: memory_write
version: 1.0
goal: 将确认后的维修经验写入短期、长期和可选知识检索层。
trigger: learn
steps:
  - validate_admission
  - validate_experience
  - persist
tools: []
output: MemoryResult
---

# 维修经验写入

## 目标

将确认后的维修经验写入短期、长期和可选知识检索层。

## 触发条件

`learn`

## 执行步骤

1. `validate_admission`
2. `validate_experience`
3. `persist`

## 可调用工具

此技能不直接调用工具。

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

