---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- 读键为experience_id/source_workorder/device_id/content，写键为device_id/fault/source_workorder；不能统一成只看工单号。
- 缺learning_idempotency_key可能产生随机ID，不保证命中原记录的部分保存恢复。
- duplicate不等于新增保存；writer可memory_saved=False而rag_saved按实情，分别返回。

原有约束继续适用：不直接调用注册工具，也不单独执行新增、删除工单或设备控制；去重不能隐藏部分保存失败。

## 工具使用规范（Tools）

按YAML白名单。Memory Graph主要通过experience_module/long_memory/store读写，不是每次执行注册MCP工具。tools=[]的学习仍有内部存储副作用，不能理解为只读。模型不能自行增加ingest/delete等工具。

YAML tools=[]，不授权注册工具调用。内部路由/记忆存储操作由代码执行；空工具表不代表该 Agent 绝对无副作用，按下面业务边界判断。

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
