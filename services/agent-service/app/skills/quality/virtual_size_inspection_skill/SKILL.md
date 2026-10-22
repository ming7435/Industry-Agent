---
name: virtual_size_inspection_skill
description: 当服务器授权检查已保存的虚拟加工产出及原设计摘要时使用。
version: 1.0
goal: 对工厂已保存的模拟加工尺寸与原设计版本执行确定性比较。
trigger: virtual_profile_dimensions_v1
steps:
- id: inspect
  type: tool
  tool: inspect_virtual_output
  required_inputs:
  - part_id
  - output_digest
  failure_policy: stop
tools:
- inspect_virtual_output
- read_skill_reference
failure_policy: stop
---

# 模拟加工产出尺寸比较

运行标识：`virtual_size_inspection_skill`；所属 Agent：`quality`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

对工厂已保存的模拟加工尺寸与原设计版本执行确定性比较。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

专用inspection_type=virtual_profile_dimensions_v1与服务器virtual_context；不是通过文字切换常规质检范围。

不适用：不能把模拟记录作为实物制造或正式产品放行依据，不能传客户端passed覆盖后端结果。

## 执行流程（Workflow）

### 公共编排

Quality Graph在START按原始inspection_type路由virtual_size_inspection → END。该单节点以virtual_inspect追踪，Skill结构化工具步为inspect；调用inspect_virtual_output前验证私有权限和原参数集合，不走常规五类检查流程。

保留的步骤标识：`inspect`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

核对SIM-PART编号、操作者、已完成且confirmed的原任务和output_digest；读取已保存加工区尺寸并与绑定设计比较；保存/复用同产出+rule的实际检测回执，返回原始check或权限失败。

## 输出规范（Output Format）

工具返回原始模拟check字典，A2A放入QualityResponse.quality_result，不是常规QualityResult。保留rule/status/items（key/name/unit/expected/actual/difference/status）、design_run_id/design_digest、check_id/part_id/job_id/actor_id/operator_id/batch_id/output_digest/source/simulation_only/scope/created_at。

## 停止条件（Stop Conditions）

只比较加工区outer_diameter_mm/length_mm，有通孔时比较inner_diameter_mm，采用Decimal精确比较，不推断制造公差。同产出+rule的既有检测核验后幂等返回，不新增随机观察。结果写模拟记录，不写正式质检放行表。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `virtual_size_inspection_skill`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |

## 独立运行

复制本目录后，可运行 `python scripts/run.py --check`，或使用 `python scripts/run.py --input task.json --model-url http://127.0.0.1:8040 --tool-script scripts/mcp_adapter.py` 执行业务任务。输入字段见 `references/contract.md`；真实工具连接与限制见 `references/standalone.md`。
