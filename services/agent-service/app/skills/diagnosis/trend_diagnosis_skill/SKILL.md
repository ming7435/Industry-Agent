---
name: trend_diagnosis_skill
description: 当事件持续或重复出现，需要检查历史窗口和变化趋势时使用。
version: 1.0
goal: 诊断重复出现或持续发展的趋势性异常。
trigger: trend_or_repeated_abnormality
steps:
- query_history
- summarize_trend
- infer_candidates
- collect_evidence
tools:
- get_device_history
- get_device_logs
- search_knowledge
- read_skill_reference
---

# 趋势与重复异常诊断

运行标识：`trend_diagnosis_skill`；所属 Agent：`diagnosis`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

诊断重复出现或持续发展的趋势性异常。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

通用注册器按 trend/趋势/重复/持续/历史/案例等文字命中；Diagnosis专用 requires_history 按 duration_seconds、occurrence_count、event_type及触发规则判定，两个机制不能混为一谈。

不适用：仅当前单点值不构成趋势，历史检索失败不伪造上升或下降曲线。

## 执行流程（Workflow）

### 公共编排

实际公共节点：prepare → reason → tool_guard → execute_observe → loop_guard → reason，模型给结论后 validate → finish，失败分支到 finish。prepare 合并初始化与技能选择；execute_observe 合并工具执行与观察。normalize_event/select_skills/generate_candidates/execute_tools/collect_evidence/validate_result/build_result 是追踪映射，不是新增节点。

保留的步骤标识：`query_history`、`summarize_trend`、`infer_candidates`、`collect_evidence`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

明确当前指标及事件持续/重复信息，查询同设备历史，先检查 sample_count 和数据窗；再比较方向、最新值和工况，区分短时波动、持续变化与重复报警。调用了历史工具但没拿到有效样本时输出不足。

## 输出规范（Output Format）

使用 DiagnosisResult（dataclass），不另造候选/趋势/安全结果模型。保留 event_id/device_id/status/summary/diagnosis/confidence、evidence/evidence_records、recommendation、alarm_definition/tool_calls/model/source/created_at，以及 validation_errors/stop_reason/evidence_status/requires_human_review/maintenance_required/disposition。模型最终正文应为含 summary/diagnosis/confidence 的 JSON；候选差异写进 diagnosis 与证据，不新增 API 字段。

## 停止条件（Stop Conditions）

默认 max_steps=6，计模型 reasoning 轮数，不是单个工具个数。相同工具参数重复被 Guard 拒绝；已有 max_steps、no_new_observation 与校验回退分支。观察哈希包含步骤，不能承诺完全识别跨轮相同业务证据。缺关键事实不能强行以成功结论结束。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `trend_diagnosis_skill`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |

## 独立运行

复制本目录后，可运行 `python scripts/run.py --check`，或使用 `python scripts/run.py --input task.json --model-url http://127.0.0.1:8040 --tool-script scripts/mcp_adapter.py` 执行业务任务。输入字段见 `references/contract.md`；真实工具连接与限制见 `references/standalone.md`。
