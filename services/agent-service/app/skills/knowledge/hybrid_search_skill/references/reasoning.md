---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- 多个来源一致也需判断是否其实引用同一资料，不累加重复可信度。
- 解释、步骤和案例有不同用途；单有报警目录不能标记完整维修依据。
- answer不等于证据融合验收；明确模型回答与原文摘录的区别。

原有约束继续适用：候选数量和相关性分数不能证明答案正确；不暗中跳过 Model 服务直连供应商，不执行业务写入。

## 工具使用规范（Tools）

仅使用当前合并白名单。计划中的工具未获授权时应保留拒绝结果；不能因 fallback 想查 search_knowledge 而扩大专业技能权限。普通命中不自动 fetch，必须有明确编号。Runtime/Harness 传递执行上下文；直接 run 的状态工具列表不能等同完整授权边界。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `search_knowledge` | 互补检索且权限允许时传非空 query，可选 limit（1–50）、filters。 | 读取 documents/answer 和 backend_status/degraded/retrieval_fallback；相似度不是诊断置信度，失败保留真实状态。 |
| `search_sop` | 需要作业规程时传 query，可选 limit/filters。 | 设置 sop 类型并移除报警码过滤；检查正文和适用设备，不把标题当可执行步骤。 |
| `search_manual` | 需要设备说明书时传 query，可选 limit/filters。 | 设置 manual 类型并移除报警码过滤；页码/机型/正文可用才支撑具体步骤。 |
| `search_fault_cases` | 需要历史案例时传 query，可选 limit/filters。 | 设置 case 类型并移除报警码过滤；作为间接参考，不证明当前故障已经修复。 |
| `search_semantic_memory` | 需要互补历史知识时传非空 query，可选 limit（1–50）/filters。 | 实现会移除 knowledge_type/alarm_code 过滤，不能声称仅命中已验收经验；当前 Memory Graph 主要使用内部存储检索。 |
| `fetch_document` | 请求明确 document_id 时传 document_id。 | 读取实际文档及来源；搜索命中不会自动触发全文获取，空正文不能补造操作规范。 |
| `fetch_chunk` | 已知 document_id 与 chunk_id 时传两个编号。 | 保留片段归属和来源；缺任一编号拒绝，无法取得片段不伪装全文。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
