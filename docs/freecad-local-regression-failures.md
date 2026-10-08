# FreeCAD 扩展后全量 Agent 回归未通过项

日期：2026-10-07。完整原始结果：`.runtime/verification/freecad-tetrahedron-agent-regression.xml`。

实际结果：1301 通过、67 失败、25 个 setup 错误、0 跳过。CAD 专项独立通过，不能据此宣称整个项目全部通过。

其中旧 BuildCAD 66 项仍要求已停用的远端生成行为；另 1 项 `test_closure_flow` 缺少隔离 Backend 地址，25 项 `test_simple_manual_repair` 在 setup 注册监督角色时被当前 Backend 的“仅支持维修人员注册”拒绝。这些并非基础设施生产验收结果。工作区同期有维修身份相关修改，本次 CAD 不覆盖这些文件或放宽其测试。

下列逐项列出，不删除、不跳过失败测试。

## services.agent-service.tests.test_buildcad_alignment

- `test_empty_design_list_is_a_completed_read_without_a_model`：失败。
- `test_get_code_is_direct_and_retains_raw_result`：失败。
- `test_read_without_usable_data_is_failed_and_preserves_raw_reply[list_designs]`：失败。
- `test_read_without_usable_data_is_failed_and_preserves_raw_reply[get_design_code]`：失败。
- `test_empty_code_is_a_valid_read_result`：失败。
- `test_preview_cannot_write_even_if_model_requests_save`：失败。
- `test_preview_cannot_finish_after_only_listing_designs`：失败。
- `test_render_rejects_incompatible_or_invalid_python_before_remote_call[import cadquery as cq\nresult = cq.Workplane('XY')]`：失败。
- `test_render_rejects_incompatible_or_invalid_python_before_remote_call[from llmcad import *\nshow_object(result)]`：失败。
- `test_render_rejects_incompatible_or_invalid_python_before_remote_call[result = 1]`：失败。
- `test_render_rejects_incompatible_or_invalid_python_before_remote_call[from llmcad import *\nresult = (]`：失败。
- `test_preview_requires_actual_image_evidence[remote_result0]`：失败。
- `test_preview_requires_actual_image_evidence[remote_result1]`：失败。
- `test_preview_requires_actual_image_evidence[remote_result2]`：失败。
- `test_undisplayable_image_does_not_complete_or_unlock_save[image0]`：失败。
- `test_undisplayable_image_does_not_complete_or_unlock_save[image1]`：失败。
- `test_undisplayable_image_does_not_complete_or_unlock_save[image2]`：失败。
- `test_undisplayable_image_does_not_complete_or_unlock_save[image3]`：失败。
- `test_undisplayable_image_does_not_complete_or_unlock_save[image4]`：失败。
- `test_undisplayable_image_does_not_complete_or_unlock_save[image5]`：失败。
- `test_undisplayable_image_does_not_complete_or_unlock_save[image6]`：失败。
- `test_undisplayable_image_does_not_complete_or_unlock_save[image7]`：失败。
- `test_safe_https_image_asset_is_preview_evidence[image/png]`：失败。
- `test_safe_https_image_asset_is_preview_evidence[image/jpeg]`：失败。
- `test_safe_https_image_asset_is_preview_evidence[image/webp]`：失败。
- `test_confirmed_action_finishes_without_another_model_summary[preview]`：失败。
- `test_confirmed_action_finishes_without_another_model_summary[save]`：失败。
- `test_batch_stops_at_confirmed_action_without_executing_later_requests[preview]`：失败。
- `test_batch_stops_at_confirmed_action_without_executing_later_requests[save]`：失败。
- `test_no_tool_answer_is_retained_as_unexecuted_input_request[\u8bf7\u63d0\u4f9b\u957f\u5bbd\u9ad8\u3001\u58c1\u539a\u548c\u5b54\u5f84\u3002]`：失败。
- `test_no_tool_answer_is_retained_as_unexecuted_input_request[\u6211\u5df2\u7ecf\u5efa\u6a21\u5b8c\u6210\u3002]`：失败。
- `test_only_read_operations_do_not_hide_dimension_clarification[save-steps0]`：失败。
- `test_only_read_operations_do_not_hide_dimension_clarification[preview-steps1]`：失败。
- `test_only_read_operations_do_not_hide_dimension_clarification[preview-steps2]`：失败。
- `test_clarification_after_preview_does_not_hide_unfinished_save`：失败。
- `test_remote_failure_stops_before_any_later_clarification[render_preview-reply0-failed]`：失败。
- `test_remote_failure_stops_before_any_later_clarification[save_design-reply1-outcome_unknown]`：失败。
- `test_fetch_failed_is_attributed_to_remote_render_without_retry`：失败。
- `test_save_checks_account_and_latest_code_then_only_saves_rendered_code`：失败。
- `test_existing_blank_design_can_be_saved_after_successful_preview`：失败。
- `test_failed_or_imageless_render_never_reaches_save[reply0]`：失败。
- `test_failed_or_imageless_render_never_reaches_save[reply1]`：失败。
- `test_save_blocks_unrendered_code_and_cross_design_operations[steps0]`：失败。
- `test_save_blocks_unrendered_code_and_cross_design_operations[steps1]`：失败。
- `test_save_blocks_unrendered_code_and_cross_design_operations[steps2]`：失败。
- `test_save_blocks_unrendered_code_and_cross_design_operations[steps3]`：失败。
- `test_nonexistent_design_blocks_save_before_model_or_get_code`：失败。
- `test_read_action_does_not_construct_model_and_exposes_action_and_designs`：失败。

