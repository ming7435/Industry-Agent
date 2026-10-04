---
name: trend_diagnosis_skill
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
---

# 趋势异常诊断

运行标识：`trend_diagnosis_skill`。诊断重复出现或持续发展的趋势性异常。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

异常重复出现、持续发展，或请求涉及趋势、历史与故障案例时使用。

## 输入与前置条件

- 设备身份及当前异常事件。
- 对应设备历史样本、日志和时间范围；没有历史记录时明确说明缺口。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `query_history`：读取对应设备的历史样本或事件。
- `summarize_trend`：概括历史变化与重复事件，不编造采样值。
- `infer_candidates`：形成趋势性异常的候选原因。
- `collect_evidence`：收集工具观察中的有效依据并保留来源。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `get_device_history`：读取对应设备历史。
- `get_device_logs`：读取对应设备日志。
- `search_knowledge`：查询混合维修知识。

## 输出与停止条件

输出有来源的趋势概括、候选原因与证据。没有新证据或超过循环预算时停止补查并保留不足原因。

## 安全边界

不编造历史曲线或采样值，不把缓慢变化直接宣布为严重故障，不修改监控阈值。

## 代码入口

- [diagnosis Agent 入口](L:/industry_agent/services/agent-service/app/agents/diagnosis/agent.py)：输入转换、技能选择与结果校验。
- [diagnosis Graph 实现](L:/industry_agent/services/agent-service/app/agents/diagnosis/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
