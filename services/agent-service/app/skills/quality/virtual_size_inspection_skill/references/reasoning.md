---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- outer_diameter_mm/length_mm及适用inner_diameter_mm精确比较，缺值不默认等于设计。
- simulation_only/synthetic标记必须保留；模型不能把虚拟产出包装实测。
- 同任务同摘要重复检查先核验已保存check，不随机生成新结果。

## 工具使用规范（Tools）

仅inspect_virtual_output，参数集合恰为part_id/output_digest；私有context绑定actor/action/arguments并验证seal。不允许添加passed、测量覆盖或其它工具以制造成功。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `inspect_virtual_output` | 服务端绑定 inspect 权限，参数恰为 part_id/output_digest。 | 读取原始模拟 check 身份/items/status；只能比较已完成任务真实产出，不写正式放行。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
