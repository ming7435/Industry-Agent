---
name: contract
title: 输入契约与真实示例
when: 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。
order: 3
---

## 输入与前置条件（Inputs）

MaintenanceQuery 接收 task_id/trace_id、device_id、user_text/query、diagnosis_result/diagnosis、knowledge/cad/memory、constraints、runtime_managed、event/context。from_payload互补两种诊断字段。没有顶层 part_no/component/maintenance_plan 输入，零件目标来自 query、诊断及工程记录。实际 DiagnosisView 需 device_id/fault/cause/severity；扩展 evidence_status 等保留在 raw。缺失事实不能以默认字段值证明已核实。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "device_id": "D-1",
  "query": "零件 CP-TC820-015 库存",
  "diagnosis_result": {
    "device_id": "D-1",
    "fault": "主轴温度异常",
    "cause": "待核实",
    "severity": "high",
    "confidence": 0.5,
    "raw": {
      "evidence_status": "insufficient"
    }
  }
}
```

### 处理与依据

示例兼容库存有数量但为demo_only：如实保留标记，不能把方案改成可正式派工。

### 示例输出

```json
{
  "plan_id": "PLAN-EXAMPLE",
  "diagnosis": {
    "device_id": "D-1",
    "fault": "主轴温度异常",
    "cause": "待核实",
    "severity": "high",
    "confidence": 0.5,
    "raw": {
      "evidence_status": "insufficient"
    }
  },
  "workorder_ready": false,
  "validation_findings": [
    "当前证据不足，方案暂未就绪"
  ],
  "inventory_status": {
    "synthetic": true,
    "degraded": true,
    "inventory_status": "demo_only",
    "parts": [
      {
        "part_no": "CP-TC820-015",
        "stock": 2,
        "synthetic": true
      }
    ]
  }
}
```
