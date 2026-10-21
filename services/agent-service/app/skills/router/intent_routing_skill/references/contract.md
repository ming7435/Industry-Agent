---
name: contract
title: 输入契约与真实示例
when: 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。
order: 3
---

## 输入与前置条件（Inputs）

RouterAgent.run接收字符串或{user_text,context}映射；可使用共享AgentTask（task_id/user_text/event/context）model_dump后提交，没有RouterInput类。user_text用于关键词及实体解析，context可提供已知业务身份；缺工单/零件等关键实体不得从上一任务猜填。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "task_id": "TASK-EXAMPLE",
  "user_text": "查询工单WO-123状态",
  "context": {
    "device_id": "CNC-01"
  }
}
```

### 处理与依据

按既有规则提取工单编号并路由查询；示例结果只描述路由，不宣称查询到该工单。

### 示例输出

```json
{
  "intent": "workorder_query",
  "target_agent": "workorder",
  "confidence": 0.95,
  "reason": "明确工单查询与编号",
  "entities": {
    "workorder_id": "WO-123",
    "device_id": "CNC-01"
  },
  "target_input": {
    "action": "query",
    "workorder_id": "WO-123",
    "device_id": "CNC-01"
  }
}
```
