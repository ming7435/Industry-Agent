---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- 准入需passed严格True、source=device_recovery、device_recovery/checks对象，device_identity/operational/alarms_clear/metrics_available均True，状态未失败。
- 质量评分≥0.8且无阻断项才接纳：closed+feedback 0.45，content 0.15，未失败维修0.20，可信确认0.20；递归synthetic/degraded阻断。
- learning_idempotency_key产生稳定EXP-ID；memory_saved与rag_saved各自有实际回执，RAG的pipeline_ready=False不能被success=True覆盖。

原有约束继续适用：不授予 `get_workorder` 或工单/控制工具权限。现有经验模块完成去重、验证和保存；tools 为空不表示该路径没有持久化副作用。

## 工具使用规范（Tools）

按YAML白名单。Memory Graph主要通过experience_module/long_memory/store读写，不是每次执行注册MCP工具。tools=[]的学习仍有内部存储副作用，不能理解为只读。模型不能自行增加ingest/delete等工具。

YAML tools=[]，不授权注册工具调用。内部路由/记忆存储操作由代码执行；空工具表不代表该 Agent 绝对无副作用，按下面业务边界判断。

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
