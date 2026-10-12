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
output: WorkOrderResult
---

# 工单派发与负责人核验

运行标识：`auto_assignment`；所属 Agent：`workorder`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

按设备登记负责关系、在线可用状态和负载选择或核验派工人员。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

trigger=assign；action=assign直走execute_action提交指定assignee，创建后的自动派发另走dispatch_context/select_assignee。不能把这两条路径合并描述。

不适用：现有assign请求不会自动运行技能/班次/区域加权评分；score_candidate不是当前排序算法。

## 输入与前置条件（Inputs）

WorkOrderQuery 字段：task_id/trace_id、action、workorder_id/device_id/title、maintenance_plan/plan/workorder、repair_feedback/repair_verification/maintenance_confirmed_by、status/assignee/auto_dispatch/requires_approval、fault_level/priority/risk_level、idempotency_key/event_id、diagnosis_snapshot/maintenance_plan_snapshot、required_parts/closure_reason/source/context。action默认create，非create/query需workorder_id。模型没有顶层area/event/verification，不能把被忽略字段描述成已实现入口。

## 执行流程（Workflow）

### 公共编排

真实节点 prepare → validate_plan；创建进入 create_order，需自动派发且尚无负责人时进入 dispatch_context → assign_order；其他动作进入 execute_action；最后finish执行结果校验和final/fallback。dispatch_context合并collect_dispatch_context/select_assignee；final追踪映射为validate_result。action=assign直走execute_action，不自动运行候选选择流程。

保留的步骤标识：`collect_dispatch_context`、`select_assignee`、`assign_order`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

创建后的自动流程先读登记人员，过滤本设备负责范围、registered/online/available均True，再按workload和technician_id排序；有指定人则必须在候选中，不偷偷换人。直接assign则提交明确人员并由Backend复核资格与必要库存。

## 业务判断规则（Reasoning Rules）

- responsible_device_ids明确空或格式错误不扩大资格；仅旧账号缺该字段可按primary_device_id兼容。
- 无候选等待登录，人员查询失败单独标记，不从固定人员列表凑成功。
- 当前候选dispatch_score统一100，技能和班次可not_recorded，不能对外宣称已做多维优化匹配。

原有约束继续适用：一个小组与监督角色不等于任何用户都能确认修复。没有真实派工依据不能为了成功返回而补演示名单。

## 工具使用规范（Tools）

允许工具不等于每次都调用。创建、查询、派发、反馈、完成、重开分别执行真实业务动作；正式写入由Backend返回权威工单。Runtime/Harness和Backend共同控制权限、幂等及状态，不接受模型自报批准。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `query_technicians` | 需为本设备找负责人时传 device_id，可选 component/priority。 | 读取 success/items、登记负责范围/online/available/workload；目录失败与无人在线分开。 |
| `query_technician_skills` | 补充人员信息时传 technician_id。 | items/status=not_recorded 保留未登记事实；当前排序不使用技能加权评分。 |
| `query_technician_workload` | 候选存在时传 technician_id。 | 读取 items.workload；真实排序用负载和编号，不编造低负载人员。 |
| `query_shift` | 需班次背景时传 device_id。 | 当前可返回 not_recorded；不是已落实班次依据，不擅自补齐班次。 |
| `query_team_availability` | 需小组可用信息时传 device_id，可选 component。 | 读取 available/available_count/team；不能取消设备负责关系和在线资格。 |
| `assign_workorder` | 已指定合格负责人时传 workorder_id/assignee。 | 返回权威工单，Backend 再核验资格和必要库存；失败保留原工单，不宣称派发。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。

## 证据与数据真实性（Evidence Rules）

绑定工单、设备、事件和方案编号及快照。人员依据是登记负责范围/online/available等服务端事实；缓存不能覆盖数据库真实负责人。存在工单只证明存在，不能证明本次update/assign/close已完成。恢复证据要匹配本设备及时间，不重复计算同一回执。

## 输出规范（Output Format）

使用 agents/workorder/schemas.py 的 WorkOrderResult：action、success、workorder_id/status/priority/assignee、workorder/items/candidates/dispatch_context、validation_findings/stop_reason/error。创建成功但未派发可保留workorder_id且success=False；空列表可查询成功，单单未找到不保证有独立not_found状态。输出必须保留实际失败/未派出，而非一律completed。

## 异常处理（Error Handling）

输入门禁失败转fallback；执行异常仍经过最终校验。人员查询失败与无人可用分别表达；授权不足、库存不足、非法迁移、空工单不伪装成功。写操作响应超时后先查询权威结果，不把底层可能仍在运行的动作盲目重放；参数改变不能共用原幂等键或审批。

## 停止条件（Stop Conditions）

本次动作返回且最终校验满足才成功。waiting_for_personnel/personnel_query_failed、输入或结果校验失败按既有回退返回，不构造固定负责人。创建/派发不等于维修完成，完成不等于关闭或复机。审批只绑定特定动作、参数和任务；并发恢复由服务端领取状态控制。

## 安全与权限边界（Safety & Constraints）

服从Backend状态迁移及可信验收规则。requires_approval不能通过客户端approved字段取消，只有Dispatcher服务端授权域可继续。登录人员确认及复机由独立团队/设备链路核对，工单技能没有启动、停止机器工具。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "action": "assign",
  "workorder_id": "WO-EXAMPLE",
  "assignee": ""
}
```

### 处理与依据

假设Backend拒绝空负责人：返回失败形状，不随机指定人员；实际错误文本以本次回执为准。

### 示例输出

```json
{
  "action": "assign",
  "success": false,
  "validation_findings": [
    "负责人为空，派发未完成"
  ],
  "stop_reason": "validation_failed"
}
```

## 参考实现（References）

- [app/agents/workorder/agent.py](L:/industry_agent/services/agent-service/app/agents/workorder/agent.py)
- [app/agents/workorder/graph.py](L:/industry_agent/services/agent-service/app/agents/workorder/graph.py)
- [app/agents/workorder/schemas.py](L:/industry_agent/services/agent-service/app/agents/workorder/schemas.py)
- [app/agents/workorder/validator.py](L:/industry_agent/services/agent-service/app/agents/workorder/validator.py)
- [app/workorder/service.py](L:/industry_agent/services/agent-service/app/workorder/service.py)
- [app/workorder/policy.py](L:/industry_agent/services/agent-service/app/workorder/policy.py)
- [app/runtime/policy.py](L:/industry_agent/services/agent-service/app/runtime/policy.py)
- [app/runtime/execution.py](L:/industry_agent/services/agent-service/app/runtime/execution.py)
- [app/skills/registry.py](L:/industry_agent/services/agent-service/app/skills/registry.py)
- [app/tools/registry.py](L:/industry_agent/services/agent-service/app/tools/registry.py)
