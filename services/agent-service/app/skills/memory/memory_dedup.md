---
name: memory_dedup
version: 1.0
goal: 避免同一工单的维修经验重复写入。
trigger: always
steps:
  - dedup
  - dedup_experience
tools: []
output: MemoryResult
---

# 维修经验去重

运行标识：`memory_dedup`。避免同一工单的维修经验重复写入。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

Memory 的读或学习路径共享去重阶段，`always` 表示在该 Agent 的选择范围内通用，而非所有 Agent 都启用。

## 输入与前置条件

- 检索得到的经验列表，或待学习案例的来源工单与经验身份。
- 实际已保存记录和保存状态；不能只按文字相似就删除历史经验。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `dedup`：对查询结果做去重，不执行经验学习。
- `dedup_experience`：按来源工单等身份避免重复保存经验。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

此技能不直接调用注册工具；内部处理或持久化仍以对应 Graph 的实现为准。

## 输出与停止条件

查询返回去重后的列表；学习识别重复来源并保持既有经验与 RAG 保存对账，不伪造新的经验完成记录。

## 安全边界

不直接调用注册工具，也不单独执行新增、删除工单或设备控制；去重不能隐藏部分保存失败。

## 代码入口

- [memory Agent 入口](L:/industry_agent/services/agent-service/app/agents/memory/agent.py)：输入转换、技能选择与结果校验。
- [memory Graph 实现](L:/industry_agent/services/agent-service/app/agents/memory/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
