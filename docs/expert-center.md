# 专家中心使用与验证记录

初次上线：2026-10-10；测试发布流程更新：2026-10-11。

## 技能名称与作用展示（2026-10-12）

技能目录逐项显示中文技能名称、真实 Skill 标识、所属智能体、技能作用及上次修改时间。选择后，编辑区顶部显示同一技能的名称、标识、作用和所属智能体；作用直接读取已保存的技能目标，不新增硬编码介绍或截图中的其它行业技能。修改目标未发布时，这里的介绍仍表示当前已保存内容。

本轮仅修改 `ExpertWorkspace.jsx`、`expert.css` 和专家中心浏览器回归；不修改 API、在线技能文件、工具权限或测试发布门禁。目录与详情保持纵向布局，长标识及说明可换行。

验证：新增名称、作用和跨技能选择回归先失败后通过；`node --test tests/browser/expert-center.test.mjs` 为 15 通过、0 失败、0 跳过；前端目录 `node --test` 为 259 通过、0 失败、0 跳过；`npm.cmd run build:monitor` 成功（保留现有大于 500 kB 的分包提示）。只读加载当前构建，以隔离接口样例检查桌面和移动端排版，无页面脚本错误或技能信息区域横向溢出；未调用实际模拟故障或设备控制。本轮未修改后端，未重跑整个 Agent 套件，也未自动启动本地业务服务。

四个修改前文件备份在 `.local-backups/expert-skill-labels-20261012`。恢复时先保存当前版本，再对照撤回本节对应的展示差异；不要用整文件覆盖其它会话已有修改。构建产物通过 Vite 从当前源码生成，未手工修改 assets。

## 使用

1. 打开 http://127.0.0.1:8001/?view=expert，或者左侧“知识资产 → 专家中心”。
2. 登录现有维修小组账号。当前 Backend 只允许维修人员注册、登录和解析会话，因而复用有效维修账号编辑，不创建新角色。
3. 选择技能，查看“上次修改”时间，修改目标和普通文章正文，填写修改说明。页面不显示版本号或内部循环说明，版本元数据仍由系统保留。正文直接显示标题、段落、列表及表格，用“正文／标题／小标题／加粗／项目列表／编号列表”按钮排版，无需输入 Markdown 标记。名称、触发条件、工具白名单、步骤、停止条件及其它元数据不可网页修改。
4. 在“模拟机器全流程测试”选择本人负责的监控中心现有模拟机器、真实故障场景及预期结果。整线须处于运行状态，且没有其它未处理故障或活动场景。
5. 点击“测试修改”。场景触发后由正常监控入口发现故障、暂停整线、执行草稿诊断、生成方案及工单。被派工人员填写处理说明并确认维修，系统解除本次测试场景后沿用正常复机流程；汇总报告保存且所选技能实际执行后，才可核对并发布。测试失败或流程未完成不能发布。
6. 默认显示诊断、知识检索、CAD 的 13 个技能；勾选“显示其它智能体技能”查看全部 30 个技能。
7. 切换中心保留同一身份的草稿；已开始的机器测试在本标签页保存测试编号、基线及草稿，重新打开页面继续查询同一次测试，不重复触发故障。切换账号不能读取其它账号的测试凭据。
8. 他人同时修改后刷新，会保留草稿并以文章格式展示最新已保存正文、目标和上次修改时间。先合并，再点击“确认已核对，采用新基线”，核对前不能保存。自己未修改的字段采用远端最新值。

## 现有模拟机器闭环试验（2026-10-11）

`/api/expert/machines` 查询负责设备与现有故障场景，`/skills/{agent}/{name}/machine-test` 启动试验，`/tests/{id}` 返回进度，`/tests/{id}/finish` 由真实被派工人员确认本次工单。入口保持会话身份、同源 Origin、请求字段白名单和虚拟工厂模式限制。

机器测试冻结全部智能体的技能文件，只替换选定草稿；ContextVar 隔离不同请求，并跨 Runtime、LoopEngine、Harness 线程传递。监控送来的新设备/报警/时间匹配事件被关联到试验，仍使用正常事件幂等、业务持久化与派工链路。实际完成的 Harness 回执记录所选技能是否执行，未调用的技能不能因其它流程成功而被发布。工单后续人工操作和经验总结也沿用冻结草稿。测试不会先覆盖线上技能。

试验占用整线；其它故障或其它试验进行时不能再启动。确认维修时只在活动场景全部属于本次试验后调用工厂当前的场景解除接口，保留其它故障。完成检查依据关联工单、实际停机周期、全部原设备运行状态及同一周期持久化报告。旧报告、诊断预览、未完成维修都不能授权发布。服务重启后的未完成试验标记失败，保留机器及业务数据，不自动重放设备指令。

