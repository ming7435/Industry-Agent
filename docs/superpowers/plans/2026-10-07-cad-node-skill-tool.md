# CAD 建模节点实施计划

> 历史计划，已被后续 BuildCAD MCP 接入替换；不要重新执行旧内核接入步骤。当前唯一生成链见 [BuildCAD 接入报告](../../buildcad-mcp-integration.md)。

> 执行方式：当前本地会话连续实施；使用 executing-plans、test-driven-development 与 verification-before-completion 的测试和核验流程。不提交、不推送、不创建其他工作区。

**目标：** 将原三维建模真实纳入 CAD Agent 的节点、Skill、Tool 调用链。

**架构：** 原队列工作线程执行 CAD 图的建模分支。一个节点加载中文 Markdown Skill 并按结构化工具步骤分派原实体建模能力，保留所有已有业务契约。

**技术栈：** Python、LangGraph、FastAPI、YAML Front Matter、原隔离 CadQuery 内核。

**设计文档：** `docs/superpowers/specs/2026-10-07-cad-node-skill-tool-design.md`。

## 全局约束

- 仅修改 CAD 相关调用链及必要的 Skill/Tool 注册边界；不重做前端。
- 修改前备份：`.runtime/backups/cad-node-skill-tool-20261007`；备份包含本次修改前已有的未提交代码。
- 不修改配置、数据库和设备；测试使用临时目录和隔离适配器。
- 测试先失败再实现，不删除失败测试；已有节点计数测试因新增节点同步增加数量，不降低校验标准。

## 重点核验

- Markdown 工具步骤被删除或未授权时不得绕过 Skill 直接建模。
- CAD 查询文字中出现建模字样时不能误获得建模权限。
- 两个并发建模任务不能串用任务或几何输入。
- 上传内容不进入新增日志，日志仅保存结构化参数及文件摘要。
- 缺尺寸、内核失败、旧版本确认和幂等冲突仍保留原业务状态。

## 任务 1：真实节点与 Skill 工具调度

文件：`app/agents/cad/{agent,graph,modeling_service}.py`、`app/skills/registry.py`、`app/tools/registry.py`；新增 `app/skills/cad/production_modeling.md`、`app/tools/cad/generate_3d_model.py`，路径均相对于 `services/agent-service`。

- [x] 新增 `test_cad_modeling_graph.py`，通过真实 API 生成带孔销轴，断言节点、Skill、Tool 的任务身份、输入输出和实体体积；增加尺寸不足与任务隔离测试。
- [x] 新增 `test_skill_tool_dispatch.py`，断言 Markdown 中的结构化工具步骤决定调用，禁止工具、缺少输入和异常不重试。
- [x] 运行 `L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_cad_modeling_graph.py services/agent-service/tests/test_skill_tool_dispatch.py -q`，记录预期失败：10 项失败。
- [x] 实现 `SkillDefinition.execute_tool_step(step_id, tools, arguments, context=None)`，由 Skill 的步骤和工具清单确定执行权限。
- [x] 实现内部 `generate_3d_model(design_id)` 工具和任务级可信绑定；在原 CAD 图新增 `model_3d` 分支，由原有界队列执行该图。
- [x] 运行针对性回归，确保原建模 API 和 CAD 设备查询测试仍通过。
- [x] 独立复核后补充失败测试：配置 `MCP_LOCAL_URL` 不能绕过可信任务校验；为建模工具增加 `local_only` 注册属性，保留其他工具的原路由。

## 任务 2：回归与交付

- [x] 同步 `test_stage_node_merge.py`：CAD 从 5 到 6，九图内部节点从 51 到 52，循环域不变；同步注册工具总数从 75 到 76，模型工具声明仍为 58。
- [x] 运行 Agent 完整测试：`L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q`；823 项通过、0 失败、0 跳过。
- [x] 核验实际编译图、工具注册和日志；新增 `docs/cad-node-skill-tool-report.md`，记录命令、结果、恢复方法与未执行项。

## 进度

- 已完成源码备份、失败测试、实现与独立复核整改。针对性回归 68 项通过；完整 Agent 回归 823 项通过。交付说明见 `docs/cad-node-skill-tool-report.md`。未重启正在运行的服务。
