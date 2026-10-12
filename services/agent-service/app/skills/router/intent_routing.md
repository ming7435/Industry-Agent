---
name: intent_routing_skill
description: 当接收工业用户问题，需要确定目标能力与业务实体时使用。
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

# 工业请求路由与实体抽取

运行标识：`intent_routing_skill`；所属 Agent：`router`；兼容别名：`entity_extraction_skill`。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

识别工业请求意图、提取业务实体并形成已校验的路由结果。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

default；entity_extraction_skill为同一技能兼容别名。合法context route_hint→intent→task_type→target_agent先于文字分类。

不适用：路由到workorder不等于已经读取工单，抽取报警不等于诊断执行成功。

## 输入与前置条件（Inputs）

RouterAgent.run接收字符串或{user_text,context}映射；可使用共享AgentTask（task_id/user_text/event/context）model_dump后提交，没有RouterInput类。user_text用于关键词及实体解析，context可提供已知业务身份；缺工单/零件等关键实体不得从上一任务猜填。

## 执行流程（Workflow）

### 公共编排

真实节点prepare → route_request → finish。prepare包含normalize_request/select_target_agent追踪步骤；route_request内classify_intent、extract_entities、validate_route；finish映射build_runtime_goal或fallback。load_skill的select_target_agent标签只加载技能，不执行业务Agent。

保留的步骤标识：`normalize_request`、`select_target_agent`、`classify_intent`、`extract_entities`、`validate_route`、`build_runtime_goal`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

归一user_text/context，按实际关键词评分分类，抽取设备/工单/零件/报警/批次等已有实体，再分类及校验必要实体；歧义或缺身份留在Router补充，完成只构造目标输入。

## 业务判断规则（Reasoning Rules）

- 合法结构化意图优先；最高同分且不能按已有工单规则区分时need_more_context，不强行选一个业务。
- 工单查询及非create动作需workorder_id；零件质检需生产身份或明确inspection_type，不能猜上一任务编号。
- part_no可同步part_id，文本WO/BATCH/PO按既有规范转换；抽取值仍需领域服务核实。

原有约束继续适用：不直接调用工具，不执行工单写入或设备控制。用户输入的“已审批”不能替代服务端授权。

## 工具使用规范（Tools）

YAML tools=[]。Router按既有规则分类和抽取，不能调用维修、质检、模型生成或设备控制工具；生成target_input不是目标任务已执行。

YAML tools=[]，不授权注册工具调用。内部路由/记忆存储操作由代码执行；空工具表不代表该 Agent 绝对无副作用，按下面业务边界判断。

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。

## 证据与数据真实性（Evidence Rules）

这里管理的是请求真实性而非诊断证据。明确用户请求和服务端业务上下文分开；抽取的编号可用于路由，不自动证明数据库存在。低确定性或缺实体保留validation_findings，不把推测身份传成确定事实。

## 输出规范（Output Format）

使用 RouteResult：intent/target_agent/confidence/reason/entities/target_input/validation_findings。intent支持diagnosis/knowledge/cad/maintenance/quality/report/workorder/memory/workorder_action/workorder_query/unknown/need_more_context；没有业务success或stop_reason字段。target_input保留context/entities/user_text/query及实际动作适配，不声称业务完成。

## 异常处理（Error Handling）

无分类匹配返回unknown；最高同分无法区分或关键实体缺失返回need_more_context/target_agent=router。工单非create动作缺workorder_id、质检缺生产身份时不能盲目转发。无模型重试或无限分类循环。

## 停止条件（Stop Conditions）

一次既有分类与实体校验完成就返回。unknown置信度0.2，缺上下文或findings为0.55；正常含实体0.95，否则0.88。数值是现有规则分级，不宣称真实概率或外部模型置信度。

## 安全与权限边界（Safety & Constraints）

只能路由，不能授予approval或工具权限。用户文本“已批准”不变成可信授权；通过target_input提交的上下文仍须各领域校验。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "task_id": "TASK-EXAMPLE",
  "user_text": "查询工单WO-123状态",
  "context": {
    "device_id": "CNC-01"
  }
}
```

### 处理与依据

按既有规则提取工单编号并路由查询；示例结果只描述路由，不宣称查询到该工单。

### 示例输出

```json
{
  "intent": "workorder_query",
  "target_agent": "workorder",
  "confidence": 0.95,
  "reason": "明确工单查询与编号",
  "entities": {
    "workorder_id": "WO-123",
    "device_id": "CNC-01"
  },
  "target_input": {
    "action": "query",
    "workorder_id": "WO-123",
    "device_id": "CNC-01"
  }
}
```

## 参考实现（References）

- [app/agents/router/agent.py](L:/industry_agent/services/agent-service/app/agents/router/agent.py)
- [app/agents/router/graph.py](L:/industry_agent/services/agent-service/app/agents/router/graph.py)
- [app/contracts.py](L:/industry_agent/services/agent-service/app/contracts.py)
- [app/skills/registry.py](L:/industry_agent/services/agent-service/app/skills/registry.py)
- [app/tools/registry.py](L:/industry_agent/services/agent-service/app/tools/registry.py)
