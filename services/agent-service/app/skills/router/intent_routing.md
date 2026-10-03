---
name: intent_routing_skill
aliases: [entity_extraction_skill]
version: 1.1
goal: 识别工业请求意图、提取业务实体并形成已校验的路由结果。
trigger: default
steps:
  - normalize_request
  - select_target_agent
  - classify_intent
  - extract_entities
  - validate_route
  - build_runtime_goal
tools: []
required_inputs:
  - user_text
optional_inputs:
  - context
---

# 意图路由与业务实体提取

## 触发条件

Router 收到操作请求时默认使用。旧名称 `entity_extraction_skill` 兼容解析到本定义，同一请求只激活一次。

## 实际执行步骤

1. `normalize_request`：整理用户输入和上下文。
2. `select_target_agent`：准备路由技能，不执行外部业务操作。
3. `classify_intent`：识别知识、诊断、质检、工单或报告意图。
4. `extract_entities`：提取设备、报警、部件、工单、报告等实体，保留上下文归属。
5. `validate_route`：共同核对意图、实体与目标；校验不通过进入原失败分支。
6. `build_runtime_goal`：形成路由结果，后续执行仍由正式 Runtime 决定。

## 工具边界

本技能不直接调用工具，不将用户提供的审批标记作为执行授权。
