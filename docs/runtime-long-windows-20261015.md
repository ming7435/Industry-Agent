# 监控统计范围扩展交付说明

日期：2026-10-15。

## 实际行为

- 页面保留“最近 1 小时”，新增“最近 1 天”“最近 1 周”“最近 1 个月（30天）”，删除 5 分钟和 15 分钟菜单；默认改为 1 小时。
- 范围是滚动最近 1/24/168/720 小时，不是自然日、本周或自然月。小时视图按分钟、天视图按小时、周/月视图按天汇总；天边界按北京时间零点划分。
- 总调用量、Token、吞吐、耗时和两张曲线使用同一范围。曲线保留直接数值标注，跨日显示日期刻度，不插入重复的半天标签。
- 后端先按桶归并再生成曲线，最多 61 个点，不在月视图逐分钟重复扫描。旧 5/15 分钟 API 请求仍兼容，但不再是页面选项。
- 仍是当前 Model 进程内的有界回执统计，不新增永久监控数据库。页面提示实际采集起点及容量不足；未采集的历史和缺失 Token 不伪装成零。选择月范围不代表已有完整一个月历史。

## 修改文件

- `frontend/monitor-react/src/app/RuntimeMonitor.jsx`：范围菜单、默认读取、粒度标题、日期刻度和采集不足提示。
- `services/model-service/app/metrics.py`：长范围过滤、分钟/小时/天汇总、粒度及北京时间元数据。
- `services/model-service/app/main.py`、`services/agent-service/app/api/server.py`：同步扩展范围校验，仍使用原只读监控链路。
- `services/model-service/tests/test_runtime_metrics.py`、`services/agent-service/tests/test_runtime_monitor.py`：真实汇总及 HTTP 契约测试。
- `tests/browser/runtime-monitor.test.mjs`：原回归适配新默认值和菜单，保留原数值、缺项、窄屏及轮询断言。
- `tests/browser/runtime-monitor-windows.test.mjs`：新增四个范围联动、总量、日期刻度与只读请求测试。
- `frontend/monitor/`：从当前源码重新构建，未手工修改压缩文件。
- `.runtime/active-startup-dir.txt`：指向恢复后的本次启动日志。

## 测试与验收

先补失败测试：原 Model 对长范围拒绝或缺少粒度，8 项失败；原 Agent 长范围 3 项返回 422；原网页菜单缺失新范围。日期重复刻度也先复现再修复。

| 验证 | 通过 | 失败 | 跳过 |
| --- | ---: | ---: | ---: |
| `L:/anaconda/python.exe -m pytest -c pytest-model.ini -q` | 42 | 0 | 0 |
| `L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_runtime_monitor.py services/agent-service/tests/test_monitor_runtime_metrics_proxy.py -q` | 12 | 0 | 0 |
| 前端所有 `src/**/*.test.mjs`：Node `--test` | 295 | 0 | 0 |
| 日志相关 13 个浏览器文件：Node `--test --test-concurrency=2` | 39 | 0 | 0 |

前端 Vite 构建成功，保留既有三维依赖块超过 500 kB 的警告。没有重跑 Agent 全量、全部浏览器或五服务全部业务验收；此前记录的其他问题未在本次范围内处理，也未改动其失败基线。

当前本机实际网页验收脚本：`.runtime/verification/runtime-long-windows-live-20261015.mjs`。四个范围经网页代理均返回 200，实际 Model 均可用，粒度依次为 60、3600、86400、86400 秒；两类视图切换正常，无页面异常，浏览器未发送写请求。已查看隔离月视图和当前本机截图；测试夹具不能作为真实月度历史。

## 本地环境恢复

用户先授权重载 Agent/Model，核对发现现有启动器统一管理服务并共享一次性鉴权后，又明确授权统一重载本地应用。执行被中断后，实际检查发现应用、模拟工厂、FreeCAD、Docker 依赖均离线；随后用户明确授权恢复已有完整本地环境。

已启动已有 Docker Desktop，复用原容器和数据卷，启动原本机模拟工厂以及原 `scripts/start_all.py`。未安装新软件、下载模型、删除数据库/数据卷、连接真实设备或直接提交设备控制指令。恢复后既有应用后台任务按原配置运行。

最终检查：虚拟工厂 4529、Model 8040、Backend 8030、RAG 8020、Document-CAD 8050、Agent 8010、网页 8001 均返回 200；原 MySQL/Redis 容器运行，Milvus 健康；FreeCAD 原安装已运行且只读 RPC 就绪。

进程内监控计数已随获授权的重载重新开始采集，旧内存计数不能通过源码备份恢复；本次没有伪造重载前的历史。新启动日志：`.runtime/startup-runtime-long-windows-20261015/`。

## 备份与恢复

修改前现有源码、测试和旧启动日志指针备份在 `.local-backups/runtime-long-windows-20261015-v1/`，保留相对路径，不包含密钥配置。需要撤回时先核对后续人工修改，将对应备份逐个复制回原位置，重新构建前端并在获准窗口重载应用；新增测试可保留归档。不要整体覆盖工作区，不需要数据库迁移，也不要删除业务数据。
