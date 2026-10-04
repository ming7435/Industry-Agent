---
name: dimension_inspection_skill
version: 1.0
goal: 对生产零件的关键尺寸执行专项质量检测。
trigger: part_quality
steps:
  - load_part
  - load_inspection_plan
  - inspect_dimensions
  - validate_part
tools:
  - get_production_part
  - get_part_specification
  - inspect_part_dimensions
---

# 尺寸专项质检

运行标识：`dimension_inspection_skill`。对生产零件的关键尺寸执行专项质量检测。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

需要核对生产零件关键尺寸时使用，按既有 `part_quality` 条件选择；可能与综合质检一起激活。

## 输入与前置条件

- 零件身份、有效尺寸规格与对应测量记录。
- 测量单位、允许范围和实际值来自有效资料，不由模型猜测。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `load_part`：读取零件及生产归属信息。
- `load_inspection_plan`：取得零件适用检验规格和计划。
- `inspect_dimensions`：收集尺寸测量值并与有效规格比较。
- `validate_part`：核对零件身份、规格、数据完整性和可信来源。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `get_production_part`：读取生产零件记录。
- `get_part_specification`：读取生产零件规格。
- `inspect_part_dimensions`：取得尺寸检测结果。

## 输出与停止条件

输出尺寸检查及数据完整性判断；只有尺寸结果不能证明外观、材料、功能和工艺都合格。

## 安全边界

未检测、缺规格或演示数据不能当作真实合格。此技能不新增其他检测或放行工具，不替代综合 Quality 门禁。

## 代码入口

- [quality Agent 入口](L:/industry_agent/services/agent-service/app/agents/quality/agent.py)：输入转换、技能选择与结果校验。
- [quality Graph 实现](L:/industry_agent/services/agent-service/app/agents/quality/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
