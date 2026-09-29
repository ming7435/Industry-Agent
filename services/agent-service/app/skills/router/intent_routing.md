---
name: intent_routing_skill
version: 1.0
goal: 识别工业操作请求意图并选择目标智能体。
trigger: default
steps:
  - normalize_request
  - classify_intent
  - select_target_agent
  - validate_route
  - build_runtime_goal
tools: []
required_inputs:
  - user_text
---

# 意图路由

## 目标

识别工业操作请求意图并选择目标智能体。

## 触发条件

`default`

## 执行步骤

1. `normalize_request`
2. `classify_intent`
3. `select_target_agent`
4. `validate_route`
5. `build_runtime_goal`

## 可调用工具

此技能不直接调用工具。

## 运行说明

运行时读取本文档顶部的 YAML Front Matter；正文用于说明技能目的、触发条件、执行步骤和工具边界。

