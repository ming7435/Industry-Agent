---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- 报警定义与实际根因分开；字典命中不是零件损坏的证明。
- 当前运行观测优先于历史相似案例；目录严重等级可表明风险，但不能证明对应物理状态。
- 存在多个合理原因时在 diagnosis 保留条件及补查建议，不给没有来源的排他结论。

原有约束继续适用：报警定义不能直接证明零件损坏。低置信度、证据不足或需要复核时不能自动派工；本技能无停机、启动或工单写入权限。

## 工具使用规范（Tools）

声明白名单在 YAML。诊断代码还合并基础只读工具，快照缺失可增加 get_device_status；runtime_managed 会移除知识工具交外部 Runtime。此处写清现状，不通过文档增加工具。每次调用仍须 Guard 检查原名、参数、重复请求与上下文。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `get_alarm_definition` | 事件有明确报警码时，传 alarm_code；设备编号由执行上下文保留，不塞入模型工具参数。 | 先查 found/success，再读取 name/description/severity/recommended_action；定义解释报警，不证明根因。 |
| `get_device_history` | 存在趋势或需对比当前指标时，传 device_id，可选 metric_keys/metric、alarm_code、limit（3–120）。 | 读取 history/series/sample_count/trend/metric_definitions；空样本与失败分别保留，不生成历史曲线。 |
| `get_device_logs` | 需要运行上下文时传 device_id，可选 limit/log_types。 | 当前实现是 source=device-log-mcp-compatible 的本地兼容摘要，并非真实 PLC 日志；不得当实测证据。 |
| `search_knowledge` | 互补检索且权限允许时传非空 query，可选 limit（1–50）、filters。 | 读取 documents/answer 和 backend_status/degraded/retrieval_fallback；相似度不是诊断置信度，失败保留真实状态。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
