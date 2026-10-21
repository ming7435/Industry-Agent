---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- 当前排序是词包含计数，不是向量重排；元数据允许search_semantic_memory但Graph没有实际调用它。
- 检索结果可信性主要靠保存准入及后端；没有validation_status过滤事实就不补标签。
- 同ID/工单/设备/content全同才读去重，不把不同内容悄悄丢弃。

原有约束继续适用：只允许已有语义查询工具；recent 可由现有记忆模块读最近记录，不补写历史，不因问题出现“学习”而获得写权限。

## 工具使用规范（Tools）

按YAML白名单。Memory Graph主要通过experience_module/long_memory/store读写，不是每次执行注册MCP工具。tools=[]的学习仍有内部存储副作用，不能理解为只读。模型不能自行增加ingest/delete等工具。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `search_semantic_memory` | 需要互补历史知识时传非空 query，可选 limit（1–50）/filters。 | 实现会移除 knowledge_type/alarm_code 过滤，不能声称仅命中已验收经验；当前 Memory Graph 主要使用内部存储检索。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
