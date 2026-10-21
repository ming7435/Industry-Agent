---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- prepared只表示准备完成，不是机器正在生产。
- 必须核对program_digest和原job归属；相同ID不同参数不是幂等重试。
- output只能来自工厂completed任务回执；模拟比较独立执行，不自动宣布合格。

## 工具使用规范（Tools）

prepare内部使用command_id/run/setup/material；submit/start恰为job_id/digest；sync恰为job_id。私有上下文绑定人员、动作和参数，不能由JSON自称通过。所有四工具local_only，不对模型开放任意生产命令。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `prepare_virtual_production` | 服务端核实人员与已校验设计后传 command_id/run/setup/material，可选 batch_id。 | 返回稳定 job_id/program_digest/status=prepared；准备不是下发或启动。 |
| `submit_virtual_production` | 已准备且摘要匹配，参数恰为 job_id/digest。 | 使用工厂原任务回执；已接收仅同步，未知不重放。 |
| `start_virtual_production` | 已接收且允许运行，参数恰为 job_id/digest。 | 读取原任务 status/progress；running/completed/未知只核对，禁止替代任务。 |
| `sync_virtual_production` | 需只读核对原任务时参数恰为 job_id。 | 读取 receipt/status/sync_status/output；读取失败不启动设备，不伪造模拟产出。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
