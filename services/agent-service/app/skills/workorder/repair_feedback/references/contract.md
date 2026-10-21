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
  "action": "mark_repair_completed",
  "workorder_id": "WO-EXAMPLE",
  "repair_feedback": {
    "feedback": "已核查现场"
  },
  "repair_verification": {
    "passed": true
  }
}
```

### 处理与依据

合法请求模型只给passed，没有device_recovery：业务应拒绝完成，不生成复机事实。

### 示例输出

```json
{
  "action": "mark_repair_completed",
  "success": false,
  "validation_findings": [
    "缺少可信设备恢复数据"
  ],
  "stop_reason": "validation_failed"
}
```
