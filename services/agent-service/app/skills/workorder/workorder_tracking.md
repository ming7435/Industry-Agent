---
name: workorder_tracking
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
output: WorkOrderResult
---

# 工单状态跟踪

运行标识：`workorder_tracking`。查询和更新工单生命周期状态。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

读取工单或处理合法状态更新时使用，对应 `query`；请求动作决定读或写，不因拥有更新工具就自动改状态。

## 输入与前置条件

- `workorder_id`，或列表查询的有效设备/状态条件。
- 更新时提供具体动作、参数和必要业务证据；创建、更新、完成与关闭分别进行幂等和对账。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `initialize`：归一化本次请求、任务身份与执行上下文。
- `load_skill`：选择当前技能并形成工具范围。
- `validate_plan`：按当前领域规则检查方案或动作前置条件。
- `execute_action`：按请求动作调用已允许的工单操作。
- `validate`：核对当前动作返回和领域业务条件。
- `final`：返回真实结果，保留业务状态与异常信息。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `get_workorder`：读取指定工单。
- `query_workorder`：兼容工单查询入口。
- `update_workorder`：提交允许的工单更新，不能绕过状态迁移。
- `list_workorders`：查询工单列表。

## 输出与停止条件

返回 `WorkOrderResult` 与真实状态/列表；查询不到、更新被拒绝或结果未知分别保留原因。

## 安全边界

受 Backend 状态迁移约束。工单存在不是更新成功证明；写操作超时不盲目重复，不能以通用更新绕过可信验收。

## 代码入口

- [workorder Agent 入口](L:/industry_agent/services/agent-service/app/agents/workorder/agent.py)：输入转换、技能选择与结果校验。
- [workorder Graph 实现](L:/industry_agent/services/agent-service/app/agents/workorder/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
