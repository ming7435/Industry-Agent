---
name: alarm_diagnosis_skill
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

运行标识：`alarm_diagnosis_skill`。结合报警定义与运行证据诊断带报警码的设备事件。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

事件存在报警码，或上下文明确属于报警诊断时使用；把报警定义与当前运行证据结合，而非只复述报警名称。

## 输入与前置条件

- 当前设备与事件身份，以及 `alarm_code`、快照、异常指标等已取得事实。
- 按需读取该设备历史、日志与知识；缺少资料必须保留不足状态。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `query_alarm_definition`：读取报警定义，不把定义直接当作故障根因。
- `judge_alarm_evidence`：区分报警定义与实际运行证据。
- `enrich_with_history_or_knowledge`：按证据缺口补查历史、日志或知识。
- `diagnose`：结合当前事实形成候选诊断。
- `validate_result`：检查最终结果的结构、证据与业务约束。
- `normalize_event`：整理设备、报警、事件及快照。
- `select_skills`：加载匹配技能及其工具和步骤元数据。
- `generate_candidates`：根据事件与现有观察形成候选判断或补查请求。
- `execute_tools`：执行通过权限与参数检查的工具调用。
- `collect_evidence`：收集工具观察中的有效依据并保留来源。
- `build_result`：组装真实处理结果及不足、失败或停止原因。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `get_alarm_definition`：读取报警编号定义。
- `get_device_history`：读取对应设备历史。
- `get_device_logs`：读取对应设备日志。
- `search_knowledge`：查询混合维修知识。

## 输出与停止条件

输出候选故障判断、证据、置信度与处置建议。预算耗尽、重复观察或校验失败进入已有降级分支。

## 安全边界

报警定义不能直接证明零件损坏。低置信度、证据不足或需要复核时不能自动派工；本技能无停机、启动或工单写入权限。

## 代码入口

- [diagnosis Agent 入口](L:/industry_agent/services/agent-service/app/agents/diagnosis/agent.py)：输入转换、技能选择与结果校验。
- [diagnosis Graph 实现](L:/industry_agent/services/agent-service/app/agents/diagnosis/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
