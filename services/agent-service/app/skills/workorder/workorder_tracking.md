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
output: WorkOrderResult
---

# 工单查询与受控状态更新

运行标识：`workorder_tracking`；所属 Agent：`workorder`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

查询和更新工单生命周期状态。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

trigger=query按上下文匹配；query/get有编号读取单单，query无编号列出设备/状态过滤结果。update由实际action决定，不因工具白名单自动写入。

不适用：不支持通过通用update任意透传验收字段，不以工单存在代替动作对账。

## 输入与前置条件（Inputs）

WorkOrderQuery 字段：task_id/trace_id、action、workorder_id/device_id/title、maintenance_plan/plan/workorder、repair_feedback/repair_verification/maintenance_confirmed_by、status/assignee/auto_dispatch/requires_approval、fault_level/priority/risk_level、idempotency_key/event_id、diagnosis_snapshot/maintenance_plan_snapshot、required_parts/closure_reason/source/context。action默认create，非create/query需workorder_id。模型没有顶层area/event/verification，不能把被忽略字段描述成已实现入口。

## 执行流程（Workflow）

### 公共编排

真实节点 prepare → validate_plan；创建进入 create_order，需自动派发且尚无负责人时进入 dispatch_context → assign_order；其他动作进入 execute_action；最后finish执行结果校验和final/fallback。dispatch_context合并collect_dispatch_context/select_assignee；final追踪映射为validate_result。action=assign直走execute_action，不自动运行候选选择流程。

保留的步骤标识：`initialize`、`load_skill`、`validate_plan`、`execute_action`、`validate`、`final`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

区分单单和列表读取，保留权威状态；更新只下传workorder_id/status/assignee并服从Backend迁移；返回空列表、未找到单单或执行错误时保留真实差异。

## 业务判断规则（Reasoning Rules）

- open可到in_progress/rejected/timeout；in_progress可到awaiting_verification/rejected/timeout；awaiting_verification可到completed/in_progress；completed可到closed/in_progress；closed/rejected/timeout可到open，均允许同态。
- in_progress必须有负责人；退回处理和完成关闭另需验证条件，prestart验证不能替代运行复核关闭。
- 空列表是成功查询，单单未找到可success=False但stop_reason=completed，不伪造不存在的not_found枚举。

原有约束继续适用：受 Backend 状态迁移约束。工单存在不是更新成功证明；写操作超时不盲目重复，不能以通用更新绕过可信验收。

## 工具使用规范（Tools）

允许工具不等于每次都调用。创建、查询、派发、反馈、完成、重开分别执行真实业务动作；正式写入由Backend返回权威工单。Runtime/Harness和Backend共同控制权限、幂等及状态，不接受模型自报批准。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `get_workorder` | 明确工单编号时传 workorder_id。 | 读取 found/工单状态与事实；不存在和传输失败都不能用缓存成功替代。 |
| `query_workorder` | 旧入口兼容读取，传 workorder_id。 | 兼容 get_workorder；当前 Graph 不必调用该别名，不能重复读取算两份证据。 |
| `update_workorder` | 合法状态更新传 workorder_id/status/assignee。 | 以 Backend 迁移表和验收规则为准；当前 Agent 不透传任意验证字段，不以存在工单判定更新成功。 |
| `list_workorders` | 列表查询时传可选 device_id/status。 | items=[] 是真实空列表，不是传输失败，不补演示任务。 |

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
  "action": "query",
  "device_id": "D-1",
  "status": "open"
}
```

### 处理与依据

假定权威查询成功且设备没有open工单：返回空列表，不填演示任务。

### 示例输出

```json
{
  "action": "query",
  "success": true,
  "items": [],
  "workorder": {
    "items": []
  },
  "stop_reason": "completed"
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
