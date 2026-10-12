---
name: alarm_diagnosis_skill
description: 当设备事件包含报警码，需要结合当前运行事实解释报警时使用。
version: 1.0
goal: 结合报警定义与运行证据诊断带报警码的设备事件。
trigger: exists(alarm_code)
steps:
  - query_alarm_definition
  - judge_alarm_evidence
  - enrich_with_history_or_knowledge
  - diagnose
  - validate_result
  - normalize_event
  - select_skills
  - generate_candidates
  - execute_tools
  - collect_evidence
  - build_result
tools:
  - get_alarm_definition
  - get_device_history
  - get_device_logs
  - search_knowledge
---

# 报警诊断

运行标识：`alarm_diagnosis_skill`；所属 Agent：`diagnosis`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

结合报警定义与运行证据诊断带报警码的设备事件。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

通用注册器匹配 exists(alarm_code) 或报警相关文字；Diagnosis 专用选择器实际要求 event.alarm_code 非空，可与多指标、趋势、安全技能共选。

不适用：没有真实报警编号时不补造编号，按实际专用选择器交由其它诊断技能。

## 输入与前置条件（Inputs）

入口为 DiagnosisAgent.run 的事件映射，HTTP 对应 AbnormalEventRequest.event。需保留 event_id/device_id，按已有事实填写 alarm_code、abnormal_metrics、realtime_snapshot、event_type、severity、occurrence_count、duration_seconds、trigger_reason/trigger_cause、trigger_rules、timestamp、event_revision；未取得的数据保持空或未知。模型消息不得把历史摘要冒充本次实时快照。

## 执行流程（Workflow）

### 公共编排

实际公共节点：prepare → reason → tool_guard → execute_observe → loop_guard → reason，模型给结论后 validate → finish，失败分支到 finish。prepare 合并初始化与技能选择；execute_observe 合并工具执行与观察。normalize_event/select_skills/generate_candidates/execute_tools/collect_evidence/validate_result/build_result 是追踪映射，不是新增节点。

保留的步骤标识：`query_alarm_definition`、`judge_alarm_evidence`、`enrich_with_history_or_knowledge`、`diagnose`、`validate_result`、`normalize_event`、`select_skills`、`generate_candidates`、`execute_tools`、`collect_evidence`、`build_result`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

先核对设备和报警身份；get_alarm_definition 返回 found 后只解释报警含义；与实时快照、历史和日志对照，保留至少一个有依据的候选或待核实结论。定义空、指标矛盾或设备目录不匹配时先说明缺口，不直接判部件损坏。

## 业务判断规则（Reasoning Rules）

- 报警定义与实际根因分开；字典命中不是零件损坏的证明。
- 当前运行观测优先于历史相似案例；目录严重等级可表明风险，但不能证明对应物理状态。
- 存在多个合理原因时在 diagnosis 保留条件及补查建议，不给没有来源的排他结论。

原有约束继续适用：报警定义不能直接证明零件损坏。低置信度、证据不足或需要复核时不能自动派工；本技能无停机、启动或工单写入权限。

## 工具使用规范（Tools）

声明白名单在 YAML。诊断代码还合并基础只读工具，快照缺失可增加 get_device_status；runtime_managed 会移除知识工具交外部 Runtime。此处写清现状，不通过文档增加工具。每次调用仍须 Guard 检查原名、参数、重复请求与上下文。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `get_alarm_definition` | 事件有明确报警码时，传 alarm_code；设备编号由执行上下文保留，不塞入模型工具参数。 | 先查 found/success，再读取 name/description/severity/recommended_action；定义解释报警，不证明根因。 |
| `get_device_history` | 存在趋势或需对比当前指标时，传 device_id，可选 metric_keys/metric、alarm_code、limit（3–120）。 | 读取 history/series/sample_count/trend/metric_definitions；空样本与失败分别保留，不生成历史曲线。 |
| `get_device_logs` | 需要运行上下文时传 device_id，可选 limit/log_types。 | 当前实现是 source=device-log-mcp-compatible 的本地兼容摘要，并非真实 PLC 日志；不得当实测证据。 |
| `search_knowledge` | 互补检索且权限允许时传非空 query，可选 limit（1–50）、filters。 | 读取 documents/answer 和 backend_status/degraded/retrieval_fallback；相似度不是诊断置信度，失败保留真实状态。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。

## 证据与数据真实性（Evidence Rules）

按设备、事件、时间、指标单位关联 observations 与 evidence_records；区分实时数据、历史样本、报警目录和知识参考。同来源重复不能提高可信度。当前本地日志兼容摘要不是真实 PLC 事实。冲突同时列明，不以多次引用消除冲突。

## 输出规范（Output Format）

