# 专家中心使用与验证记录

日期：2026-10-10。本轮只增加专家中心；不修改模型、设备控制、Backend 身份体系或生产配置。

## 使用

1. 打开 http://127.0.0.1:8001/?view=expert，或者左侧“知识资产 → 专家中心”。
2. 登录现有维修小组账号。当前 Backend 只允许维修人员注册、登录和解析会话，因而复用有效维修账号编辑，不创建新角色。
3. 选择技能，修改版本、目标、中文 Markdown 正文，填写修改说明并保存。名称、触发条件、工具白名单、步骤、停止条件及其它元数据不可网页修改。
4. 默认显示诊断、知识检索、CAD 的 13 个技能；勾选“显示其它智能体技能”查看全部 30 个技能。
5. 切换左侧中心保留同一身份的草稿；切换身份、退出或刷新页面清除未保存草稿，已保存的文档重新读取仍保留。
6. 版本冲突后刷新，会保留草稿并展示最新已保存正文、目标与版本。先合并，再点击“确认已核对，采用新基线”，核对前不能保存。自己未修改的字段采用远端最新值。

## 生效边界

- 规范存储仍是 `services/agent-service/app/skills/{agent}/*.md`。注册表按文件变化重载，不新增 SQLite 或迁移数据库。
- 诊断：所选技能正文、版本进入后续模型调用的消息上下文，工具 Guard、证据、审批与验收校验不变。
- CAD：已有生产建模模型解析路径消费 skill.document，现在随注册表热加载。简单尺寸的确定性解析不会被正文重写。
- 知识检索及 CAD 工程查询：仍按代码中的受控循环执行。编辑说明不自动改变算法、节点、工具范围，也不把说明冒充检索证据。
- 新任务按后续加载的说明执行。历史结果及已缓存任务不会自动重新运行；未宣称整个在途任务都被整体冻结。
- 技术内容需专家自己核对；保存不代表正文内容或模型推理效果已经通过生产验收。

## 文件

- 后端：`app/skills/management.py`、`app/skills/registry.py`、`app/api/expert.py`、`app/api/server.py`、`app/agents/diagnosis/graph.py`（均位于 services/agent-service）。
- 代理：`services/agent-service/monitor_web_server.py`。
- 前端：`frontend/monitor-react/src/app/ExpertWorkspace.jsx`、`expert.css`、`WorkbenchShell.jsx`、`App.jsx`；`src/teamSession.mjs`。
- 回归：`services/agent-service/tests/test_expert_center.py`、`test_monitor_expert_proxy.py`；`tests/browser/expert-center.test.mjs`。
- 计划：`docs/superpowers/plans/2026-10-10-expert-center.md`。
- 发布目录由当前源码 Vite 构建产生，未手工改 assets；其它已有 dirty 修改保留。

## 备份与安全

- Skill 原文备份：`.runtime/skill-revisions/{agent}/{name}/{edit_id}.md`；同名 JSON 保留操作者、原因、旧/新哈希与版本、prepared/applied 状态。
- 调用现有 TraceRecorder 记录审计；数据库追踪暂不可用时返回警告，本地修订记录保留，不伪装数据库写入成功。
- 先备份，再临时文件原子替换。使用本机跨线程/进程文件锁；两个专家同时提交相同基线，最多一位成功，其余 409。
- 详情哈希与正文由同一次读取构造；损坏 YAML 返回受控 503，不返回内部路径。未登录 401，额外 tools/steps/actor/role/path 字段被拒绝。
- Monitor 保留服务令牌与用户会话，专家写入口验证本机 Host、同源 Origin、128 KiB 正文边界。旧会话响应不能恢复旧编辑器。
- 恢复技能：先保留当前文件，依据 JSON 修订哈希核对后恢复旧版 .md；或将备份正文通过专家中心保存为新版本。不要覆盖其它专家后续更新。
- 修改前七个源码文件备份：`.local-backups/expert-center-20261010-102254`。回退前先备份当前版本，再对照撤回本轮差异；App.jsx 有其它会话修改，不应整文件覆盖。移除新 API/UI 时先取消挂载与入口。
- 未改配置/密钥、注册真实测试账号、删除数据库或控制设备。

## 实际测试

测试使用隔离配置、临时 Skill 目录、测试会话提供者和临时 HTTP 服务，调用真实管理器、注册表、FastAPI、Monitor 与 React 组件；未调用生产数据库、收费模型、真实设备。

最终针对性回归：

```powershell
L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_expert_center.py services/agent-service/tests/test_monitor_expert_proxy.py services/agent-service/tests/test_monitor_cad_production_proxy.py services/agent-service/tests/test_monitor_virtual_production_proxy.py services/agent-service/tests/test_skill_registry.py services/agent-service/tests/test_skill_tool_dispatch.py services/agent-service/tests/test_runtime_skill_scope.py services/agent-service/tests/test_freecad_graph.py services/agent-service/tests/test_runtime_diagnosis_timeouts.py -q --tb=short --junitxml=.runtime/verification/expert-center-targeted.xml
```

