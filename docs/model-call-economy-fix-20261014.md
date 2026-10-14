# 重复模型调用削减与回归结果

日期：2026年10月14日。范围：当前本地项目的 Agent 和 RAG 服务。此次优化减少内部取证的回答生成、无选择空间的检索排序及同一次执行的重复技能核查，不删除业务页面、诊断循环、证据校验、审批和验收规则。

## 实际行为

| 场景 | 修改后的行为 |
| --- | --- |
| 诊断或维修内部取证 | 检索、融合、重排和证据校验仍执行；不调用回答生成模型 |
| 正常知识问答 | 保留回答生成；未提供新参数的调用默认生成回答 |
| 单个或没有检索候选 | 不调用模型排列检索顺序 |
| 多个检索候选 | 保留技能参与模型排序、既有工具名单和检索预算 |
| 同一次执行重复提交相同技能核查 | 合并重复提交，仅原请求调用模型，日志记录合并事件 |
| 输入、输出、技能正文或版本、执行编号、轨迹对象不同 | 独立核查，不共用旧核查记录 |
| 查看已有方案、工单、报告、日志 | 原有读取流程不变，不因为展示结果而重新调用生成模型 |

内部取证响应明确返回 `generation_requested=false`。成功完成证据组织后，回答为空、回答引用状态为 `not_applicable`，不会将主动省略的生成步骤写成模型故障，也不会假标引用验收通过。检索、重排或数据库异常仍如实报告。

## 修改文件

### RAG 服务

- `services/rag-service/app/api/models.py`：增加严格布尔请求参数 `generate_answer`，默认 `true`；响应增加 `generation_requested`。
- `services/rag-service/app/api/pipeline.py`：内部取证跳过生成步骤，保留原检索与证据链；日志记录 `stage=llm skipped reason=evidence_only`。
- `services/rag-service/app/api/routes.py`：前置查询超时响应也保留实际请求模式。

### Agent 服务

- `app/rag/client.py`：实际 HTTP 请求及当前报警的扩大范围检索均转发生成开关。
- `app/a2a/models.py`、`endpoints.py`、`requests.py`：类型化请求贯穿开关，内部取证请求明确关闭生成。
- `app/runtime/dispatcher.py`：触发式故障流程、已有诊断的维修依据查询、专门证据检索不生成用户回答；普通问答保留生成。
- `app/agents/knowledge/schemas.py`、`graph.py`、`agent.py`：保留请求模式，所有检索路径均传递，内部取证结果不包装成用户回答。
- `app/agents/knowledge/planning.py`：只有一个或没有检索候选时省略模型排序，多候选机制保持。
- `app/tools/query_contracts.py`：搜索参数使用原有严格校验机制验证生成开关。
- `app/tools/knowledge/search_knowledge.py`、`search_alarm_knowledge.py`、`search_sop.py`、`search_manual.py`、`search_fault_cases.py`、`search_semantic_memory.py`：各搜索工具与统一过滤器真实转发开关。
- `app/tools/registry.py`：统一调用和六个搜索直调方法均支持开关；诊断及维修工具上下文强制取证模式，工具输入日志显示实际模式。
- `app/skills/review.py`：基于冻结、脱敏的输入输出，以及任务、轨迹、实际 Agent 执行编号、技能正文与版本，原子合并重复核查；记录 `skill_review_reused`，不伪造核查成功。

以上 `app/` 路径均位于 `services/agent-service/`。核查防重属于进程内的有界临时状态：每个轨迹记录器最多保留512个摘要，不存储模型答案或业务权限；轨迹对象释放后状态可释放。缺少完整执行身份时不合并，进程重启或摘要淘汰后不承诺永久防重。原有两槽异步上限、超时、饱和处理和原业务结果不变。

## 回归测试

新增测试：

- `services/rag-service/tests/test_evidence_only_search.py`：真实路由、管道、临时 Whoosh 和本机模型 HTTP 替身验证生成次数，严格参数、正常问答及无聊天能力的取证行为。
- `services/agent-service/tests/test_model_call_economy.py`：真实 Agent、工具及 HTTP 客户端验证六路搜索、六个直调方法、A2A、当前报警扩大检索、Runtime 用途、排序及并发核查防重。
- `tests/integration/test_evidence_generation_contract.py`、`evidence_rag_worker.py`：两个独立进程加载同名 `app` 包，Agent 客户端调用真实 RAG 路由；内部取证0次回答生成，正常问答1次生成。

