---
name: intent_routing_skill
description: 当接收工业用户问题，需要确定目标能力与业务实体时使用。
aliases:
- entity_extraction_skill
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
tools:
- read_skill_reference
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

## 执行流程（Workflow）

### 公共编排

真实节点prepare → route_request → finish。prepare包含normalize_request/select_target_agent追踪步骤；route_request内classify_intent、extract_entities、validate_route；finish映射build_runtime_goal或fallback。load_skill的select_target_agent标签只加载技能，不执行业务Agent。

保留的步骤标识：`normalize_request`、`select_target_agent`、`classify_intent`、`extract_entities`、`validate_route`、`build_runtime_goal`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

归一user_text/context，按实际关键词评分分类，抽取设备/工单/零件/报警/批次等已有实体，再分类及校验必要实体；歧义或缺身份留在Router补充，完成只构造目标输入。

## 输出规范（Output Format）

使用 RouteResult：intent/target_agent/confidence/reason/entities/target_input/validation_findings。intent支持diagnosis/knowledge/cad/maintenance/quality/report/workorder/memory/workorder_action/workorder_query/unknown/need_more_context；没有业务success或stop_reason字段。target_input保留context/entities/user_text/query及实际动作适配，不声称业务完成。

## 停止条件（Stop Conditions）

一次既有分类与实体校验完成就返回。unknown置信度0.2，缺上下文或findings为0.55；正常含实体0.95，否则0.88。数值是现有规则分级，不宣称真实概率或外部模型置信度。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `intent_routing_skill`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |

## 独立运行

复制本目录后，可运行 `python scripts/run.py --check`，或使用 `python scripts/run.py --input task.json --model-url http://127.0.0.1:8040 --tool-script scripts/mcp_adapter.py` 执行业务任务。输入字段见 `references/contract.md`；真实工具连接与限制见 `references/standalone.md`。