使用 DiagnosisResult（dataclass），不另造候选/趋势/安全结果模型。保留 event_id/device_id/status/summary/diagnosis/confidence、evidence/evidence_records、recommendation、alarm_definition/tool_calls/model/source/created_at，以及 validation_errors/stop_reason/evidence_status/requires_human_review/maintenance_required/disposition。模型最终正文应为含 summary/diagnosis/confidence 的 JSON；候选差异写进 diagnosis 与证据，不新增 API 字段。

## 异常处理（Error Handling）

输入缺口先在现有预算内补查；工具错误保留失败观察；空定义/空历史不证明设备正常；来源冲突降低结论确定性。模型不可用、校验无法修正、预算耗尽进入现有 fallback，source=local_fallback，保留 error/validation_errors 与人工复核要求。现有 Validator 结构校验不等于已验证业务因果。

## 停止条件（Stop Conditions）

默认 max_steps=6，计模型 reasoning 轮数，不是单个工具个数。相同工具参数重复被 Guard 拒绝；已有 max_steps、no_new_observation 与校验回退分支。观察哈希包含步骤，不能承诺完全识别跨轮相同业务证据。缺关键事实不能强行以成功结论结束。

## 安全与权限边界（Safety & Constraints）

只生成诊断和建议，不创建、派发、关闭工单或控制机器。低置信度/证据不足是否派工由后续门禁裁定；安全建议不代表停机指令已经执行。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "event": {
    "event_id": "EV-EXAMPLE-A",
    "device_id": "D-01",
    "alarm_code": "700223",
    "abnormal_metrics": [],
    "realtime_snapshot": {
      "cycle_state": "processing"
    }
  }
}
```

### 处理与依据

隔离报警目录返回空对象，未取得完整资料；输入已有processing快照，真实fallback保留该事实。evidence_status=ready只表示存在事件证据，不表示报警定义、根因或自动派工门禁已通过；status=fallback且requires_human_review=true。

### 示例输出

```json
{
  "event_id": "EV-EXAMPLE-A",
  "device_id": "D-01",
  "status": "fallback",
  "summary": "设备 D-01 检测到设备异常，异常指标：cycle_state=processing，当前等级：未知。",
  "diagnosis": "当前已确认设备存在异常，但现有证据不足以确定具体根因，需要进一步查询历史趋势、设备日志或维修知识。",
  "confidence": 0.255,
  "evidence": [
    "异常事件指标：cycle_state=processing",
    "Monitor 已提供实时快照"
  ],
  "evidence_records": [],
  "recommendation": "补充历史趋势、设备日志和维修手册证据后，由维修人员现场确认。",
  "alarm_definition": {},
  "tool_calls": [],
  "model": "isolated-doc-example",
  "source": "local_fallback",
  "created_at": "2026-10-12T02:58:40.553566+00:00",
  "task_id": null,
  "triggered_at": null,
  "error": "隔离示例：未取得完整资料",
  "event_revision": 1,
  "trigger_cause": "",
  "diagnosis_run_id": "DIAG-EXAMPLE",
  "trace_id": "",
  "active_skill": "alarm_diagnosis_skill",
  "active_skills": [
    "alarm_diagnosis_skill"
  ],
  "validation_errors": [],
  "stop_reason": "",
  "cached": false,
  "alarm_code": "700223",
  "cycle_state": "processing",
  "cycle_state_label": "",
  "confidence_details": {
    "overall": 0.255,
    "retrieval_match": 0,
    "llm_probability": 0.35,
    "historical_resolution": 0.5,
    "weights": {
      "retrieval_match": 0.4,
      "llm_probability": 0.3,
      "historical_resolution": 0.3
    },
    "knowledge_degraded": false,
    "warning": ""
  },
  "knowledge_warning": "",
  "maintenance_required": false,
  "maintenance_reason": "异常等级未达到维修门槛，先观察或继续诊断",
  "disposition": "operator_check",
  "evidence_status": "ready",
  "requires_human_review": true,
  "model_metadata": {}
}
```

## 参考实现（References）

- [app/agents/diagnosis/agent.py](L:/industry_agent/services/agent-service/app/agents/diagnosis/agent.py)
- [app/agents/diagnosis/graph.py](L:/industry_agent/services/agent-service/app/agents/diagnosis/graph.py)
- [app/agents/diagnosis/tool_policy.py](L:/industry_agent/services/agent-service/app/agents/diagnosis/tool_policy.py)
- [app/agents/diagnosis/schemas.py](L:/industry_agent/services/agent-service/app/agents/diagnosis/schemas.py)
- [app/agents/diagnosis/validator.py](L:/industry_agent/services/agent-service/app/agents/diagnosis/validator.py)
- [app/api/schemas/agent.py](L:/industry_agent/services/agent-service/app/api/schemas/agent.py)
- [app/skills/registry.py](L:/industry_agent/services/agent-service/app/skills/registry.py)
- [app/tools/registry.py](L:/industry_agent/services/agent-service/app/tools/registry.py)
