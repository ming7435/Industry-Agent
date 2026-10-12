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
---

# 零件适用范围质检与整改闭环

运行标识：`part_quality_inspection_skill`；所属 Agent：`quality`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

按权威设计参数或适用检验范围检测生产零件，并支持受控质检闭环。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

part_quality与尺寸技能共选；闭环operation仅受私有QUALITY_CLOSURE_AUTHORITY授权，常规inspect不依次执行所有闭环动作。

不适用：cad_parameters只比较参数，不声称外观/材料/功能/工艺均已检测；不能用客户端标记申请放行。

## 输入与前置条件（Inputs）

常规 QualityQuery：inspection_type/action、task_id/trace_id/device_id/event_id、part_id/part_no/part_name/batch_id/production_order_id、part/inspection_plan/measurements/inspection_results/specifications/production_context。from_payload强制part_quality/inspect_part并补齐身份；身份和实测须从真实生产记录核实。production_context可约束comparison_scope、expected_design_run_id、expected_design_digest、expected_recorded_at，不能自行扩大权限或替换设计标准。

## 执行流程（Workflow）

### 公共编排

常规节点 prepare → load_input → inspect → validate_part → finish。load_input合并生产记录和标准读取；inspect只执行权威范围适用的检查。已验证part.comparison_scope=cad_parameters时只运行设计参数比较；旧普通范围才运行五类检查。identify_part/select_skills/determine_pass_fail/build_result等是追踪映射，不是新增节点。闭环操作和虚拟产出有另行受控入口，不自动遍历整改与放行工具。

保留的步骤标识：`load_part`、`load_inspection_plan`、`inspect_dimensions`、`inspect_appearance`、`inspect_material`、`inspect_function`、`inspect_process`、`validate_part`、`identify_part`、`determine_pass_fail`、`build_result`、`create_quality_check`、`create_closure_task`、`complete_closure_task`、`submit_quality_appeal`、`resolve_quality_appeal`、`reinspect_quality_check`、`release_quality_check`、`close_quality_check`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

核实生产记录及scope，cad_parameters只做dimensions，普通范围按五类实际检查；Validator合并真实项并返回。申诉/整改/复检/Release/Close另一次只执行获授权动作，引用持久化检测与整改记录，严守状态顺序。

## 业务判断规则（Reasoning Rules）

- 普通范围外观需五项明确布尔，材料按已声明牌号/硬度，功能需跳动标准与rotation_test，工艺需cycle_complete/traceable/operator_confirmed；缺数据不默认通过。
- 申诉批准进入rectification而非放行；全部整改完成后才复检，通过需整改后新检测、同零件/批次/scope/设计版本。
- Release再次核对整改与复检，released才允许Close；质检记录关闭不授权机器启动。

原有约束继续适用：单个 `passed=true` 不能替代完整可信检测；synthetic/degraded 不作为生产验收。失败后的整改、复检、放行和关闭由 Backend 闭环处理。

## 工具使用规范（Tools）

以服务端确认的范围决定实际调用，不把所有允许工具都写成每次执行。常规inspect读取权威零件及标准；create_quality_check/整改/申诉/复检/放行/关闭需要私有闭环授权，不能由JSON字段伪造。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `create_quality_check` | 受服务端正式质检入口授权时传 operator 与真实检测字段。 | 返回 quality_check_id/quality_check/success；持久化事实与检测结论分别核对。 |
| `get_production_part` | 生产身份已知时传 part_id/part_no/batch_id/production_order_id 和 part。 | 核对 success/found/identity_verified、身份及 synthetic/degraded；客户端数据不能替代权威生产记录。 |
| `get_part_specification` | 已取得可信生产记录时传 part。 | 读取 specifications/source；缺少必需规格为数据不足，不默认合格。 |
| `inspect_part_dimensions` | 有权威 part 和标准时传 part/measurements/specifications。 | 核对 items/status/passed/sufficient_data；cad_parameters 为完整参数精确比较，缺项与超差分别表达。 |
| `inspect_part_appearance` | 仅普通五类范围适用时传 part。 | 读取外观检查体；缺布尔缺陷项为不足，不把未检测记为通过。 |
| `inspect_part_material` | 普通范围有材料标准时传 part/specifications。 | 读取牌号/硬度检查；未知材料或缺标准不是合格。 |
| `inspect_part_function` | 普通范围有功能标准时传 part/specifications。 | 读取跳动及 rotation_test 检查；没有测量不能推定功能通过。 |
| `inspect_part_process` | 普通范围需工艺追溯时传 part。 | 读取 cycle_complete/traceable/operator_confirmed，缺项不代替现场确认。 |
| `create_closure_task` | 已存在质检单且获闭环授权时传 operator/quality_check_id/workorder_id/title/owner/actions/due_at。 | 读取 closure_task_id/closure_task；建整改任务不等于整改完成。 |
| `complete_closure_task` | 实际整改完成时传 task_id/operator/note。 | 保存 closure_task；只有全部必要任务完成才可复检。 |
| `submit_quality_appeal` | 对现有 check_id 申诉时传 check_id/reason/evidence/operator/applicant。 | 读取 appeal；提交申诉不能改为检测通过或放行。 |
| `resolve_quality_appeal` | 正式审批入口传 check_id/appeal_id/decision/reason/operator。 | 读取 appeal/quality_check；批准进入整改，不直接 Release。 |
| `reinspect_quality_check` | 整改完成并有新的真实检测时传 check_id/passed/findings/evidence/operator/reinspection_check_id。 | 核对同零件、批次、范围和设计版本，以及检测晚于整改；不是客户端 passed 自证。 |
| `release_quality_check` | 有效通过复检后传 check_id/operator。 | 再次核对全部整改和复检依据，返回实际 quality_check；不绕过现场标准。 |
| `close_quality_check` | 仅 released 状态传 check_id/operator/note。 | 返回实际关闭状态；未放行不允许关闭冒充完成。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。

