---
name: safety_triage_skill
description: 当严重事件需识别风险并给出受控核查建议时使用。
version: 1.0
goal: 对严重事件进行风险识别，并提出需人工或安全系统核查的处置建议。
trigger: severity == critical
steps:
- identify_safety_risk
- retrieve_safety_sop
- mark_human_or_safety_system_required
tools:
- get_alarm_definition
- get_device_logs
- search_knowledge
- read_skill_reference
---

# 严重事件安全分级

运行标识：`safety_triage_skill`；所属 Agent：`diagnosis`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

对严重事件进行风险识别，并提出需人工或安全系统核查的处置建议。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

通用注册器对 severity==critical 接受 critical/fatal/严重；专用选择器仅在 severity=critical 或原因含 critical/严重时追加本技能。单独 fatal 不保证激活。

不适用：选中技能不自动执行急停，也不自动设置专属安全验收字段。

## 执行流程（Workflow）

### 公共编排

实际公共节点：prepare → reason → tool_guard → execute_observe → loop_guard → reason，模型给结论后 validate → finish，失败分支到 finish。prepare 合并初始化与技能选择；execute_observe 合并工具执行与观察。normalize_event/select_skills/generate_candidates/execute_tools/collect_evidence/validate_result/build_result 是追踪映射，不是新增节点。

保留的步骤标识：`identify_safety_risk`、`retrieve_safety_sop`、`mark_human_or_safety_system_required`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

先区分当前已观测安全状态和报警风险，按现有报警/SOP证据形成只读核查建议；SOP缺失或状态不明确时列出需要人工核实的风险，结果交外部安全和业务链路处理。

## 输出规范（Output Format）

使用 DiagnosisResult（dataclass），不另造候选/趋势/安全结果模型。保留 event_id/device_id/status/summary/diagnosis/confidence、evidence/evidence_records、recommendation、alarm_definition/tool_calls/model/source/created_at，以及 validation_errors/stop_reason/evidence_status/requires_human_review/maintenance_required/disposition。模型最终正文应为含 summary/diagnosis/confidence 的 JSON；候选差异写进 diagnosis 与证据，不新增 API 字段。

## 停止条件（Stop Conditions）

默认 max_steps=6，计模型 reasoning 轮数，不是单个工具个数。相同工具参数重复被 Guard 拒绝；已有 max_steps、no_new_observation 与校验回退分支。观察哈希包含步骤，不能承诺完全识别跨轮相同业务证据。缺关键事实不能强行以成功结论结束。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `safety_triage_skill`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |

## 独立运行

复制本目录后，可运行 `python scripts/run.py --check`，或使用 `python scripts/run.py --input task.json --model-url http://127.0.0.1:8040 --tool-script scripts/mcp_adapter.py` 执行业务任务。输入字段见 `references/contract.md`；真实工具连接与限制见 `references/standalone.md`。
