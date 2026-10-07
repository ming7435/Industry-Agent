# 当前故障诊断及时返回修复报告

日期：2026-10-07。对象：当前 `L:/industry_agent` 本地源码。保留五服务和已有前端，不覆盖远程版本、不降低置信度或派工门禁。

## 结果与范围

已修复设备报警定义误用旧 Mock、诊断必须等待整条流程结束才显示、长运行模型 HTTP 客户端持有旧代理，以及超时/错误清除已有诊断的问题。

现场正常诊断流已观察到：700004 正确识别为“开门被禁止：程序、轴、主轴未停止或接料器未下降”；`diagnosis.status=completed`、置信度 0.916。Monitor 待处理数仍为 1 时正文已经显示，`workflow_status=running`；整流程结束后待处理数归零、正文继续保留。

这不是整个维修闭环已完成。该轮 Runtime 为 `blocked / replan_limit_exceeded`，没有工单；向量和重排提供方仍不可用。按用户此前选择保留现有提供方，不更换模型、不补造证据、不强制派工。

## 原因核查

1. 虚拟工厂目录有 700004 的真实模拟定义，但报警工具仍使用不包含该编号的旧字典，返回“未知报警”。已改为按请求设备和精确报警编号查现有工厂 `/api/snapshot` 的结构化目录。
2. 最终事件结果只在整个 Runtime 结束时保存。Monitor 原来先等待 POST，超时后才 GET 回查，所以诊断虽已完成仍不能显示。已发布并读取独立的阶段诊断。
3. 旧 Model 进程多次快速返回 `URLError`，但新进程无密钥读取 DeepSeek 官网 `/models` 能收到 HTTP 401，说明当时新连接能到达官网。代码存在全局 urllib opener 缓存旧系统代理的风险，已通过真实回环供应商复现并修复。旧进程底层网络异常没有分类，不能仅凭日志断言每次 503 都由代理造成；本次正常诊断在重启后已真实收到 DeepSeek HTTP 200。

## 实际修改的源码

| 文件 | 新行为 |
| --- | --- |
| `services/model-service/app/providers/gateway.py` | 每次请求使用当前系统/环境代理建立 opener，保留 TLS 校验与有界重试。连接拒绝、超时、DNS、TLS 错误按白名单分类，不回显底层异常正文或密钥。 |
| `services/agent-service/app/tools/diagnosis/get_alarm_definition.py` | 线上必须有工厂地址和设备。目录内设备与编号同时匹配；失败、缺失或格式不完整返回证据不可用，不能退回 Mock。显式空列表允许正常未命中。旧字典仅供隔离测试。 |
| `services/agent-service/app/tools/registry.py` | 报警工具设备来自可信执行 context，模型参数不能切换设备；模型工具 schema 不扩大。 |
| `services/agent-service/app/runtime/container.py` | Registry 使用现有 factory 地址配置。 |
| `services/agent-service/app/agents/diagnosis/graph.py`、`agent.py` | 内循环、兜底及安全复查均传入当前事件设备归属。 |
| `services/agent-service/app/runtime/event_store.py` | 共用事件作用域键；阶段进度存 Redis TTL，正式事件结果仍存 MySQL。隔离测试使用有界内存，不新增线上 SQLite。 |
| `services/agent-service/app/runtime/coordinator.py` | 实际诊断动作返回后立即发布阶段输出；不等待知识、方案和工单，不改变这些动作的验证与审批门禁。缓存失败只记录安全的异常类别，不能伪造完成。 |
| `services/agent-service/app/api/server.py` | 提交、发布和查询共用租户/设备/事件/修订键。结果 GET 先读正式结果，再读阶段；分别返回 `available`、`in_progress` 或 HTTP 202 `pending_or_unknown`。仍保留鉴权。 |
| `services/agent-service/monitor_web_server.py` | 仅一次 POST，同时用只读 GET 读取阶段输出。POST 自身超时才进入额外回查窗口；等待 Future 的超时不等同于请求失败。阶段完成正文不被后续超时或连接错误抹掉。旧事件/旧会话不能覆盖当前故障。 |
| `frontend/monitor-react/src/app/diagnosisView.mjs` | 阶段完成时展示正文并明确提示“后续流程仍在处理”；后续结果不确定与诊断结果分开显示，仍显示最终门禁。 |
| `frontend/monitor/` | 从当前 React/Vite 源码构建产生 `index-SAjktQkl.js`，没有手工修改 assets。 |

## 回归测试

新增 `test_factory_alarm_definition.py`、`test_diagnosis_stage_progress.py`，扩展 `test_diagnosis_result_recovery.py`、Model `test_provider_connectivity.py` 和前端 `diagnosisView.test.mjs`。

测试在隔离配置下运行，使用临时存储、真实随机回环 HTTP 供应商与工厂、真实被测 Coordinator/API/Store/Monitor。只有远程业务执行边界使用测试适配器；没有把被测函数本身替换成通过结果。没有连接收费模型或真实设备进行自动化回归。

先失败后修复的覆盖包括：设备匹配与未知编号、错误目录、过期全局代理、错误正文泄密、阶段 API、真实 HTTP 提前显示、超时/连接错误保留诊断，以及 POST 在 Future 等待超时边界刚完成的竞态。没有删除失败测试或扩大跳过范围。

