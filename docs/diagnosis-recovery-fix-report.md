# 诊断超时与结果展示修复报告

日期：2026-10-06。范围：当前本地项目的 Monitor、Agent 事件结果读取和智能诊断页面。没有重构五服务架构，没有降低置信度门禁，没有强制派工。

## 实际原因

此前只读监控与 Trace 核对发现：Monitor 的事件请求等待默认 180 秒，而同一异常的诊断、检索、复核运行总计约 4 分 18 秒。后台确实产生了诊断输出，置信度为 0.465；因证据不足，Runtime 最终以 `blocked / replan_limit_exceeded` 停止。

Monitor 先记录 HTTP 超时，原实现没有回查。失败对象缺少设备、报警、事件修订信息；页面在有活动报警时将它视为无关旧结果，反而显示“等待”。此外，旧故障回调能够覆盖新故障，旧会话回调能够扣减新会话的待处理数。

这不是“通过降低置信度就能派工”的问题。未知报警定义、检索向量能力不可用等证据问题仍需真实资料及供应商能力解决；不能将缺少证据写成确定根因。

## 修改文件与行为

| 文件 | 行为 |
| --- | --- |
| `services/agent-service/app/runtime/event_store.py` | 新增 `get_result`，按完整作用域只读读取已有结果，不调用生产函数、不认领任务、不等待执行锁、不扫描全库。线上继续使用 MySQL。 |
| `services/agent-service/app/api/server.py` | 新增 `GET /api/v1/agent/event/{event_id}/result`。设备和修订必填；提交与读取共用租户/设备/事件/修订键。已有结果返回 200；未得到结果返回 202 `pending_or_unknown`，不谎称正在运行或已经失败。保留服务令牌鉴权，不返回完整 Trace/递归 Runtime 上下文。 |
| `services/agent-service/monitor_web_server.py` | POST 只发送一次。请求超时或收到 504 后，只进行有界 GET 回查；回查期间显示 `recovering`，窗口结束仍无结果则显示 `unknown`。422 等业务拒绝不重试。所有结果保留原始事件身份，新故障立即替换旧展示；旧修订/旧会话回调不能污染当前诊断和计数。 |
| `frontend/monitor-react/src/app/diagnosisView.mjs` | 保留并显示失败原因、回查状态和未知状态；低置信度诊断正文可以展示，但证据门禁仍明确提示“未自动派工”。不同设备的结果不混用。 |
| `frontend/monitor-react/src/app/App.jsx` | 中文状态、可见错误提示、按所选设备读取 Pipeline，不改变原有上下排版。 |
| `services/agent-service/tests/test_diagnosis_result_recovery.py` | 存储/API/HTTP 超时/身份/旧回调回归。真实 HTTP 测试调用真实事件 API 与结果存储；仅慢速模型运行边界使用测试 Runtime。 |
| `frontend/monitor-react/src/app/diagnosisView.test.mjs` | 增加失败展示、低置信度门禁、跨设备隔离回归。 |
| `frontend/monitor/` | 使用当前源码执行 Vite 构建生成；没有手工修改打包后的 assets。 |

## 配置与数据

没有修改 `.env`、密钥、模型供应商、生产数据库配置或数据库结构。没有删除数据库、业务记录或数据卷。

新增代码默认值：`AGENT_RESULT_RECOVERY_SECONDS=180`、`AGENT_RESULT_POLL_SECONDS=2`。原 POST 超时默认仍为 180 秒；这是“超时后只读对账”，不是重复提交或单纯提高 POST 超时。部署人员如有明确需要可通过进程环境覆盖，本次没有写入配置文件。

GET 回查读取原有事件结果格式，无需数据迁移。旧版仅按事件 ID、缺少设备归属的记录仍不能无条件回放；原有防重放规则保留。

## 测试记录

测试隔离本机配置，使用测试适配器、临时存储和回环随机端口，不连接收费模型或真实设备。测试中的 SQLite 仅为项目既有隔离测试适配器，不改变线上 MySQL 存储。

| 命令/检查 | 实际结果 |
| --- | --- |
| 修改前：`L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_diagnosis_result_recovery.py -q` | 1 通过、8 失败，复现缺少回查接口、身份丢失和旧回调覆盖。 |
| 修改前：`L:/nodejs/node.exe --test frontend/monitor-react/src/app/diagnosisView.test.mjs` | 4 通过、3 失败。 |
| 针对性回归：`L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_diagnosis_result_recovery.py services/agent-service/tests/test_event_result_revision.py services/agent-service/tests/test_monitor_auto_pause.py services/agent-service/tests/test_monitor_web_server.py -q` | 22 通过、0 失败、0 跳过。 |
| Agent 全量：`L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q` | 792 通过、0 失败、0 跳过。 |
| 前端全量：`$diagnosisFrontTests = @(rg --files frontend/monitor-react/src -g '*.test.mjs'); & 'L:/nodejs/node.exe' --test @diagnosisFrontTests` | 78 通过、0 失败、0 跳过。 |
| 前端构建：在 `frontend/monitor-react` 执行 `L:/nodejs/node.exe node_modules/vite/bin/vite.js build` | 成功；保留 Vite 原有大分包体积告警，没有降低告警阈值。 |
| 浏览器：`L:/nodejs/node.exe .runtime/verification/diagnosis-recovery-browser.mjs` | 4 场景通过：回查、证据不足、错误显示、新报警清除旧结果；0 页面异常、0 业务写请求。使用隔离快照，不是现场设备验收。 |
| 重启启动时序修复前：`L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_start_all.py -q` | 1 通过、3 失败，复现启动器没有健康接口等待机制。 |
| 重启启动时序修复后：`L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_start_all.py services/agent-service/tests/test_diagnosis_result_recovery.py -q` | 14 通过、0 失败、0 跳过。真实随机回环 HTTP 服务验证初始化期间 503 不放行、200 后放行、等待有界；真实子进程验证提前退出及时失败。 |
| 重启修复后 Agent 全量：`L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q` | 795 通过、0 失败、0 跳过，160.34 秒。 |

