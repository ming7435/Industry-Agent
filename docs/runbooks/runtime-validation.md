# Runtime 验证手册

## 快速回归

在仓库根目录执行：

```powershell
python scripts/test_all.py
```

该脚本分别运行 Agent、RAG 和 CAD 测试，避免不同服务的 `app` 包相互污染。

只验证 Runtime 时可执行：

```powershell
pytest -c pytest-agent.ini -q services/agent-service/tests/test_evaluator.py services/agent-service/tests/test_execution_manager.py services/agent-service/tests/test_loop_guard.py services/agent-service/tests/test_loop_engine.py services/agent-service/tests/test_full_agent_runtime_e2e.py
```

## 最小闭环检查

1. 提交带稳定 `event_id` 的 `POST /api/v1/agent/event`。
2. 确认返回的 `task_id/trace_id` 稳定，重复提交不重复执行图。
3. 确认自动链路在 WorkOrder 后返回 `pipeline.status=waiting_repair`。
4. 查询工单并提交有效维修反馈，再执行 complete/close。
5. 确认 close 响应进入 `memory -> rag -> report`，并且重复 close 不重复学习。
6. 用 `GET /api/trace?task_id=...&trace_id=...` 检查 Trace 只属于当前任务。
7. 用 `GET /api/rag/search` 或 `/api/v1/experience/search` 查询刚写入的经验。

## 失败诊断

| 现象 | 首先检查 |
| --- | --- |
| Loop 立即停止 | `loop_stop.stop_reason` 是否为 `duplicate_action`、`no_new_evidence` 或 `confidence_not_improved` |
| 执行超时但副作用未知 | `execution_end.status=TIMEOUT/UNKNOWN`，随后走 state check/reconciliation，不要盲目重试 |
| 工单重复 | `monitor:<event_id>` 是否在请求和 WorkOrder adapter 中保持不变 |
| 经验重复 | `workorder:<workorder_id>` 是否保持稳定，RAG document_id 是否等于 experience_id |
| RAG 未写入 | 检查 `/health`、`/documents/upsert` 的逐 backend 结果以及 `RAG_ALLOW_LOCAL_FALLBACK` |
| Trace 串任务 | 检查所有 Node/Agent/Tool/Loop 记录是否同时包含 task_id 与 trace_id |

## 契约变更流程

修改服务模型后，先更新 `shared/contracts/*.schema.json` 和
`docs/contracts/runtime-contracts.md`，再运行完整回归。若是兼容旧客户端的字段，
必须在 Schema 的 `x-legacy-input-aliases` 或文档的兼容边界中说明。
