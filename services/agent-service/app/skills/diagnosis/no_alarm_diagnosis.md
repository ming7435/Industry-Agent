---
name: no_alarm_diagnosis_skill
version: 1.0
goal: 在没有报警码时依据指标、日志和历史数据诊断异常。
trigger: no_alarm_code
steps:
  - inspect_abnormal_metrics
  - query_context_if_needed
  - output_low_confidence_if_evidence_insufficient
tools:
  - get_device_history
  - get_device_logs
  - search_knowledge
  - get_device_status
---

# 无报警码诊断

运行标识：`no_alarm_diagnosis_skill`。在没有报警码时依据指标、日志和历史数据诊断异常。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

没有可解析报警码但已有异常指标、日志或状态变化时使用；不为补全输入伪造报警码。

## 输入与前置条件

- 设备身份与当前异常样本。
- 异常指标、设备状态、历史或日志；明确哪些信息尚未取得。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `inspect_abnormal_metrics`：检查当前异常指标和采样依据。
- `query_context_if_needed`：按需补充设备状态、历史或日志。
- `output_low_confidence_if_evidence_insufficient`：证据不足时返回不足与低置信度，不猜测根因。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `get_device_history`：读取对应设备历史。
- `get_device_logs`：读取对应设备日志。
- `search_knowledge`：查询混合维修知识。
- `get_device_status`：读取设备当前状态。

## 输出与停止条件

输出基于实测与日志的候选原因、证据与置信度；资料不足时明确返回低置信度或不足，不当作确定根因。

## 安全边界

不能猜测工业合格阈值，也不能把查询不到数据解释为设备正常。是否维修与派工仍由业务门禁判断。

## 代码入口

- [diagnosis Agent 入口](L:/industry_agent/services/agent-service/app/agents/diagnosis/agent.py)：输入转换、技能选择与结果校验。
- [diagnosis Graph 实现](L:/industry_agent/services/agent-service/app/agents/diagnosis/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