143 通过、0 失败、0 跳过。

浏览器：设置 PLAYWRIGHT_MODULE_PATH 为本机 playwright-core/index.mjs，CHROME_EXECUTABLE 为本机 Chrome，运行 `node --test tests/browser/expert-center.test.mjs`：7 通过、0 失败、0 跳过。

前端目录运行 `node --test`：236 通过、0 失败、0 跳过；`npm.cmd run build:monitor` 成功。已有大于 500 kB 打包警告未扩大范围处理。`git diff --check` 返回 0，未提交、切换分支或访问远程。

完整 Agent 套件：

```powershell
L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q --tb=short --junitxml=.runtime/verification/expert-center-agent.xml
```

2003 通过、71 失败、2 跳过。该全量运行在最终快照、草稿和账号适配小修之前；最后版本由以上 143 项针对性回归复核，未再跑第二次整个 Agent 套件。

失败分布：旧 BuildCAD 66 项（入口已停用，旧测试仍期待建模），质量/报告链路 3 项（report 字段、中文标点预期），维修闭环旧适配器 2 项（缺少 snapshot）。没有删除失败测试、扩大跳过或降低断言。

将 app 复制到隔离临时目录并换回本轮修改前的 registry/server/diagnosis 文件，六个代表性失败仍复现（基线 XML：`.runtime/verification/expert-center-baseline.xml`）。未声称全部 71 项都逐项做了基线复核；当前完整套件不是全绿。

## 审查和本地生效

独立只读审查发现冲突刷新没有新版对照、侧栏切换丢草稿、详情读取快照不一致；均通过先失败后通过的测试修复。初始监督账号编辑假设经代码核实不可用，改为现有有效维修账号；已向用户说明，未扩张工具或设备权限。

Agent、Monitor 已重载，原环境仅在内存继承；其它六个服务进程保留。页面 200，加载当前构建；未登录同源专家 API 返回 401，而非 404。未使用真实账号保存/改写 Skill。

## 未验证与限制

- 未进行收费模型语义评测、真实账号写入、断电恢复、多主机/网络文件系统并发验证；不能写成生产验收通过。
- 现有有效维修账号都可编辑。专职专家管理员权限若有需要，应单独设计，不能假装已有可登录监督账号。
- 正文编辑不重写确定性循环算法；当前文件锁针对本机，外部编辑器仍应遵守修订核对。
- 不处理本轮范围外的上述旧业务/测试契约失败。

## 完整运行失败清单

