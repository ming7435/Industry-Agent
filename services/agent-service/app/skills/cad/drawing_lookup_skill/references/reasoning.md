---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- 部件为空即不足；普通component需零件号和图纸，BOM需编号与BOM，装配需关系，位置需位置证据。
- 编号精确、名称模糊规则独立；相似名字不授权跨设备复用。
- 图纸显示可用与部件精确定位可用是两件事，不能因总图能打开而宣称故障部件已定位。

原有约束继续适用：指定设备无结果不能悄悄改查全库；不使用无关演示模型填结果，不授权库存写入、维修派工或设备控制。

## 工具使用规范（Tools）

只使用EngineeringArguments真实字段request_id/query/device_id/device_model/component/component_id/part_no，条件优先part_no→component→query；编号精确、名称按CAD服务规则匹配。声明fetch_engineering_record不表示默认计划必调。工程读取与建模执行不得混用。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `query_part` | 需定位零件时传 query/device_id/device_model/component/component_id/part_no 中已有条件。 | 读取 parts，指定设备必须有一致 device_id；编号精确匹配，空结果不改查无关设备。 |
| `query_drawing` | 已确定工程范围时传同一组工程条件。 | 读取 drawings，核对图纸和部件身份；设备总图不等于故障部件工程证据。 |
| `query_bom` | 需物料清单时传同一组工程条件。 | 读取 components/bom_items；保留数量、部件和设备归属，不能用相似名称合并不同编号。 |
| `query_relation` | 需装配或位置关系时传同一组工程条件。 | 读取 assembly_relations/relations/locations，核对两端实体与设备，失败不补造连接关系。 |
| `fetch_engineering_record` | 需要完整工程记录且入口实际调用时传已有工程条件。 | 权限允许但常规 CAD 查询计划不会自动调用；使用真实记录而非演示替代。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
