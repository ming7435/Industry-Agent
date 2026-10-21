---
name: contract
title: 输入契约与真实示例
when: 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。
order: 3
---

## 输入与前置条件（Inputs）

常规 QualityQuery：inspection_type/action、task_id/trace_id/device_id/event_id、part_id/part_no/part_name/batch_id/production_order_id、part/inspection_plan/measurements/inspection_results/specifications/production_context。from_payload强制part_quality/inspect_part并补齐身份；身份和实测须从真实生产记录核实。production_context可约束comparison_scope、expected_design_run_id、expected_design_digest、expected_recorded_at，不能自行扩大权限或替换设计标准。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "part_id": "PART-EXAMPLE",
  "production_context": {
    "comparison_scope": "cad_parameters",
    "expected_design_run_id": "FC-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "expected_design_digest": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
  }
}
```

### 处理与依据

假设权威长方体标准有长宽高，但生产测量缺height：保留数据不足，不能默认相同。

### 示例输出

```json
{
  "part_id": "PART-EXAMPLE",
  "comparison_scope": "cad_parameters",
  "passed": false,
  "qualified": false,
  "status": "insufficient_data",
  "quality_validation": {
    "dimensions": {
      "passed": false,
      "sufficient_data": false
    }
  },
  "findings": [
    "缺少完整实测参数"
  ],
  "stop_reason": "validator_fail"
}
```
