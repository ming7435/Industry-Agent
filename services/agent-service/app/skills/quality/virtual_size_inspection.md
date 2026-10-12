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
    required_inputs: [part_id, output_digest]
    failure_policy: stop
tools: [inspect_virtual_output]
failure_policy: stop
---

# 模拟加工产出尺寸比较

运行标识：`virtual_size_inspection_skill`；所属 Agent：`quality`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

对工厂已保存的模拟加工尺寸与原设计版本执行确定性比较。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

专用inspection_type=virtual_profile_dimensions_v1与服务器virtual_context；不是通过文字切换常规质检范围。

不适用：不能把模拟记录作为实物制造或正式产品放行依据，不能传客户端passed覆盖后端结果。

## 输入与前置条件（Inputs）

专用A2A QualityRequest要求request_id/from_agent/to_agent，inspection_type=virtual_profile_dimensions_v1、part_id、output_digest；服务器另创建不可由客户端JSON伪造的virtual_context。常规QualityQuery.from_payload会强制part_quality，因此本分支不能先走该转换。

## 执行流程（Workflow）

### 公共编排

Quality Graph在START按原始inspection_type路由virtual_size_inspection → END。该单节点以virtual_inspect追踪，Skill结构化工具步为inspect；调用inspect_virtual_output前验证私有权限和原参数集合，不走常规五类检查流程。

保留的步骤标识：`inspect`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

核对SIM-PART编号、操作者、已完成且confirmed的原任务和output_digest；读取已保存加工区尺寸并与绑定设计比较；保存/复用同产出+rule的实际检测回执，返回原始check或权限失败。

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

## 证据与数据真实性（Evidence Rules）

Backend读取同操作者任务的已保存产出；job需completed/sync_status=confirmed，产出digest匹配，模拟标识source=factory-simulation/simulation_only=True/synthetic=True正确且不可丢。scope=machining-zone，不等于实物设计验收。

## 输出规范（Output Format）

工具返回原始模拟check字典，A2A放入QualityResponse.quality_result，不是常规QualityResult。保留rule/status/items（key/name/unit/expected/actual/difference/status）、design_run_id/design_digest、check_id/part_id/job_id/actor_id/operator_id/batch_id/output_digest/source/simulation_only/scope/created_at。

## 异常处理（Error Handling）

任务或摘要/归属不符拒绝；身份错误review，实际值缺失insufficient_data，实测不一致fail，全部一致pass。私有授权上下文缺失时A2A端点抛A2AError，不会生成failed QualityResponse；不得用用户输入测量替代后端产出。

## 停止条件（Stop Conditions）

只比较加工区outer_diameter_mm/length_mm，有通孔时比较inner_diameter_mm，采用Decimal精确比较，不推断制造公差。同产出+rule的既有检测核验后幂等返回，不新增随机观察。结果写模拟记录，不写正式质检放行表。

## 安全与权限边界（Safety & Constraints）

仅模拟结果比较，不接受真实设备指令，不声称实物制造验收。synthetic=True是这个域的必要身份，不能套常规生产QMS禁止合成数据的规则。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "request_id": "REQ-EXAMPLE",
  "from_agent": "router",
  "to_agent": "quality",
  "inspection_type": "virtual_profile_dimensions_v1",
  "part_id": "SIM-PART-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "output_digest": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
}
```

### 处理与依据

本例的可序列化请求由router发起；服务器已经核实操作者，并在调用前附加私有virtual_context（不能通过客户端JSON构造）。隔离后端返回已保存的模拟检测记录，数据不足；实际A2A与Quality Graph完成后外层success=true/status=completed，而quality_result.status=insufficient_data、passed=false、qualified=false。传输成功不等于检测合格。若缺私有上下文，实际端点抛A2AError，不返回此响应。

### 示例输出

```json
{
  "request_id": "REQ-EXAMPLE",
  "message_id": "A2A-RESP-8A809B51AEE0",
  "reply_to": "REQ-EXAMPLE",
  "task_id": "",
  "trace_id": "",
  "from_agent": "quality",
  "to_agent": "router",
  "source_agent": "quality",
  "target_agent": "router",
  "status": "completed",
  "success": true,
  "error": "",
  "payload": {
    "check_id": "SIM-CHECK-EXAMPLE",
    "part_id": "SIM-PART-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "output_digest": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "rule": "virtual_profile_dimensions_v1",
    "status": "insufficient_data",
    "items": [],
    "source": "factory-simulation",
    "simulation_only": true,
    "scope": "machining-zone"
  },
  "created_at": "2026-10-12T02:55:24.678755Z",
  "quality_result": {
    "check_id": "SIM-CHECK-EXAMPLE",
    "part_id": "SIM-PART-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "output_digest": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "rule": "virtual_profile_dimensions_v1",
    "status": "insufficient_data",
    "items": [],
    "source": "factory-simulation",
    "simulation_only": true,
    "scope": "machining-zone"
  },
  "inspection_type": "virtual_profile_dimensions_v1",
  "passed": false,
  "qualified": false,
  "defects": [],
  "rework_required": false,
  "validation_findings": [],
  "stop_reason": ""
}
```

## 参考实现（References）

- [app/a2a/models.py](L:/industry_agent/services/agent-service/app/a2a/models.py)
- [app/agents/quality/graph.py](L:/industry_agent/services/agent-service/app/agents/quality/graph.py)
- [app/production_simulation/agents.py](L:/industry_agent/services/agent-service/app/production_simulation/agents.py)
- [app/production_simulation/context.py](L:/industry_agent/services/agent-service/app/production_simulation/context.py)
- [app/production_simulation/tools.py](L:/industry_agent/services/agent-service/app/production_simulation/tools.py)
- [app/skills/registry.py](L:/industry_agent/services/agent-service/app/skills/registry.py)
- [app/tools/registry.py](L:/industry_agent/services/agent-service/app/tools/registry.py)
