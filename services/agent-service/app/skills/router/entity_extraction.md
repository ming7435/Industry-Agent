---
name: entity_extraction_skill
version: 1.0
goal: 提取设备、报警、部件、工单和报告等业务实体。
trigger: default
steps:
  - extract_entities
  - validate_entities
tools: []
optional_inputs:
  - context
---

# 业务实体提取

## 目标

提取设备、报警、部件、工单和报告等业务实体。

## 触发条件

`default`

## 执行步骤

1. `extract_entities`
2. `validate_entities`

## 可调用工具

此技能不直接调用工具。

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

