---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- 可用数量必须为有限正数且不是布尔值；available=False阻断，没有数量时需明确available=True。
- 当前兼容库存会返回synthetic/degraded/demo_only，不能拿示例stock成为正式派单依据。
- 有库存不等于诊断已证明损坏；核查阶段不预留、扣减或领用库存。

原有约束继续适用：这只是查询分析，不预约、扣减或消耗库存，不编造库存数量或替代型号。

## 工具使用规范（Tools）

仅在当前技能合并白名单与实际维修范围内使用工具。知识及CAD的协作读取由既有Agent/Runtime链路负责，不因正文新增对应工具。方案生成、库存读取、模板和草稿提交分开说明，不把后者当正式派单。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `query_inventory` | 确需备件核查时传 query，可选 device_id。 | 读取 parts/stock/source 与 synthetic/degraded/inventory_status；demo_only 不能成为正式库存依据。 |
| `query_part_availability` | 已有备件目标时传 query，可选 device_id/part_no。 | 读取 available/parts/source；available=False 或数量无效阻断，不能替换成固定可用数量。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
