---
name: contract
title: 输入契约与真实示例
when: 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。
order: 3
---

## 输入与前置条件（Inputs）

工程查询使用 CADQuery：request_id、device_id/device_model/component/part_no/query、max_steps（默认5，1–6）。不存在输入query_type；Graph按query识别BOM、位置、装配或部件。已有精确编号/设备范围全程保留，缺少名称可由fault/summary归一，不补造工程零件。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "device_id": "CNC-01",
  "part_no": "CP-TC820-015",
  "query": "查询该零件BOM",
  "max_steps": 4
}
```

### 处理与依据

假设指定设备无对应工程记录：保留设备与编号，返回不足，不退全库凑图。

### 示例输出

```json
{
  "query": "查询该零件BOM",
  "device_id": "CNC-01",
  "part_no": "CP-TC820-015",
  "query_type": "bom",
  "status": "insufficient_engineering_data",
  "validation_findings": [
    "缺少对应设备部件或BOM资料"
  ],
  "stop_reason": "cad_service_no_data"
}
```
