# CAD 真实实体交互式预览修复结果

日期：2026-10-06。本次只处理生产建模页面的 3D 观察交互，不改变建模结果、人工设计确认或机器控制。

## 修改内容

- `frontend/monitor-react/src/app/production-cad/CadSolidPreview.jsx`：继续读取当前任务真实 STL；增加自动旋转/暂停、等轴/主视/俯视/侧视、放大/缩小、线框、重置视角、全屏。保留左键旋转、滚轮缩放和右键平移。增加真实几何轮廓、观察网格、坐标轴及照明。
- `frontend/monitor-react/src/app/production-cad/productionCad.css`：增加可见工具栏、操作提示及自适应预览/全屏布局。
- `tests/browser/cad-solid-preview.test.mjs`：新增真实浏览器回归，调用当前页面和现有 CAD 读取接口，通过画布像素变化验证交互效果。
- `frontend/monitor/index.html` 和构建目录中的资源：通过现有 Vite 构建生成，没有手工修改打包资产。没有新增前端依赖。

圆柱仍然是原任务生成的圆柱，不用装饰性模型代替零件，也不修改尺寸。网格和坐标轴仅为观察辅助。用户系统设置“减少动态效果”时不默认转动，但可以手动开启。

切换任务时中止旧文件读取并释放动画、控制器、观察器、材质、几何体及渲染器。加载失败时显示原因和“预览暂不可用”，禁用无效交互。手动拖动或切换视角会暂停自动旋转；转动中不再高亮固定视角。

## 测试证据

所有日志保存在 `.runtime/verification/cad-interactive-20261006/`。

| 实际验证 | 通过 | 失败 | 跳过 | 证据 |
| --- | ---: | ---: | ---: | --- |
| 修改前浏览器回归 | 0 | 5 | 0 | browser-red.log，旧版缺少所需交互控件 |
| 第一轮实现浏览器回归 | 5 | 0 | 0 | browser-green.log |
| 审查补充断言后回归 | 2 | 3 | 0 | review-red.log，暴露旋转状态高亮及失败状态标题问题 |
| 状态修正中间回归 | 3 | 2 | 0 | browser-final.log，其中一次任务列表点击超时，另一次同步高亮断言失败；保留失败记录 |
| 最终源码构建后的浏览器回归 | 5 | 0 | 0 | browser-final-2.log，未增加超时、删断言或扩大跳过 |
| 前端既有回归 | 63 | 0 | 0 | frontend-final.log |

浏览器五项验证包括：实际画面自动变化和暂停后稳定；拖动、缩放按钮、四种视角、线框和重置改变真实画面；进入/退出全屏；减少动态效果与手动开启；STL 加载失败的真实错误处理。仅在失败场景模拟 STL 网络失败，没有替换被测组件或生成假几何。复查确认两个状态提示问题已关闭。

构建成功，见 `build-final.log`。现有大于 500 kB 的资源体积警告仍保留，没有通过调高阈值隐藏警告。

### 实际执行命令

前端回归与构建（PowerShell）：

```powershell
Set-Location 'L:/industry_agent/frontend/monitor-react'
$taskTests = @(rg --files src | Where-Object { $_ -match '\.test\.mjs$' })
& L:/nodejs/node.exe --test @taskTests
& L:/nodejs/node.exe node_modules/vite/bin/vite.js build
```

浏览器回归使用本机已经缓存的 Playwright Core 与已经安装的 Chrome，没有下载浏览器或远程项目。换机器时将两个运行时路径替换为对应的已有安装路径，或使用可导入的 `playwright-core`：

```powershell
Set-Location 'L:/industry_agent'
$env:PLAYWRIGHT_MODULE_PATH = 'C:/Users/12587/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs'
$env:CHROME_EXECUTABLE = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
$env:CAD_PREVIEW_SCREENSHOT = 'L:/industry_agent/.runtime/verification/cad-interactive-20261006/interactive-preview.png'
& L:/nodejs/node.exe --test tests/browser/cad-solid-preview.test.mjs
```

需要本机工作台及至少一份已有的真实 STL 任务。测试使用现有 `CAD-0FFAEA3FDBE84E02A73A` 记录，只读取；浏览器阻止所有非 GET 的 API 请求。未创建或确认设计，未调用生产、维修、模型收费接口或设备控制接口。

## 查看、恢复和边界

打开 `http://127.0.0.1:8001/?view=cad`，按 Ctrl+F5 刷新，选择“模型已生成”任务，在“真实实体预览”中使用交互工具。截图：`.runtime/verification/cad-interactive-20261006/interactive-preview.png`。

修改前源码备份位于 `.runtime/backups/20261006-cad-interactive-preview/`，文件哈希及单文件恢复命令见该目录的 `RESTORE.md`。未修改配置、数据库、服务启动方式或后端功能，无数据迁移。

本次没有单独进行移动端触摸、快速连续切换多个任务、滚轮/右键平移的专项自动验收；这些输入仍由现有 OrbitControls 处理。浏览器使用软件 WebGL，不能代表每台现场电脑的 GPU 兼容性或工业生产验收。待补充尺寸或未完成建模的任务仍需按既有流程核实后生成，不会因此绕过人工确认。
