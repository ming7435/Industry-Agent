---
name: repair_feedback
version: 1.0
goal: 接收现场维修反馈并标记维修执行结果。
trigger: feedback
steps:
  - initialize
  - load_skill
  - validate_plan
  - execute_action
  - validate
  - final
tools:
  - submit_repair_feedback
  - mark_repair_completed
output: WorkOrderResult
---

# 维修执行反馈

运行标识：`repair_feedback`。接收现场维修反馈并标记维修执行结果。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

被派工维修人员提交真实处理反馈或完成动作时使用；反馈提交与验收通过不是同一件事。

## 输入与前置条件

- 工单身份与实际 `repair_feedback`。
- 完成动作需要服务端可信身份与本设备新鲜恢复数据；只有客户端 `passed=true` 不足以通过。

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

- `submit_repair_feedback`：提交实际维修反馈。
- `mark_repair_completed`：提交维修完成动作，仍需可信恢复验证。

## 输出与停止条件

返回 `WorkOrderResult`、反馈保存及完成动作真实结果；恢复证据不足、过期、设备不符或未通过时不能宣告完成。

## 安全边界

被派工人确认、恢复验收和虚拟复机另由业务链路核对；不因提交反馈就无条件启动整条产线。

## 代码入口

- [workorder Agent 入口](L:/industry_agent/services/agent-service/app/agents/workorder/agent.py)：输入转换、技能选择与结果校验。
- [workorder Graph 实现](L:/industry_agent/services/agent-service/app/agents/workorder/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
