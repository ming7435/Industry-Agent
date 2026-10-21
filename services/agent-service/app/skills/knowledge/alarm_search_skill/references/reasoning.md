---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- 报警目录给编号含义，不给当前故障确定原因。
- 跨设备降级命中必须明示作用范围，不能替换本设备原始字典。
- 报警知识缺少SOP时只返回解释与不足，下游另检索维修规程。

原有约束继续适用：允许通用 `search_knowledge` 作为既有检索补充；模型不得自行移除设备限制。后端现有明确的空结果回退可能扩大范围，须保留 retrieval_scope、retrieval_fallback 与原因并标为跨设备参考，不能冒充本设备证据；不得写工单或控制设备。

## 工具使用规范（Tools）

仅使用当前合并白名单。计划中的工具未获授权时应保留拒绝结果；不能因 fallback 想查 search_knowledge 而扩大专业技能权限。普通命中不自动 fetch，必须有明确编号。Runtime/Harness 传递执行上下文；直接 run 的状态工具列表不能等同完整授权边界。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `search_alarm_knowledge` | 需要准确报警资料时传 query、alarm_code，可选 limit/filters。 | 设置 alarm 知识类型，核对实际报警与设备来源；未命中不自行发明定义。 |
| `search_knowledge` | 互补检索且权限允许时传非空 query，可选 limit（1–50）、filters。 | 读取 documents/answer 和 backend_status/degraded/retrieval_fallback；相似度不是诊断置信度，失败保留真实状态。 |
| `fetch_document` | 请求明确 document_id 时传 document_id。 | 读取实际文档及来源；搜索命中不会自动触发全文获取，空正文不能补造操作规范。 |
| `fetch_chunk` | 已知 document_id 与 chunk_id 时传两个编号。 | 保留片段归属和来源；缺任一编号拒绝，无法取得片段不伪装全文。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
