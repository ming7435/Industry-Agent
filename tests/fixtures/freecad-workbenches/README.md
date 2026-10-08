# FreeCAD 工作台浏览器测试数据

这些文件是本项目在 2026-10-08 使用 FreeCAD 1.1.4 实际生成并通过公共 MCP 整链核验的产物，按原始字节复制，没有手工绘制或伪造 STL、SVG、PDF、DXF 或运动帧。产物文件约 144 KB；`proof.json` 保留两个运行的原始完整 manifest，以及最终验收批次结果和实现文件哈希。

浏览器测试直接读取本目录，不需要 `.runtime`、运行中的 FreeCAD 或 MCP 服务；缺少文件会失败，不会跳过。测试使用受控 HTTP 响应适配器，但运行真实 React 工作台、STL 加载器、SVG 图像和 WebGL 运动播放器。

## 来源和验收范围

- 最终公共 MCP 验收批次：`.runtime/verification/freecad-workbenches-integrated/20261008T030613Z-83bd12/summary.json`。通过 `CADAgent.run_freecad` 运行，drawing、assembly、sheet_metal、bim 四类全部 `verified: true`、`status: completed`，自动重试为 0。本目录采用该批次的钣金和装配运行。
- `sheetmetal/` 和 `drawing/` 均来自同一目录 `.runtime/cad-models/FC-cdde60ae17f784b7760fd49e66065daf23744ef3359f8da9a7fbee5dec59c338/`。SheetMetal 0.8.24、NetworkX 3.4.2；输入为宽 80、基板直段 60、翻边直段 30、厚 2、内半径 3 mm，折弯 90°、ANSI K=0.4。真实弯折有两张圆柱面和一条展开折弯线；展开面积、体积、尺寸及 STEP 回读通过。工程图直接引用该折弯模型，第三角投影、比例 1、A3，包含三视图和轴测、不含剖视；SVG 有 72 个图形元素，PDF 有 1 个页面矢量图形流。`proof.json` 的 `sheetmetal` 为该目录原始 `manifest.json`。
- `assembly/` 的 STL 和 25 帧运动 JSON 均来自同一目录 `.runtime/cad-models/FC-e7d183baebf7c476b11f0d789af4f75a3d5891a278300127c46a7c7124cb115e/`。Base 为直径 20、高 20 mm 圆柱；Arm 为 50 × 8 × 4 mm 长方体；Hinge 为 Z 轴转动副，连接点为 Base 的 `[0,0,20]` 与 Arm 的 `[0,0,0]`，0→90°、2 秒。原生 Assembly 求解器状态为 0，首帧静态干涉检查、STEP 两实体回读和服务端零件归属验收通过。`proof.json` 的 `assembly` 为该目录原始 `manifest.json`；未声称运动全过程无碰撞。

双 SVG 测试展示同一钣金运行的折弯工程图和展开图，覆盖两个同格式附件并存的前端契约。浏览器测试仅适配 HTTP 响应的测试运行 ID，结构化参数和验收字段直接读取真实 manifest。固定数据验证浏览器加载、导出链接及运动播放，不替代后续版本的实时内核或服务端整链回归。

## 文件完整性

| 文件 | 字节数 | SHA-256 |
| --- | ---: | --- |
| sheetmetal/model.stl | 13884 | `759fc29756eb8d4017ebb40c69ec96d91da5877fa0992ab24e5544e1e4645cbb` |
| sheetmetal/unfold.svg | 1191 | `a50ddab25729c022a8dd206a301a732dd88b0356227b811c4475a2828c6dc549` |
| sheetmetal/unfold.dxf | 7104 | `3da4b14183c3bcf96d2797137d4584e859faa209f9df3d1d9af186109f4a5c42` |
| drawing/drawing.svg | 28167 | `3bbeb3243d30ca68d9692fec207b0f0caa594b46d5a8266adb82ffeebef53831` |
| drawing/drawing.pdf | 12831 | `20eb32b06222d42f02b887627be25ca3d3c69fade24a8d6118ef8265b1c335b1` |
| assembly/motion.json | 73637 | `cc38dba791e00ae42937c0ec5e2a5801cc1ef47a5b3966d346d58c3a370ec45e` |
| assembly/model.stl | 10484 | `9d9d5527c072b98dc74546bbba089bdb1422ae5ee3a6b51499c944cc308a89bb` |

## 重跑

安装 `frontend/monitor-react` 的项目依赖，并让 Node 能找到 `playwright-core`（或以 `PLAYWRIGHT_MODULE_PATH` 指定其入口）；如未安装 Playwright Chromium，可用 `CHROME_EXECUTABLE` 指定本机 Chrome。项目根执行：

```text
node --test tests/browser/freecad-workspace.test.mjs
```

默认截图输出至 `.runtime/verification/freecad-workbench-browser/`，也可用 `FREECAD_BROWSER_SCREENSHOT_DIR` 指定输出目录。该路径只用于写入截图，不用于读取测试输入。
