---
name: drawing_lookup_skill
description: 当需按设备、部件或零件编号查询工程图、BOM、位置及装配关系时使用。
aliases: [part_search_skill, bom_analysis_skill]
version: 1.2
goal: 定位设备零部件、安装位置及工程图纸，验证它们的设备归属。
trigger: part_or_component
triggers: [part_or_component, bom]
steps:
  - normalize_query
  - classify_engineering_request
  - resolve_part
  - plan_engineering_query
  - resolve_bom
  - merge_engineering_context
  - validate_engineering_context
  - build_result
tools:
  - query_part
  - query_drawing
  - query_bom
  - query_relation
  - fetch_engineering_record
---

# 设备工程图纸与部件定位

运行标识：`drawing_lookup_skill`；所属 Agent：`cad`；兼容别名：`part_search_skill`、`bom_analysis_skill`。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

定位设备零部件、安装位置及工程图纸，验证它们的设备归属。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

part_or_component、bom两触发取或；part_search_skill/bom_analysis_skill是同一技能兼容别名。文本“零件/part/BOM”可选中，但工程query_type由Graph再次分类。

不适用：工程查询不生成3D实体，不用其它设备图纸填无结果查询。

## 输入与前置条件（Inputs）

工程查询使用 CADQuery：request_id、device_id/device_model/component/part_no/query、max_steps（默认5，1–6）。不存在输入query_type；Graph按query识别BOM、位置、装配或部件。已有精确编号/设备范围全程保留，缺少名称可由fault/summary归一，不补造工程零件。

## 执行流程（Workflow）

### 公共编排

工程公共节点 prepare → plan_engineering_query ↔ query → validate_relation → finish；prepare合并初始化、加载、目标识别，query合并工具查询与观察。normalize_query/classify_engineering_request/resolve_part/resolve_bom/merge_engineering_context/validate_engineering_context/build_result是兼容追踪标签。model_3d和virtual_production是另两条受控分支。

保留的步骤标识：`normalize_query`、`classify_engineering_request`、`resolve_part`、`plan_engineering_query`、`resolve_bom`、`merge_engineering_context`、`validate_engineering_context`、`build_result`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

按query优先BOM（bom/物料/零件/part）、位置、装配关系，最后普通部件。BOM计划part→bom→relation→drawing；位置part→drawing→relation；装配part→relation→drawing→bom。合并后核对本次类型必需资料及设备归属。

## 业务判断规则（Reasoning Rules）

- 部件为空即不足；普通component需零件号和图纸，BOM需编号与BOM，装配需关系，位置需位置证据。
- 编号精确、名称模糊规则独立；相似名字不授权跨设备复用。
- 图纸显示可用与部件精确定位可用是两件事，不能因总图能打开而宣称故障部件已定位。

原有约束继续适用：指定设备无结果不能悄悄改查全库；不使用无关演示模型填结果，不授权库存写入、维修派工或设备控制。

## 工具使用规范（Tools）

只使用EngineeringArguments真实字段request_id/query/device_id/device_model/component/component_id/part_no，条件优先part_no→component→query；编号精确、名称按CAD服务规则匹配。声明fetch_engineering_record不表示默认计划必调。工程读取与建模执行不得混用。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `query_part` | 需定位零件时传 query/device_id/device_model/component/component_id/part_no 中已有条件。 | 读取 parts，指定设备必须有一致 device_id；编号精确匹配，空结果不改查无关设备。 |
| `query_drawing` | 已确定工程范围时传同一组工程条件。 | 读取 drawings，核对图纸和部件身份；设备总图不等于故障部件工程证据。 |
| `query_bom` | 需物料清单时传同一组工程条件。 | 读取 components/bom_items；保留数量、部件和设备归属，不能用相似名称合并不同编号。 |
| `query_relation` | 需装配或位置关系时传同一组工程条件。 | 读取 assembly_relations/relations/locations，核对两端实体与设备，失败不补造连接关系。 |
| `fetch_engineering_record` | 需要完整工程记录且入口实际调用时传已有工程条件。 | 权限允许但常规 CAD 查询计划不会自动调用；使用真实记录而非演示替代。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。

## 证据与数据真实性（Evidence Rules）

按部件、设备、机型和工程编号关联parts/drawings/bom/relations/locations。指定设备的部件必须带一致device_id；关系两端及图纸归属不能用相似标题猜测。空结果不悄悄退回无关设备全库，不把演示模型当维修证据。

## 输出规范（Output Format）

工程查询返回 CADResult：request_id/device_id/device_model/query/status/query_type/component/part_no，components/parts/drawings/bom_items/assembly_relations/locations、drawing_refs/drawing_ref_details/viewer_context/location、evidence/sources/confidence/total、validation_findings/steps/stop_reason/backend_status/degraded/warning。synthetic不是该Result声明字段，不能承诺一定从该对象暴露。

## 异常处理（Error Handling）

工具异常写入失败观察，在有限计划内继续互补查询并最终校验；无部件、必要编号/图纸/BOM/关系/位置缺失返回insufficient_engineering_data，不补造记录。远程不可用保留backend_status/degraded/warning和实际finding。

## 停止条件（Stop Conditions）

预算max_steps默认5、1–6；队列耗尽或达到预算进入关系校验。结果stop_reason沿用max_steps/validator_pass/cad_service_no_data/validation_failed；completed仅表示当前工程查询验证通过，不是模型已生产或维修已完成。

## 安全与权限边界（Safety & Constraints）

只读工程定位不授权领料、维修派发或设备控制。用户文字不能启用建模；结构化operation和受控服务端入口决定建模或虚拟生产分支。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "device_id": "CNC-01",
  "part_no": "CP-TC820-015",
  "query": "查询该零件BOM",
  "max_steps": 4
}
```

### 处理与依据

假设指定设备无对应工程记录：保留设备与编号，返回不足，不退全库凑图。

### 示例输出

```json
{
  "query": "查询该零件BOM",
  "device_id": "CNC-01",
  "part_no": "CP-TC820-015",
  "query_type": "bom",
  "status": "insufficient_engineering_data",
  "validation_findings": [
    "缺少对应设备部件或BOM资料"
  ],
  "stop_reason": "cad_service_no_data"
}
```

## 参考实现（References）

- [app/agents/cad/agent.py](L:/industry_agent/services/agent-service/app/agents/cad/agent.py)
- [app/agents/cad/graph.py](L:/industry_agent/services/agent-service/app/agents/cad/graph.py)
- [app/agents/cad/schemas.py](L:/industry_agent/services/agent-service/app/agents/cad/schemas.py)
- [app/agents/cad/validator.py](L:/industry_agent/services/agent-service/app/agents/cad/validator.py)
- [app/contracts.py](L:/industry_agent/services/agent-service/app/contracts.py)
- [app/tools/query_contracts.py](L:/industry_agent/services/agent-service/app/tools/query_contracts.py)
- [app/skills/registry.py](L:/industry_agent/services/agent-service/app/skills/registry.py)
- [app/tools/registry.py](L:/industry_agent/services/agent-service/app/tools/registry.py)
