---
name: workorder_skill
description: 当维修方案需要附带工单模板与草稿信息时使用。
version: 1.0
goal: 结合维修方案与工程资料生成工单草稿。
trigger: workorder
steps:
  - build_workorder_draft
  - attach_repair_target
  - attach_drawing_context
  - submit_workorder_draft
tools:
  - get_workorder_template
  - submit_workorder_draft
---

# 维修工单草稿准备

运行标识：`workorder_skill`；所属 Agent：`maintenance`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

结合维修方案与工程资料生成工单草稿。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

trigger=workorder按上下文匹配；是否提交由constraints.need_workorder和workorder_ready共同决定。与WorkOrderAgent正式创建技能不同。

不适用：不接收顶层maintenance_plan作为MaintenanceQuery输入，不直接创建/派发正式工单。

## 输入与前置条件（Inputs）

MaintenanceQuery 接收 task_id/trace_id、device_id、user_text/query、diagnosis_result/diagnosis、knowledge/cad/memory、constraints、runtime_managed、event/context。from_payload互补两种诊断字段。没有顶层 part_no/component/maintenance_plan 输入，零件目标来自 query、诊断及工程记录。实际 DiagnosisView 需 device_id/fault/cause/severity；扩展 evidence_status 等保留在 raw。缺失事实不能以默认字段值证明已核实。

## 执行流程（Workflow）

### 公共编排

真实节点 prepare → collect_context → build_plan → safety_validate → validate → finish。prepare 包括初始化/技能选择/诊断评估；collect_context 包含知识及CAD收集；build_plan 包含草案及备件核查；finish 包含草稿准备与结果构建。validate_diagnosis/determine_required_parts/build_safety_steps/build_result等是追踪标签，不是独立节点。已有知识/CAD可复用；runtime_managed=True交外层Runtime检索，不再自行远程补查。

保留的步骤标识：`build_workorder_draft`、`attach_repair_target`、`attach_drawing_context`、`submit_workorder_draft`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

在同一计划流程finish的prepare_workorder整理设备、title、plan_id、steps、repair_target与drawing_context；按需读取模板，仅方案就绪且need_workorder时提交草稿；将实际草稿回执保留到计划。

## 业务判断规则（Reasoning Rules）

- 模板、草稿、正式工单是不同事实；submitted只能来自工具实际成功回执。
- 附图沿用已有drawing_url/model_url/mesh_name/location，不用标题造图纸地址。
- 未就绪计划仍可保留ready=False的草稿，不把它显示成已派发维修。

原有约束继续适用：只使用模板与草稿入口，不新增创建、派工、完成、关闭或设备控制权限。

## 工具使用规范（Tools）

仅在当前技能合并白名单与实际维修范围内使用工具。知识及CAD的协作读取由既有Agent/Runtime链路负责，不因正文新增对应工具。方案生成、库存读取、模板和草稿提交分开说明，不把后者当正式派单。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `get_workorder_template` | 需要草稿或正式创建参考时传 device_id，可选 plan。 | 读取 template_id/title/steps/source；是模板，不是已创建的维修任务。 |
| `submit_workorder_draft` | 方案 workorder_ready 且 constraints.need_workorder 时传已构造草稿。 | 读取 draft_id/submitted/source；草稿提交不等于正式创建、派发或完成。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。

## 证据与数据真实性（Evidence Rules）

关联本次设备、事件、报警与方案；知识/SOP正文、工程部件/BOM、备件记录分别保留来源。设备总图或reference_only记录不能替代故障部件依据；synthetic/degraded工程和demo_only库存不作正式就绪证明。复用同源资料不重复增加可信度，冲突留在validation_findings。

## 输出规范（Output Format）

使用 MaintenancePlan，必需 plan_id/diagnosis；保留 plan_kind/inspection_required、repair_target/target_part/engineering_context、repair_steps/required_tools/required_parts/safety_requirements、pre_checks/post_checks、inventory_status/part_availability、evidence/memory_evidence/source_documents、validation_findings、maintenance_required/cad_required/workorder_ready/workorder_draft 等真实字段。没有公开 stop_reason，终止原因在 Graph 状态，计划通过 findings 与 workorder_ready 表达不足。

## 异常处理（Error Handling）

缺诊断或证据时输出未就绪计划；工具草案、查询或库存失败保留来源和finding；互锁/液压与诊断范围错配不能套用普通换件。资料不足不补编库存、工时、备件或安全步骤已执行。Graph本身不执行无限重试；外部协作故障交原状态返回。

## 停止条件（Stop Conditions）

完成条件是方案结构、安全和适用工程/知识依据均校验通过；只有维修必要性和相关门禁满足才 workorder_ready=True。普通提示可观察，可靠预警可进入固定只读检查；资料不足、范围错配、安全校验失败保持False。既有一次方案流程不因正文增加独立循环预算。

## 安全与权限边界（Safety & Constraints）

只负责维修方案及受条件控制的草稿。不能正式创建/派发/关闭工单，不能控制机器、领料、旁路互锁或无依据确定换件。constraints.need_workorder 不绕过方案校验。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "device_id": "D-1",
  "query": "维修 workorder 草稿",
  "diagnosis_result": {
    "device_id": "D-1",
    "fault": "主轴温度异常",
    "cause": "待核实",
    "severity": "high",
    "confidence": 0.5,
    "raw": {
      "evidence_status": "insufficient"
    }
  },
  "constraints": {
    "need_workorder": true
  }
}
```

### 处理与依据

计划证据不足：仅保留未就绪草稿，不能补造submitted=True。

### 示例输出

```json
{
  "plan_id": "PLAN-EXAMPLE",
  "diagnosis": {
    "device_id": "D-1",
    "fault": "主轴温度异常",
    "cause": "待核实",
    "severity": "high",
    "confidence": 0.5,
    "raw": {
      "evidence_status": "insufficient"
    }
  },
  "workorder_ready": false,
  "validation_findings": [
    "当前证据不足，方案暂未就绪"
  ],
  "workorder_draft": {
    "device_id": "D-1",
    "ready": false,
    "steps": []
  }
}
```

## 参考实现（References）

- [app/agents/maintenance/agent.py](L:/industry_agent/services/agent-service/app/agents/maintenance/agent.py)
- [app/agents/maintenance/graph.py](L:/industry_agent/services/agent-service/app/agents/maintenance/graph.py)
- [app/agents/maintenance/schemas.py](L:/industry_agent/services/agent-service/app/agents/maintenance/schemas.py)
- [app/agents/maintenance/validator.py](L:/industry_agent/services/agent-service/app/agents/maintenance/validator.py)
- [app/contracts.py](L:/industry_agent/services/agent-service/app/contracts.py)
- [app/workorder/repair_profile.py](L:/industry_agent/services/agent-service/app/workorder/repair_profile.py)
- [app/skills/registry.py](L:/industry_agent/services/agent-service/app/skills/registry.py)
- [app/tools/registry.py](L:/industry_agent/services/agent-service/app/tools/registry.py)