原有两个维修检索测试适配器增加新参数的显式签名，保留全部原检索覆盖、设备过滤、预算和证据校验断言；另增加维修取证关闭生成的断言，没有删除失败测试或扩大跳过范围。

实际命令及结果：

| 验证 | 命令 | 通过 | 失败 | 跳过 |
| --- | --- | ---: | ---: | ---: |
| Agent全量 | `L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q --tb=short` | 2542 | 0 | 3 |
| RAG全量 | `L:/anaconda/python.exe -m pytest -c pytest-rag.ini -q --tb=short` | 143 | 0 | 2 |
| 最终相关范围及跨服务契约 | 下方命令 | 106 | 0 | 0 |
| 独立复核的优化专项 | `L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_model_call_economy.py -q` | 33 | 0 | 0 |

最终范围命令：

```powershell
L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_model_call_economy.py services/agent-service/tests/test_maintenance_knowledge_sources.py services/agent-service/tests/test_runtime_maintenance_skill_scope.py services/agent-service/tests/test_all_skill_evolution.py tests/integration/test_evidence_generation_contract.py -q --tb=short
```

Agent全量启动后，独立复核发现六个直调方法未转发开关。先补六个测试并确认失败，再修复；这六个新增用例不在该次全量收集的数量中，最终106项范围及独立33项专项覆盖了最后的源码。RAG全量覆盖最终RAG源码。各测试计数存在重叠，不能相加作为独立用例数。

跳过原因：Agent一项Windows文件链接权限限制，两项需要显式启用真实FreeCAD的既有测试；RAG两项Windows文件及目录链接权限限制。

完整输出：

- `.runtime/verification/model-call-economy-agent-full.log`
- `.runtime/verification/model-call-economy-rag-full.log`
- `.runtime/verification/model-call-economy-final-regression.log`

使用Superpowers的测试驱动与复核流程，分别验证了修改前的缺陷及修改后的行为。独立复核发现的直调遗漏已修复并复验。此次没有修改前端，不执行前端构建；Backend、Document-CAD、Model的完整服务测试未重跑，没有将本次结果表述为五服务现场验收。

## 成本边界

隔离测试确认省掉的是实际回答生成调用，而不是隐藏日志。向量查询、重排、诊断多轮推理、多候选排序、不同执行的技能核查和技能优化验证仍可能使用模型。正常问答的多来源检索方式未重新设计。本次没有进行真实付费模型调用，也没有计算或承诺实际账单节省百分比。

同一诊断被方案、工单、报告和日志引用，是关联展示与审计；此次不删这些业务关联，也不删原始轨迹中的输入输出。因此不承诺日志存储大小降低。

## 配置与生效

没有更换供应商或模型，没有修改 `.env`、生产配置、端口、数据库结构及数据，也没有控制设备或调用远程CAD平台。

当前运行中的正式本地服务未重启。需要在适当的维护窗口先重启RAG服务，再重启Agent服务，使两侧源码同时生效。旧RAG会忽略未知参数，不能只更新Agent后就声称已停止内部回答生成。没有自动部署或修改生产环境。

## 备份与恢复

修改前逐文件备份23个既有源码或测试文件到：

`.local-backups/model-call-economy-20261014-v1/`

恢复前，确认对应文件在本次修改后没有新的人工或并行修改；若有，应按差异恢复，不能直接覆盖。确认后，逐文件从备份的相同相对路径复制回原路径。例如，仅恢复RAG管道：

```powershell
Copy-Item -LiteralPath 'L:/industry_agent/.local-backups/model-call-economy-20261014-v1/services/rag-service/app/api/pipeline.py' -Destination 'L:/industry_agent/services/rag-service/app/api/pipeline.py'
```

完整恢复应同时恢复Agent与RAG的相关源码，避免生成开关契约不一致；新增测试可保留用于展示旧行为的失败。无需数据库迁移，不删除数据库、数据卷、审计、工单、报告或用户已有前端改动。