本轮验证：后端针对性回归 84 项、浏览器 14 项、文章格式转换 4 项通过，Vite 构建成功。机器完成测试使用真实 Backend 子进程、临时数据库、正常工单确认及持久化周期报告；模型与设备传输边界隔离。另以真实 Runtime 图验证草稿跨执行线程进入诊断提示并生成工单。没有把这些隔离回归称为已在用户当前机器上完成一次故障维修。旧的 `test_p0_p1_lifecycle_smoke` 仍引用已经过时的自动核验适配器（缺少 snapshot），本轮未改业务代码去迎合旧核验流程；当前人工确认路径由 `test_manual_restart_integration` 验证。

零件质检与设备维修检查采用现有系统的真实适用流程，不伪造未执行的质检。若所选技能未被该故障流程调用，界面说明原因并禁止发布，应选择能触发该技能的测试流程。

## 正文格式（2026-10-11）

专家正文、版本对照和试运行结果使用相同文章排版，界面不再显示原始 Markdown 标记。只在实际编辑后将普通文档转换为原有技能存储格式；只查看、测试或修改版本／目标时，原文保持逐字节一致。编辑后仍需重新测试并人工核对才能发布。标题、列表、引用、表格和示例内容均保留；粘贴仅使用纯文本，正文中的 HTML 不执行。空正文、超过 24000 字符的正文不能试运行或发布。没有修改其它中心或线上技能内容。

格式回归：正文转换 4 项、浏览器流程 13 项全部通过，Vite 构建成功。用现有报警诊断正文和实际样式检查了标题、段落、列表及页面宽度，截图保存在 `.runtime/verification/expert-format-20261011/expert-editor.png`。本轮最后检查时 8001／8010 应用服务未运行；构建产物已更新，未宣称线上页面已可用。

## 生效边界

- 规范存储仍是 `services/agent-service/app/skills/{agent}/*.md`。注册表按文件变化重载，不新增 SQLite 或迁移数据库。
- 诊断：所选技能正文、版本进入后续模型调用的消息上下文，工具 Guard、证据、审批与验收校验不变。
- CAD：已有生产建模模型解析路径消费 skill.document，现在随注册表热加载。简单尺寸的确定性解析不会被正文重写。
- 知识检索及 CAD 工程查询：仍按代码中的受控循环执行。编辑说明不自动改变算法、节点、工具范围，也不把说明冒充检索证据。
- 新任务按后续加载的说明执行。历史结果及已缓存任务不会自动重新运行；未宣称整个在途任务都被整体冻结。
- 旧的诊断样例 API 仅为隔离预览，不能授权发布。网页测试使用现有模拟机器完整业务链路，真实保存测试工单和报告。
- 其它智能体提供明确标注的“说明试读”，由当前模型依据草稿与故障样例返回内容。该模式不运行其固定业务流程，也不证明检索、CAD 生成或工单执行算法通过了测试。
- 模型必须返回完整诊断内容；技术判断仍需人工对照预期结果核对。样例试运行成功不等于生产验收通过。

## 测试与发布约束（2026-10-11）

- 公开更新接口必须提供服务器生成的 `test_id` 和明确的 `human_confirmed: true`，不能仅从浏览器伪造测试成功状态。
- 测试记录位于 `.runtime/skill-revisions/tests/{test_id}.json`，包含操作者、样例、草稿指纹、测试开始时技能文件哈希、结果与时间；读取仅限记录所属账号。
- 记录绑定版本、目标、正文、修改说明及线上基线。修改草稿、合并远端更新、相关技能变化、测试失败或超过 24 小时后，必须重新测试。
- 后台最多并发两次测试，同一账号只允许一次在途测试。前端异步等待结果，退出登录或切换技能后迟到的结果不能恢复旧编辑器。
- 同一文件锁保护测试状态读取、结果原子写入与发布校验，避免 Windows 文件打开期间替换失败。发布仍沿用备份、原子替换和注册表热加载；审计记录关联测试编号与人工确认。
- 所有测试工具只读取人工样例。未提供的历史或知识数据返回未找到，不虚构数值或检索命中。

验证：新增样例发布、失败、身份隔离、并发、版本变化、过期及业务写入拒绝回归；专家中心与诊断历史/缓存回归 67 项通过，共用技能图回归 49 项通过，浏览器流程 9 项通过。前端 Vite 构建成功。真实模型样例试运行结果单独核对，不与这些隔离回归混计。

真实模型验证：复制诊断技能到私有测试目录，使用当前配置的模型服务对报警 700006 样例试运行，返回了就位反馈/分度机构排查建议，明确没有证据证明机械零件损坏。线上技能文件逐字节保持一致，业务工具调用为 0。测试上下文明确数值置信度格式；最初模型返回中文置信度时测试失败，没有被标记成功。最终结果保存在本地忽略目录 `.runtime/verification/expert-trials-20261011/live-sample.json`。

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

