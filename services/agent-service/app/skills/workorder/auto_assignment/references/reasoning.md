---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- responsible_device_ids明确空或格式错误不扩大资格；仅旧账号缺该字段可按primary_device_id兼容。
- 无候选等待登录，人员查询失败单独标记，不从固定人员列表凑成功。
- 当前候选dispatch_score统一100，技能和班次可not_recorded，不能对外宣称已做多维优化匹配。

原有约束继续适用：一个小组与监督角色不等于任何用户都能确认修复。没有真实派工依据不能为了成功返回而补演示名单。

## 工具使用规范（Tools）

允许工具不等于每次都调用。创建、查询、派发、反馈、完成、重开分别执行真实业务动作；正式写入由Backend返回权威工单。Runtime/Harness和Backend共同控制权限、幂等及状态，不接受模型自报批准。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `query_technicians` | 需为本设备找负责人时传 device_id，可选 component/priority。 | 读取 success/items、登记负责范围/online/available/workload；目录失败与无人在线分开。 |
| `query_technician_skills` | 补充人员信息时传 technician_id。 | items/status=not_recorded 保留未登记事实；当前排序不使用技能加权评分。 |
| `query_technician_workload` | 候选存在时传 technician_id。 | 读取 items.workload；真实排序用负载和编号，不编造低负载人员。 |
| `query_shift` | 需班次背景时传 device_id。 | 当前可返回 not_recorded；不是已落实班次依据，不擅自补齐班次。 |
| `query_team_availability` | 需小组可用信息时传 device_id，可选 component。 | 读取 available/available_count/team；不能取消设备负责关系和在线资格。 |
| `assign_workorder` | 已指定合格负责人时传 workorder_id/assignee。 | 返回权威工单，Backend 再核验资格和必要库存；失败保留原工单，不宣称派发。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
