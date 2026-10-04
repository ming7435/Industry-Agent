---
name: drawing_lookup_skill
aliases: [part_search_skill, bom_analysis_skill]
version: 1.2
goal: 定位设备零部件、安装位置及工程图纸，验证它们的设备归属。
trigger: part_or_component
triggers: [part_or_component, bom]
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

运行标识：`drawing_lookup_skill`。定位设备零部件、安装位置及工程图纸，验证它们的设备归属。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

查询部件、零件号、安装位置、工程图纸、BOM 或装配关系时使用；旧名 `part_search_skill` 与 `bom_analysis_skill` 为兼容别名，多触发只激活一次。

## 输入与前置条件

- 设备、机型、部件/组件、`part_no` 与查询类型等实际条件。
- 编号精确匹配，名称沿用 CAD 服务明确的模糊规则；查询过程中保留设备归属。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `normalize_query`：归一化问题与结构化筛选条件。
- `classify_engineering_request`：加载工程查询技能并整理请求范围。
- `resolve_part`：识别部件、BOM、位置或装配查询类型。
- `plan_engineering_query`：安排当前工程问题的查询顺序。
- `resolve_bom`：逐次执行工程查询计划，包含适用的 BOM 等查询。
- `merge_engineering_context`：合并零件、图纸、装配、关系和位置证据。
- `validate_engineering_context`：核对工程记录完整性与设备归属。
- `build_result`：组装真实处理结果及不足、失败或停止原因。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `query_part`：查询对应设备零部件。
- `query_drawing`：查询工程图纸。
- `query_bom`：查询物料清单。
- `query_relation`：查询部件、装配或位置关系。
- `fetch_engineering_record`：读取结构化工程记录。

## 输出与停止条件

输出工程定位、零件、图纸、BOM、关系与位置证据，或明确的不足/不可用；返回对象仍保留请求设备归属。

## 安全边界

指定设备无结果不能悄悄改查全库；不使用无关演示模型填结果，不授权库存写入、维修派工或设备控制。

## 代码入口

- [cad Agent 入口](L:/industry_agent/services/agent-service/app/agents/cad/agent.py)：输入转换、技能选择与结果校验。
- [cad Graph 实现](L:/industry_agent/services/agent-service/app/agents/cad/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
