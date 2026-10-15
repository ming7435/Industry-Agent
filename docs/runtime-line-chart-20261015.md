# 运行监控折线图修改说明

日期：2026-10-15。仅修改现有日志系统的“每分钟模型调用量”展示，不更改后端指标、模型调用、统计口径或业务数据。

## 行为与文件

- `frontend/monitor-react/src/app/RuntimeMonitor.jsx`：柱状图改为折线图，各采样点直接标注实际调用次数；保留错误提示，以空心点区分含错误的分钟。
- 按真实时间间隔定位，不使用平滑曲线或虚构数据。零值保留，缺失值不补零、不跨缺项连线；单点和空采样有独立处理。
- `frontend/monitor-react/src/app/runtimeMonitor.css`：折线、坐标和数值样式；数据密集时仅图表内部横向滚动，不撑宽页面，不缩小字体隐藏数值。
- `tests/browser/runtime-monitor.test.mjs`：实际浏览器渲染回归，覆盖数值、时间间隔、错误提示、61 点窄屏滚动、零值、缺项和原有轮询/折叠行为。仅替换 API 边界，不替换被测组件。
- `frontend/monitor/`：通过 Vite 从当前源码重新构建，未手工修改打包产物。

## 验证

测试先运行失败：旧柱图下 3 项失败、1 项通过；随后实现折线与数值标注。

- 前端全部单元测试：`L:/nodejs/node.exe --test <frontend/monitor-react/src 下全部 *.test.mjs>`，295 通过、0 失败、0 跳过。
- 日志相关 12 个文件的浏览器回归：`L:/nodejs/node.exe --test --test-concurrency=2 <受影响日志测试>`，37 通过、0 失败、0 跳过；其中包含本文件的 4 项监控回归。
- 前端构建：在 `frontend/monitor-react` 执行 `L:/nodejs/node.exe node_modules/vite/bin/vite.js build`，成功；保留既有三维依赖块超过 500 kB 的警告。
- 已查看桌面及 390 像素窄屏隔离测试截图，数值清晰，页面无横向溢出；密集点在图表内部滚动。
- 当前本机页面只读检查成功，无页面异常和写请求；检查时最近 15 分钟无模型调用，真实页面显示空状态，没有为截图人为触发收费调用。

本次没有重新执行五服务全量或全部浏览器测试，不将局部通过写成全项目通过。此前全量问题见 `docs/runtime-monitor-20261015.md`，本次不修改其失败基线。

## 备份与恢复

修改前备份：`.local-backups/runtime-line-chart-20261015-v1/`，含上述两个源码和原浏览器测试，不包含配置或密钥。需要撤回时，先核对是否有后续修改，再将备份中的对应文件逐个复制回原位置，然后重新构建前端。不要整体覆盖工作区，也无需迁移或删除数据库。

截图：`.runtime/verification/runtime-monitor-desktop-20261015.png`、`runtime-line-chart-mobile-20261015.png` 为隔离测试；`runtime-line-chart-live-20261015.png` 为本机真实空状态。
