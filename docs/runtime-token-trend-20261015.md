# 每分钟 Token 消耗量折线图

2026-10-15，在日志系统原有模型调用量图下增加独立的 Token 消耗量图。两图共用既有的只读监控请求、5 秒刷新和 5/15/60 分钟筛选，不新增模型请求或依赖。

## 数据与显示

- 使用现有 `GET /api/runtime/metrics` 返回的 `model.timeline[].total_tokens`，按提供方总量回执统计，包含输入与输出，不通过字符数推算。
- 每个已采集点标注数值；真实 0 保留，`null`/缺失值不补零、不跨缺项连线，完全未采集时显示空状态。部分回执缺失继续由原用量覆盖说明披露。
- 次数与 Token 使用独立坐标轴和明确单位。根据数值长度预留坐标和首点标签空间，密集数据仅在图表内部滚动。
- 修改 `frontend/monitor-react/src/app/RuntimeMonitor.jsx`、`runtimeMonitor.css`；更新 `tests/browser/runtime-monitor.test.mjs`。前端产物由 Vite 从源码构建，不手工编辑 assets。

## 实测结果

先补回归：缺少 Token 图时 2 项失败、3 项通过；窄屏文字重叠也先复现失败，再调整绘图区留白。

- 前端全部单元测试：`L:/nodejs/node.exe --test <frontend/monitor-react/src 下全部 *.test.mjs>`：295 通过、0 失败、0 跳过。
- 日志相关 12 个浏览器测试文件：`L:/nodejs/node.exe --test --test-concurrency=2 <受影响日志测试>`：38 通过、0 失败、0 跳过，其中包含 5 项运行监控测试。
- 时间窗切换、61 点窄屏滚动、缺失/零值、大数值、文本边界与纵轴避让、原折线/折叠/轮询行为均已覆盖真实组件。
- 在 `frontend/monitor-react` 执行 `L:/nodejs/node.exe node_modules/vite/bin/vite.js build` 成功；既有三维依赖块超过 500 kB 的警告保留。
- 本机 `http://127.0.0.1:8001/?view=logs` 只读检查：Token 图已显示，2 个真实采样值与接口一致，没有页面异常或业务写入。本次没有主动触发收费生成。
- 已查看桌面、390 像素窄屏与当前本机截图。未重新执行五服务或全部浏览器回归；不声称全项目或生产验收通过。

证据：`.runtime/verification/runtime-token-trend-mobile-20261015.png` 为隔离测试，`runtime-token-trend-live-20261015.png` 为本机实际数据；实际结果只代表检查时刻。

## 备份与恢复

原源码和测试已备份到 `.local-backups/runtime-token-trend-20261015-v1/`，保留相对路径，不含密钥。恢复前核对后续修改，逐个复制对应备份回原路径，再构建前端；不要整体覆盖工作区。本次未改后端、配置、Skill、计费或数据库，无需数据迁移。
