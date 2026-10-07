---
name: production_modeling_skill
version: 1.0
goal: 根据已登记的零件需求或上传图纸生成可校验、可预览和可下载的真实三维实体。
trigger: production_modeling
steps:
  - normalize_query
  - classify_engineering_request
  - id: build_model
    type: tool
    description: 对当前已登记任务执行需求解析、实体建模、STEP 回读校验和工程文件导出。
    tool: generate_3d_model
    required_inputs: [design_id]
    outputs: [geometry, artifacts, status, missing_information]
    failure_policy: stop
  - build_result
tools: [generate_3d_model]
stop_conditions:
  - 信息不足或模型提取参数尚未人工确认时停止，不返回默认实体。
  - 内核失败、校验失败或任务上下文不匹配时停止，不开放未经校验的文件。
failure_policy: stop
---

# 生产前三维实体建模

## 适用场景

CAD Agent 的 `model_3d` 节点处理明确的 `production_modeling` 操作时使用。普通工程查询、故障零件定位和 BOM 查询不使用此技能。

## 输入

`design_id` 是原建模队列已登记的任务编号。完整需求、结构化尺寸、材料、技术要求和上传图纸由任务作用域提供，客户端不能通过工具参数指定本地路径、服务对象或另一个任务的输入。

## 调度

节点读取本文件的 `build_model` 工具步骤，再通过 `SkillDefinition.execute_tool_step` 调用其声明的 `generate_3d_model`。ToolRegistry 检查技能工具权限并记录输入与返回体；工具执行原需求解析、CadQuery 实体计算、STEP 回读与导出，不是只返回排队成功。

简单完整需求或人工明确提交的结构化参数可直接建模；需要模型解析的复杂需求和图片仍经过原模型客户端，提取的参数必须按原规则人工核对后才能建立实体。

## 输出和停止

- 校验成功：返回真实实体尺寸、体积、文件摘要及 STEP、STL、工程视图等下载引用。
- 缺少信息或尚未确认提取参数：返回 `needs_input` 和具体补充项，不返回默认模型。
- 内核或输入失败：返回 `failed`，不返回未经验证的工程文件；不会自动重复执行。
- 日志中的 Agent、节点、技能、步骤和工具归属于同一建模任务。

## 安全边界

人工设计确认仍绑定当前版本摘要；新版本不继承旧确认。生成模型不等于启动生产，本技能不调用设备控制、加工派发或真实 PLC。上传图纸内容不写入新增调度日志，仅保留任务输入中的文件摘要与大小。
