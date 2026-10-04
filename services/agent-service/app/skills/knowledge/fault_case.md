---
name: fault_case_skill
version: 1.0
goal: 检索历史故障案例和已验证的维修经验。
trigger: case_or_history
steps:
  - search_fault_cases
  - search_semantic_memory
  - rerank_evidence
  - validate_evidence
tools:
  - search_fault_cases
  - search_semantic_memory
  - fetch_document
  - fetch_chunk
---

# 历史故障案例检索

运行标识：`fault_case_skill`。检索历史故障案例和已验证的维修经验。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

请求涉及历史故障、案例或已验证维修经验时使用；案例参考不等于当前设备已诊断。

## 输入与前置条件

- 问题及设备、报警、部件等已知条件。
- 可用案例和经验来源；记录来源工单或文档引用。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `search_fault_cases`：查询历史故障案例。
- `search_semantic_memory`：查询已有语义维修经验。
- `rerank_evidence`：对检索证据重排，保留来源与筛选范围。
- `validate_evidence`：核对检索依据、来源和不足信息。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `search_fault_cases`：查询历史故障案例。
- `search_semantic_memory`：查询历史语义经验。
- `fetch_document`：读取指定文档内容。
- `fetch_chunk`：读取指定知识片段。

## 输出与停止条件

输出相关历史案例与证据，排序后保留归属；没有匹配案例时明确返回不足。

## 安全边界

相似案例不能直接证明当前根因。查询经验不会触发经验学习、工单写入或设备控制。

## 代码入口

- [knowledge Agent 入口](L:/industry_agent/services/agent-service/app/agents/knowledge/agent.py)：输入转换、技能选择与结果校验。
- [knowledge Graph 实现](L:/industry_agent/services/agent-service/app/agents/knowledge/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
