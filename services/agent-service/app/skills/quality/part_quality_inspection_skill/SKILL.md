---
name: part_quality_inspection_skill
description: 当生产零件需要执行实际适用范围的检测，或受授权入口处理质检闭环时使用。
version: 1.0
goal: 按权威设计参数或适用检验范围检测生产零件，并支持受控质检闭环。
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
- read_skill_reference
---

# 零件适用范围质检与整改闭环

运行标识：`part_quality_inspection_skill`；所属 Agent：`quality`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

按权威设计参数或适用检验范围检测生产零件，并支持受控质检闭环。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

part_quality与尺寸技能共选；闭环operation仅受私有QUALITY_CLOSURE_AUTHORITY授权，常规inspect不依次执行所有闭环动作。

不适用：cad_parameters只比较参数，不声称外观/材料/功能/工艺均已检测；不能用客户端标记申请放行。

## 执行流程（Workflow）

### 公共编排

常规节点 prepare → load_input → inspect → validate_part → finish。load_input合并生产记录和标准读取；inspect只执行权威范围适用的检查。已验证part.comparison_scope=cad_parameters时只运行设计参数比较；旧普通范围才运行五类检查。identify_part/select_skills/determine_pass_fail/build_result等是追踪映射，不是新增节点。闭环操作和虚拟产出有另行受控入口，不自动遍历整改与放行工具。

保留的步骤标识：`load_part`、`load_inspection_plan`、`inspect_dimensions`、`inspect_appearance`、`inspect_material`、`inspect_function`、`inspect_process`、`validate_part`、`identify_part`、`determine_pass_fail`、`build_result`、`create_quality_check`、`create_closure_task`、`complete_closure_task`、`submit_quality_appeal`、`resolve_quality_appeal`、`reinspect_quality_check`、`release_quality_check`、`close_quality_check`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

核实生产记录及scope，cad_parameters只做dimensions，普通范围按五类实际检查；Validator合并真实项并返回。申诉/整改/复检/Release/Close另一次只执行获授权动作，引用持久化检测与整改记录，严守状态顺序。

## 输出规范（Output Format）

常规返回 QualityResult：inspection_type、part_id/part_no/part_name/batch_id/production_order_id/device_id、passed/status/qualified、inspection_items/measurements/specifications/comparison_scope/design_reference、defects/failed_checks/quality_validation/evidence/recommendation/findings/quality_check_id/stop_reason/checked_at。status为pass/fail/review/not_tested/insufficient_data；cad_parameters分支quality_validation只含dimensions，不补写其它四项通过。

## 停止条件（Stop Conditions）

适用参数完整且比较通过才passed/qualified=True。缺数据、证据错配、来源不可信或Validator失败按既有结果返回；没有模型自由推理循环。整改未全部完成不可复检，复检失败不可放行，released才可Close。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `part_quality_inspection_skill`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |

## 独立运行

复制本目录后，可运行 `python scripts/run.py --check`，或使用 `python scripts/run.py --input task.json --model-url http://127.0.0.1:8040 --tool-script scripts/mcp_adapter.py` 执行业务任务。输入字段见 `references/contract.md`；真实工具连接与限制见 `references/standalone.md`。
