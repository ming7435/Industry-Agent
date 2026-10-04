---
name: experience_retrieval
version: 1.1
goal: 检索或列出已验证的历史维修经验。
trigger: search
triggers: [search, recent]
steps:
  - validate_closed
  - select_skills
  - validate_search
  - retrieve_memory
  - dedup
  - score_experience
  - validate
  - build_result
  - fallback
tools:
  - search_semantic_memory
output: MemoryResult
---

# 维修经验检索

运行标识：`experience_retrieval`。检索或列出已验证的历史维修经验。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

`action=search` 检索或 `action=recent` 列出最近经验时使用；两者只读，不进入学习。

## 输入与前置条件

- search 的问题与可选设备、报警、部件等范围；recent 使用实际返回条数限制。
- 不要求输入已关闭工单，`validate_closed` 在此只是现有入口映射名；明确 action 优先于文本关键词。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `validate_closed`：归一化 Memory 入口并校验动作；学习准入另由对应步骤检查。
- `select_skills`：加载匹配技能及其工具和步骤元数据。
- `validate_search`：校验经验查询条件，recent 分支可跳过。
- `retrieve_memory`：读取已有经验或最近经验记录。
- `dedup`：对查询结果做去重，不执行经验学习。
- `score_experience`：按相关性整理经验并限制返回数量。
- `validate`：核对当前动作返回和领域业务条件。
- `build_result`：组装真实处理结果及不足、失败或停止原因。
- `fallback`：返回明确不足或失败，不包装成成功。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `search_semantic_memory`：查询历史语义经验。

## 输出与停止条件

返回 `MemoryResult` 中真实经验、数量、排序与不足信息；recent 跳过 search 条件验证，仍走去重与结果校验。

## 安全边界

只允许已有语义查询工具；recent 可由现有记忆模块读最近记录，不补写历史，不因问题出现“学习”而获得写权限。

## 代码入口

- [memory Agent 入口](L:/industry_agent/services/agent-service/app/agents/memory/agent.py)：输入转换、技能选择与结果校验。
- [memory Graph 实现](L:/industry_agent/services/agent-service/app/agents/memory/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
