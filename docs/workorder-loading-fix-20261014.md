# 工单详情反复加载修复记录

日期：2026-10-14。范围：当前本地项目的工单页面、共享只读缓存及回归测试。未修改后端业务、配置、数据库或设备控制接口。

## 修复结果与原因

1. 原来工单详情版本包含产线 `updated_at`。后台即使只更新观察时间，也使页面取消并重发慢详情；隔离浏览器复现五轮刷新产生6次详情请求，含预读的完整应用产生7次。现在正文版本只由工单编号、修订号和工单更新时间组成，同样场景只请求1次，正文返回后持续保留。
2. 切换现场报警时，旧现场的在途工单目录曾被新现场复用。现在目录缓存显式绑定当前故障身份；旧现场晚回包不覆盖新现场任务。原有失败回归已通过。
3. 真实 `summary=true` 目录不含维修验收和复机结果，不能拿摘要代替权威控制结果。现在产线 `state/generation` 真正变化时，后台只读核对原有详情接口；正文保持显示，观察时间变化不触发重读。在核对完成前显示“正在核对最新复机结果”，不继续展示旧的复机成功。产线再次变化时不打断在途核对，旧投影不落入页面，结束后再核对最新状态。
4. 无关方案变更会取消共享缓存请求。现在区分页面退出/身份变化的取消与共享缓存失效的取消：页面仍有效时3秒后只读重读，退出时清理重试。临时503保留正文、说明原因并重试；401/403清除私有详情。
5. 详情回包必须匹配请求工单与设备，不能把另一设备的维修内容放到所选任务下。

截图中已完成工单的报警700009与当前现场报警700000不同。这是历史任务与当前故障的真实区分，不通过伪造关联、重复派工或恢复已删除方案来消除提示。选中历史工单仍可正常读取其详情。

## 修改文件

- `frontend/monitor-react/src/app/App.jsx`：正文版本、故障作用域目录读取、独立后台控制核对、身份/设备回包校验、共享取消后的安全重读。
- `frontend/monitor-react/src/app/workspaceReads.mjs`：统一导出正文版本函数；页面和预读使用相同版本，预读不等待产线观察结果。
- `frontend/monitor-react/src/app/workspaceReads.test.mjs`：补充不随观察时间反复下载正文的测试。
- `tests/browser/workorder-detail-stability.test.mjs`：新增10项真实组件/完整应用浏览器回归，覆盖慢正文、真实修订、设备归属、两向复机更新、迟到投影、503和共享取消。
- `tests/browser/helpers/center-fixture.mjs`：隔离夹具可显式暴露真实维护变更发布函数，测试实际共享缓存取消链；正常夹具默认不暴露。
- `frontend/monitor/index.html` 和构建生成的 assets：由当前源码正常构建，未手改压缩文件。

原先移除失败任务面板、模型调用去重和其他已有修改均保留。

## 实际验证

| 验证 | 通过 | 失败 | 跳过 |
| --- | ---: | ---: | ---: |
| 工单相关针对性浏览器回归 | 40 | 0 | 0 |
| 前端全部单元测试 | 291 | 0 | 0 |
| 全部浏览器回归 | 316 | 1 | 0 |

先运行复现测试再修改；反复加载、新现场切换、设备错配、复机投影失效和共享取消均取得失败证据后修复。真实工单修订更新是保留的既有行为，没有制造无意义改动。

全量剩余失败：`tests/browser/online-device-dispatch.test.mjs:60`，维修方案从人员等待轮询为已派单时等待文字超时。它在修改前的全量回归和上一任务报告中已有记录，不属于本次工单详情加载修复；没有删除该测试、放宽标准或将其计为通过。此前工单新现场晚回包测试已由本次修复通过。一次高并发针对性运行另有维修按钮等待超时，最终同标准串行40项和全量测试中的该项均通过，原失败日志保留。

实际命令（工作目录为项目根目录；构建除外）：

```powershell
$env:PLAYWRIGHT_MODULE_PATH='C:/Users/12587/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs'
$env:CHROME_EXECUTABLE='C:/Program Files/Google/Chrome/Application/chrome.exe'
L:/nodejs/node.exe --test --test-concurrency=1 tests/browser/workorder-detail-stability.test.mjs tests/browser/workorder-loading.test.mjs tests/browser/page-read-latency.test.mjs tests/browser/workorder-simple-completion.test.mjs tests/browser/workspace-prefetch.test.mjs
$workorderUnitFiles=@(rg --files frontend/monitor-react/src -g '*.test.mjs')
L:/nodejs/node.exe --test @workorderUnitFiles
$workorderBrowserFiles=@(rg --files tests/browser -g '*.test.mjs')
L:/nodejs/node.exe --test --test-concurrency=2 @workorderBrowserFiles
# 在 frontend/monitor-react 下执行
L:/nodejs/node.exe node_modules/vite/bin/vite.js build --emptyOutDir false
```

构建成功，保留既有超过500KB分块警告。未清空输出目录，五个本地设备图纸文件的SHA256与修改前完全一致。

运行中的8001网页已提供新入口 `/assets/index-DIiN77Mw.js`。在真实网页构建产物上用隔离GET适配器执行浏览器验证：18次产线观察读取、1次慢详情读取、0次业务写请求、0个页面脚本错误；正文可见，没有残留“正在加载任务详情”。截图：`.runtime/verification/workorder-loading-fixed-live.png`。这是构建产物的隔离验证，不是使用用户实际账号或真实设备的生产验收。

测试使用实际页面、缓存及请求逻辑，只模拟外部API；未调用收费模型、派工写操作或真实设备。此次没有重启五服务或触发故障工作流。未执行后端全量/现场完整联调，因为没有修改后端；真实账号授权、现场数据和复机验收仍以原业务接口为准。

日志保存在 `.runtime/verification/`：

- `workorder-loading-red-20261014.log`：原始复现。
- `workorder-control-refresh-red-v2-20261014.log`：控制投影回归失败证据。
- `workorder-cache-cancel-red-v2-20261014.log`：共享取消回归失败证据。
- `workorder-loading-final-targeted-v2-20261014.log`：40项最终针对性回归。
- `workorder-loading-final-units-20261014.log`：291项单元测试。
- `workorder-loading-final-browser-full-20261014.log`：317项全量浏览器回归及保留的1项失败。

## 备份与恢复

修改前备份：`.local-backups/workorder-loading-20261014-v1/`，保留相对目录。包括上述两个源码文件、原共享缓存测试、原浏览器夹具和原 `frontend/monitor/index.html`。新浏览器回归和本文是新增文件。

若需要回退，先检查本次以后是否有其他修改，再逐文件将备份恢复到相同相对路径，不能覆盖后来修改。恢复源码后用上述命令重新构建；旧构建assets未删除，也可临时恢复备份入口。无需数据迁移或数据库恢复：本次未修改数据或配置。

用户可在工单页面按 `Ctrl+F5` 加载新前端；不需要重复点击派工或维修确认。
