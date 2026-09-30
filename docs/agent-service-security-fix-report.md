# Agent Service 本地安全修复记录

更新日期：2026-09-30。范围仅为当前工作目录中的 Agent Service；未部署，也未调用真实设备或收费模型。

## 已落地

- `app/api/server.py`：生产模式未配置服务令牌时拒绝业务请求；业务 GET 也校验令牌。异常事件以租户、设备、事件 ID 和修订号区分，参数冲突返回 409，非法修订号返回 422。
- `app/agents/quality/graph.py`、`app/api/schemas/quality.py`、`app/closure/service.py`：质检不再采信请求伪造的零件、实测值或规格；申诉不能直接将质检单置为关闭。
- `app/runtime/policy.py`、`app/runtime/dispatcher.py`：按实际工单动作执行策略门禁；查询能力不能夹带创建操作；经校验的幂等键覆盖请求体中的同名字段。
- `app/runtime/planner.py`、`app/runtime/action.py`：动作身份纳入业务参数、事件修订及租户/设备范围，忽略单纯变化的任务和追踪 ID。
- `app/runtime/container.py`：移除仅凭“工单存在”就认定写操作已完成的预执行对账；未知写入结果保持不确定，不能盲目重试。
- `app/runtime/event_store.py`、`app/runtime/durable_store.py`：耗时执行移出全局锁和 SQLite 写事务；同键参数变化拒绝复用；旧版仅按事件 ID 保存的结果在迁移核对前返回 409；失败或过期的执行领取记录保持待对账状态；显式关闭数据库连接。

## 验证

从仓库根目录使用隔离测试环境运行：

```powershell
$env:PYTHONPATH='L:\industry_agent;L:\industry_agent\services\agent-service'
$env:FACTORY_API_BASE_URL='http://127.0.0.1:9'
$env:MODEL_SERVICE_BASE_URL='http://127.0.0.1:9'
$env:APP_ENV='test'
python -m pytest services/agent-service/tests -q
```

结果：**285 passed**。`git diff --check` 通过。测试未执行五服务联调或生产验收。

## 仍未完成

1. Monitor Web 的 API 代理会注入 Agent Service 令牌，但浏览器到 Monitor 的写操作没有独立身份认证；监控开关和重置亦然。Agent Service 的直接访问已收紧，但端到端入口仍需浏览器登录/会话或可信网关方案。
2. 维修完成仍可能接受客户端提交的设备恢复快照；需要在后端权威遥测接口处统一取数，并明确设备验收规则。
3. 报告 Agent 的部分章节仍可由调用方直接提交；需要按报告类型从可信持久化记录重新加载并验证归属。
4. 工单副作用现在对未知结果采取拒绝重试，而不是提供所有动作的权威结果对账；要补操作级对账接口和人工恢复流程。
5. 旧事件缓存和旧工单幂等键与新的租户/设备/修订键格式不同。旧版事件缓存存在且新作用域结果不存在时，API 现在返回 409，不会直接重放；升级前仍须备份 SQLite，并核对已有事件和工单。没有自动修改或删除旧数据。

新建的 `runtime_claims` 表由程序使用 `CREATE TABLE IF NOT EXISTS` 增量创建，不删除原表。`DURABLE_CLAIM_STALE_SECONDS` 可选，默认 600 秒；过期领取记录转为待人工对账，不自动重试。恢复源码请从本地 Git 历史或已保存的工作区快照按文件恢复；当前工作区原有未提交改动未被清理或覆盖。
