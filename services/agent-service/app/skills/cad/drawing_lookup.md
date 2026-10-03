---
name: drawing_lookup_skill
aliases: [part_search_skill]
version: 1.1
goal: 定位设备零部件、安装位置及工程图纸，验证它们的设备归属。
trigger: part_or_component
steps:
  - normalize_query
  - classify_engineering_request
  - resolve_part
  - plan_engineering_query
  - resolve_bom
  - merge_engineering_context
  - validate_engineering_context
  - build_result
tools:
  - query_part
  - query_drawing
  - query_bom
  - query_relation
  - fetch_engineering_record
---

# 工程图纸与零部件定位

## 触发与范围

收到部件、零件号、安装位置、BOM 或工程图纸查询时使用。旧名称 `part_search_skill` 解析到本定义，不再重复执行。

设备、机型、部件和零件号贯穿查询；指定设备后不得退化为全库查找。编号精确匹配，名称使用 CAD 服务的既有模糊匹配规则。

## 实际执行步骤

1. `normalize_query`：归一化结构化查询条件。
2. `classify_engineering_request`：加载本技能及既有工具范围。
3. `resolve_part`：区分 BOM、安装位置、装配关系和部件查询。
4. `plan_engineering_query`：选择实际查询顺序。
5. `resolve_bom`：逐次调用零部件、图纸、BOM、关系工具，不虚构查询结果。
6. `merge_engineering_context`：合并零件、图纸、关系与位置证据。
7. `validate_engineering_context`：核对工程记录完整性及设备归属。
8. `build_result`：返回已验证的定位结果或明确的数据不足。

## 工具边界

仅允许顶部五个工程查询工具。部件定位和图纸检索共用实现，不授权库存写入、维修派工或设备控制。无工程证据时不以演示数据替代。
