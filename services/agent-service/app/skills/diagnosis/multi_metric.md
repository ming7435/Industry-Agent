---
name: multi_metric_diagnosis_skill
version: 1.0
goal: 关联多个异常指标并推断共同故障原因。
trigger: multiple_abnormal_metrics
steps:
  - correlate_metrics
  - query_history
  - infer_common_causes
  - validate_result
tools:
  - get_device_history
  - get_device_logs
  - search_knowledge
---

# 多指标关联诊断

运行标识：`multi_metric_diagnosis_skill`。关联多个异常指标并推断共同故障原因。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

同一设备同时存在多个异常指标，需要分析指标关联和共同原因时使用。

## 输入与前置条件

- 同一设备的 `abnormal_metrics` 或既有指标列表。
- 指标对应时间、历史与日志；跨设备或不同采样条件不能直接混为一组事实。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `correlate_metrics`：核对多个异常指标之间的关系。
- `query_history`：读取对应设备的历史样本或事件。
- `infer_common_causes`：结合多个指标提出共同原因候选。
- `validate_result`：检查最终结果的结构、证据与业务约束。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `get_device_history`：读取对应设备历史。
- `get_device_logs`：读取对应设备日志。
- `search_knowledge`：查询混合维修知识。

## 输出与停止条件

输出指标关联、共同原因候选及支持证据；无法证明关联时保留不确定判断，由诊断校验器决定结果状态。

## 安全边界

相关变化不等于因果证明。不用无关设备的历史补证，不增加控制或派工权限。

## 代码入口

- [diagnosis Agent 入口](L:/industry_agent/services/agent-service/app/agents/diagnosis/agent.py)：输入转换、技能选择与结果校验。
- [diagnosis Graph 实现](L:/industry_agent/services/agent-service/app/agents/diagnosis/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