## services.agent-service.tests.test_buildcad_api

- `test_real_api_executes_one_cad_node_skill_and_tool_then_get_is_read_only`：失败。
- `test_same_command_is_atomic_and_different_prompt_conflicts`：失败。
- `test_run_record_preserves_validated_prompt_for_acceptance_lookup_and_duplicates`：失败。
- `test_legacy_record_omits_missing_prompt_and_internal_fields_on_lookup_and_duplicate`：失败。
- `test_remote_error_and_unknown_outcome_are_never_success_or_replayed[outcome0-failed]`：失败。
- `test_remote_error_and_unknown_outcome_are_never_success_or_replayed[outcome1-outcome_unknown]`：失败。
- `test_only_two_runs_execute_concurrently_and_duplicate_inflight_request_is_read_only`：失败。
- `test_two_simultaneous_missing_reads_still_claim_the_same_command_only_once`：失败。
- `test_result_storage_failure_keeps_claim_and_does_not_replay_remote_call`：失败。

## services.agent-service.tests.test_buildcad_http_contract

- `test_cad_api_to_real_http_model_and_mcp_without_external_side_effects`：失败。

## services.agent-service.tests.test_buildcad_node

- `test_actual_node_skill_tool_uses_discovered_schema_and_preserves_result`：失败。
- `test_wrong_dynamic_schema_stops_before_network`：失败。
- `test_duplicate_write_is_not_reexecuted`：失败。
- `test_save_reads_selected_design_then_previews_exact_code_before_one_write`：失败。
- `test_mcp_error_never_reports_design_success`：失败。
- `test_no_tool_result_cannot_claim_generated_model`：失败。
- `test_queries_cannot_select_buildcad_skill_and_tool_is_scoped`：失败。
- `test_provider_value_error_is_not_exposed`：失败。

## services.agent-service.tests.test_closure_flow

- `test_anonymous_cannot_create_delete_or_read_workorder`：失败。

## services.agent-service.tests.test_simple_manual_repair

- `test_actual_feedback_and_fresh_backend_receipt_complete_old_wrong_plan_then_restart`：初始化错误。
- `test_no_session_non_assignee_or_supervisor_cannot_confirm_or_control[None-401]`：初始化错误。
- `test_no_session_non_assignee_or_supervisor_cannot_confirm_or_control[expired-401]`：初始化错误。
- `test_no_session_non_assignee_or_supervisor_cannot_confirm_or_control[other-403]`：初始化错误。
- `test_no_session_non_assignee_or_supervisor_cannot_confirm_or_control[supervisor-403]`：初始化错误。
- `test_feedback_or_client_passed_fields_do_not_replace_fresh_prestart[bad0]`：初始化错误。
- `test_feedback_or_client_passed_fields_do_not_replace_fresh_prestart[bad1]`：初始化错误。
- `test_feedback_or_client_passed_fields_do_not_replace_fresh_prestart[bad2]`：初始化错误。
- `test_feedback_or_client_passed_fields_do_not_replace_fresh_prestart[bad3]`：初始化错误。
- `test_feedback_or_client_passed_fields_do_not_replace_fresh_prestart[bad4]`：初始化错误。
- `test_blank_feedback_does_not_confirm_or_restart`：初始化错误。
- `test_missing_or_forged_stored_receipt_blocks_start_and_close[missing]`：初始化错误。
- `test_missing_or_forged_stored_receipt_blocks_start_and_close[client_boolean]`：初始化错误。
- `test_missing_or_forged_stored_receipt_blocks_start_and_close[wrong_digest]`：初始化错误。
- `test_missing_or_forged_stored_receipt_blocks_start_and_close[wrong_actor]`：初始化错误。
- `test_other_unconfirmed_fault_or_legacy_wrong_order_blocks_entire_line[in_progress]`：初始化错误。
- `test_other_unconfirmed_fault_or_legacy_wrong_order_blocks_entire_line[completed]`：初始化错误。
- `test_other_unconfirmed_fault_or_legacy_wrong_order_blocks_entire_line[closed]`：初始化错误。
- `test_already_running_saves_real_poststart_without_start_control_and_can_close`：初始化错误。
- `test_already_running_abnormal_other_device_blocks_poststart_and_close[bad0]`：初始化错误。
- `test_already_running_abnormal_other_device_blocks_poststart_and_close[bad1]`：初始化错误。
- `test_already_running_abnormal_other_device_blocks_poststart_and_close[bad2]`：初始化错误。
- `test_already_running_abnormal_other_device_blocks_poststart_and_close[bad3]`：初始化错误。
- `test_already_running_abnormal_other_device_blocks_poststart_and_close[bad4]`：初始化错误。
- `test_new_fault_during_already_running_readback_blocks_poststart`：初始化错误。
