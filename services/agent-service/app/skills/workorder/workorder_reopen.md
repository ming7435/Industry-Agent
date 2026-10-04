---
name: workorder_reopen
version: 1.0
goal: 质检不通过时重新打开工单并返回返工入口。
trigger: reopen
steps:
  - initialize
  - load_skill
  - validate_plan
  - execute_action
  - validate
  - final
tools:
  - reopen_workorder
  - get_workorder
output: WorkOrderResult
---

# 返工工单重开

运行标识：`workorder_reopen`。质检不通过时重新打开工单并返回返工入口。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

已存在的工单需要返工或合法重开时使用，对应 `reopen`，不是另建一张重复任务。

## 输入与前置条件

- 目标 `workorder_id` 与返工/重开业务上下文。
- 当前权威状态及允许重开的依据；需审批的动作仍按服务端政策处理。

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

- `reopen_workorder`：提交已有工单重开动作。
- `get_workorder`：读取指定工单。

## 输出与停止条件

返回 `WorkOrderResult` 与实际重开状态；非法迁移、无工单或远程不确定结果明确返回。

## 安全边界

只授权重开与读取，不直接创建新单、派工、完成或控制设备；不能利用旧审批授权新动作。

## 代码入口

- [workorder Agent 入口](L:/industry_agent/services/agent-service/app/agents/workorder/agent.py)：输入转换、技能选择与结果校验。
- [workorder Graph 实现](L:/industry_agent/services/agent-service/app/agents/workorder/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
