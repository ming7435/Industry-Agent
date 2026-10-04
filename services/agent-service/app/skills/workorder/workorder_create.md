---
name: workorder_create
version: 1.0
goal: 根据已验证的维修方案创建并派发维修工单。
trigger: repair_plan
steps:
  - initialize
  - load_skill
  - validate_plan
  - create_order
  - collect_dispatch_context
  - select_assignee
  - assign_order
  - validate
  - final
tools:
  - create_workorder
  - get_workorder_template
  - query_technicians
  - query_technician_skills
  - query_technician_workload
  - query_shift
  - query_team_availability
  - assign_workorder
output: WorkOrderResult
---

# 维修工单创建

运行标识：`workorder_create`。根据已验证的维修方案创建并派发维修工单。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

已验证维修方案需要形成正式维修任务时使用；不是每个异常都创建工单。

## 输入与前置条件

- 设备、事件、维修方案以及诊断和证据上下文。
- 创建幂等信息、备件要求及实际派工人员依据；维修必要性、置信度和方案就绪门禁必须满足。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `initialize`：归一化本次请求、任务身份与执行上下文。
- `load_skill`：选择当前技能并形成工具范围。
- `validate_plan`：按当前领域规则检查方案或动作前置条件。
- `create_order`：经业务门禁后提交创建工单动作。
- `collect_dispatch_context`：读取人员、技能、班次与负载等可用派工依据。
- `select_assignee`：依据实际人员与设备负责关系选择派工对象。
- `assign_order`：提交选定人员的派工动作并保留实际返回。
- `validate`：核对当前动作返回和领域业务条件。
- `final`：返回真实结果，保留业务状态与异常信息。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `create_workorder`：提交正式工单创建。
- `get_workorder_template`：读取工单模板。
- `query_technicians`：查询已登记维修人员。
- `query_technician_skills`：查询维修人员技能信息。
- `query_technician_workload`：查询维修人员负载。
- `query_shift`：查询可用班次信息。
- `query_team_availability`：查询小组可用信息。
- `assign_workorder`：向业务服务提交人员派工。

## 输出与停止条件

返回 `WorkOrderResult`，包含实际工单、人员和业务状态；未派工或超时不冒充创建派工全链路成功。

## 安全边界

重复创建按业务身份对账，存在工单不等于本次更新已完成；审批和人员资格由服务端核对，不相信客户端自报授权。

## 代码入口

- [workorder Agent 入口](L:/industry_agent/services/agent-service/app/agents/workorder/agent.py)：输入转换、技能选择与结果校验。
- [workorder Graph 实现](L:/industry_agent/services/agent-service/app/agents/workorder/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
