# 全项目 Agent Skills 标准化整改与验证报告

日期：2026-10-12。项目：`L:/industry_agent`。

## 结论与范围

本轮已实际整改 **30份运行技能文档，覆盖9个Agent**，并交付清单、兼容快照、只读核对工具及回归测试。统一YAML及13章正文，职责、触发、输入、公共编排、专属判断、工具合同、证据、输出、异常、停止、安全、示例、引用均已补齐。

本项目没有被Loader加载的独立`SKILL.md`；实际注册目录为`services/agent-service/app/skills/{agent}/*.md`。保留目录、文件名和内部运行名称，避免新建重复源。采用用户要求的文档规范，但**未迁移成外部Agent Skills标准技能包**；原下划线运行名称仍是项目内部兼容协议。

**不能宣称整个项目测试全绿或生产验收完成。** 最新完整Agent测试：2245通过、71失败、3跳过。当前30技能加载、真实契约和权限校验无错误；本轮新增100项回归、相关151项回归及专家中心15项浏览器测试通过。失败详情和未验证边界见下文。

## 实际修改与新增文件

### 修改：全部30份运行文档

完整逐份清单见[技能清单](L:/industry_agent/docs/skills-inventory.md)，包含文件路径、Agent、Graph节点/条件边、触发差异、兼容别名、工具、输入输出模型、停止与异常处理。机器可读版本见[skills-inventory.json](L:/industry_agent/docs/skills-inventory.json)。

| Agent | 文档数量 |
| --- | ---: |
| cad | 3 |
| diagnosis | 5 |
| knowledge | 5 |
| maintenance | 3 |
| memory | 3 |
| quality | 3 |
| report | 2 |
| router | 1 |
| workorder | 5 |

所有文档均保留原技能专业规则并补充各自不同的判断逻辑；FreeCAD建模原有几何/特征/装配/工程图协议整体保留，没有用模板覆盖。

### 新增：核对、测试和交付

- [只读核对工具](L:/industry_agent/scripts/audit_skills.py)：真实Loader加载30技能、验证工具Guard和原别名、编译9个Agent Graph并导出节点及93条编译边、检查示例契约与引用路径。不运行工具处理器，不访问收费模型或业务数据库。
- [技能回归测试](L:/industry_agent/services/agent-service/tests/test_skill_standardization.py)：原元数据不变、每份可加载、每份示例契约、每份Guard权限，以及真实Knowledge结果构建、Diagnosis fallback和虚拟检测A2A场景。
- [原始元数据快照](L:/industry_agent/services/agent-service/tests/fixtures/skill-runtime-contracts.json)：固定原name/aliases/trigger/steps/tools等，防止文档改造意外改变运行协议。
- [实施计划](L:/industry_agent/docs/superpowers/plans/2026-10-12-skills-standardization.md)、本报告、技能清单及JSON。

本轮没有修改Skill Loader、Agent业务实现、Graph节点/边、API业务模型、工具注册或前端。当前工作区还有其它任务的既有/并发修改，不能把`git status`中的所有变化归于本轮；未覆盖、回退或清理那些文件。

## 兼容性与职责裁定

- 原name、aliases、版本、trigger/triggers、steps、tools、required_inputs、failure_policy等执行元数据保持一致。
- 增加中文description，用于发现和理解技能，不声称它自动改变现有调度。
- Agent接收和转换任务；Graph执行顺序、分支、预算、循环与降级；Skill描述业务判断；Tools提供观察/受权操作；Result Schema限制返回。文档步骤标签不改成新Graph节点。
- 允许工具不等于每次已调用；结构化tool步骤按原绑定调度。记录为空工具表时的内部副作用，不把Memory/Router的`tools=[]`写成“绝无副作用”。
- Diagnosis正文被实际推理提示消费；其它确定性流程不一定将整个Skill正文交给模型。仅补正文不会给未实现的算法、门禁或验收能力，也不会自动改变确定性Validator。
- 5处goal是说明文案修正，不改变调度字段或权限：

