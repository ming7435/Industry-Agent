# Model Service

统一的模型推理网关，不包含 Diagnosis、Maintenance 或其他业务 Prompt。

- `GET /health`
- `POST /v1/chat/completions`
- `POST /v1/embeddings`
- `POST /v1/rerank`
- `POST /v1/vision`（复用 chat contract）

`MODEL_PROVIDER=fake` 是确定性的 CI/本地契约模式；生产环境由 Model Service 注入 DeepSeek/SiliconFlow 凭据，Agent、RAG、CAD 不读取 Provider key。
