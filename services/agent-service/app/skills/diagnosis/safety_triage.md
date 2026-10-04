---
name: safety_triage_skill
version: 1.0
goal: 对严重事件进行安全分级并识别必须立即执行的安全控制。
trigger: severity == critical
steps:
  - identify_safety_risk
  - retrieve_safety_sop
  - mark_human_or_safety_system_required
tools:
  - get_alarm_definition
  - get_device_logs
  - search_knowledge
---

# 安全风险分级

运行标识：`safety_triage_skill`。对严重事件进行安全分级并识别必须立即执行的安全控制。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

事件严重级别为 critical、fatal 或既有规则识别的严重状态时使用，形成风险分级与安全处置需求。

## 输入与前置条件

- 设备、事件、报警及有效严重级别。
- 报警定义、设备日志和相关安全规程；安全标准来自已确认资料。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `identify_safety_risk`：识别事件中的严重风险与受影响对象。
- `retrieve_safety_sop`：检索相关安全规程，不编造控制步骤。
- `mark_human_or_safety_system_required`：标记需要人工复核或安全系统处置的事项。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `get_alarm_definition`：读取报警编号定义。
- `get_device_logs`：读取对应设备日志。
- `search_knowledge`：查询混合维修知识。

## 输出与停止条件

输出风险说明及需要人工或安全系统处置的标记；依据不足时要求复核，不生成虚构的安全操作确认。

## 安全边界

这里只分析与标记，不直接停止或启动机器。虚拟整线控制属于 Monitor 的独立受限链路，真实 PLC 需要另行验收。

## 代码入口

- [diagnosis Agent 入口](L:/industry_agent/services/agent-service/app/agents/diagnosis/agent.py)：输入转换、技能选择与结果校验。
- [diagnosis Graph 实现](L:/industry_agent/services/agent-service/app/agents/diagnosis/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
