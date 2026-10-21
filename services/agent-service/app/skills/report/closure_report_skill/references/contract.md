---
name: contract
title: 输入契约与真实示例
when: 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。
order: 3
---

## 输入与前置条件（Inputs）

ReportQuery：report_type、task_id/trace_id/device_id/event_id/workorder_id，diagnosis/maintenance_plan/workorder/repair_feedback/repair_verification/quality/knowledge/event/context，trace（对象列表），persist（默认True）。已有记录可直接传入；缺资料保留缺口，不通过伪造ID取得另一事件资料。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "report_type": "full_case_report",
  "persist": false,
  "diagnosis": {
    "device_id": "CNC-01",
    "fault": "冷却泵异常"
  },
  "maintenance_plan": {
    "repair_target": "冷却泵",
    "repair_steps": [
      "核对供液"
    ]
  },
  "workorder": {
    "workorder_id": "WO-EXAMPLE",
    "device_id": "CNC-01"
  }
}
```

### 处理与依据

没有实际处理反馈/验收：即使有计划，也只输出incomplete，persist=False不保存。

### 示例输出

```json
{
  "report_id": "RPT-EXAMPLE",
  "report_type": "full_case_report",
  "title": "冷却泵异常案例资料",
  "summary": "缺少实际维修反馈或验收",
  "status": "incomplete",
  "persisted": false,
  "validation_findings": [
    "缺少维修反馈或维修验收"
  ]
}
```
