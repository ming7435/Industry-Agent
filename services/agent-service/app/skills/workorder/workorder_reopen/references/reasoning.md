---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- closed/rejected/timeout可到open，open同态可保留；completed回到in_progress是另一合法更新，不等于reopen。
- 保留已冻结的关闭/诊断/方案/验收事实，不修改历史来证明新操作完成。
- 旧审批只绑定旧动作，不为重开或新参数自动授权。

原有约束继续适用：只授权重开与读取，不直接创建新单、派工、完成或控制设备；不能利用旧审批授权新动作。

## 工具使用规范（Tools）

允许工具不等于每次都调用。创建、查询、派发、反馈、完成、重开分别执行真实业务动作；正式写入由Backend返回权威工单。Runtime/Harness和Backend共同控制权限、幂等及状态，不接受模型自报批准。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `reopen_workorder` | 已有工单合法重开时传 workorder_id。 | 实际目标状态 open；closed/rejected/timeout 可重开，不直接改派或创建新单。 |
| `get_workorder` | 明确工单编号时传 workorder_id。 | 读取 found/工单状态与事实；不存在和传输失败都不能用缓存成功替代。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
