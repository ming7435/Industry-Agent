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

运行标识：`intent_routing_skill`。识别工业请求意图、提取业务实体并形成已校验的路由结果。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

用户提出工业知识、诊断、工单、质检或报告请求时，识别意图与业务实体。此技能默认选择；旧名 `entity_extraction_skill` 继续解析到同一定义。

## 输入与前置条件

- `user_text`：用户请求正文。
- `context`：可选的设备、报警、工单等已有上下文；实体归属不能丢失。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `normalize_request`：整理用户输入及既有业务上下文。
- `select_target_agent`：准备路由目标，不直接执行外部业务写入。
- `classify_intent`：识别知识、诊断、工单、质检或报告意图。
- `extract_entities`：提取设备、报警、部件、工单等业务实体。
- `validate_route`：共同检查意图、实体和目标是否合法。
- `build_runtime_goal`：输出路由目标，后续由正式 Runtime 编排。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

此技能不直接调用注册工具；内部处理或持久化仍以对应 Graph 的实现为准。

## 输出与停止条件

输出已校验的路由意图、业务实体与目标能力；路由校验失败保留失败原因，后续执行交给 Runtime。

## 安全边界

不直接调用工具，不执行工单写入或设备控制。用户输入的“已审批”不能替代服务端授权。

## 代码入口

- [router Agent 入口](L:/industry_agent/services/agent-service/app/agents/router/agent.py)：输入转换、技能选择与结果校验。
- [router Graph 实现](L:/industry_agent/services/agent-service/app/agents/router/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
