---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- 默认自动置信度门槛AUTO_WORKORDER_MIN_CONFIDENCE为0.80，还需非synthetic、无需人工复核、证据和维修必要性、workorder_ready通过。
- 固定预警inspection有独立严格门禁，不能将低置信度维修降级成普通检查绕过校验。
- 相同命令复用必须业务参数一致；负责人已存在不被创建时旧缓存覆盖。

原有约束继续适用：重复创建按业务身份对账，存在工单不等于本次更新已完成；审批和人员资格由服务端核对，不相信客户端自报授权。

## 工具使用规范（Tools）

允许工具不等于每次都调用。创建、查询、派发、反馈、完成、重开分别执行真实业务动作；正式写入由Backend返回权威工单。Runtime/Harness和Backend共同控制权限、幂等及状态，不接受模型自报批准。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `create_workorder` | 方案门禁通过后提交 device_id/title/plan_id/steps，以及事件、证据快照和幂等身份。 | 使用权威 workorder_id 和实际状态；已有工单不自动证明新动作已完成，超时先对账。 |
| `get_workorder_template` | 需要草稿或正式创建参考时传 device_id，可选 plan。 | 读取 template_id/title/steps/source；是模板，不是已创建的维修任务。 |
| `query_technicians` | 需为本设备找负责人时传 device_id，可选 component/priority。 | 读取 success/items、登记负责范围/online/available/workload；目录失败与无人在线分开。 |
| `query_technician_skills` | 补充人员信息时传 technician_id。 | items/status=not_recorded 保留未登记事实；当前排序不使用技能加权评分。 |
| `query_technician_workload` | 候选存在时传 technician_id。 | 读取 items.workload；真实排序用负载和编号，不编造低负载人员。 |
| `query_shift` | 需班次背景时传 device_id。 | 当前可返回 not_recorded；不是已落实班次依据，不擅自补齐班次。 |
| `query_team_availability` | 需小组可用信息时传 device_id，可选 component。 | 读取 available/available_count/team；不能取消设备负责关系和在线资格。 |
| `assign_workorder` | 已指定合格负责人时传 workorder_id/assignee。 | 返回权威工单，Backend 再核验资格和必要库存；失败保留原工单，不宣称派发。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
