# Agent 工具与 Skill 精简设计

## 范围与依据

用户要求先优化工具，再优化 Skill，已要求连续实施、不再逐项确认。本次仅修改当前本地 Agent 服务，不访问远程项目，不修改配置、数据库或前端，不启动设备控制或收费模型。

当前注册 66 个工具入口、65 个模型声明、30 份 Markdown Skill；领域图 51 个节点。本次不再改图。

## 工具阶段

七个重复查询入口退出默认模型候选集，但保留 Python、MCP 和 execute 兼容调用：

| 兼容入口 | 推荐工具 |
| --- | --- |
| query_cad | fetch_engineering_record |
| query_part_relation、query_assembly_relation、get_component_location | query_relation |
| get_drawing_metadata | query_drawing |
| query_stock | query_inventory |
| query_workorder | get_workorder |

兼容关系不是权限关系：原名称授权先行，不自动把 alias 替换为推荐名。按白名单请求 schema 时，可显式返回获准的旧查询名；内部失败验收工具始终不能暴露给模型。保持远程 operation 和本地返回投影。

RAG 检索、文档读取和 CAD 查询共用 Pydantic 参数契约，schema 与调用前校验来自同一模型；只增加这些只读工具的契约，不擅自通用化副作用参数。限值沿用 KnowledgeQuery 的 1～50。拒绝空检索、缺失文档标识、错误类型；不把设备条件丢掉，不重复请求。保留历史额外上下文参数，明确其不能授权工具。

## Skill 阶段

保持 Markdown + Front Matter。仅合并以下三份重叠文档，并保留旧名别名：

- CAD bom_analysis → drawing_lookup：相同五个查询工具、同一实际 Graph；支持原两个触发条件。
- Memory memory_write → experience_extraction：同一 learn 路径的子阶段。实际学习图使用请求中的工单，不调用 get_workorder，故去掉未使用的该项授权；两旧名不增加工具。
- Report trace_report → closure_report：相同六个工具、同一汇总 Graph；保留不同 report_type 对完整性的业务校验，不增加 PDF 工具授权。

增加结构化 triggers 列表，保持旧 trigger 兼容；触发条件之间取或，不重复激活。显式无效名称或空列表不回退到宽权限默认 Skill。修正文档实际步骤，确保日志能关联到真正执行的子操作；不以文档步骤伪装完成。

## 不做

不合并创建/更新/派工/完成/关闭等副作用工具，不合并报警/SOP/手册检索过滤，不合并综合质检与尺寸质检，不删除严重故障审批与验收门禁。没有运行频率数据，不宣称性能实测改善或生产验收。

## 验收

工具与 Skill 分别经历新增失败测试、实现、针对性和 Agent 全量回归。最后运行跨服务契约、相关 Backend 测试和独立只读审查。测试使用临时 SQLite、隔离环境和外部传输替身，不替换被测注册表、Graph、守卫、业务验证器。修改前备份源文件与 SHA256，保留日志与恢复说明。
