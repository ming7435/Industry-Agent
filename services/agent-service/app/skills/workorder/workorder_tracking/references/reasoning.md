---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- open可到in_progress/rejected/timeout；in_progress可到awaiting_verification/rejected/timeout；awaiting_verification可到completed/in_progress；completed可到closed/in_progress；closed/rejected/timeout可到open，均允许同态。
- in_progress必须有负责人；退回处理和完成关闭另需验证条件，prestart验证不能替代运行复核关闭。
- 空列表是成功查询，单单未找到可success=False但stop_reason=completed，不伪造不存在的not_found枚举。

原有约束继续适用：受 Backend 状态迁移约束。工单存在不是更新成功证明；写操作超时不盲目重复，不能以通用更新绕过可信验收。

## 工具使用规范（Tools）

允许工具不等于每次都调用。创建、查询、派发、反馈、完成、重开分别执行真实业务动作；正式写入由Backend返回权威工单。Runtime/Harness和Backend共同控制权限、幂等及状态，不接受模型自报批准。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `get_workorder` | 明确工单编号时传 workorder_id。 | 读取 found/工单状态与事实；不存在和传输失败都不能用缓存成功替代。 |
| `query_workorder` | 旧入口兼容读取，传 workorder_id。 | 兼容 get_workorder；当前 Graph 不必调用该别名，不能重复读取算两份证据。 |
| `update_workorder` | 合法状态更新传 workorder_id/status/assignee。 | 以 Backend 迁移表和验收规则为准；当前 Agent 不透传任意验证字段，不以存在工单判定更新成功。 |
| `list_workorders` | 列表查询时传可选 device_id/status。 | items=[] 是真实空列表，不是传输失败，不补演示任务。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
