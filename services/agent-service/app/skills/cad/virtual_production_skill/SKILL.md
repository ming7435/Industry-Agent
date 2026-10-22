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
  required_inputs:
  - command_id
  - run
  - setup
  - material
  failure_policy: stop
- id: submit
  type: tool
  tool: submit_virtual_production
  required_inputs:
  - job_id
  - digest
  failure_policy: stop
- id: start
  type: tool
  tool: start_virtual_production
  required_inputs:
  - job_id
  - digest
  failure_policy: stop
- id: sync
  type: tool
  tool: sync_virtual_production
  required_inputs:
  - job_id
  failure_policy: stop
tools:
- prepare_virtual_production
- submit_virtual_production
- start_virtual_production
- sync_virtual_production
- read_skill_reference
failure_policy: stop
---

# 受限虚拟加工任务

运行标识：`virtual_production_skill`；所属 Agent：`cad`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

根据已校验的 CAD 版本生成并执行受限模拟加工任务。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

通用trigger=virtual_production；实际CADAgent必须收到operation=virtual_production和服务器私有上下文，经专用单节点执行指定动作。

不适用：非真实机床后处理，不支持装配、圆角、多孔或任意复杂刀路；一次准备不会自动连跑下发和启动。

## 执行流程（Workflow）

### 公共编排

公开入口 → VirtualProductionCoordinator → 私有action-bound上下文 → CAD Graph唯一virtual_production节点 → 本技能指定prepare/submit/start/sync工具步。每次只执行明确动作，四步不是自动顺序节点。原任务未知时先读取回执，不生成新命令替代。

保留的步骤标识：`prepare`、`submit`、`start`、`sync`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

先核对本次设计版本和工艺/毛坯/刀具，再prepare保存稳定任务；用户明确后单独submit，再明确start；sync持续读取原任务。已接收/运行/完成或未知不能用新的command_id回避对账。

## 输出规范（Output Format）

公开返回原始job字典，不是CADResult；保留job_id/part_id/command_id/actor_id/design_run_id/design_digest/request_digest/program_digest、setup/material/status/sync_status/revision/source/simulation_only及实际receipt/output/inspection/error_code。completed才有保存产出；inspection是独立动作，不能默认通过。

## 停止条件（Stop Conditions）

prepare成功只到prepared；submit须摘要一致并实际接收；start须已接收且状态允许运行；running/completed/未知只同步。sync只记录原工厂事实。稳定同操作者+command_id身份防重复建任务，不自动修复或恢复设备。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `virtual_production_skill`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |

## 独立运行

复制本目录后，可运行 `python scripts/run.py --check`，或使用 `python scripts/run.py --input task.json --model-url http://127.0.0.1:8040 --tool-script scripts/mcp_adapter.py` 执行业务任务。输入字段见 `references/contract.md`；真实工具连接与限制见 `references/standalone.md`。
