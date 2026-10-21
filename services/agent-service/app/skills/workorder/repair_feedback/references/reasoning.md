---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- 完成需要已派工且开始、实际反馈，以及设备身份/可运行状态/报警清除/指标/新鲜度恢复数据。
- passed=true不能自证；inspection只读核查任务不提供维修完成证明。
- 工具反馈参数feedback来自输入repair_feedback；身份确认和复机有另行受保护链路，不能宣称本工具自行验证登录人。

原有约束继续适用：被派工人确认、恢复验收和虚拟复机另由业务链路核对；不因提交反馈就无条件启动整条产线。

## 工具使用规范（Tools）

允许工具不等于每次都调用。创建、查询、派发、反馈、完成、重开分别执行真实业务动作；正式写入由Backend返回权威工单。Runtime/Harness和Backend共同控制权限、幂等及状态，不接受模型自报批准。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `submit_repair_feedback` | 执行反馈时传 workorder_id/feedback。 | 保存权威反馈；in_progress/awaiting_verification 下允许，不自动变成已完成。 |
| `mark_repair_completed` | 维修完成动作传 workorder_id/feedback/repair_verification。 | 必须有真实设备恢复数据，单独 passed=true 无效；不能把完成等同复机授权。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