## 证据与数据真实性（Evidence Rules）

核对零件编号、批次、生产记录时刻、设计run_id/digest和适用范围。CAD基准必须来自completed且valid/step_roundtrip的实际设计，不能用网页草稿或另一版本代替。正式生产检测不使用synthetic/degraded记录；虚拟尺寸技能另有独立模拟身份规则。实测缺项、不同版本和真实不合格必须区分。

## 输出规范（Output Format）

常规返回 QualityResult：inspection_type、part_id/part_no/part_name/batch_id/production_order_id/device_id、passed/status/qualified、inspection_items/measurements/specifications/comparison_scope/design_reference、defects/failed_checks/quality_validation/evidence/recommendation/findings/quality_check_id/stop_reason/checked_at。status为pass/fail/review/not_tested/insufficient_data；cad_parameters分支quality_validation只含dimensions，不补写其它四项通过。

## 异常处理（Error Handling）

生产记录未找到、身份未核实、规格缺失或版本不符不能判合格。工具失败保留失败体；缺必需参数为insufficient_data，已测不一致为fail，需人工核实为review。查到记录不等于完成检测，录入passed也不代替独立比较。

## 停止条件（Stop Conditions）

适用参数完整且比较通过才passed/qualified=True。缺数据、证据错配、来源不可信或Validator失败按既有结果返回；没有模型自由推理循环。整改未全部完成不可复检，复检失败不可放行，released才可Close。

## 安全与权限边界（Safety & Constraints）

仅检测生产后的零件与实际基准，不维修机器、不启动产线。正式申诉/整改/复检/Release/Close受服务端权限和事务门禁限制；文档不能让模型虚构检测值或以passed=true绕过核验。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "part_id": "PART-EXAMPLE",
  "production_context": {
    "comparison_scope": "cad_parameters",
    "expected_design_run_id": "FC-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "expected_design_digest": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
  }
}
```

### 处理与依据

假设当前权威范围cad_parameters且一项未测：仅dimensions数据不足，不附其它四项通过。

### 示例输出

```json
{
  "part_id": "PART-EXAMPLE",
  "comparison_scope": "cad_parameters",
  "passed": false,
  "qualified": false,
  "status": "insufficient_data",
  "quality_validation": {
    "dimensions": {
      "passed": false,
      "sufficient_data": false
    }
  },
  "findings": [
    "缺少完整实测参数"
  ],
  "stop_reason": "validator_fail"
}
```

## 参考实现（References）

- [app/agents/quality/agent.py](L:/industry_agent/services/agent-service/app/agents/quality/agent.py)
- [app/agents/quality/graph.py](L:/industry_agent/services/agent-service/app/agents/quality/graph.py)
- [app/agents/quality/schemas.py](L:/industry_agent/services/agent-service/app/agents/quality/schemas.py)
- [app/agents/quality/validator.py](L:/industry_agent/services/agent-service/app/agents/quality/validator.py)
- [app/contracts.py](L:/industry_agent/services/agent-service/app/contracts.py)
- [app/skills/registry.py](L:/industry_agent/services/agent-service/app/skills/registry.py)
- [app/tools/registry.py](L:/industry_agent/services/agent-service/app/tools/registry.py)