- services/agent-service/tests/test_buildcad_alignment.py：`test_empty_design_list_is_a_completed_read_without_a_model`
- services/agent-service/tests/test_buildcad_alignment.py：`test_get_code_is_direct_and_retains_raw_result`
- services/agent-service/tests/test_buildcad_alignment.py：`test_read_without_usable_data_is_failed_and_preserves_raw_reply[list_designs]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_read_without_usable_data_is_failed_and_preserves_raw_reply[get_design_code]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_empty_code_is_a_valid_read_result`
- services/agent-service/tests/test_buildcad_alignment.py：`test_preview_cannot_write_even_if_model_requests_save`
- services/agent-service/tests/test_buildcad_alignment.py：`test_preview_cannot_finish_after_only_listing_designs`
- services/agent-service/tests/test_buildcad_alignment.py：`test_render_rejects_incompatible_or_invalid_python_before_remote_call[import cadquery as cq\nresult = cq.Workplane('XY')]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_render_rejects_incompatible_or_invalid_python_before_remote_call[from llmcad import *\nshow_object(result)]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_render_rejects_incompatible_or_invalid_python_before_remote_call[result = 1]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_render_rejects_incompatible_or_invalid_python_before_remote_call[from llmcad import *\nresult = (]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_preview_requires_actual_image_evidence[remote_result0]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_preview_requires_actual_image_evidence[remote_result1]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_preview_requires_actual_image_evidence[remote_result2]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_undisplayable_image_does_not_complete_or_unlock_save[image0]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_undisplayable_image_does_not_complete_or_unlock_save[image1]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_undisplayable_image_does_not_complete_or_unlock_save[image2]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_undisplayable_image_does_not_complete_or_unlock_save[image3]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_undisplayable_image_does_not_complete_or_unlock_save[image4]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_undisplayable_image_does_not_complete_or_unlock_save[image5]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_undisplayable_image_does_not_complete_or_unlock_save[image6]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_undisplayable_image_does_not_complete_or_unlock_save[image7]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_safe_https_image_asset_is_preview_evidence[image/png]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_safe_https_image_asset_is_preview_evidence[image/jpeg]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_safe_https_image_asset_is_preview_evidence[image/webp]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_confirmed_action_finishes_without_another_model_summary[preview]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_confirmed_action_finishes_without_another_model_summary[save]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_batch_stops_at_confirmed_action_without_executing_later_requests[preview]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_batch_stops_at_confirmed_action_without_executing_later_requests[save]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_no_tool_answer_is_retained_as_unexecuted_input_request[\u8bf7\u63d0\u4f9b\u957f\u5bbd\u9ad8\u3001\u58c1\u539a\u548c\u5b54\u5f84\u3002]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_no_tool_answer_is_retained_as_unexecuted_input_request[\u6211\u5df2\u7ecf\u5efa\u6a21\u5b8c\u6210\u3002]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_only_read_operations_do_not_hide_dimension_clarification[save-steps0]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_only_read_operations_do_not_hide_dimension_clarification[preview-steps1]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_only_read_operations_do_not_hide_dimension_clarification[preview-steps2]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_clarification_after_preview_does_not_hide_unfinished_save`
- services/agent-service/tests/test_buildcad_alignment.py：`test_remote_failure_stops_before_any_later_clarification[render_preview-reply0-failed]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_remote_failure_stops_before_any_later_clarification[save_design-reply1-outcome_unknown]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_fetch_failed_is_attributed_to_remote_render_without_retry`
- services/agent-service/tests/test_buildcad_alignment.py：`test_save_checks_account_and_latest_code_then_only_saves_rendered_code`
- services/agent-service/tests/test_buildcad_alignment.py：`test_existing_blank_design_can_be_saved_after_successful_preview`
- services/agent-service/tests/test_buildcad_alignment.py：`test_failed_or_imageless_render_never_reaches_save[reply0]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_failed_or_imageless_render_never_reaches_save[reply1]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_save_blocks_unrendered_code_and_cross_design_operations[steps0]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_save_blocks_unrendered_code_and_cross_design_operations[steps1]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_save_blocks_unrendered_code_and_cross_design_operations[steps2]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_save_blocks_unrendered_code_and_cross_design_operations[steps3]`
- services/agent-service/tests/test_buildcad_alignment.py：`test_nonexistent_design_blocks_save_before_model_or_get_code`
- services/agent-service/tests/test_buildcad_alignment.py：`test_read_action_does_not_construct_model_and_exposes_action_and_designs`
- services/agent-service/tests/test_buildcad_api.py：`test_real_api_executes_one_cad_node_skill_and_tool_then_get_is_read_only`
- services/agent-service/tests/test_buildcad_api.py：`test_same_command_is_atomic_and_different_prompt_conflicts`
- services/agent-service/tests/test_buildcad_api.py：`test_run_record_preserves_validated_prompt_for_acceptance_lookup_and_duplicates`
- services/agent-service/tests/test_buildcad_api.py：`test_legacy_record_omits_missing_prompt_and_internal_fields_on_lookup_and_duplicate`
- services/agent-service/tests/test_buildcad_api.py：`test_remote_error_and_unknown_outcome_are_never_success_or_replayed[outcome0-failed]`
- services/agent-service/tests/test_buildcad_api.py：`test_remote_error_and_unknown_outcome_are_never_success_or_replayed[outcome1-outcome_unknown]`
- services/agent-service/tests/test_buildcad_api.py：`test_only_two_runs_execute_concurrently_and_duplicate_inflight_request_is_read_only`
- services/agent-service/tests/test_buildcad_api.py：`test_two_simultaneous_missing_reads_still_claim_the_same_command_only_once`
- services/agent-service/tests/test_buildcad_api.py：`test_result_storage_failure_keeps_claim_and_does_not_replay_remote_call`
- services/agent-service/tests/test_buildcad_http_contract.py：`test_cad_api_to_real_http_model_and_mcp_without_external_side_effects`
- services/agent-service/tests/test_buildcad_node.py：`test_actual_node_skill_tool_uses_discovered_schema_and_preserves_result`
- services/agent-service/tests/test_buildcad_node.py：`test_wrong_dynamic_schema_stops_before_network`
- services/agent-service/tests/test_buildcad_node.py：`test_duplicate_write_is_not_reexecuted`
- services/agent-service/tests/test_buildcad_node.py：`test_save_reads_selected_design_then_previews_exact_code_before_one_write`
- services/agent-service/tests/test_buildcad_node.py：`test_mcp_error_never_reports_design_success`
- services/agent-service/tests/test_buildcad_node.py：`test_no_tool_result_cannot_claim_generated_model`
- services/agent-service/tests/test_buildcad_node.py：`test_queries_cannot_select_buildcad_skill_and_tool_is_scoped`
- services/agent-service/tests/test_buildcad_node.py：`test_provider_value_error_is_not_exposed`
- services/agent-service/tests/test_business_returns_api.py：`test_quality_input_inspection_report_and_real_tools_are_connected`
- services/agent-service/tests/test_business_returns_api.py：`test_failed_quality_rectification_reinspection_release_and_close_are_logged`
- services/agent-service/tests/test_business_trace_returns.py：`test_quality_pdf_fields_and_missing_data_have_chinese_labels`
- services/agent-service/tests/test_full_agent_runtime_e2e.py：`test_full_evidence_driven_runtime_lifecycle`
- services/agent-service/tests/test_p0_p1_lifecycle_smoke.py：`test_event_to_closed_case_smoke`