| 技能 | 原目标 | 修正后 |
| --- | --- | --- |
| `safety_triage_skill` | 对严重事件进行安全分级并识别必须立即执行的安全控制。 | 对严重事件进行风险识别，并提出需人工或安全系统核查的处置建议。 |
| `dimension_inspection_skill` | 对生产零件的关键尺寸执行专项质量检测。 | 核对生产零件与权威设计规格的尺寸或参数一致性。 |
| `part_quality_inspection_skill` | 对生产零件的尺寸、外观、材料、功能和工艺进行综合质量检测。 | 按权威设计参数或适用检验范围检测生产零件，并支持受控质检闭环。 |
| `auto_assignment` | 基于技能、班次、区域和负载选择维修人员。 | 按设备登记负责关系、在线可用状态和负载选择或核验派工人员。 |
| `workorder_reopen` | 质检不通过时重新打开工单并返回返工入口。 | 按实际状态迁移规则重开已有工单，不重复创建任务。 |

## 问题逐项裁定

| 问题 | 状态 | 实际处理或边界 |
| --- | --- | --- |
| 文档章节缺失、description缺失 | 已修复 | 全30文档统一完整结构，由真实Loader逐份校验 |
| 输入输出只给宽泛介绍，缺可验证例子 | 已修复 | 全30提供一组合法原契约JSON，禁止顶层虚构字段 |
| 公共图编排与技能特有业务混淆 | 已修复 | 分别写实际节点/条件分支和专有任务；不新增节点 |
| 各领域判断规则不足 | 已修复 | 报警≠根因、相关≠因果、SOP≠目录、模拟≠实测、草案≠派工、正文≠PDF等专业边界逐个说明 |
| 工具参数、观察使用与失败处理不明确 | 已修复 | 按现有注册及参数模型写调用表，保留原白名单和失败体 |
| 停止预算、重复查询与降级表述不准确 | 已修复 | 写明各Graph现有预算和停止机制，不虚构新停止行为 |
| 名称/别名/工具范围是否需重做 | 原本已有机制，无需重构 | 原Loader能解析Markdown及别名；30份契约快照回归与实际Guard验证通过 |
| 需要把每份文件强行改名为SKILL.md | 不成立 | 当前Loader按agent目录平铺*.md加载；强改名会冲突或遗漏，保留真实约定 |
| 工具允许就必须全部执行 | 不成立 | 文档将许可、实际分支、已执行记录分开 |
| 空知识结果需要生成假成功 | 不成立 | 保留现有insufficient_evidence及可追踪不足，不伪造资料 |
| 已有输入事实却在诊断样例丢弃 | 已修复 | 4个样例用实际fallback构建，保留名称/单位/输入证据和真实置信度；ready不等于根因已验证 |
| SOP/混合检索部分命中样例清空证据 | 已修复 | 运行实际合并、校验和构建函数，保留文档/证据/来源并返回不足 |
| 手册空正文样例错误声称现有Validator会拒绝 | 文档已修复；运行时语义缺口未改 | 准确示例为completed但content为空，明确不能据此构造步骤；不为迎合文档擅改Validator |
| 虚拟质检样例使用production发起且伪造失败回执 | 已修复 | 改router真实A2A来源，服务器私有context另附；调用完成与检测insufficient_data分开，缺权限是A2AError |
| 报警技能“不能绕过设备范围”与后端现有回退矛盾 | 已修复说明 | 模型不可自行移除范围；后端显式扩大范围要保留retrieval_scope/fallback/reason并标跨设备参考 |
| FreeCAD专业协议是否被模板删除 | 原本合理并已保留 | 独立核对原协议，保持结构化build_model/freecad_mcp绑定 |
| 旧BuildCAD及业务闭环测试不通过 | 未完成，非本轮标准化修改范围 | 未恢复已停用通道、修改业务API或放宽断言；逐项记录71项 |
| 真实模型能否始终遵守新正文 | 未执行现场验证 | 没有真实收费模型和设备联调，不能将离线契约通过等同生产语义验收 |

## 独立审查与最后一次修正

整改前进行了按领域的独立只读文档应用检查：不是只看标题，而是尝试构造真实输入、决定工具、处理空证据/失败/停止条件，再核对代码。共覆盖Diagnosis/Knowledge10份、Maintenance/WorkOrder/Quality11份、CAD/Memory/Report/Router9份。

