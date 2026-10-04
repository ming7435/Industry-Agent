# Agent 工具与 Skill 优化报告

日期：2026-10-03；工作目录：`L:/industry_agent`。先工具，后 Skill。仅修改本地文件，未访问远程项目、修改生产配置、接触真实数据库、调用设备或收费模型，未部署、提交或重启服务。

## 数量及真实含义

| 项目 | 修改前 | 修改后 |
| --- | --- | --- |
| 默认模型工具候选 | 65 | 58 |
| 兼容执行入口总数 | 66 | 66 |
| Markdown Skill | 30 | 27 |
| 领域 Graph 节点 | 51 | 51 |
| 核心 Agent | 9 | 9 |

这是默认工具候选精简，不是删除七项业务能力。显式白名单可继续获得对应旧查询名的 schema，仍按原名授权；不会自动授权推荐名。内部验收失败写入工具仍不暴露给模型。没有运行频率数据或性能基准，不宣称实测加速。

## 工具实际改动

- `app/tools/registry.py`：ToolDefinition 标注兼容关系，默认不再重复展示五个旧 CAD 查询、query_stock 和 query_workorder；原 Python 导入、MCP 路由、参数与返回投影保留。
- 新增 `app/tools/query_contracts.py`：18 个只读入口共用参数契约，生成模型 schema 并进行调用前校验。RAG 查询范围沿用 1～50；空问题、缺失文档/片段编号、错误类型在传输前拒绝，不发重复请求。CAD 设备、机型、部件、零件号和 request_id 原样传递。execute 与直接 Python 调用使用相同契约；合法调用保持原参数和返回体。
- `app/api/server.py`：两个现有 RAG search API 路径将上述参数错误转换为 422，错误信息只含工具名与字段位置，不回显参数。鉴权、方法限制和传输失败处理保留。
- `app/agents/diagnosis/tool_policy.py`：参数拒绝返回 INVALID_ARGUMENT，不再给出误导的 OK。
- 没有合并创建、更新、派工、反馈、完成、关闭、重开和删除；不同 RAG 过滤与质检检测仍独立。其余工具参数仍沿用原实现，不把本次只读契约写成全部工具契约改造。

## Skill 实际改动

| 主定义 | 并入的旧定义 | 行为 |
| --- | --- | --- |
| CAD drawing_lookup_skill | bom_analysis_skill | 同五个工程工具、同实际 Graph，多触发只激活一次；part_search_skill 原别名继续保留 |
| Memory experience_extraction | memory_write | 同一学习路径；删除实际图未使用的 get_workorder 授权，别名不扩大权限 |
| Report closure_report_skill | trace_report_skill | 同六个记录汇总工具，不增加 PDF/删除权限；报告类型的完整性校验仍由业务代码执行 |

`app/skills/registry.py` 支持 triggers 列表，保留旧 trigger。显式未知或空名称不回退到宽权限默认 Skill。文本匹配使用非空业务值，不让空 trace_id 字段名触发专用报告。Memory 明确 action 优先，检索文本提及 learn 不能激活学习 Skill。闭环类型包括实际 Runtime 使用的 full_case_report，不再误选默认 PDF Skill。

Memory 学习/检索、Report 合并文档对齐现有 Graph 的实际步骤与条件；真实 trace 回归验证每个已执行子操作的 mapped 和规范 Skill 名。没有把文档列表当作业务执行器，也未改变图节点和内循环。

移除重复文档：`app/skills/cad/bom_analysis.md`、`app/skills/memory/memory_write.md`、`app/skills/report/trace_report.md`。内容与能力已并入主文档；旧名可解析，三份原文可从备份恢复。未删除数据库、记录、配置或业务工具。

## 实际测试

统一隔离 runner：`.superpowers/sdd/2026-10-03-agent-tools-skills/run-tests.ps1`。它在子进程中禁用 dotenv、清空远程地址和密钥、关闭 MySQL/工厂控制，测试使用临时 SQLite。五服务同名 app 不在同进程混导。

基础命令：`powershell -NoProfile -File .superpowers/sdd/2026-10-03-agent-tools-skills/run-tests.ps1 -Log <日志>`，内部执行 `L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q`。

| 验证 | 通过 | 失败 | 跳过 | 日志 |
| --- | --- | --- | --- | --- |
| 修改前 Agent 全量 | 412 | 0 | 0 | baseline.log |
| 工具新增预期 RED | 3 | 15 | 0 | tools-red-confirmed.log |
| 工具新增 GREEN | 18 | 0 | 0 | tools-green.log |
| 工具阶段 Agent 全量 | 430 | 0 | 0 | tools-agent-suite.log |
| Skill 新增预期 RED | 4 | 14 | 0 | skills-red-confirmed.log |
| 未使用学习工具授权 RED | 0 | 1 | 0 | skills-learning-red.log |
| Skill 新增 GREEN | 19 | 0 | 0 | skills-green.log |
| 两阶段完成 Agent 全量 | 449 | 0 | 0 | skills-agent-suite.log |
| 审查前针对性回归 | 103 | 0 | 0 | targeted-final.log |
| 相关 Backend | 6 | 0 | 0 | backend-confirmed.log |
| 跨服务契约 | 12 | 0 | 0 | contracts.log |
| 独立审查针对性检查 | 44 | 0 | 0 | final-review-focused.log |
| 审查修复预期 RED | 40 | 19 | 0 | review-fixes-red.log |
| 审查修复 GREEN | 59 | 0 | 0 | review-fixes-green.log |
| 修复后 Agent 全量 | 471 | 0 | 0 | final-agent-suite-after-review.log |
| 修复后相关 Backend | 6 | 0 | 0 | final-backend.log |
| 修复后跨服务契约 | 12 | 0 | 0 | final-contracts.log |

