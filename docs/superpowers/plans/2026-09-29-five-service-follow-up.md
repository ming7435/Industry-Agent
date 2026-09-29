# 五服务后续业务修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依据当前本地代码，修复 RAG 向量客户端接线、质检类型与证据契约、恢复快照新鲜度、CAD 查询边界、诊断缓存隔离和 CI 可复现性，并以真实回归测试验证。

**Architecture:** 保留现有五服务边界和已有用户修改；只在实际调用链上补充服务端门禁、结构化参数传递和测试隔离。RAG 在线链路统一使用 Model Service，离线供应商客户端继续保留。真实 MySQL/Milvus/Docker 仅在环境可用时验证。

**Tech Stack:** Python 3、FastAPI、Pydantic、SQLite/MySQL 适配器、Whoosh/Milvus、pytest、Node test、Docker Compose 配置。

**Spec:** `C:/Users/12587/.codex/attachments/af3a08bb-a658-439e-9793-083a7e2d1b2f/已粘贴的文本.txt`

## Global Constraints

- 只使用当前 `L:/industry_agent`；不访问远程仓库、不克隆、不覆盖未提交修改。
- 修改前备份受影响源码；不读取、输出或修改真实密钥配置。
- 不调用真实设备控制、不操作生产数据库、不删除数据卷。
- 每项修复先写能失败的回归测试；不删除测试、不降低门禁、不扩大 skip。
- 外部服务不可用时完成本地验证并明确受阻原因。

## Review Focus

- 注入的 RAG embedder 必须成为实际查询客户端，而不是只出现在构造参数中。
- `null`、字符串布尔值、无效数值和缺规格不能转成合格。
- Agent 返回的质检证据必须与 Backend 重读记录一致。
- 新鲜度按服务端年龄/时钟偏差配置计算，历史完成记录仍可读取。
- CAD 过滤必须在 LIMIT 前完成，显式 part/drawing 条件不能被 query 覆盖。
- 无事件号或新证据不能复用其他请求/旧诊断结果。
- CI 总入口必须汇总服务测试，外部镜像/模拟器受阻必须可见。

### Task 1: RAG 向量客户端接线

**Files:** `services/rag-service/app/api/deps.py`, `services/rag-service/app/milvus/retriever.py`, `services/rag-service/app/clients/model.py`, RAG tests.

- [x] 先写并运行只配置 Model Service 的实际检索/入库失败测试。
- [x] 让 DenseRetriever 使用注入 RemoteEmbedder，避免单例锁重入和隐式供应商 key。
- [x] 验证模型、维度和不可用降级路径。

### Task 2: 质检输入类型门禁

**Files:** `services/backend-service/app/quality/inspection.py`, `services/agent-service/app/agents/quality/validator.py`, tests.

- [x] 先写 null、字符串布尔值、rotation_test 非 True、NaN/Infinity、缺规格的失败测试。
- [x] 实现严格布尔/数值/规格校验，并保留 pass、fail、not_tested、insufficient_data 区分。

### Task 3: Agent/Backend 质检证据契约

**Files:** `services/agent-service/app/runtime/operations.py`, `services/agent-service/app/clients/backend.py`, `services/backend-service/app/workorder/service.py`, schemas/tests.

- [x] 先写真实 Agent 参数构造到 Backend 保存/重读的一致性测试。
- [x] 统一五项结构化证据，保存实际检测结果，不补造 True；缺证据不能映射成失败或通过。

### Task 4: 恢复快照新鲜度

**Files:** Agent/Backend repair verification, config and tests.

- [x] 先写可控时钟下的年龄边界、未来、无效/缺失、expires_at、stale 和历史读取测试。
- [x] 使用服务端最大采样年龄/允许时钟偏差配置；历史完成验收读取不重新做实时新鲜度判定。

### Task 5: CAD 查询过滤顺序和字段契约

**Files:** `services/document-cad-service/app/main.py`, `repository.py`, Agent CAD calls/tests.

- [x] 先写 30+ 条跨设备同名记录、LIMIT 后过滤、drawing_id/drawing_ref、part_no+query、版本/错误设备测试。
- [x] 将显式条件传入 Repository，数据库先过滤再 LIMIT；保持 Demo/MySQL 语义一致和设备归属校验。

### Task 6: 诊断缓存隔离和复核

**Files:** `services/agent-service/app/agents/diagnosis/dedup.py`, `agent.py`, `runtime/dispatcher.py`, tests.

- [x] 先写无事件号跨设备/问题、同事件版本、证据变化复核和失败后重试测试。
- [x] 生成服务端请求隔离键；复核按证据版本/指纹绕过旧结果，失败/降级不长期阻塞重试。

### Task 7: CI 可复现性

**Files:** emergency-stop tests, `scripts/test_all.py`, workflow/compose as needed.

- [x] 先复现绝对路径和总入口短路问题。
- [x] 改为仓库内契约夹具；总入口汇总所有服务失败；核对镜像标签/MinIO 错误但不伪造 Docker 通过。

### Task 8: 全量验证与报告

- [x] 依次运行针对性、五服务、跨服务、前端/静态检查。
- [x] 真实 MySQL/Milvus/Docker 可用时验证，否则记录受阻。
- [x] 更新 `docs/local-five-service-fix-report.md`，列明每项状态、命令、数量、迁移和恢复。
