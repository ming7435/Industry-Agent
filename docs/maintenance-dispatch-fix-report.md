# 维修方案与工单派发修复记录

日期：2026-10-06。范围：当前本地项目的维修方案分类、备件身份、工程与库存门禁及派发回归。未重做前端，未修改其他四个服务或现有配置。

## 实际原因与现场状态

通过只读 API 获取的历史方案 `PLAN-06AB25A668`，设备为 `TRAK-TC820LTYSI-001`，报警码为 `700001`，实际故障是润滑压力未达到。原分类扫描正常温度背景以及图纸名称，导致维修对象错误地变成主轴冷却系统；缺乏工程和库存依据时，还会生成固定的温度传感器、冷却泵备件。

该记录诊断置信度为 0.886，证据状态为 ready；此次并非通过降低置信度门禁修复。保存的方案因缺少 CAD/BOM、工程依据和正式库存而阻断，并达到重规划上限。

只读复查 CAD 服务的 `/health`：ready=true，但 records=0。服务能连接不代表已有设备工程资料。工单故障定位用的 HTML 三维图与可查询的工程部件/BOM 记录不是同一份数据，不能用前者假装后者已经齐全。当前四台虚拟设备均处于 running 状态，没有为验证派发而注入故障、停机或启动设备。

## 修改文件及关键行为

| 文件 | 实际变更 |
| --- | --- |
| services/agent-service/app/workorder/repair_profile.py（新增） | Agent 和草案工具共用故障分类；优先实际报警定义和主要故障，再参考原因；不依赖跨机型报警码猜含义。区分正常指标背景、复合指标和已有状态的独立指标；图纸名称不再改变故障分类。 |
| services/agent-service/app/agents/maintenance/agent.py | 补齐润滑故障方案与复测内容；去掉没有证据的固定备件；只选对应故障的工程和库存记录；不能用输入中的无关目标覆盖工程目标。显示 parts 和业务 required_parts 分开，后者传纯编号；兼容库存 part_no 和 part_id。 |
| services/agent-service/app/agents/maintenance/graph.py | 后续库存检查更新方案时，同步保留纯编号 required_parts，避免重新写回显示文字。 |
| services/agent-service/app/agents/maintenance/validator.py | 验证本次故障对应的 CAD/BOM；所需备件逐项检查准确编号、库存可用性和数量，拒绝无关、无编号、未知或零库存。缺少库存不能默认通过。保留演示/降级证据阻断。 |
| services/agent-service/app/tools/maintenance/generate_repair_plan.py | 与 Agent 使用一致分类，润滑故障不返回温度维修步骤；保留 fault/summary/diagnosis 输入兼容性和故障名称。 |
| services/agent-service/tests/test_maintenance_fault_dispatch.py（新增） | 39 项针对性回归，包括错误分类、正常背景、目标覆盖、CAD/库存门禁、编号传递以及有效资料下的自动派工和持久化。 |

### 保留的业务门禁

保留诊断证据、置信度、maintenance_required、工程依据、安全要求、库存、人员和现有权限校验。没有制造库存、人员、图纸、阈值或“验证通过”标记。未知故障仍走通用方案，不会因为报警码恰好相同而假定设备属于其他机型。

## 问题处理结果

| 问题 | 结果 |
| --- | --- |
| 润滑故障被正常温度及无关图纸带偏 | 已修复；实际保存的诊断只读回放结果为润滑系统。 |
| 无证据时补出固定温度/冷却备件 | 已修复；没有工程和库存证据时备件列表为空。 |
| 无关 CAD 或其他零件有库存也能满足本次门禁 | 已修复；验证本次故障对象和具体所需备件。 |
| 库存只有 part_no 时丢失编号 | 已修复；part_no/part_id 两条真实 Agent 流程均验证。 |
| 将备件名称和库存注释传给库存预留 part_no | 已修复；业务编号独立于显示文字，回归捕获实际边界调用的纯编号。 |
| 无编号库存被当作有效备件 | 已修复；不能以名称代替编号满足库存门禁。 |
| 当前现场缺少工程资料和正式库存依据 | 仍受阻；CAD 服务目前记录为零，不能用演示数据绕过。需补充该设备的正式部件/BOM 和可查询库存。 |
| 页面旧方案、旧工单自动被新代码覆盖 | 未做，且不是本次目标；已有业务记录保留。 |
| 当前运行进程自动加载修复 | 尚未生效；Agent 由 start_all.py 管理且没有 reload，本次没有重启服务。 |