针对性 Targets：test_tool_optimization.py、test_skill_optimization.py、test_tool_alias_contract.py、test_skill_aliases.py、test_runtime_skill_scope.py、test_graph_slimming_contract.py、test_stage_node_merge.py。

最终 Agent 命令：`powershell -NoProfile -File .superpowers/sdd/2026-10-03-agent-tools-skills/run-tests.ps1 -Log final-agent-suite-after-review.log`。

最终 Backend 命令：`powershell -NoProfile -Command "& ./.superpowers/sdd/2026-10-03-agent-tools-skills/run-tests.ps1 -Config pytest-backend.ini -Log final-backend.log -Targets @('services/backend-service/tests/test_team_dispatch.py','services/backend-service/tests/test_team_repair_confirmation.py')"`。

最终契约命令：`powershell -NoProfile -Command "& ./.superpowers/sdd/2026-10-03-agent-tools-skills/run-tests.ps1 -Log final-contracts.log -Targets @('services/agent-service/tests/test_agent_contract.py','services/agent-service/tests/test_shared_contracts.py','services/agent-service/tests/test_quality_backend_contract.py','tests/integration/test_runtime_rag_cad_contract.py')"`。

修复后 `L:/anaconda/python.exe -m compileall -q services/agent-service/app services/agent-service/tests` 与 `git diff --check` 均 exit 0；Git 仅提示既有 Windows 换行转换。最终业务测试均 0 failed / 0 skipped。

以上统计存在用例重叠，不合计为独立用例数。初次 RED 构造 DiagnosisState 时漏了必填事件，CAD prepare 测试误以为已生成查询队列，均先纠正后重新观察预期失败。首次 Backend -File 数组参数被当作单一路径：0 tests、exit 1（backend.log），已用显式数组纠正；保留日志，没有删除失败测试或降标。

## 备份、恢复及边界

本次修改前的 14 份源码/文档/既有测试保存在 `.runtime/backups/agent-tools-skills-20261003/`，manifest.md 记录 SHA256；包含审查修复前新增备份的 app/api/server.py，已逐份核验。恢复前先保存后续改动，再逐文件比较、复制同名备份；恢复三份已移除 Skill 时同时恢复注册表和主文档以免别名冲突。新增 query_contracts.py 和优化测试不在旧版，完整撤销需同步取消引用。不要覆盖整个项目、配置或数据目录。

没有配置变化、数据库迁移或新增依赖。没有执行真实五服务在线联调、模型收费调用、前端重构/构建、生产数据库和设备控制验证；它们不是本次离线 Agent 优化的验收。保持原来的诊断置信度、证据、审批、工单状态和可信维修验收门禁，不自行定义工业阈值。离线通过不等于生产验收通过。

## 最终审查

一次 fresh-context 独立只读审查完成，无 Critical，发现两项 Important；作者按一次修复流程补充真实函数/API 回归，观察失败后修复，并重新运行 Agent 全量及相关契约。未安排第二次审查。

1. 实际闭环 report_type=full_case_report 未匹配合并后的报告 Skill：已修复，覆盖真实 RuntimeCoordinator 动作上下文和 ReportGraph 的步骤映射。
2. 直接调用 ToolRegistry 和 RAG search API 绕过 execute 参数校验：已修复，18 个公开只读入口共用装饰器预检，API 返回 422；测试只替换外部传输，不 mock 被测函数。

### 延后的小项

Diagnosis 的 tool_schemas_for 辅助函数尚未接入 Registry 的显式旧名 schema 选项；自定义旧别名白名单可能得不到声明。内置 Diagnosis 白名单不使用这些旧名，正常调用不受影响；Registry 的显式兼容接口已测。本轮记录，不将审查小项扩展为第二轮改造。

### 实施裁定及代价

- 在用户指定的本地目录连续实施，不新建 worktree、不逐项询问、不自动提交；发布仍需另行授权。
- 用 Windows 独立 PowerShell 测试与 SHA256 备份替代 Bash/提交范围记录，保留本计划日志；代价是少量磁盘占用。
- 对审查未判定的在线适配器兼容性、远程服务可达性和实际性能，只交付离线结论；没有授权调用真实设备/收费模型，代价是仍需单独在线验收。不能将本次测试写成生产通过。