其中真实 HTTP 回归明确验证：原 POST 超时后后台继续完成；GET 从真实 API/存储取得结论；事件执行次数仍为一次；置信度仍为 0.465、`maintenance_required=false`、Runtime 仍为 `blocked`。没有为了通过测试伪造派工成功。

## 生效与未验证项

前端产物已构建。用户随后明确要求重启，已在 2026-10-06 21:15 重新启动五服务与 Monitor，加载新 Python 源码及当前前端产物；页面 HTTP 200 且引用 `index-Lo7AcYNi.js`。模拟工厂原进程 PID 20144 保持不变，未重启数据库和基础设施，未清理业务数据。

重启现场发现另一项启动竞态：原 `scripts/start_all.py` 每启动一个服务仅固定等待 0.8 秒，Monitor 自动提交故障时 Agent 尚未接收请求，出现 WinError 10061；随后相同故障被监控去重，未再次诊断。已先补回归再修改启动器：各服务健康接口 HTTP 200 后才继续启动下一个，等待默认最多 60 秒；子进程提前退出或等待超时会停止本次启动器拥有的进程。模型能力未探测或向量不可用不伪装为就绪，也不通过额外收费生成请求检查启动状态。

当前运行器仍由 `scripts/start_all.py` 管理：在原启动终端使用 Ctrl+C 正常结束应用服务，再在项目根目录执行 `L:/anaconda/python.exe scripts/start_all.py`。不要直接单独结束被监督的子进程；不需要停止模拟工厂或 MySQL/Redis/Milvus，更不能删除数据卷。本次按端口、路径、父进程和创建时间核对后，只终止了已确认属于项目启动器的进程。

现场只读验证结果：五服务 `/health` 均 HTTP 200；旧事件结果查询 HTTP 200 且返回 MySQL 已保存结果。新监控事件 `EVT-20261006-131524-087-005` 正常进入诊断，最终 Monitor 待处理数归零、诊断 `completed`，报警 700001，设备 `TRAK-TC820LTYSI-001`，诊断为润滑压力不足，置信度 0.916，Trace 为 `TRACE-4ab95c19dde4`。没有再次发生连接拒绝或丢失诊断正文。

仍未恢复的业务：该事件整体 Runtime 为 `blocked / replan_limit_exceeded`，没有生成工单；不能将诊断完成写成维修方案、派工、报告闭环完成。Model 健康信息显示 DeepSeek 对话可达，但 SiliconFlow 向量和重排能力不可达（ProviderError），视觉能力未探测；按用户此前选择保留供应商，没有更换模型或写入配置。

重启后 Monitor 的正常故障流程自动调用了现有模型和检索接口，未人工重复 POST 故障，也未额外发送生成请求用于健康检查。未人工调用停机/复机接口。没有将隔离测试通过写成整条产线现场验收通过。

## 备份与恢复

修改前源码和旧前端产物位于：`L:/industry_agent/.runtime/backups/diagnosis-recovery-20261006-200041`，不包含配置和密钥。

恢复时先停止本地应用服务，按下列方式恢复本次涉及的六个已有源文件；如果之后产生了新修改，应先另行备份，不覆盖新的用户工作。

```powershell
$repairBackup = 'L:/industry_agent/.runtime/backups/diagnosis-recovery-20261006-200041'
$repairFiles = @(
  'services/agent-service/app/api/server.py',
  'services/agent-service/app/runtime/event_store.py',
  'services/agent-service/monitor_web_server.py',
  'frontend/monitor-react/src/app/diagnosisView.mjs',
  'frontend/monitor-react/src/app/diagnosisView.test.mjs',
  'frontend/monitor-react/src/app/App.jsx'
)
foreach ($repairFile in $repairFiles) {
  Copy-Item -LiteralPath (Join-Path $repairBackup $repairFile) -Destination (Join-Path 'L:/industry_agent' $repairFile)
}
Set-Location 'L:/industry_agent/frontend/monitor-react'
& 'L:/nodejs/node.exe' node_modules/vite/bin/vite.js build
```

旧产物目录也保留在备份内供核对。本次新增的测试、计划和报告可保留；源码恢复后新增回归会再次指出缺失的功能，这是正常现象。

启动时序修改前的 `scripts/start_all.py`、`services/agent-service/tests/test_start_all.py` 与当时报告备份在 `L:/industry_agent/.runtime/backups/startup-readiness-20261006-2106`。此备份同样不包含配置或密钥。需要撤回启动时序修复时，先停止应用，另行备份后续修改，再将该目录中的两个源码文件复制回各自原路径；恢复旧启动器会重新引入本次发现的启动竞态，不建议仅为了重启回退。
