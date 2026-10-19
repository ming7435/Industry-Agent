# RabbitMQ 移除记录

日期：2026-10-19。范围：按用户要求移除当前本地项目的 RabbitMQ 接入，不更换为另一种消息中间件。

## 当前执行方式

```text
Monitor 确认故障
  ├─ 原有独立停线处理（不等待模型）
  └─ 后台 HTTP → POST /api/v1/agent/event
       → EventResultStore / MySQL 原子认领与参数指纹
       → 原 Agent Runtime、节点、Skill、Tool
       → 原诊断、维修方案、审批、工单、报告
       → MySQL 最终结果 / Redis 阶段进度
       → GET 原事件结果，只读回查、不重新提交
```

直接执行不等于把诊断放到浏览器线程：Monitor 原有后台线程继续负责请求与页面进度。RabbitMQ 的 16 个分区消费者、4 个业务 Worker 及跨进程设备分区调度已移除，不能再把它们描述为当前能力；未新增后台消息队列。现有同事件幂等、业务写操作幂等、审批和超时对账仍保留。

## 实际修改

- `services/agent-service/app/api/server.py`：删除队列分支、队列工厂注入、生命周期及状态接口，事件入口直接复用原 `process_event`。保留事件修订作用域、参数指纹、旧结果防重、审批、阶段结果和只读回查。
- 删除运行模块 `app/runtime/event_queue.py`、`app/runtime/event_jobs.py`。
- `services/agent-service/requirements.txt`：删除 `pika` 项目依赖。没有卸载共享 Anaconda 环境中的包，避免影响其它项目。
- `scripts/start_all.py`：删除 RabbitMQ 默认启用及分区/Worker 默认参数。遗留环境变量不再被业务执行链使用。
- `infra/docker/docker-compose.yml`：删除 RabbitMQ 服务、Agent 的连接参数/健康依赖及卷声明。未修改生产覆盖配置。
- `.github/workflows/ci.yml`：移除仅服务于 RabbitMQ 的测试环境参数。
- `monitor_web_server.py`：修正旧注释，不再声称设备串行由消息队列保证；保留提交、只读回查及故障停线通道。
- 删除六个仅针对已移除队列实现的测试/支持文件；增加 `test_direct_event_dispatch.py` 七项直接事件回归，原事件修订、超时回查、鉴权和审批测试未删除或放宽。
- 删除 `.runtime/verification/` 中两个旧 RabbitMQ 启动/冒烟辅助脚本，普通启动直接运行 `scripts/start_all.py`。
- README 更新当前执行方式，旧 RabbitMQ 实施报告标记为历史材料；原计划保留为历史记录。

## 运行切换与数据

切换前通过原队列状态接口和 RabbitMQ 只读检查确认：14 条任务已取得确定执行结果，`queued/running/unknown` 均为 0，所有队列的待投递、未确认消息均为 0。没有将历史消息重新提交给新入口。

只重载了经 PID、父子关系、可执行路径和启动时间核对的本项目应用进程。未重启模拟工厂、MySQL、Redis、Milvus。

项目专用容器 `industry-agent-infra-rabbitmq-1` 已停止并设为 `restart=no`，5672/15672 不再监听。为保留原凭据与恢复条件，没有销毁容器、镜像或持久卷；卷 `industry-agent-infra_rabbitmq-data` 保留，历史 `agent_event_jobs/devices/queue_meta` 表保留，未删除任何数据库表、图纸或工单数据。

没有复制或输出密钥，没有修改根 `.env` 或生产配置。本次切换日志在 `.runtime/startup-direct-20261019-104820/`。验证期间工作区随后被其它本地任务重新启动，出现过瞬时连接失败；没有覆盖后续启动标记或再次停止后续进程。当前日志目录以 `.runtime/active-startup-dir.txt` 为准，不硬编码本次启动 PID，最终只读验证以后续运行实例为准。

## 已完成验证