最终一次独立审查确认原元数据兼容、建模协议保留，同时指出4组重要示例问题：知识部分证据被丢弃、手册空正文实际状态不符、Diagnosis已有事件事实被丢弃、虚拟质检来源/权限返回不符。先新增8个会失败的场景回归（8失败），再在同一修正轮中用真实函数/Graph/A2A返回改写示例；未让模型说明覆盖真实状态。报警范围措辞与指标label/unit同时纠正。完成修正后没有反复发起重审或无限修订。

只读CLI还复现了无pytest临时配置时误初始化业务存储的问题，以及清单遗漏Graph边的问题；先收紧回归并看到失败，再将隔离路由、UTF-8输出和编译边导出补齐。生产配置文件没有修改。

## 实际测试命令与结果

执行环境：`L:/anaconda/python.exe`、`L:/nodejs/node.exe`，本地PowerShell；pytest使用既有独立Agent配置。服务conftest禁用.env、注入临时存储/隔离适配器和不可用工厂地址；浏览器路由为隔离fixture，未访问真实业务后端。

| 验证 | 通过 | 失败 | 跳过/未选择 | 说明 |
| --- | ---: | ---: | --- | --- |
| 原文档标准化基线 | 31 | 60 | 0 | 30缺章节/description，30缺精确示例；先观察失败 |
| 逐份修改后契约/Guard校验 | 每份3，共90 | 0 | 每次88 deselected | 30份逐一运行，没有只测试一个技能 |
| 审查发现的真实场景RED | 0 | 8 | 92 deselected | 三Knowledge、四Diagnosis、一虚拟Quality |
| 最终新增完整回归 | 100 | 0 | 0 | UTF-8、干净CLI环境、图边检查也已包含 |
| 相关已有服务回归 | 151 | 0 | 0 | 注册、别名、调度、权限、Quality、FreeCAD、虚拟A2A、专家中心、知识可信来源 |
| 专家中心浏览器回归 | 15 | 0 | 0 | 当前React源码在隔离页面编译，列表、编辑、权限、测试发布与恢复流程 |
| 第一次完整Agent套件 | 2236 | 71 | 3 | 总2310；在最后8项场景及CLI回归加入前 |
| 最新完整Agent套件 | 2245 | 71 | 3 | 总2319，6分25秒；失败集合与上次完全相同 |
| 只读技能审计 | 30技能/9Agent | 0错误 | 不运行工具 | 93条编译边，无引用路径或契约遗漏 |

测试之间存在覆盖重叠，不把100、151、2245简单相加宣称总覆盖。最新全量在示例修正后执行；随后只增强审计CLI隔离与边检查并重跑100项完整新增测试。所有示例验证原结构模型；8个重点场景额外运行真实结果构建或A2A/Graph，不声称所有示例都经过真实工厂执行。

### 新增完整回归

```powershell
L:/anaconda/python.exe -X utf8 -m pytest -c pytest-agent.ini services/agent-service/tests/test_skill_standardization.py -q --tb=short --junitxml=.runtime/verification/skills-standardization-targeted.xml
```

### 逐份回归

```powershell
L:/anaconda/python.exe -X utf8 -m pytest -c pytest-agent.ini services/agent-service/tests/test_skill_standardization.py -q --tb=short -k '<agent>-<实际运行标识>'
```

每一份实际技能均使用对应参数执行，不是只跑上述占位命令；每次3通过。

### 相关服务回归

```powershell
L:/anaconda/python.exe -X utf8 -m pytest -c pytest-agent.ini services/agent-service/tests/test_skill_registry.py services/agent-service/tests/test_skill_aliases.py services/agent-service/tests/test_skill_optimization.py services/agent-service/tests/test_skill_tool_dispatch.py services/agent-service/tests/test_runtime_skill_scope.py services/agent-service/tests/test_runtime_maintenance_skill_scope.py services/agent-service/tests/test_quality_backend_contract.py services/agent-service/tests/test_quality_data_gate.py services/agent-service/tests/test_freecad_graph.py services/agent-service/tests/test_virtual_production_agents.py services/agent-service/tests/test_expert_center.py services/agent-service/tests/test_expert_trials.py services/agent-service/tests/test_knowledge_source_trust.py -q --tb=short --junitxml=.runtime/verification/skills-standardization-regression.xml > .runtime/verification/skills-standardization-regression.log 2>&1
```

