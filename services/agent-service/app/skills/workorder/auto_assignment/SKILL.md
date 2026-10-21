---
name: auto_assignment
description: 当创建流程需自动选负责人，或现有工单明确指定负责人派发时使用。
version: 1.0
goal: 按设备登记负责关系、在线可用状态和负载选择或核验派工人员。
trigger: assign
steps:
- collect_dispatch_context
- select_assignee
- assign_order
tools:
- query_technicians
- query_technician_skills
- query_technician_workload
- query_shift
- query_team_availability
- assign_workorder
- read_skill_reference
output: WorkOrderResult
---

# 工单派发与负责人核验

运行标识：`auto_assignment`；所属 Agent：`workorder`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

按设备登记负责关系、在线可用状态和负载选择或核验派工人员。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

trigger=assign；action=assign直走execute_action提交指定assignee，创建后的自动派发另走dispatch_context/select_assignee。不能把这两条路径合并描述。

不适用：现有assign请求不会自动运行技能/班次/区域加权评分；score_candidate不是当前排序算法。

## 执行流程（Workflow）

### 公共编排

真实节点 prepare → validate_plan；创建进入 create_order，需自动派发且尚无负责人时进入 dispatch_context → assign_order；其他动作进入 execute_action；最后finish执行结果校验和final/fallback。dispatch_context合并collect_dispatch_context/select_assignee；final追踪映射为validate_result。action=assign直走execute_action，不自动运行候选选择流程。

保留的步骤标识：`collect_dispatch_context`、`select_assignee`、`assign_order`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

创建后的自动流程先读登记人员，过滤本设备负责范围、registered/online/available均True，再按workload和technician_id排序；有指定人则必须在候选中，不偷偷换人。直接assign则提交明确人员并由Backend复核资格与必要库存。

## 输出规范（Output Format）

使用 agents/workorder/schemas.py 的 WorkOrderResult：action、success、workorder_id/status/priority/assignee、workorder/items/candidates/dispatch_context、validation_findings/stop_reason/error。创建成功但未派发可保留workorder_id且success=False；空列表可查询成功，单单未找到不保证有独立not_found状态。输出必须保留实际失败/未派出，而非一律completed。

## 停止条件（Stop Conditions）

本次动作返回且最终校验满足才成功。waiting_for_personnel/personnel_query_failed、输入或结果校验失败按既有回退返回，不构造固定负责人。创建/派发不等于维修完成，完成不等于关闭或复机。审批只绑定特定动作、参数和任务；并发恢复由服务端领取状态控制。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `auto_assignment`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |
