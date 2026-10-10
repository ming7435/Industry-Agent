# Model Service

统一的模型推理网关，不包含 Diagnosis、Maintenance 或其他业务 Prompt。

- `GET /health`
- `POST /v1/chat/completions`
- `POST /v1/embeddings`
- `POST /v1/rerank`
- `POST /v1/vision`（复用 chat contract）

`MODEL_PROVIDER=fake` 是确定性的 CI/本地契约模式；远程模式下聊天固定由 `MODEL_CHAT_PROVIDER=deepseek` 选择 DeepSeek 官方接口。SiliconFlow 只为向量化、重排和可选视觉能力提供辅助接口，不参与 DeepSeek 聊天请求。Agent、RAG、CAD 不读取 Provider key。

远程模式支持 `MODEL_PROVIDER=remote` 或 `deepseek`；`MODEL_CHAT_PROVIDER` 仅接受 `deepseek`，其他值会阻止服务启动。生产部署必须配置 `DEEPSEEK_API_KEY`。

网关会在发送 SiliconFlow 请求前拒绝 DeepSeek 模型，包括通过视觉、向量或重排接口指定该模型的请求；文档视觉解析也拒绝将 DeepSeek 配置为 SiliconFlow 视觉模型。

`GET /health` 中的 `provider`/`chat_provider` 表示聊天模型，`aux_provider` 表示向量、重排和视觉辅助提供方，两者不会互相回退。
