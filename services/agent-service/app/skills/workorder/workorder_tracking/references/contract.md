---
name: contract
title: 输入契约与真实示例
when: 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。
order: 3
---

## 输入与前置条件（Inputs）

WorkOrderQuery 字段：task_id/trace_id、action、workorder_id/device_id/title、maintenance_plan/plan/workorder、repair_feedback/repair_verification/maintenance_confirmed_by、status/assignee/auto_dispatch/requires_approval、fault_level/priority/risk_level、idempotency_key/event_id、diagnosis_snapshot/maintenance_plan_snapshot、required_parts/closure_reason/source/context。action默认create，非create/query需workorder_id。模型没有顶层area/event/verification，不能把被忽略字段描述成已实现入口。

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
