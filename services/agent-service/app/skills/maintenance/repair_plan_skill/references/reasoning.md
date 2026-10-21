---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- 主报警优先，正常温度等背景文字不能把刀塔或互锁故障改成主轴温度故障。
- 只读互锁核查不得升级为拆换部件；液压停机核查必须有同一来源覆盖液压、油位、泄漏和压力的依据。
- 必须区别推荐维修与maintenance_required事实；不足时说明待核实项而非自动形成正式工单。

原有约束继续适用：方案与正式工单分离；允许的草稿工具不代表正式派工权限。正文不会新增工具或绕过 diagnosis 与 workorder 业务门禁。

## 工具使用规范（Tools）

仅在当前技能合并白名单与实际维修范围内使用工具。知识及CAD的协作读取由既有Agent/Runtime链路负责，不因正文新增对应工具。方案生成、库存读取、模板和草稿提交分开说明，不把后者当正式派单。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `generate_repair_plan` | 诊断范围已整理时传 diagnosis。 | 读取 fault/repair_steps/safety 草案，还需后续证据与安全校验；工具草案不是已批准方案。 |
| `query_inventory` | 确需备件核查时传 query，可选 device_id。 | 读取 parts/stock/source 与 synthetic/degraded/inventory_status；demo_only 不能成为正式库存依据。 |
| `query_part_availability` | 已有备件目标时传 query，可选 device_id/part_no。 | 读取 available/parts/source；available=False 或数量无效阻断，不能替换成固定可用数量。 |
| `get_workorder_template` | 需要草稿或正式创建参考时传 device_id，可选 plan。 | 读取 template_id/title/steps/source；是模板，不是已创建的维修任务。 |
| `submit_workorder_draft` | 方案 workorder_ready 且 constraints.need_workorder 时传已构造草稿。 | 读取 draft_id/submitted/source；草稿提交不等于正式创建、派发或完成。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
