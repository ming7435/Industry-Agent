---
name: virtual_production_skill
description: 当已校验的CAD版本需要准备、下发、启动或同步虚拟车削任务时使用。
version: 1.0
goal: 根据已校验的 CAD 版本生成并执行受限模拟加工任务。
trigger: virtual_production
steps:
  - id: prepare
    type: tool
    tool: prepare_virtual_production
    required_inputs: [command_id, run, setup, material]
    failure_policy: stop
  - id: submit
    type: tool
    tool: submit_virtual_production
    required_inputs: [job_id, digest]
    failure_policy: stop
  - id: start
    type: tool
    tool: start_virtual_production
    required_inputs: [job_id, digest]
    failure_policy: stop
  - id: sync
    type: tool
    tool: sync_virtual_production
    required_inputs: [job_id]
    failure_policy: stop
tools: [prepare_virtual_production, submit_virtual_production, start_virtual_production, sync_virtual_production]
failure_policy: stop
---

# 受限虚拟加工任务

运行标识：`virtual_production_skill`；所属 Agent：`cad`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

根据已校验的 CAD 版本生成并执行受限模拟加工任务。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

通用trigger=virtual_production；实际CADAgent必须收到operation=virtual_production和服务器私有上下文，经专用单节点执行指定动作。

不适用：非真实机床后处理，不支持装配、圆角、多孔或任意复杂刀路；一次准备不会自动连跑下发和启动。

## 输入与前置条件（Inputs）

公开Plan：command_id、design_run_id（FC-加64小写hex）、setup对象、material（1–200）、可选batch_id；提交/启动公共体ProgramIdentity仅digest，job_id在路径。sync用严格空体。run、actor、_virtual_context由服务器核实，不能作为客户端授权字段。

setup需stock_diameter_mm/stock_length_mm/grip_length_mm/clearance_mm/pass_depth_mm/spindle_rpm/feed_mm_per_rev/tolerance_mm/tool_id/device_id/postprocessor。有孔另需drill_tool_id/drill_diameter_mm；刀号1–99，钻头与车刀不同。设备固定TRAK-TC820LTYSI-001，postprocessor为virtual-trak-turning-v1。工艺值为有限正数，毛坯覆盖主体与夹持段；刀路点≤4000，时长≤604800秒。

## 执行流程（Workflow）

### 公共编排

公开入口 → VirtualProductionCoordinator → 私有action-bound上下文 → CAD Graph唯一virtual_production节点 → 本技能指定prepare/submit/start/sync工具步。每次只执行明确动作，四步不是自动顺序节点。原任务未知时先读取回执，不生成新命令替代。

保留的步骤标识：`prepare`、`submit`、`start`、`sync`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

先核对本次设计版本和工艺/毛坯/刀具，再prepare保存稳定任务；用户明确后单独submit，再明确start；sync持续读取原任务。已接收/运行/完成或未知不能用新的command_id回避对账。

## 业务判断规则（Reasoning Rules）

- prepared只表示准备完成，不是机器正在生产。
- 必须核对program_digest和原job归属；相同ID不同参数不是幂等重试。
- output只能来自工厂completed任务回执；模拟比较独立执行，不自动宣布合格。

## 工具使用规范（Tools）

prepare内部使用command_id/run/setup/material；submit/start恰为job_id/digest；sync恰为job_id。私有上下文绑定人员、动作和参数，不能由JSON自称通过。所有四工具local_only，不对模型开放任意生产命令。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `prepare_virtual_production` | 服务端核实人员与已校验设计后传 command_id/run/setup/material，可选 batch_id。 | 返回稳定 job_id/program_digest/status=prepared；准备不是下发或启动。 |
| `submit_virtual_production` | 已准备且摘要匹配，参数恰为 job_id/digest。 | 使用工厂原任务回执；已接收仅同步，未知不重放。 |
| `start_virtual_production` | 已接收且允许运行，参数恰为 job_id/digest。 | 读取原任务 status/progress；running/completed/未知只核对，禁止替代任务。 |
| `sync_virtual_production` | 需只读核对原任务时参数恰为 job_id。 | 读取 receipt/status/sync_status/output；读取失败不启动设备，不伪造模拟产出。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。

## 证据与数据真实性（Evidence Rules）

设计必须已完成且valid/step_roundtrip、单实体、毫米，非synthetic/degraded；仅圆柱或单同轴贯穿孔可生成受限模拟车削。job/design/program/output各摘要一致并绑定操作者；source=factory-simulation与simulation_only=True明确标记，不把模拟产出当实物测量。

## 输出规范（Output Format）

公开返回原始job字典，不是CADResult；保留job_id/part_id/command_id/actor_id/design_run_id/design_digest/request_digest/program_digest、setup/material/status/sync_status/revision/source/simulation_only及实际receipt/output/inspection/error_code。completed才有保存产出；inspection是独立动作，不能默认通过。

## 异常处理（Error Handling）

重复command_id但设计/工艺变化拒绝；任务归属、摘要、状态冲突或工厂未知返回现有VirtualProductionError/code/message/status。review/outcome_unknown不能包装接收成功，读取失败不重启任务。

## 停止条件（Stop Conditions）

prepare成功只到prepared；submit须摘要一致并实际接收；start须已接收且状态允许运行；running/completed/未知只同步。sync只记录原工厂事实。稳定同操作者+command_id身份防重复建任务，不自动修复或恢复设备。

## 安全与权限边界（Safety & Constraints）

严格仅模拟工厂且服务端登记人员授权；不得调用真实PLC/CNC。毛坯/刀具/工艺需要明确输入，不能以示例参数替代。同步不能自动启动、复机或创建替代任务。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "command_id": "example-turning",
  "design_run_id": "FC-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "material": "45钢",
  "setup": {
    "stock_diameter_mm": 50,
    "stock_length_mm": 80,
    "grip_length_mm": 20,
    "clearance_mm": 2,
    "pass_depth_mm": 1,
    "spindle_rpm": 800,
    "feed_mm_per_rev": 0.2,
    "tolerance_mm": 0.1,
    "tool_id": 1,
    "device_id": "TRAK-TC820LTYSI-001",
    "postprocessor": "virtual-trak-turning-v1"
  }
}
```

### 处理与依据

仅在示例design_run_id确有对应已校验圆柱、操作者和全部工艺核验通过时可到prepared；下面是返回片段示意，不代表本机已执行。

### 示例输出

```json
{
  "job_id": "SIM-JOB-cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
  "design_run_id": "FC-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "status": "prepared",
  "sync_status": "pending",
  "source": "factory-simulation",
  "simulation_only": true
}
```

## 参考实现（References）

- [app/api/production_simulation.py](L:/industry_agent/services/agent-service/app/api/production_simulation.py)
- [app/production_simulation/coordinator.py](L:/industry_agent/services/agent-service/app/production_simulation/coordinator.py)
- [app/production_simulation/agents.py](L:/industry_agent/services/agent-service/app/production_simulation/agents.py)
- [app/production_simulation/context.py](L:/industry_agent/services/agent-service/app/production_simulation/context.py)
- [app/production_simulation/tools.py](L:/industry_agent/services/agent-service/app/production_simulation/tools.py)
- [app/agents/cad/graph.py](L:/industry_agent/services/agent-service/app/agents/cad/graph.py)
- [app/skills/registry.py](L:/industry_agent/services/agent-service/app/skills/registry.py)
- [app/tools/registry.py](L:/industry_agent/services/agent-service/app/tools/registry.py)
