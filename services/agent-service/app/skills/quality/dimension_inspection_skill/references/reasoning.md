---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- cad_parameters使用Decimal严格一致，完整参数集以及choice/edge_set规则；不是制造公差判定。
- scope由权威part.comparison_scope决定，production_context只能约束版本不能授权改范围。
- 少测一项为insufficient_data，测得不一致为fail，不能因其余项目相同算合格。

原有约束继续适用：未检测、缺规格或演示数据不能当作真实合格。此技能不新增其他检测或放行工具，不替代综合 Quality 门禁。

## 工具使用规范（Tools）

以服务端确认的范围决定实际调用，不把所有允许工具都写成每次执行。常规inspect读取权威零件及标准；create_quality_check/整改/申诉/复检/放行/关闭需要私有闭环授权，不能由JSON字段伪造。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `get_production_part` | 生产身份已知时传 part_id/part_no/batch_id/production_order_id 和 part。 | 核对 success/found/identity_verified、身份及 synthetic/degraded；客户端数据不能替代权威生产记录。 |
| `get_part_specification` | 已取得可信生产记录时传 part。 | 读取 specifications/source；缺少必需规格为数据不足，不默认合格。 |
| `inspect_part_dimensions` | 有权威 part 和标准时传 part/measurements/specifications。 | 核对 items/status/passed/sufficient_data；cad_parameters 为完整参数精确比较，缺项与超差分别表达。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