## 测试方法与结果

测试执行真实被测函数及 Agent 流程，不只检查源码字符串。正向测试运行 MaintenanceAgent → WorkOrderAgent → 工单服务 → 隔离 SQLite 持久化，检查自动派给对应设备的注册维修人员，库存预留收到纯编号。外部知识、工程、库存和人员适配器使用隔离测试返回，不调用真实数据库、收费模型或设备接口。

### 失败复现记录

所有失败用例均先补测试、实际运行，再修复；保留日志及全部测试，没有通过删除测试、放宽门禁或扩大跳过范围制造通过。

| 日志（.runtime/verification/maintenance-dispatch-20261006/） | 通过 | 失败 |
| --- | ---: | ---: |
| target-red.log | 1 | 13 |
| review-red.log | 14 | 11 |
| identity-red.log | 23 | 6 |
| adjacent-red.log | 29 | 5 |
| status-red.log | 34 | 2 |
| temperature-red.log | 36 | 3 |

### 最终版本验证

以下命令使用当前环境中的 Python/Node，测试配置为临时数据库、显式 fake 测试模型且关闭 dotenv 自动读取；测试子进程清空模型密钥并将外部数据库/工厂地址指向不可用隔离端口。未修改项目配置文件。

```powershell
# 项目根目录
$env:PYTHONUTF8 = '1'
$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHON_DOTENV_DISABLED = '1'
$env:APP_ENV = 'testing'
$env:MODEL_PROVIDER = 'fake'
$env:DEEPSEEK_API_KEY = ''
$env:SILICONFLOW_API_KEY = ''
$env:MYSQL_HOST = '127.0.0.1'
$env:MYSQL_PORT = '9'
$env:MYSQL_PASSWORD = ''
$env:MILVUS_URI = 'http://127.0.0.1:9'
$env:FACTORY_API_BASE_URL = 'http://127.0.0.1:9'
& L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_maintenance_fault_dispatch.py -q
& L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q
& L:/anaconda/python.exe -m pytest -c pytest-agent.ini tests/integration/test_virtual_line_team_contract.py -q

# frontend/monitor-react 目录
$taskTests = @(rg --files src | Where-Object { $_ -match '\.test\.mjs$' })
& L:/nodejs/node.exe --test @taskTests
```

| 验证 | 通过 | 失败 | 跳过 | 日志 |
| --- | ---: | ---: | ---: | --- |
| 针对性回归 | 39 | 0 | 0 | target-final.log |
| Agent 全量（包含上述 39 项） | 751 | 0 | 0 | agent-final39.log |
| 产线与维修小组跨服务契约 | 1 | 0 | 0 | contract-final39.log |
| 前端既有功能回归 | 63 | 0 | 0 | frontend-final.log |

上述均为最终源码的实际验证结果，不用中间版本结果替代。Agent 全量耗时 138.64 秒，跨服务契约 6.57 秒；没有失败或跳过项。代码复查发现的明确回归已经补测并关闭，最终版本范围内无未关闭的审查项。测试用的环境变量仅作用于命令子进程，不能拿这组隔离变量启动日常业务服务。

## 配置、数据及恢复

没有修改 .env、供应商、模型、端口或生产配置；没有数据库迁移；没有覆盖既有诊断/方案/工单；没有真实派工、库存预留或机器控制操作。源码备份目录为 `.runtime/backups/20261006-maintenance-dispatch/`，其中 `RESTORE.md` 记录四个修改前文件的摘要和逐文件恢复方法。

运行服务由 `scripts/start_all.py` 统一管理，直接结束单个 Agent 子进程会触发管理进程停止其余服务。本次没有这样重启，避免打断当前运行及触发监控后续业务。应在合适的本地维护时机统一重启后使用新逻辑；新故障仍必须满足实际工程、库存及人员证据。

## 尚未执行的验证

未执行真实故障注入、真实库存事务、在线付费模型回路或设备恢复验收；当前 CAD/BOM 无记录，无法证明现场完整派发成功。没有凭经验猜测设备合格阈值；润滑压力等复测仍与当前设备已配置的验收标准比较。离线/隔离回归通过不等同生产或真实设备验收通过。
