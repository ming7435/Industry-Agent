---
name: contract
title: 输入契约与真实示例
when: 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。
order: 3
---

## 输入与前置条件（Inputs）

专用A2A QualityRequest要求request_id/from_agent/to_agent，inspection_type=virtual_profile_dimensions_v1、part_id、output_digest；服务器另创建不可由客户端JSON伪造的virtual_context。常规QualityQuery.from_payload会强制part_quality，因此本分支不能先走该转换。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "request_id": "REQ-EXAMPLE",
  "from_agent": "router",
  "to_agent": "quality",
  "inspection_type": "virtual_profile_dimensions_v1",
  "part_id": "SIM-PART-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "output_digest": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
}
```

### 处理与依据

本例的可序列化请求由router发起；服务器已经核实操作者，并在调用前附加私有virtual_context（不能通过客户端JSON构造）。隔离后端返回已保存的模拟检测记录，数据不足；实际A2A与Quality Graph完成后外层success=true/status=completed，而quality_result.status=insufficient_data、passed=false、qualified=false。传输成功不等于检测合格。若缺私有上下文，实际端点抛A2AError，不返回此响应。

### 示例输出

```json
{
  "request_id": "REQ-EXAMPLE",
  "message_id": "A2A-RESP-8A809B51AEE0",
  "reply_to": "REQ-EXAMPLE",
  "task_id": "",
  "trace_id": "",
  "from_agent": "quality",
  "to_agent": "router",
  "source_agent": "quality",
  "target_agent": "router",
  "status": "completed",
  "success": true,
  "error": "",
  "payload": {
    "check_id": "SIM-CHECK-EXAMPLE",
    "part_id": "SIM-PART-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "output_digest": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "rule": "virtual_profile_dimensions_v1",
    "status": "insufficient_data",
    "items": [],
    "source": "factory-simulation",
    "simulation_only": true,
    "scope": "machining-zone"
  },
  "created_at": "2026-10-12T02:55:24.678755Z",
  "quality_result": {
    "check_id": "SIM-CHECK-EXAMPLE",
    "part_id": "SIM-PART-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "output_digest": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "rule": "virtual_profile_dimensions_v1",
    "status": "insufficient_data",
    "items": [],
    "source": "factory-simulation",
    "simulation_only": true,
    "scope": "machining-zone"
  },
  "inspection_type": "virtual_profile_dimensions_v1",
  "passed": false,
  "qualified": false,
  "defects": [],
  "rework_required": false,
  "validation_findings": [],
  "stop_reason": ""
}
```
