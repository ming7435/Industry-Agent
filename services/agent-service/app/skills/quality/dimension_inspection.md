---
name: dimension_inspection_skill
description: 当生产后零件需与实际设计版本的尺寸或参数进行比较时使用。
version: 1.0
goal: 核对生产零件与权威设计规格的尺寸或参数一致性。
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

# 零件尺寸与设计参数比对

运行标识：`dimension_inspection_skill`；所属 Agent：`quality`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

核对生产零件与权威设计规格的尺寸或参数一致性。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

part_quality依据零件身份或质量文字匹配，与综合技能通常共选；选择本技能本身不提供客户端只检尺寸开关。

不适用：不能拿前端草稿参数替代已保存设计，也不自行猜制造公差或允许偏差。

## 输入与前置条件（Inputs）

常规 QualityQuery：inspection_type/action、task_id/trace_id/device_id/event_id、part_id/part_no/part_name/batch_id/production_order_id、part/inspection_plan/measurements/inspection_results/specifications/production_context。from_payload强制part_quality/inspect_part并补齐身份；身份和实测须从真实生产记录核实。production_context可约束comparison_scope、expected_design_run_id、expected_design_digest、expected_recorded_at，不能自行扩大权限或替换设计标准。

## 执行流程（Workflow）

### 公共编排

常规节点 prepare → load_input → inspect → validate_part → finish。load_input合并生产记录和标准读取；inspect只执行权威范围适用的检查。已验证part.comparison_scope=cad_parameters时只运行设计参数比较；旧普通范围才运行五类检查。identify_part/select_skills/determine_pass_fail/build_result等是追踪映射，不是新增节点。闭环操作和虚拟产出有另行受控入口，不自动遍历整改与放行工具。

保留的步骤标识：`load_part`、`load_inspection_plan`、`inspect_dimensions`、`validate_part`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

先取权威生产记录与规格，核验part身份、记录时间、设计run/digest；cad_parameters按完整参数逐项精确比较，缺项先报不足；普通尺寸范围沿用实际_mm上下界规则。保留每项expected/actual和结论来源。

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

假设权威长方体标准有长宽高，但生产测量缺height：保留数据不足，不能默认相同。

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
