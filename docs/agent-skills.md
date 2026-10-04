# Agent 技能文档总目录

本目录对应当前本地项目的 **27 个 Skill、9 类 Agent**。技能定义统一存放为 `.md` 文档：顶部保留运行时读取的 YAML 元数据，正文使用中文 Markdown 说明。

数量分布：路由 1、诊断 5、知识检索 5、工程定位 1、维修方案 3、工单 5、质量检测 2、报告 2、经验记忆 3。

## 本次整理范围

- 现有技能本来已经以 `.md` 存储；本次补齐中文正文和统一结构，并新增本总目录。
- 不新增、删除或合并技能，不改名称、版本、触发条件、步骤标识、输出声明、工具权限或兼容别名。
- 不把 Python 加载器、Graph、工具实现改成文本文件；它们仍负责实际执行。
- 不改模型配置、业务接口、前端、数据库或设备控制，不调用收费模型或真实设备。

## 技能目录

| 所属 Agent | 中文技能文档 | 运行标识 |
| --- | --- | --- |
| 路由 `router` | [意图路由与业务实体提取](L:/industry_agent/services/agent-service/app/skills/router/intent_routing.md) | `intent_routing_skill` |
| 诊断 `diagnosis` | [报警诊断](L:/industry_agent/services/agent-service/app/skills/diagnosis/alarm_diagnosis.md) | `alarm_diagnosis_skill` |
| 诊断 `diagnosis` | [多指标关联诊断](L:/industry_agent/services/agent-service/app/skills/diagnosis/multi_metric.md) | `multi_metric_diagnosis_skill` |
| 诊断 `diagnosis` | [无报警码诊断](L:/industry_agent/services/agent-service/app/skills/diagnosis/no_alarm_diagnosis.md) | `no_alarm_diagnosis_skill` |
| 诊断 `diagnosis` | [安全风险分级](L:/industry_agent/services/agent-service/app/skills/diagnosis/safety_triage.md) | `safety_triage_skill` |
| 诊断 `diagnosis` | [趋势异常诊断](L:/industry_agent/services/agent-service/app/skills/diagnosis/trend_diagnosis.md) | `trend_diagnosis_skill` |
| 知识检索 `knowledge` | [报警知识检索](L:/industry_agent/services/agent-service/app/skills/knowledge/alarm_search.md) | `alarm_search_skill` |
| 知识检索 `knowledge` | [历史故障案例检索](L:/industry_agent/services/agent-service/app/skills/knowledge/fault_case.md) | `fault_case_skill` |
| 知识检索 `knowledge` | [混合知识检索](L:/industry_agent/services/agent-service/app/skills/knowledge/hybrid_search.md) | `hybrid_search_skill` |
| 知识检索 `knowledge` | [设备手册检索](L:/industry_agent/services/agent-service/app/skills/knowledge/manual_search.md) | `manual_search_skill` |
| 知识检索 `knowledge` | [标准作业规程检索](L:/industry_agent/services/agent-service/app/skills/knowledge/sop_search.md) | `sop_search_skill` |
| 工程定位 `cad` | [工程图纸与零部件定位](L:/industry_agent/services/agent-service/app/skills/cad/drawing_lookup.md) | `drawing_lookup_skill` |
| 维修方案 `maintenance` | [维修方案生成](L:/industry_agent/services/agent-service/app/skills/maintenance/repair_plan.md) | `repair_plan_skill` |
| 维修方案 `maintenance` | [备件分析](L:/industry_agent/services/agent-service/app/skills/maintenance/spare_part.md) | `spare_part_skill` |
| 维修方案 `maintenance` | [工单草稿准备](L:/industry_agent/services/agent-service/app/skills/maintenance/workorder.md) | `workorder_skill` |
| 工单 `workorder` | [工单自动派发](L:/industry_agent/services/agent-service/app/skills/workorder/auto_assignment.md) | `auto_assignment` |
| 工单 `workorder` | [维修执行反馈](L:/industry_agent/services/agent-service/app/skills/workorder/repair_feedback.md) | `repair_feedback` |
| 工单 `workorder` | [维修工单创建](L:/industry_agent/services/agent-service/app/skills/workorder/workorder_create.md) | `workorder_create` |
| 工单 `workorder` | [返工工单重开](L:/industry_agent/services/agent-service/app/skills/workorder/workorder_reopen.md) | `workorder_reopen` |
| 工单 `workorder` | [工单状态跟踪](L:/industry_agent/services/agent-service/app/skills/workorder/workorder_tracking.md) | `workorder_tracking` |
| 质量检测 `quality` | [尺寸专项质检](L:/industry_agent/services/agent-service/app/skills/quality/dimension_inspection.md) | `dimension_inspection_skill` |
| 质量检测 `quality` | [生产零件综合质检](L:/industry_agent/services/agent-service/app/skills/quality/part_quality_inspection.md) | `part_quality_inspection_skill` |
| 报告 `report` | [闭环与执行链路报告](L:/industry_agent/services/agent-service/app/skills/report/closure_report.md) | `closure_report_skill` |
| 报告 `report` | [工业事件报告生成](L:/industry_agent/services/agent-service/app/skills/report/report_generation.md) | `report_generation_skill` |
| 经验记忆 `memory` | [维修经验提取与写入](L:/industry_agent/services/agent-service/app/skills/memory/experience_extraction.md) | `experience_extraction` |
| 经验记忆 `memory` | [维修经验检索](L:/industry_agent/services/agent-service/app/skills/memory/experience_retrieval.md) | `experience_retrieval` |
| 经验记忆 `memory` | [维修经验去重](L:/industry_agent/services/agent-service/app/skills/memory/memory_dedup.md) | `memory_dedup` |