### 最新完整Agent套件

```powershell
L:/anaconda/python.exe -X utf8 -m pytest -c pytest-agent.ini -q --tb=short --junitxml=.runtime/verification/skills-standardization-final-full.xml > .runtime/verification/skills-standardization-final-full.log 2>&1
```

### 专家中心浏览器验证

```powershell
$env:PLAYWRIGHT_MODULE_PATH='C:/Users/12587/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs'
$env:CHROME_EXECUTABLE='C:/Program Files/Google/Chrome/Application/chrome.exe'
L:/nodejs/node.exe --test tests/browser/expert-center.test.mjs > .runtime/verification/skills-standardization-expert-browser.log 2>&1
```

### 证据文件

- [新增测试JUnit](L:/industry_agent/.runtime/verification/skills-standardization-targeted.xml)
- [相关测试JUnit](L:/industry_agent/.runtime/verification/skills-standardization-regression.xml)
- [完整测试JUnit](L:/industry_agent/.runtime/verification/skills-standardization-final-full.xml)
- [完整失败日志](L:/industry_agent/.runtime/verification/skills-standardization-final-full.log)
- [浏览器测试日志](L:/industry_agent/.runtime/verification/skills-standardization-expert-browser.log)

## 完整测试失败与跳过

71个失败分组如下。没有删除失败测试、扩大跳过或改松断言；“失败集合不变”是本轮两次完整测试的比对结果，不等于已经证明每一项在开始整改之前都失败。

| 测试模块 | 失败数 | 当前观察 |
| --- | ---: | --- |
| `test_buildcad_alignment` | 48 | 测试仍期待BuildCAD活跃建模路径；当前兼容入口提示已停用/FreeCAD，needs_input等与预期不同 |
| `test_buildcad_api` | 9 | 测试仍期待BuildCAD活跃建模路径；当前兼容入口提示已停用/FreeCAD，needs_input等与预期不同 |
| `test_buildcad_http_contract` | 1 | 测试仍期待BuildCAD活跃建模路径；当前兼容入口提示已停用/FreeCAD，needs_input等与预期不同 |
| `test_buildcad_node` | 8 | 测试仍期待BuildCAD活跃建模路径；当前兼容入口提示已停用/FreeCAD，needs_input等与预期不同 |
| `test_business_returns_api` | 2 | 响应没有测试期待的report字段 |
| `test_business_trace_returns` | 1 | 中文标签全角冒号与测试期待不同 |
| `test_full_agent_runtime_e2e` | 1 | 隔离Backend生命周期worker仍读取请求中不存在的snapshot字段 |
| `test_p0_p1_lifecycle_smoke` | 1 | 隔离Backend生命周期worker仍读取请求中不存在的snapshot字段 |

### 失败项完整名单

