---
name: auto_assignment
version: 1.0
goal: 基于技能、班次、区域和负载选择维修人员。
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
output: WorkOrderResult
---

# 工单自动派发

运行标识：`auto_assignment`。基于技能、班次、区域和负载选择维修人员。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

已有工单需要自动选择维修人员并派工时使用，对应 `assign`。

## 输入与前置条件

- 目标工单、设备、优先级与已有方案。
- 登记人员、设备负责关系、技能、负载和可用班次信息；接口缺失时明确返回不可用。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `collect_dispatch_context`：读取人员、技能、班次与负载等可用派工依据。
- `select_assignee`：依据实际人员与设备负责关系选择派工对象。
- `assign_order`：提交选定人员的派工动作并保留实际返回。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `query_technicians`：查询已登记维修人员。
- `query_technician_skills`：查询维修人员技能信息。
- `query_technician_workload`：查询维修人员负载。
- `query_shift`：查询可用班次信息。
- `query_team_availability`：查询小组可用信息。
- `assign_workorder`：向业务服务提交人员派工。

## 输出与停止条件

返回实际派工人员及工单结果；没有合适人员或提交失败时保留未派出原因，不伪造固定人员。

## 安全边界

一个小组与监督角色不等于任何用户都能确认修复。没有真实派工依据不能为了成功返回而补演示名单。

## 代码入口

- [workorder Agent 入口](L:/industry_agent/services/agent-service/app/agents/workorder/agent.py)：输入转换、技能选择与结果校验。
- [workorder Graph 实现](L:/industry_agent/services/agent-service/app/agents/workorder/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
