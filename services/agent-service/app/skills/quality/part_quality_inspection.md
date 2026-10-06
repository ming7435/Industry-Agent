---
name: part_quality_inspection_skill
version: 1.0
goal: 对生产零件的尺寸、外观、材料、功能和工艺进行综合质量检测。
trigger: part_quality
steps:
  - load_part
  - load_inspection_plan
  - inspect_dimensions
  - inspect_appearance
  - inspect_material
  - inspect_function
  - inspect_process
  - validate_part
  - identify_part
  - determine_pass_fail
  - build_result
  - create_quality_check
  - create_closure_task
  - complete_closure_task
  - submit_quality_appeal
  - resolve_quality_appeal
  - reinspect_quality_check
  - release_quality_check
  - close_quality_check
tools:
  - create_quality_check
  - get_production_part
  - get_part_specification
  - inspect_part_dimensions
  - inspect_part_appearance
  - inspect_part_material
  - inspect_part_function
  - inspect_part_process
  - create_closure_task
  - complete_closure_task
  - submit_quality_appeal
  - resolve_quality_appeal
  - reinspect_quality_check
  - release_quality_check
  - close_quality_check
---

# 生产零件综合质检

运行标识：`part_quality_inspection_skill`。对生产零件的尺寸、外观、材料、功能和工艺进行综合质量检测。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

对生产零件或批次执行综合质量检测时使用，覆盖尺寸、外观、材料、功能、工艺追溯五类。

## 输入与前置条件

- `part_id`/`part_no` 等生产零件身份，按需提供批次与生产单。
- 有效检验规格、实际测量与检测记录；本次使用的是零件质量，不是设备维修恢复数据。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `load_part`：读取零件及生产归属信息。
- `load_inspection_plan`：取得零件适用检验规格和计划。
- `inspect_dimensions`：收集尺寸测量值并与有效规格比较。
- `inspect_appearance`：收集生产零件外观检测记录。
- `inspect_material`：核对材料检测信息与规格。
- `inspect_function`：收集生产零件功能测试记录。
- `inspect_process`：核对生产工艺与追溯记录。
- `validate_part`：核对零件身份、规格、数据完整性和可信来源。
- `identify_part`：核对生产零件、批次及生产归属。
- `determine_pass_fail`：按实际规格与完整、可信检测数据形成判断。
- `build_result`：组装真实处理结果及不足、失败或停止原因。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `get_production_part`：读取生产零件记录。
- `get_part_specification`：读取生产零件规格。
- `inspect_part_dimensions`：取得尺寸检测结果。
- `inspect_part_appearance`：取得外观检测结果。
- `inspect_part_material`：取得材料检测结果。
- `inspect_part_function`：取得功能检测结果。
- `inspect_part_process`：取得工艺追溯检测结果。

## 输出与停止条件

输出五类检测项与整体质量结果，保留数据不足、未检测和证据来源。规格或必需数据缺失不能默认合格。

## 安全边界

单个 `passed=true` 不能替代完整可信检测；synthetic/degraded 不作为生产验收。失败后的整改、复检、放行和关闭由 Backend 闭环处理。

## 闭环执行

服务端闭环入口让同一 Quality Agent 执行本次选择的一个真实动作，并调用同名 Backend 工具：创建整改、提交整改记录、申诉、处理申诉、引用新检测复检、再次校验放行、关闭。每一步的输入、输出、技能标识与工具调用都归入原检测轨迹。复检和放行仍以 Backend 的事务门禁为准，客户端不能通过参数自行授权闭环路径。

## 代码入口

- [quality Agent 入口](L:/industry_agent/services/agent-service/app/agents/quality/agent.py)：输入转换、技能选择与结果校验。
- [quality Graph 实现](L:/industry_agent/services/agent-service/app/agents/quality/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
