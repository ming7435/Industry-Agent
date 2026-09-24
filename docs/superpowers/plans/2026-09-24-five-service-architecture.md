# 五服务职责收敛重构实施计划

> 基线：`9b20e17`，先完成实际源码审计和全量测试，再逐阶段迁移。保留现有 Runtime、九个业务 Agent、外部 API 和 `data/*/.gitkeep` 预先删除。

## 目标边界

将业务运行时收敛为 Agent、Backend、RAG、CAD、Model 五个服务。Agent 保留 Runtime/Agent 决策；Backend 接管确定性业务 CRUD 和持久化；RAG 接管知识检索与语义索引；CAD 只保留工程数据；Model 统一 Provider 网关。跨服务只使用 HTTP/MCP/共享 Contract，不直接 import 对方 service 包。

## 阶段

1. **审计与契约锁定**：记录当前测试 baseline，盘点 Agent WorkOrder/Closure/Memory/Report、CAD 重复 RAG、Agent/RAG/CAD Provider 引用，建立 Backend/Model API contract tests。
2. **Model Service**：实现 `/health`、`/v1/chat/completions`、`/v1/embeddings`、`/v1/rerank`（可选 vision）及 deterministic fake provider；Agent 保留兼容 `get_default_llm_client`，底层改为 `ModelServiceClient`；RAG 改为 Model client。
3. **Backend Service**：迁移 WorkOrder、Quality、Closure、Audit、Report metadata 的确定性服务和 MySQL/SQLite test repository；实现统一 `/tools/call` 与兼容健康检查；Agent 使用 Backend MCP Client，不再在 Runtime 进程内直接创建业务 MySQL repository。
4. **Agent 边界切换**：保持 WorkOrder/Quality/Memory/Report Agent 在 Agent Service，Tool/MCP 通过 Backend；保留短期 deprecated facade，先双轨验证再切换默认路径；Runtime 核心控制流不重写。
5. **CAD 收敛**：保留 CAD repository、BOM、drawing、part、relation、DXF/DWG 工程解析；移除未被 CAD API/runtime 引用的通用 embedding/reranker/LLM/RRF/Whoosh/Milvus/RAG API 依赖，迁移脚本引用到 RAG 或显式标注离线工具；CAD Docker 使用专用最小 requirements。
6. **Compose/CI/E2E**：新增 Backend/Model Dockerfile 和 Compose 服务，注入单向 URL；使用 deterministic fake Model provider 启动完整 apps profile，等待六个健康端点，执行 event→RAG→CAD→workorder→verification→close→memory/RAG/report，并验证幂等和持久化；真实 Provider 仅作为外部联调。
7. **清理与收口**：全量测试、静态跨服务 import/Provider/直接 DB 扫描、Docker 构建与 Compose 校验，更新架构/契约/部署文档，分阶段提交后以 `refactor: finalize five-service architecture` 收口并推送。

## 不变量

- 不新增、删除或合并业务 Agent，不修改 Planner、ActionModel、CapabilityRegistry、LoopEngine、Evaluator、ExecutionManager、RuntimePolicy、Approval/Resume、RuntimeCoordinator、RuntimeDispatcher 的职责和控制流。
- 生产 Compose 默认关闭所有 demo/local/degraded fallback；CI 只能通过显式 fake provider/test profile 使用确定性测试后端。
- shared 仅存跨服务 contract/schema/协议常量；不放业务 repository 或服务实现。
- 每阶段先加 contract/regression test，再切换实现；旧 facade 只有在新路径验证后才删除。
