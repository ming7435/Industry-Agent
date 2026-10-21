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
  "report_type": "diagnosis_report",
  "persist": false,
  "diagnosis": {
    "device_id": "CNC-01",
    "fault": "主轴振动异常"
  }
}
```

### 处理与依据

假设所给诊断满足正文校验：仅返回正文契约，persist=False且无文件请求，因此没有PDF或已保存事实。

### 示例输出

```json
{
  "report_id": "RPT-EXAMPLE",
  "report_type": "diagnosis_report",
  "title": "主轴振动诊断资料",
  "summary": "示例已有诊断资料汇总，未生成文件",
  "status": "completed",
  "persisted": false,
  "file_path": "",
  "sections": {
    "diagnosis": {
      "device_id": "CNC-01",
      "fault": "主轴振动异常"
    }
  },
  "source_refs": [
    {
      "section": "diagnosis",
      "type": "diagnosis",
      "id": "",
      "source": "request",
      "label": "示例输入诊断"
    }
  ]
}
```
