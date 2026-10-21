---
name: contract
title: 输入契约与真实示例
when: 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。
order: 3
---

## 输入与前置条件（Inputs）

MemoryQuery：task_id/trace_id、action（search/recent/learn/summarize/sync）、device_id/device_model/alarm_code/fault_type/component/part_no/query、limit（默认20，1–100），diagnosis/maintenance_plan/workorder/repair_feedback/repair_verification/quality/report/context/experience。repair_feedback可对象或字符串，其余记录用对象。参数形状合法不代表满足学习准入。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "action": "learn",
  "workorder": {
    "workorder_id": "WO-EXAMPLE",
    "status": "closed",
    "device_id": "CNC-01"
  },
  "repair_feedback": {
    "feedback": "已更换轴承"
  }
}
```

### 处理与依据

只有关闭字样和反馈、无可信验收：请求模型合法但禁止写入经验。

### 示例输出

```json
{
  "action": "learn",
  "success": false,
  "validation_findings": [
    "缺少可信维修验收"
  ],
  "stop_reason": "validation_failed"
}
```