- 修改前新增测试：2 失败、5 通过。失败分别证明旧队列状态接口仍存在，以及遗留 RabbitMQ 环境变量仍能启用队列。
- 针对性回归：40 通过、0 失败、0 跳过。包括新增直接事件测试以及原事件修订、诊断回查/阶段进度、鉴权、审批 API。
- 跨服务/Compose/监控布局契约：10 通过、0 失败、0 跳过。
- `docker compose -f infra/docker/docker-compose.yml config --quiet`：退出码 0，不再要求 RabbitMQ 凭据。
- 实际网页与 Agent、Backend、RAG、Document-CAD、Model 健康接口均返回 HTTP 200；Model 的能力仍是未做收费探测，不等于模型服务已通过实际业务验收。
- 已移除的 `/api/v1/runtime/event-queue` 返回 404。
- 原有事件 `EVT-20261019-022853-845-014` 只读查询返回 HTTP 200、`available` 且原结果仍在；没有执行新的诊断或派工。
- CAD 状态接口返回 HTTP 200、`connected=true`、`provider=text-to-cad`。首次并行检查出现等待超时，随后单独只读检查通过；未修改 CAD 代码。
- 启动辅助回归：4 通过、0 失败、0 跳过，覆盖 `test_text_to_cad_launcher.py`、`test_freecad_document_startup.py`、`test_test_all.py`。
- 源码语法检查及本次相关文件的 `git diff --check` 通过。运行源码、启动器、依赖声明、Compose 和 CI 不再引用 RabbitMQ；历史文档、备份与“旧环境变量不能重新启用队列”的回归样例有意保留对应文字。
- 完整服务回归实际执行了 `.venv/Scripts/python.exe -u scripts/test_all.py`，隔离环境禁用 `.env` 加载、使用测试模式和不可达的设备地址，未调用生产数据库、真实设备或收费模型。该命令最终非零退出，不能宣称全量通过，结果如下。

| 范围 | 实际结果 |
| --- | --- |
| Model | 42 通过，0 失败，0 跳过 |
| Backend | 468 通过，0 失败，1 项原有隔离 MySQL 条件跳过 |
| Agent 全量 | 未完成；约 17 分钟后仍在原生 CAD 用例区段，已观察到下述 CAD 断言失败；仅中断该测试子进程及其拥有的子进程，后续服务测试继续运行，没有修改测试或扩大跳过范围 |
| RAG | 144 通过，24 失败，2 项文件链接权限跳过 |
| Document-CAD | 131 通过，0 失败，2 项文件链接权限跳过 |
| 根目录测试 | 127 通过，0 失败，6 项原有条件跳过 |
| 独立 Backend 导入的 MySQL 文档契约 | 1 通过，0 失败，0 跳过 |

Agent 失败为 `services/agent-service/tests/test_freecad_advanced.py::test_advanced_api_executes_graph_skill_and_tool_and_rejects_changed_dimensions`，第 158 行仍预期 `tool=freecad_mcp`，当前 CAD 实现返回 `text_to_cad`。独立复现 1 失败；通过备份目录导入修改前 API/队列模块再执行同一原测试仍为相同失败，证明不是本次队列移除造成。未回退 CAD 后端、未修改断言或删除该用例。

RAG 失败根因是本次选择的项目 `.venv` 未安装独立评测依赖 `ragas`。相应 CLI 在报告生成前退出，导致后续读取 `latest.json` 失败。未修改 RAG 代码、未安装或替换评测依赖、未以假分数或跳过包装通过。需使用已配置的独立评测环境或按 `requirements-evaluation.txt` 安装后另行验证。

本次 RAG 失败用例名称如下，路径均为 `services/rag-service/tests/`：

