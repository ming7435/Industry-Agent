# Shared contracts

`shared/` 保存跨服务、跨语言都能读取的契约快照。它不是新的运行时，也不创建
Agent；Agent Service、RAG Service 和前端仍然由各自的源码模型负责行为实现。

## 目录

| 文件 | 对应源码 | 用途 |
| --- | --- | --- |
| `contracts/runtime-action.schema.json` | `services/agent-service/app/runtime/action.py` | Runtime 唯一动作表达 |
| `contracts/runtime-loop.schema.json` | `runtime/loop_engine.py`、`runtime/evaluator.py`、`runtime/guard.py` | Loop 状态、Evaluator 结果和 Guard 停止原因 |
| `contracts/runtime-trace.schema.json` | `runtime/tracing.py`、`harness/trace.py` | Agent/Tool/A2A/MCP/Loop Trace 事件 |
| `contracts/workorder-lifecycle.schema.json` | `workorder/validator.py`、`runtime/operations.py` | 工单状态、幂等和关闭学习门禁 |
| `contracts/rag-experience.schema.json` | `memory/extractor.py`、`memory/writer.py`、`rag/client.py` | 关闭工单后的经验写入与检索元数据 |

这些 JSON Schema 是接口边界文档，不替代服务端校验。修改服务模型时，应同时
更新对应 Schema 和 `docs/contracts/runtime-contracts.md`，并运行：

```powershell
python scripts/test_all.py
```

## 兼容原则

1. `ActionModel` 的输出只使用 `action_type/target/payload` 等规范字段；旧的
   `kind/name/params` 仅作为输入兼容别名。
2. `pipeline.status=waiting_repair` 表示自动图已停止等待维修，真实工单仍使用
   `open/in_progress/completed/closed/...` 等 WorkOrder 状态。
3. `monitor:<event_id>` 是自动异常创建工单的稳定幂等键；经验学习使用
   `workorder:<workorder_id>`，事件 ID 作为经验来源元数据。
4. 共享 Schema 不允许暗示“超时即杀死线程”。底层执行超时必须保留
   `TIMEOUT/UNKNOWN` 状态，并依赖幂等、状态检查和 reconciliation 处理外部副作用。
