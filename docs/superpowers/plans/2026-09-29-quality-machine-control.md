# 质量检测与设备控制实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将生产零件质检变成真实数据驱动的可追溯闭环，并在确认严重故障时自动暂停设备、由维修人员确认并通过恢复验证后才允许重启。

**Architecture:** 保留 Quality Agent 作为唯一质检入口，统一从 QMS 获取零件身份、规格和五类检测证据；任何身份不明、证据不足或合成数据只能进入待复核。监控 Web 服务负责故障确认后的单次暂停动作，WorkOrder 完成接口负责校验维修人员身份与设备恢复数据，然后通过工厂控制 API 发出启动命令并二次读取快照确认结果。

**Tech Stack:** Python、FastAPI、LangGraph、Pydantic、pytest、React/ESM。

**Spec:** 用户请求：质量检测真实完整；检测到故障自动暂停生产链设备；维修人员确认维修后才重启。

## Global Constraints

- 质检只处理 `production_part` / `part_quality`，不把维修验证当质量检测。
- 未知零件、缺少规格、缺少任一检测项或合成/降级证据不得判定合格。
- 自动暂停只允许由已确认的高级故障触发，并且同一设备/故障事件只发送一次控制命令。
- 重启必须同时满足维修人员确认、维修反馈、设备恢复验证和工厂控制接口二次确认。
- 工厂控制接口失败时不得伪造运行状态，工单保留完成结果但明确返回控制失败。
- 删除只针对有静态证据的冗余代码和无效导入，不删除仍被运行路径或测试使用的兼容适配器。

## Review Focus

- 未知 `part_id` 或只有编号没有证据时必须是 `not_tested`，不能是 PASS。
- 五项检测中任意一项缺失、状态非 pass 或标记 synthetic/degraded 时必须阻断 Release。
- 同一故障在连续采样中不能重复暂停设备。
- 维修反馈缺少确认人、确认人不是派工人或恢复快照不匹配时不能启动设备。
- 工厂接口返回错误/非 running 快照时前端必须看到失败原因，不能显示“已启动”。

### Task 1: 清理确认无用代码并固定质量输入边界

**Files:**
- Modify: `services/agent-service/app/agents/quality/graph.py`
- Modify: `services/backend-service/app/quality/inspection.py`
- Modify: `services/agent-service/app/mcp/quality.py`
- Modify: `services/agent-service/app/agents/quality/validator.py`
- Test: `services/agent-service/tests/test_quality_data_gate.py`

- [ ] 先写未知零件、不完整检测证据、五项全通过三类失败/通过测试并确认旧实现失败。
- [ ] 删除质量图中未使用的导入和重复字段赋值。
- [ ] 让 QMS 查询只接受已存在且可追溯的生产零件；缺少规格或任一五类证据返回 `not_tested`。
- [ ] 让 QualityValidator 明确输出五项检查、缺失项、证据状态和 Release 门禁。
- [ ] 运行质量测试并确认通过。

### Task 2: 实现监控故障自动暂停且幂等

**Files:**
- Modify: `services/agent-service/app/monitor/control_policy.py`
- Modify: `services/agent-service/monitor_web_server.py`
- Test: `services/agent-service/tests/test_monitor_auto_pause.py`

- [ ] 先写高级故障触发一次暂停、警告不暂停、同一事件不重复暂停、控制接口失败可见四个测试。
- [ ] 增加生产暂停判定和事件级幂等记录。
- [ ] 在监控确认故障后调用工厂控制 API，并把控制事件、设备状态和错误写入快照。
- [ ] 运行监控测试并确认通过。

### Task 3: 维修人员确认后重启并二次核验

**Files:**
- Modify: `services/agent-service/app/api/schemas/workorder.py`
- Modify: `services/agent-service/app/runtime/operations.py`
- Modify: `services/agent-service/app/mcp/workorder.py`
- Modify: `services/backend-service/app/workorder/service.py`
- Modify: `services/agent-service/app/contracts.py`
- Modify: `frontend/monitor-react/src/workorderSheet.mjs`
- Modify: `frontend/monitor-react/src/app/App.jsx`
- Test: `services/agent-service/tests/test_workorder_machine_resume.py`

- [ ] 先写确认人缺失/不匹配拒绝启动、恢复数据有效才发 start、start 失败不伪造成功三个测试。
- [ ] 统一维修完成载荷，移除前端 `passed=true` 伪造，提交真实设备恢复快照和确认人。
- [ ] 完成工单后仅在派工人员确认且设备恢复验证通过时调用 `start`，并读取返回设备状态确认 running。
- [ ] 将 `machine_control` 结果写回工单响应供界面展示。
- [ ] 运行工单、后端 API 和前端测试。

### Task 4: 全量验证和运行态检查

**Files:**
- No production file changes expected.

- [ ] 运行 Agent、Backend、Model、RAG、CAD 和前端测试。
- [ ] 运行 `git diff --check`、Python 编译检查和服务健康检查。
- [ ] 记录仍与新业务契约冲突的旧测试，不为兼容旧断言而放宽安全门禁。
