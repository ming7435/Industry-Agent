# 工业设备实时监测与智能诊断

当前版本实现了完整的单服务多 Agent 运维闭环：

```text
模拟工厂 API -> 实时 Monitor -> 六类规则 -> AbnormalEvent
-> Agent Runtime -> Diagnosis -> Knowledge / CAD -> Maintenance
-> WorkOrder -> Quality -> Report -> Memory / Experience
```

监测器接入模拟工厂 `http://127.0.0.1:8000`，默认每 0.5 秒读取一次设备快照。Diagnosis Agent 按事件变化触发：首次确认异常、等级升级、严重故障、新独立故障或恢复后再次发生；同一事件同等级持续期间不会重复调用。

## 当前范围

- 实时采集整机指标：温度、振动、主轴、液压、润滑、冷却、气压、刀塔等
- 六类规则：Critical、Threshold、Duration、Count、Trend、MultiMetric
- 统一异常事件 `AbnormalEvent`
- Diagnosis Agent 与 DeepSeek Tool Calling
- 七个核心 Agent：Router、Diagnosis、Knowledge、CAD、Maintenance、Quality、Report
- Diagnosis 工具：`get_device_status`、`get_alarm_definition`、`get_device_history`、`search_knowledge`
- 全量 Tool Registry：设备状态、生产状态、知识检索、文档解析、CAD/BOM、维修计划、备件、工单、SOP、维修验证、报告
- RAG JSONL 入库、中文检索、集合/部件/报警码元数据过滤
- MCP Client 适配层：PLC、RAG、CAD、MES 的统一调用边界
- 短期 Memory、长期 Memory、Experience Learning Module 维修经验提取并回写 RAG
- Pydantic 结构化输入输出和调用 Trace
- LangGraph Reason-Act-Observe 工作流
- Agent Runtime Harness：超时、重试和统一执行入口
- 中文实时监测页面、诊断中心、维修决策、工单、质检、报告和 AI 运行追踪

## 启动

先启动模拟工厂，再启动监控服务：

```powershell
L:\anaconda\python.exe services\agent-service\monitor_web_server.py
```

打开 `http://127.0.0.1:8001` 查看工业智能运维工作台。

启动 Agent Service API：

```powershell
L:\anaconda\python.exe -m uvicorn app.api.server:app --app-dir services\agent-service --host 127.0.0.1 --port 8010
```

接口：

```text
POST http://127.0.0.1:8010/api/agent/question
POST http://127.0.0.1:8010/api/agent/event
GET  http://127.0.0.1:8010/api/rag/status
GET  http://127.0.0.1:8010/api/rag/search?query=主轴温度&limit=5
POST http://127.0.0.1:8010/api/rag/ingest
GET  http://127.0.0.1:8010/api/trace
GET  http://127.0.0.1:8010/api/memory/recent
GET  http://127.0.0.1:8010/api/memory/search?device_id=TRAK-TC820LTYSI-001
GET  http://127.0.0.1:8010/api/workorders
POST http://127.0.0.1:8010/api/workorders/{workorder_id}/quality
POST http://127.0.0.1:8010/api/experience/search
```

RAG 入库接口接收一个 JSONL 文件路径。文件名包含 `SOP`、`报警码`、`故障诊断`、`BOM`、`保养维护` 或 `安全规程` 时，会自动映射到字段设计中的目标集合；也可以在请求体中显式传入 `collection`。

```json
{"path":"D:/QQ/维修手册_TC820LTYsi_报警码数据.jsonl"}
```

当前本地后端是可运行的关键词混合检索实现，输出会保留 `collection`、`device_model`、`component`、`knowledge_type`、`alarm_code`、页码和原始字段等元数据。后续接入 Milvus 时，Knowledge Agent 和 API 契约不需要改变。

用户提问入口会经过 `Router -> Orchestrator -> 目标Agent`；异常事件入口会经过 `Diagnosis -> Knowledge -> CAD -> Maintenance -> WorkOrder Node -> Quality -> Report -> Experience Learning Module -> Memory/RAG`。

## 架构收敛

最终 Agent Registry 只有：`router`、`diagnosis`、`knowledge`、`cad`、`maintenance`、`quality`、`report`。

工单不再是 Agent：

- 工具和 MES MCP 适配位于 `services/agent-service/app/mcp/workorder.py`
- 业务服务位于 `services/agent-service/app/tools/workorder/service.py`
- LangGraph 通过 `workorder` 业务节点调用服务，API 也复用同一服务

经验不再是 Agent：

- 学习模块位于 `services/agent-service/app/experience`
- 包含提取、准入校验、去重、写入和检索
- 只有工单状态为 `closed` 且 Quality `passed=true` 时才允许沉淀

Trace 使用 `type` 区分 `agent`、`node`、`tool`、`module`；A2A 只允许七个核心 Agent 作为通信目标。

## 配置

本地 `.env` 中可配置以下项：

```dotenv
FACTORY_API_BASE_URL=http://127.0.0.1:8000
FACTORY_DEVICE_ID=TRAK-TC820LTYSI-001
MONITOR_INTERVAL_SECONDS=0.5
MONITOR_WEB_HOST=127.0.0.1
MONITOR_WEB_PORT=8001
AGENT_TIMEOUT_SECONDS=45
AGENT_MAX_RETRIES=1
```

`MONITOR_INTERVAL_SECONDS` 控制采样频率；改为 `0.5` 即每 0.5 秒采样一次。DeepSeek 相关密钥仅保存在本地 `.env`，不提交到仓库。

Agent 的调用入口在 `services/agent-service/app/harness`，多 Agent 图在 `services/agent-service/app/graph`。监测服务只把确认后的 `AbnormalEvent` 交给 Agent Orchestrator，不直接管理模型循环。外部能力统一从 `services/agent-service/app/tools` 进入，再由 `mcp` 层适配真实系统或本地实现。前端源码在 `frontend/monitor-react`，生产构建输出到 `frontend/monitor`。

前端开发/构建：

```powershell
npm install
npm run dev:monitor
npm run build:monitor
```

## 测试

```powershell
L:\anaconda\python.exe -m unittest discover -s services\agent-service\tests -p "test_*.py"
```

依赖安装：

```powershell
L:\anaconda\python.exe -m pip install -r services\agent-service\requirements.txt
```
