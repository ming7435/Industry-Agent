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
  "action": "search",
  "device_id": "CNC-01",
  "query": "学习过的冷却泵维修经验",
  "limit": 5
}
```

### 处理与依据

假设检索无匹配：返回空items与实际finding，completed不冒充有经验或已学习。

### 示例输出

```json
{
  "action": "search",
  "success": false,
  "items": [],
  "count": 0,
  "validation_findings": [
    "未检索到匹配的维修经验"
  ],
  "stop_reason": "completed"
}
```
