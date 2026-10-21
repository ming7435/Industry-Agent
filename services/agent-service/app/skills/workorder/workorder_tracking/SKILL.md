---
name: workorder_tracking
description: 当查询工单状态或明确请求合法状态更新时使用。
version: 1.0
goal: 查询和更新工单生命周期状态。
trigger: query
steps:
- initialize
- load_skill
- validate_plan
- execute_action
- validate
- final
tools:
- get_workorder
- query_workorder
- update_workorder
- list_workorders
- read_skill_reference
output: WorkOrderResult
---

# 工单查询与受控状态更新

运行标识：`workorder_tracking`；所属 Agent：`workorder`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

查询和更新工单生命周期状态。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

trigger=query按上下文匹配；query/get有编号读取单单，query无编号列出设备/状态过滤结果。update由实际action决定，不因工具白名单自动写入。

不适用：不支持通过通用update任意透传验收字段，不以工单存在代替动作对账。

## 执行流程（Workflow）

### 公共编排

真实节点 prepare → validate_plan；创建进入 create_order，需自动派发且尚无负责人时进入 dispatch_context → assign_order；其他动作进入 execute_action；最后finish执行结果校验和final/fallback。dispatch_context合并collect_dispatch_context/select_assignee；final追踪映射为validate_result。action=assign直走execute_action，不自动运行候选选择流程。

保留的步骤标识：`initialize`、`load_skill`、`validate_plan`、`execute_action`、`validate`、`final`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

区分单单和列表读取，保留权威状态；更新只下传workorder_id/status/assignee并服从Backend迁移；返回空列表、未找到单单或执行错误时保留真实差异。

## 输出规范（Output Format）

使用 agents/workorder/schemas.py 的 WorkOrderResult：action、success、workorder_id/status/priority/assignee、workorder/items/candidates/dispatch_context、validation_findings/stop_reason/error。创建成功但未派发可保留workorder_id且success=False；空列表可查询成功，单单未找到不保证有独立not_found状态。输出必须保留实际失败/未派出，而非一律completed。

## 停止条件（Stop Conditions）

本次动作返回且最终校验满足才成功。waiting_for_personnel/personnel_query_failed、输入或结果校验失败按既有回退返回，不构造固定负责人。创建/派发不等于维修完成，完成不等于关闭或复机。审批只绑定特定动作、参数和任务；并发恢复由服务端领取状态控制。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `workorder_tracking`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |
