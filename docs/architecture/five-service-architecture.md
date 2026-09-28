# 五服务架构

五服务发布拓扑包含五个业务服务。Monitor、前端和网关属于交付界面，不是领域服务。

| Service | Responsibility | Owns | Does not own |
| --- | --- | --- | --- |
| Agent (`8010`) | Intelligence and controlled autonomy | RuntimeInputParser, Planner, Actions, Capability Registry, Loop Engine, Evaluator, policy/approval/resume, the nine existing Agents, Skills, Tools, A2A/MCP clients, runtime memory decisions, report composition | Business repositories, model-provider credentials, direct WorkOrder/Quality/Closure MySQL |
| Backend (`8030`) | Deterministic business system | WorkOrder lifecycle, technicians/shift/inventory/QMS boundary, Quality/Appeal, Closure, Audit, report metadata, experience records, MySQL repositories | Agent decisions, prompts, model inference |
| RAG (`8020`) | Enterprise knowledge and evidence | Ingestion, parsing, chunking, Whoosh/Milvus retrieval, fusion, evidence/citation, document/experience upsert and search | Provider credentials and provider SDK calls |
| CAD (`8050`) | Engineering data | Drawing, BOM, parts, relations, locations, engineering metadata, CAD repository and parsers | Generic RAG pipeline, generic model providers |
| Model (`8040`) | Inference gateway | LLM, embeddings, reranking, vision, provider routing and credentials | Industrial business decisions and business prompts |

## Runtime 请求流程

```text
Goal/Event
  -> Agent RuntimeInputParser -> Planner -> ActionModel -> CapabilityRegistry
  -> LoopEngine -> ExecutionManager -> Agent/Tool/MCP
  -> Backend/RAG/CAD/Model -> Evidence -> Evaluator
  -> continue | replan | final | blocked
  -> Backend experience/report persistence and RAG semantic upsert
```

Graph 仍然是状态和执行容器，只保留一个 Runtime 入口节点；
业务执行顺序由 Runtime Coordinator 和 Planner 负责。

## 服务契约

所有服务调用均使用 HTTP 或 MCP 形态的 JSON。Backend 提供带有 `{tool, arguments}`
请求体的 `POST /tools/call` 和 `GET /health`。Model 提供 `/v1/chat/completions`、
`/v1/embeddings`、`/v1/rerank`、`/v1/vision` 和 `/health`。RAG 与 CAD 保留现有
公开 API。任何服务都不导入其他服务的 Python 包。

Provider 密钥只注入 Model。生产 Compose 会关闭本地或 Demo fallback。CI 使用确定性的
Model fake provider，并断言 Agent、RAG 和 CAD 路径遵守各自的远程契约。
