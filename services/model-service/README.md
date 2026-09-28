# Model Service

统一的模型推理网关，不包含 Diagnosis、Maintenance 或其他业务 Prompt。

- `GET /health`
- `POST /v1/chat/completions`
- `POST /v1/embeddings`
- `POST /v1/rerank`
- `POST /v1/vision`（复用 chat contract）

`MODEL_PROVIDER=fake` 是确定性的 CI/本地契约模式；远程模式下聊天固定由 `MODEL_CHAT_PROVIDER=deepseek` 选择 DeepSeek 官方接口。SiliconFlow 只为向量化、重排和可选视觉能力提供辅助接口，不参与 DeepSeek 聊天请求。Agent、RAG、CAD 不读取 Provider key。

`GET /health` 中的 `provider`/`chat_provider` 表示聊天模型，`aux_provider` 表示向量、重排和视觉辅助提供方，两者不会互相回退。