## 每份 Markdown 的结构

文档顶部的 `---` 区域是原有 YAML 元数据，仍是运行参数来源；正文不是另一套配置。每份文档统一包含以下章节：

1. **适用场景**：什么时候选择该技能，以及旧名称的兼容关系。
2. **输入与前置条件**：需要哪些业务身份、实测数据、记录和证据。
3. **执行步骤**：解释现有步骤标识，不创建新的 Graph 节点。
4. **可调用工具**：解释已有工具用途，不扩展权限。
5. **输出与停止条件**：实际结果、证据不足、预算结束或失败时如何返回。
6. **安全边界**：明确不得绕过的业务门禁、归属校验和授权。
7. **代码入口**：链接到对应 Agent、Graph 和技能加载器。

如需阅读实例，可从 [维修方案生成](L:/industry_agent/services/agent-service/app/skills/maintenance/repair_plan.md) 或 [报警诊断](L:/industry_agent/services/agent-service/app/skills/diagnosis/alarm_diagnosis.md) 开始。

## 文档与执行的关系

技能加载器读取 Markdown 的元数据，再按当前 Agent、触发条件和显式技能范围选择技能。真正的节点调用、分支和循环由对应 Graph 完成；`steps` 中也保留一些兼容标识，不能将文档列表误读为固定串行流程。

工具列表是允许范围，不代表每次全部执行，也不能替代审批与服务端业务门禁。明确传入空技能范围或未知技能名时，不应退回默认技能来扩大能力。

现有旧名称兼容关系保持不变：

- `entity_extraction_skill` → `intent_routing_skill`。
- `part_search_skill`、`bom_analysis_skill` → `drawing_lookup_skill`。
- `trace_report_skill` → `closure_report_skill`。
- `memory_write` → `experience_extraction`。

总目录放在 `docs`，不放入技能扫描目录，以免被当成运行时技能。下面两个 Python 文件是加载与导出入口，不是待转成 Markdown 的技能正文：

- [技能注册与加载器](L:/industry_agent/services/agent-service/app/skills/registry.py)。
- [技能模块导出](L:/industry_agent/services/agent-service/app/skills/__init__.py)。

## 本地验证记录

验证日期：2026-10-03。使用隔离配置和本地测试适配器；不加载生产密钥，不连接生产数据库、收费模型或真实设备。

| 验证 | 实际结果 |
| --- | --- |
| 修改前技能加载、别名、优化、权限范围和 Agent 入口测试 | 66 通过，0 失败，0 跳过 |
| 修改后上述专项回归 | 66 通过，0 失败，0 跳过 |
| 修改后 Agent 服务全量测试 | 493 通过，0 失败，0 跳过 |

专项回归命令（项目根目录执行）：

```powershell
powershell -NoProfile -Command "& ./.runtime/verification/skill-markdown-20261003/run-tests.ps1 -Log final-skill-tests.log -Targets @('services/agent-service/tests/test_skill_registry.py', 'services/agent-service/tests/test_skill_aliases.py', 'services/agent-service/tests/test_skill_optimization.py', 'services/agent-service/tests/test_runtime_skill_scope.py', 'services/agent-service/tests/test_agent_entry_contracts.py')"
```

Agent 全量回归命令：

```powershell
powershell -NoProfile -File .runtime/verification/skill-markdown-20261003/run-tests.ps1 -Log final-agent-tests.log
```

另有一次性文档检查：实际通过 `SkillRegistry` 加载技能，与修改前备份核对文件集合、全部元数据及原文，检查七个中文章节、源码链接和总目录覆盖情况。修改前该检查识别出 27 份文档缺少统一章节、总目录不存在；这是文档完整性缺口，不是业务测试失败。

```powershell
$env:PYTHONUTF8='1'
$env:PYTHONIOENCODING='utf-8'
& 'L:/anaconda/python.exe' '.runtime/verification/skill-markdown-20261003/check-documents.py' --catalog
```

测试与文档检查输出保存在 [本次验证目录](L:/industry_agent/.runtime/verification/skill-markdown-20261003)。文档检查不替代业务回归；上述离线测试不代表生产设备验收通过。本次没有运行五服务生产联调，也没有重启或部署服务。

## 修改前备份与恢复

修改前的全部 27 份技能已按原目录结构备份到 [本次技能备份](L:/industry_agent/.runtime/backups/skill-markdown-20261003/skills)。备份来自修改前的本地文件，包含此前已完成的优化，不依赖 Git 或远程代码。

需要撤回某份文档时，仅恢复对应备份文件。例如恢复维修方案文档：

```powershell
Copy-Item -LiteralPath 'L:/industry_agent/.runtime/backups/skill-markdown-20261003/skills/maintenance/repair_plan.md' -Destination 'L:/industry_agent/services/agent-service/app/skills/maintenance/repair_plan.md'
```

如之后已再次编辑，请先备份现文件再恢复；不要用整仓库回退覆盖其他已有修改。本次没有配置变更、数据迁移或数据删除。