```text
services.agent-service.tests.test_buildcad_alignment::test_empty_design_list_is_a_completed_read_without_a_model
services.agent-service.tests.test_buildcad_alignment::test_get_code_is_direct_and_retains_raw_result
services.agent-service.tests.test_buildcad_alignment::test_read_without_usable_data_is_failed_and_preserves_raw_reply[list_designs]
services.agent-service.tests.test_buildcad_alignment::test_read_without_usable_data_is_failed_and_preserves_raw_reply[get_design_code]
services.agent-service.tests.test_buildcad_alignment::test_empty_code_is_a_valid_read_result
services.agent-service.tests.test_buildcad_alignment::test_preview_cannot_write_even_if_model_requests_save
services.agent-service.tests.test_buildcad_alignment::test_preview_cannot_finish_after_only_listing_designs
services.agent-service.tests.test_buildcad_alignment::test_render_rejects_incompatible_or_invalid_python_before_remote_call[import cadquery as cq\nresult = cq.Workplane('XY')]
services.agent-service.tests.test_buildcad_alignment::test_render_rejects_incompatible_or_invalid_python_before_remote_call[from llmcad import *\nshow_object(result)]
services.agent-service.tests.test_buildcad_alignment::test_render_rejects_incompatible_or_invalid_python_before_remote_call[result = 1]
services.agent-service.tests.test_buildcad_alignment::test_render_rejects_incompatible_or_invalid_python_before_remote_call[from llmcad import *\nresult = (]
services.agent-service.tests.test_buildcad_alignment::test_preview_requires_actual_image_evidence[remote_result0]
services.agent-service.tests.test_buildcad_alignment::test_preview_requires_actual_image_evidence[remote_result1]
services.agent-service.tests.test_buildcad_alignment::test_preview_requires_actual_image_evidence[remote_result2]
services.agent-service.tests.test_buildcad_alignment::test_undisplayable_image_does_not_complete_or_unlock_save[image0]
services.agent-service.tests.test_buildcad_alignment::test_undisplayable_image_does_not_complete_or_unlock_save[image1]
services.agent-service.tests.test_buildcad_alignment::test_undisplayable_image_does_not_complete_or_unlock_save[image2]
services.agent-service.tests.test_buildcad_alignment::test_undisplayable_image_does_not_complete_or_unlock_save[image3]
services.agent-service.tests.test_buildcad_alignment::test_undisplayable_image_does_not_complete_or_unlock_save[image4]
services.agent-service.tests.test_buildcad_alignment::test_undisplayable_image_does_not_complete_or_unlock_save[image5]
services.agent-service.tests.test_buildcad_alignment::test_undisplayable_image_does_not_complete_or_unlock_save[image6]
services.agent-service.tests.test_buildcad_alignment::test_undisplayable_image_does_not_complete_or_unlock_save[image7]
services.agent-service.tests.test_buildcad_alignment::test_safe_https_image_asset_is_preview_evidence[image/png]
services.agent-service.tests.test_buildcad_alignment::test_safe_https_image_asset_is_preview_evidence[image/jpeg]
services.agent-service.tests.test_buildcad_alignment::test_safe_https_image_asset_is_preview_evidence[image/webp]
services.agent-service.tests.test_buildcad_alignment::test_confirmed_action_finishes_without_another_model_summary[preview]
services.agent-service.tests.test_buildcad_alignment::test_confirmed_action_finishes_without_another_model_summary[save]
services.agent-service.tests.test_buildcad_alignment::test_batch_stops_at_confirmed_action_without_executing_later_requests[preview]
services.agent-service.tests.test_buildcad_alignment::test_batch_stops_at_confirmed_action_without_executing_later_requests[save]
services.agent-service.tests.test_buildcad_alignment::test_no_tool_answer_is_retained_as_unexecuted_input_request[\u8bf7\u63d0\u4f9b\u957f\u5bbd\u9ad8\u3001\u58c1\u539a\u548c\u5b54\u5f84\u3002]
services.agent-service.tests.test_buildcad_alignment::test_no_tool_answer_is_retained_as_unexecuted_input_request[\u6211\u5df2\u7ecf\u5efa\u6a21\u5b8c\u6210\u3002]
services.agent-service.tests.test_buildcad_alignment::test_only_read_operations_do_not_hide_dimension_clarification[save-steps0]
services.agent-service.tests.test_buildcad_alignment::test_only_read_operations_do_not_hide_dimension_clarification[preview-steps1]
services.agent-service.tests.test_buildcad_alignment::test_only_read_operations_do_not_hide_dimension_clarification[preview-steps2]
services.agent-service.tests.test_buildcad_alignment::test_clarification_after_preview_does_not_hide_unfinished_save
services.agent-service.tests.test_buildcad_alignment::test_remote_failure_stops_before_any_later_clarification[render_preview-reply0-failed]
services.agent-service.tests.test_buildcad_alignment::test_remote_failure_stops_before_any_later_clarification[save_design-reply1-outcome_unknown]
services.agent-service.tests.test_buildcad_alignment::test_fetch_failed_is_attributed_to_remote_render_without_retry
services.agent-service.tests.test_buildcad_alignment::test_save_checks_account_and_latest_code_then_only_saves_rendered_code
services.agent-service.tests.test_buildcad_alignment::test_existing_blank_design_can_be_saved_after_successful_preview
services.agent-service.tests.test_buildcad_alignment::test_failed_or_imageless_render_never_reaches_save[reply0]
services.agent-service.tests.test_buildcad_alignment::test_failed_or_imageless_render_never_reaches_save[reply1]
services.agent-service.tests.test_buildcad_alignment::test_save_blocks_unrendered_code_and_cross_design_operations[steps0]
services.agent-service.tests.test_buildcad_alignment::test_save_blocks_unrendered_code_and_cross_design_operations[steps1]
services.agent-service.tests.test_buildcad_alignment::test_save_blocks_unrendered_code_and_cross_design_operations[steps2]
services.agent-service.tests.test_buildcad_alignment::test_save_blocks_unrendered_code_and_cross_design_operations[steps3]
services.agent-service.tests.test_buildcad_alignment::test_nonexistent_design_blocks_save_before_model_or_get_code
services.agent-service.tests.test_buildcad_alignment::test_read_action_does_not_construct_model_and_exposes_action_and_designs
services.agent-service.tests.test_buildcad_api::test_real_api_executes_one_cad_node_skill_and_tool_then_get_is_read_only
services.agent-service.tests.test_buildcad_api::test_same_command_is_atomic_and_different_prompt_conflicts
services.agent-service.tests.test_buildcad_api::test_run_record_preserves_validated_prompt_for_acceptance_lookup_and_duplicates
services.agent-service.tests.test_buildcad_api::test_legacy_record_omits_missing_prompt_and_internal_fields_on_lookup_and_duplicate
services.agent-service.tests.test_buildcad_api::test_remote_error_and_unknown_outcome_are_never_success_or_replayed[outcome0-failed]
services.agent-service.tests.test_buildcad_api::test_remote_error_and_unknown_outcome_are_never_success_or_replayed[outcome1-outcome_unknown]
services.agent-service.tests.test_buildcad_api::test_only_two_runs_execute_concurrently_and_duplicate_inflight_request_is_read_only
services.agent-service.tests.test_buildcad_api::test_two_simultaneous_missing_reads_still_claim_the_same_command_only_once
services.agent-service.tests.test_buildcad_api::test_result_storage_failure_keeps_claim_and_does_not_replay_remote_call
services.agent-service.tests.test_buildcad_http_contract::test_cad_api_to_real_http_model_and_mcp_without_external_side_effects
services.agent-service.tests.test_buildcad_node::test_actual_node_skill_tool_uses_discovered_schema_and_preserves_result
services.agent-service.tests.test_buildcad_node::test_wrong_dynamic_schema_stops_before_network
services.agent-service.tests.test_buildcad_node::test_duplicate_write_is_not_reexecuted
services.agent-service.tests.test_buildcad_node::test_save_reads_selected_design_then_previews_exact_code_before_one_write
services.agent-service.tests.test_buildcad_node::test_mcp_error_never_reports_design_success
services.agent-service.tests.test_buildcad_node::test_no_tool_result_cannot_claim_generated_model
services.agent-service.tests.test_buildcad_node::test_queries_cannot_select_buildcad_skill_and_tool_is_scoped
services.agent-service.tests.test_buildcad_node::test_provider_value_error_is_not_exposed
services.agent-service.tests.test_business_returns_api::test_quality_input_inspection_report_and_real_tools_are_connected
services.agent-service.tests.test_business_returns_api::test_failed_quality_rectification_reinspection_release_and_close_are_logged
services.agent-service.tests.test_business_trace_returns::test_quality_pdf_fields_and_missing_data_have_chinese_labels
services.agent-service.tests.test_full_agent_runtime_e2e::test_full_evidence_driven_runtime_lifecycle
services.agent-service.tests.test_p0_p1_lifecycle_smoke::test_event_to_closed_case_smoke
```