| 实际命令 | 结果 |
| --- | --- |
| `L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_diagnosis_result_recovery.py services/agent-service/tests/test_diagnosis_stage_progress.py services/agent-service/tests/test_factory_alarm_definition.py -q --tb=short` | 最终 27 通过、0 失败、0 跳过，9.54 秒。 |
| `L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests -q --tb=short` | 最终 812 通过、0 失败、0 跳过，197.04 秒。 |
| `L:/anaconda/python.exe -m pytest -c pytest-model.ini services/model-service/tests -q` | 19 通过、0 失败、0 跳过。 |
| `$diagnosisFrontTests = @(rg --files frontend/monitor-react/src -g '*.test.mjs'); & 'L:/nodejs/node.exe' --test @diagnosisFrontTests` | 79 通过、0 失败、0 跳过。 |
| 在 `frontend/monitor-react` 执行 `L:/nodejs/node.exe node_modules/vite/bin/vite.js build` | 构建成功；保留已有大 bundle 提示，本轮不进行无关拆包。 |
| `L:/nodejs/node.exe .runtime/verification/live-diagnosis-browser.mjs` | 6 个隔离浏览器场景通过；0 页面错误、0 业务写请求。 |
| `L:/nodejs/node.exe .runtime/verification/live-diagnosis-current-browser.mjs` | 真实当前页面通过：存在 700004 和正确报警名称，无 Mock 提示，不再显示等待正文；0 页面错误、0 业务写请求。 |

独立只读审查发现两个 Important：Future 超时完成竞态、缺失目录字段错误地当未命中。均先补失败测试再修复，并执行上述最终全量回归。0 Critical、0 Minor；未再派第二轮审查。本轮审查以备份文件而非 Git 提交号为对照，不覆盖已有 dirty 改动。

## 配置、数据与恢复

没有修改 `.env`、密钥、模型供应商、数据库配置或表结构；没有删除业务记录、缓存集合、数据库或数据卷，无需数据迁移。阶段进度使用现有 `REDIS_URL`，前缀 `agent:event-progress`，TTL 900 秒；最终结果仍为现有 MySQL 事件存储。POST 超时与回查窗口仍使用现有设置，读取间隔默认 2 秒。

源文件与旧前端产物修改前已备份到 `L:/industry_agent/.runtime/backups/diagnosis-live-20261007`，不包含配置或密钥。恢复时：

1. 先停止本地应用启动器，不停止虚拟工厂和数据库；另行备份之后新增的用户改动。
2. 将备份中本报告列出的已有源码按原相对路径复制回工作目录。不要整目录覆盖，不恢复本轮没有改过的文件；备份中的 `tool_policy.py` 本轮未修改。
3. 在 `frontend/monitor-react` 重新执行上述 Vite 构建，再使用 `L:/anaconda/python.exe scripts/start_all.py` 启动。
4. 新增测试和报告可以保留；恢复旧源码后这些回归会重新暴露原缺陷，属预期。

本轮重启只针对已核对路径、父进程与端口的项目应用，等待旧诊断待处理数归零后进行。虚拟工厂 PID 20144、4529 端口保持不变。没有人工 POST 故障、没有手工控制停机/复机接口；正常 Monitor 启动流程会按项目现有行为处理当前虚拟故障并调用模型。

最终版本于 08:49:55 由本地启动器 PID 35180 启动，日志为 `.runtime/diagnosis-live-final-20261007.out.log` 和同名 `.err.log`。五服务健康接口均 HTTP 200，页面引用当前源码构建的 `index-SAjktQkl.js`。当前事件 `EVT-20261007-005016-137-003` 在结束前的 Agent 只读 GET 为 HTTP 200 / `in_progress`，诊断已完成、置信度 0.916；结束后 Monitor pending=0，Runtime blocked、Trace `TRACE-22A282D77DFB`，没有宣称派工成功。

重启前事件 `EVT-20261007-004007-462-003` 重启后仍能从 MySQL 读取，GET 为 HTTP 200 / `available`。一次验证误向 Monitor 8001 请求未在其公开代理白名单中的 `/api/v1/agent/event/.../result`，收到 404；改用 Agent 8010 的实际路由后验证通过。Monitor 后台本来直接访问 Agent，不为这次探测扩大公开 API 白名单。

## 未完成或未执行的验证

- 外部向量与重排能力仍失败；用户此前要求保留当前供应商，由用户处理余额/权限。因此知识证据、维修方案、派工及报告闭环不能宣称全部可用。
- 本轮没有重新运行无改动 Backend、RAG、Document-CAD 的全量测试；五服务健康 GET 与正常诊断链路只作本地连通性验证。
- 没有验收真实 PLC、真实生产、真实设备维修阈值或设备恢复；诊断正文中的指标来自现有虚拟工厂数据，不是本轮自行规定工业合格标准。
- 模型旧进程的所有网络失败原因无法追溯重建；修复的是已复现的旧代理风险与缺少安全错误分类，不能保证未来任何供应商网络故障都消失。
- 离线回归通过、API 可达或诊断完成均不等于生产维修验收或整个工单闭环通过。