```text
test_evaluation_runner.py::test_evidence_ids_take_precedence_and_evidence_metrics_are_computed
test_evaluation_runner.py::test_latency_breakdown_uses_total_for_retrieval_and_llm_for_answer
test_evaluation_runner.py::test_corpus_labels_cannot_replace_reference_ids_or_become_keyword_scores
test_evaluation_runner.py::test_citation_ranges_are_diagnostics_not_semantic_quality_scores
test_evaluation_runner.py::test_aggregation_averages_only_present_metrics_and_retains_errors
test_evaluation_runner.py::test_run_evaluation_posts_search_payload_and_writes_two_report_files
test_evaluation_runner.py::test_run_evaluation_filters_cases_limits_and_keeps_individual_errors
test_evaluation_runner.py::test_no_llm_preserves_retrieval_metrics_and_nulls_answer_metrics
test_evaluation_runner.py::test_failed_request_does_not_turn_expected_sources_into_zero_score
test_ragas_migration_contract.py::test_no_llm_really_disables_answer_generation_and_identifies_framework
test_ragas_sdk_integration.py::test_real_ragas_scores_all_metrics_through_existing_model_http_contract
test_ragas_sdk_integration.py::test_missing_or_unreviewed_reference_is_not_invented_from_keywords
test_ragas_sdk_integration.py::test_judge_call_budget_is_enforced_without_hidden_model_retries
test_ragas_sdk_integration.py::test_model_errors_cannot_become_scores_or_leak_provider_payload[http]
test_ragas_sdk_integration.py::test_model_errors_cannot_become_scores_or_leak_provider_payload[binary]
test_ragas_sdk_integration.py::test_model_errors_cannot_become_scores_or_leak_provider_payload[truncated]
test_ragas_sdk_integration.py::test_model_errors_cannot_become_scores_or_leak_provider_payload[json]
test_ragas_sdk_integration.py::test_no_llm_uses_real_ragas_and_never_contacts_model_service
test_ragas_sdk_integration.py::test_expected_abstention_does_not_use_answer_relevance_as_wrong_answer_penalty
test_ragas_sdk_integration.py::test_identical_embeddings_float_roundoff_is_not_a_failed_evaluation
test_ragas_sdk_integration.py::test_substantial_out_of_range_sdk_score_is_not_silently_clamped_to_pass
test_ragas_sdk_integration.py::test_cli_end_to_end_uses_real_http_and_sdk_and_writes_v2_report[True]
test_ragas_sdk_integration.py::test_cli_end_to_end_uses_real_http_and_sdk_and_writes_v2_report[False]
test_ragas_sdk_integration.py::test_cli_rag_http_failure_is_reported_without_error_body_or_zero_quality
```

完整输出：`.runtime/verification/remove-rabbitmq-full-suite-20261019.log`。针对性命令实际执行两次均为 40 通过；跨服务与启动辅助另为 10、4 通过。命令均在项目根目录执行：

```powershell
L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_direct_event_dispatch.py services/agent-service/tests/test_event_result_revision.py services/agent-service/tests/test_diagnosis_result_recovery.py services/agent-service/tests/test_diagnosis_stage_progress.py services/agent-service/tests/test_api_auth.py services/agent-service/tests/test_runtime_approval_api.py -q --tb=short
L:/anaconda/python.exe -m pytest -c pytest-agent.ini tests/integration/test_compose_environment_contract.py tests/integration/test_runtime_rag_cad_contract.py tests/integration/test_virtual_line_team_contract.py tests/integration/test_monitor_container_layout.py -q --tb=short
L:/anaconda/python.exe -m pytest -c pytest-agent.ini tests/test_text_to_cad_launcher.py tests/test_freecad_document_startup.py tests/test_test_all.py -q --tb=short
L:/industry_agent/.venv/Scripts/python.exe -u scripts/test_all.py
docker compose -f infra/docker/docker-compose.yml config --quiet
```

本次未手工制造现场故障、创建新工单、控制真实设备或进行收费模型探测。离线回归不作为生产验收。

## 备份与恢复

修改前源码/配置模板备份位于 `.local-backups/remove-rabbitmq-20261019/`。已有 17 个文件按原相对路径备份；另有 `monitor_web_server-before.py` 和 `active-startup-dir-before.txt`。备份不含 `.env`、数据库内容或凭据。

恢复时先停止接收新事件，等待当前直接执行完成并核对未知结果。将备份按相同相对路径复制回项目；`monitor_web_server-before.py` 恢复到 `services/agent-service/monitor_web_server.py`。恢复旧代码、Compose 和启动辅助后，才可手工恢复原 RabbitMQ 容器启动策略并启动容器，复用原凭据和数据卷，通过恢复后的统一启动辅助启动应用。

不得同时运行新旧两套执行器，不得删除幂等记录来强行重放。新增加的直接事件测试和本文可作为历史材料保留；不要使用 `git reset --hard` 覆盖工作区中的其它已有修改。