### 跳过的3项

- `services.agent-service.tests.test_freecad_document_artifacts::test_symlink_files_are_not_trusted`：Windows symlink permission unavailable。
- `services.agent-service.tests.test_freecad_sheetmetal::test_real_bent_sheet_and_unfold_are_valid_and_editable[90-0.4]`：独立 FreeCAD 验收需显式开启，离线测试不代替内核验收。
- `services.agent-service.tests.test_freecad_sheetmetal::test_real_bent_sheet_and_unfold_are_valid_and_editable[60-0.5]`：独立 FreeCAD 验收需显式开启，离线测试不代替内核验收。

## 保留的实现边界与后续事项

以下从真实代码发现并在文档中诚实说明。本轮未将文档标准化扩展成无关业务重构。

1. Knowledge Validator验证身份/来源/覆盖和结构，不验证正文非空或语义相关性。空正文可能completed；缺SOP的兼容answer仍可能说“可执行知识”。下游不得凭answer覆盖insufficient_evidence/validation_findings；若要保证正文质量需另做业务代码整改。
2. RAG客户端已有显式扩大到全库的回退；返回必须标记范围和原因。文档没有承诺代码已经强制所有结果属于当前设备。
3. Diagnosis evidence_status=ready可只表示输入中有事实，不保证根因、报警定义、知识完整或派工许可。当前观察哈希含步骤，不承诺完全消除跨轮重复业务证据。
4. 本地设备日志兼容摘要不等于真实PLC日志；库存或人员接口的演示/不可用标记不能当正式派工依据。不自行猜测设备合格阈值或修复数据源。
5. AutoAssignment按实际登记负责关系、可用状态和负载排序；旧权重评分函数不能被写成当前执行算法。
6. WorkOrder完成反馈不等于维修验收、人员确认或产线复机；重开受实际状态迁移约束，不能“质检失败就无条件重开”。
7. CAD建模许可、设计参数校验、模拟生产、模拟尺寸比较和实物验收为不同边界。没有运行真实FreeCAD/SheetMetal内核验收或设备控制。
8. Memory部分持久化成功不是全部存储都成功；读/写去重身份不同，保留现有机制及副作用未知时不盲目重试。
9. Report正文持久化与PDF产物存在不同入口；不能由技能名或白名单推定PDF已生成、故障已恢复或工单已闭环。
10. 全面运行其他四服务、真实模型行为、生产数据库/向量库/设备验收、自动部署与前端产物发布本轮未执行；不是本轮技能文档任务的验收范围。

