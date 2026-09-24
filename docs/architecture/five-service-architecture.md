# Five-service architecture

The released topology has five business services. Monitor, the frontend, and
the gateway are delivery surfaces and are not domain services.

| Service | Responsibility | Owns | Does not own |
| --- | --- | --- | --- |
| Agent (`8010`) | Intelligence and controlled autonomy | JEV, Planner, Actions, Capability Registry, Loop Engine, Evaluator, policy/approval/resume, the nine existing Agents, Skills, Tools, A2A/MCP clients, runtime memory decisions, report composition | Business repositories, model-provider credentials, direct WorkOrder/Quality/Closure MySQL |
| Backend (`8030`) | Deterministic business system | WorkOrder lifecycle, technicians/shift/inventory/QMS boundary, Quality/Appeal, Closure, Audit, report metadata, experience records, MySQL repositories | Agent decisions, prompts, model inference |
| RAG (`8020`) | Enterprise knowledge and evidence | Ingestion, parsing, chunking, Whoosh/Milvus retrieval, fusion, evidence/citation, document/experience upsert and search | Provider credentials and provider SDK calls |
| CAD (`8011`) | Engineering data | Drawing, BOM, parts, relations, locations, engineering metadata, CAD repository and parsers | Generic RAG pipeline, generic model providers |
| Model (`8040`) | Inference gateway | LLM, embeddings, reranking, vision, provider routing and credentials | Industrial business decisions and business prompts |

## Runtime request flow

```text
Goal/Event
  -> Agent JEVParser -> Planner -> ActionModel -> CapabilityRegistry
  -> LoopEngine -> ExecutionManager -> Agent/Tool/MCP
  -> Backend/RAG/CAD/Model -> Evidence -> Evaluator
  -> continue | replan | final | blocked
  -> Backend experience/report persistence and RAG semantic upsert
```

Graph remains the state and execution container. It has one runtime entry node;
business sequencing is owned by the Runtime Coordinator and Planner.

## Service contracts

All service calls use HTTP or MCP-shaped JSON. Backend exposes `POST /tools/call`
with `{tool, arguments}` and `GET /health`. Model exposes `/v1/chat/completions`,
`/v1/embeddings`, `/v1/rerank`, `/v1/vision`, and `/health`. RAG and CAD keep
their existing public APIs. No service imports another service's Python package.

Provider keys are injected only into Model. Production Compose disables local or
demo fallback. CI uses the deterministic Model fake provider and asserts that
the Agent, RAG, and CAD paths stay on their remote contracts.
