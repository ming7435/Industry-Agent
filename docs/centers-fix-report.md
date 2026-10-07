# 日志、报告、质检中心修复记录

日期：2026-10-07。对应原检查确认的 8 项问题，已修改源码并构建前端。

后续复测发现的 Memory 经验检索终态回归已追加修复，后端也已重启加载本次改动。本文保留第一轮修复与测试记录；最新交付结果见 [问题解决报告](centers-resolution-2026-10-07.md)，中间失败证据见 [复测报告](centers-test-report-2026-10-07.md)。

## 修复结果

| 中心 | 修复内容 |
| --- | --- |
| 日志 | 上一次索引读取结束后再安排刷新，同一时间只保留一个索引请求；删除未用于展示的全局 Trace 摘要请求。 |
| 日志 | MySQL 在查询时裁剪运行索引，只传归组和状态所需的标量字段；完整正文按选中 Trace 读取。 |
| 日志 | 详情返回校验当前运行身份，Agent 与底层事件使用相同的过滤结果，旧成功和旧错误均不能覆盖新选择。 |
| 日志 | 以当前 Runtime 和阶段负责人 Agent／节点的终态判断状态，保留阻塞原因及真实业务结果；子工具完成、子 Agent 完成、旧尝试错误、旧 Trace 晚到终态及内部学习循环均不会误改当前状态。 |
| 报告 | 显示真实工单编号、状态、负责人和步骤，兼容历史工单封装及工单内维修反馈；维修复核单独展示。 |
| 报告 | 列表和正文显示完整性，正文展示全部校验缺失原因。 |
| 报告 | PDF 生成及就绪状态绑定报告 ID，列表刷新移除旧报告时同步校正选中项，切换报告不会借用旧报告的链接。 |
| 质检 | 检测、操作和历史刷新绑定零件及当前选择，切换零件或历史记录后丢弃旧返回；批准／驳回传唯一 pending 申诉 ID，两后端兼容空 ID 时只处理唯一待办。 |

申诉修复保留了原来的放行证据、复检、批次及整改时间校验；显式已结束申诉 ID 仍拒绝再次处理。

## 验证

- 前端 Node 测试：97/97 通过。
- 浏览器回归：7/7 通过，覆盖慢轮询、日志切换、质检切换零件／历史、不完整报告、两个 PDF 竞态。
- 日志相关 Python 测试：46/46 通过，包含负责人、节点业务结果、重试与旧执行晚返回边界。
- Backend 完整测试：81/81 通过。
- Agent 非 CAD 完整测试：773/773 通过，使用 `--ignore-glob='*test_cad*'`；完整结果见 `.runtime/verification/center-fixes/agent-non-cad-final.log`。
- `npm --prefix frontend/monitor-react run build` 成功。8001 已提供 `index-DepkKYe6.js`；通过该静态服务器加载的三个页面均无 JavaScript 异常。页面验证中的 API 全部被模拟接口拦截，未执行业务写入。
- 独立复核通过，当前修改范围内未发现剩余重要问题。

现有 MySQL 的只读测量取出 4,274 条索引，查询 4.336 秒，聚合 0.252 秒；数据库传输 JSON 约 3.52 MB，未包含对象／数组形式的正文。原检查的在线旧接口读取 5000 上限为 26.07 秒。两次使用不同读取路径，数据量和缓存状态也可能不同，数值用于记录本机观测。

完整 Agent 测试曾得到 839 passed、20 failed、12 errors，失败集中在 CAD 实体建模和加工相关用例。独立运行原 CAD worker 的 `--health` 返回 `ModuleNotFoundError`；当前 Python 无 `cadquery`，`.runtime/cad-modeling-venv/Scripts/python.exe` 不存在。因此完整 Agent 套件尚未全部通过，CAD 环境问题没有在本次中心修复中改动。

## 生效状态

前端资源已更新，刷新页面即可加载。

8010 Agent 和 8030 Backend 由 `scripts/start_all.py` 统一管理，没有开启自动重载。后续修复轮已于 2026-10-07 13:40 左右统一重启应用，Agent 新 PID 为 43860，Backend 新 PID 为 29756，均已加载日志索引、状态聚合及申诉选择改动。

重启前已核对诊断队列为 0，仅停止并恢复原启动器管理的应用进程；独立 Factory 进程 20144 和持久数据保留。现有维护模块的其他任务改动已保留，未提交 Git。

## 交付文件

- `frontend/monitor-react/src/app/App.jsx`、`reportView.mjs`、`qualityWorkspace.mjs` 及对应测试。
- `services/agent-service/app/harness/{runs,trace,trace_store}.py`、`app/api/server.py`、`app/closure/service.py` 及对应测试。
- `services/backend-service/app/workorder/service.py` 和 `tests/test_quality_appeal_selection.py`。
- `tests/browser/centers-regressions.test.mjs`、`tests/browser/helpers/center-fixture.mjs`。
- 验证脚本、测量与截图位于 `.runtime/verification/center-fixes/`；原检查证据仍在 `.runtime/verification/center-audit/`。