## 配置、数据和恢复

- 没有改生产配置、密钥、模型提供方、数据库结构或数据目录，无业务数据迁移。
- 原始备份位置：[技能备份目录](L:/industry_agent/.local-backups/skills-standardization-20261012/skills)。修改前复制整个技能源码树；没有覆盖已有备份。
- 恢复仅针对30个改动的Markdown，**不要覆盖整个技能目录或回退注册器/管理器**，它们可能含其它任务修改。
- 先停止对同一技能的编辑，比较当前文件与备份；存在本轮之后的更新时先保留新文件并人工合并，不可直接覆盖。
- 经核对后可按单文件恢复，例如下面命令是恢复说明，本轮没有执行：

```powershell
# 先核对差异，确认没有覆盖后续修改。
Compare-Object (Get-Content -LiteralPath 'L:/industry_agent/.local-backups/skills-standardization-20261012/skills/diagnosis/alarm_diagnosis.md' -Encoding UTF8) (Get-Content -LiteralPath 'L:/industry_agent/services/agent-service/app/skills/diagnosis/alarm_diagnosis.md' -Encoding UTF8)
# 人工确认后，只复制该文件；其余文件按清单逐份处理。
Copy-Item -LiteralPath 'L:/industry_agent/.local-backups/skills-standardization-20261012/skills/diagnosis/alarm_diagnosis.md' -Destination 'L:/industry_agent/services/agent-service/app/skills/diagnosis/alarm_diagnosis.md'
```

恢复旧正文后本轮标准化章节/示例测试会再次失败，这是预期，不应删除测试来制造通过。Loader按现有mtime机制重载文档；本轮未重启服务、自动提交代码、部署或调用设备控制。

## 验收口径

- 技能文档标准化、逐份Loader/契约/Guard验证、清单与回归：已完成。
- 全项目所有业务、真实模型遵循、实物验收、完整服务套件全绿：未宣称完成。

