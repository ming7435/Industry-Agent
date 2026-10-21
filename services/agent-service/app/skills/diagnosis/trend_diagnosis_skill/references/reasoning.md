---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- 必须区分次数、持续时间和样本趋势，不用报警频率替代物理指标变化。
- 检查缺失值、采样质量与单位；工具给的 direction 只描述该样本窗，不推广为长期因果。
- 用当前事实复核历史候选；窗口过短或样本空时保留不确定性。

原有约束继续适用：不编造历史曲线或采样值，不把缓慢变化直接宣布为严重故障，不修改监控阈值。

## 工具使用规范（Tools）

声明白名单在 YAML。诊断代码还合并基础只读工具，快照缺失可增加 get_device_status；runtime_managed 会移除知识工具交外部 Runtime。此处写清现状，不通过文档增加工具。每次调用仍须 Guard 检查原名、参数、重复请求与上下文。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `get_device_history` | 存在趋势或需对比当前指标时，传 device_id，可选 metric_keys/metric、alarm_code、limit（3–120）。 | 读取 history/series/sample_count/trend/metric_definitions；空样本与失败分别保留，不生成历史曲线。 |
| `get_device_logs` | 需要运行上下文时传 device_id，可选 limit/log_types。 | 当前实现是 source=device-log-mcp-compatible 的本地兼容摘要，并非真实 PLC 日志；不得当实测证据。 |
| `search_knowledge` | 互补检索且权限允许时传非空 query，可选 limit（1–50）、filters。 | 读取 documents/answer 和 backend_status/degraded/retrieval_fallback；相似度不是诊断置信度，失败保留真实状态。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
