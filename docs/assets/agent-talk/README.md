# 30 分钟讲解稿的架构与效果图

日期：2026-10-03。主文档：[agent-architecture-30-minute-talk.md](L:/industry_agent/docs/agent-architecture-30-minute-talk.md)。

本目录只包含文档插图与本地确定性生成程序，不是新增业务服务。四张图按实际本地代码绘制；没有调用图像生成模型、收费模型、业务数据库或设备控制接口，没有安装新依赖。

## 图稿与依据

| 图稿 | 讲述位置 | 源码依据与边界 |
| --- | --- | --- |
| [总架构 PNG](L:/industry_agent/docs/assets/agent-talk/system-architecture.png) / [SVG](L:/industry_agent/docs/assets/agent-talk/system-architecture.svg) | 第二节 | Runtime 容器、五服务调用边界、RAG Model 客户端；端口为本地标准布局，不是存活证明 |
| [Agent Loop PNG](L:/industry_agent/docs/assets/agent-talk/agent-loop.png) / [SVG](L:/industry_agent/docs/assets/agent-talk/agent-loop.svg) | 第五节 | RuntimeCoordinator、Diagnosis Graph、Knowledge/CAD Graph；部分失败回边省略，不取代完整执行图 |
| [故障闭环 PNG](L:/industry_agent/docs/assets/agent-talk/fault-lifecycle.png) / [SVG](L:/industry_agent/docs/assets/agent-talk/fault-lifecycle.svg) | 第七节 | 自动派单策略、工单迁移、共用恢复规则、虚拟整线控制；不是每次异常都维修，不是 PLC 验收证明 |
| [工作台效果 PNG](L:/industry_agent/docs/assets/agent-talk/workbench-effects.png) / [SVG](L:/industry_agent/docs/assets/agent-talk/workbench-effects.svg) | 查阅附录 | React 工作台与视图转换代码；不是运行截图，未编造设备记录或模型答案 |

四张 PNG 都为 3200 像素宽，适合放大讲解；SVG 保留可编辑精确文本，可导入支持矢量图的软件。PNG 与 SVG 使用同一套几何/标签定义，不需要手工修改打包后的前端 assets。

## 重新生成

使用当前已有 Python、Pillow 和 Windows 微软雅黑字体：

```powershell
& L:/anaconda/python.exe docs/assets/agent-talk/render_figures.py
```

程序：[render_figures.py](L:/industry_agent/docs/assets/agent-talk/render_figures.py)。没有读取 `.env`，没有发起网络请求。字体缺失时明确失败，不悄悄用不能显示中文的字体。

重新运行只覆盖本目录的四对生成文件，不修改业务源码或数据库。需要改图时先改程序中的精确标签与连接，再重新导出；如直接编辑 SVG，之后重新生成会覆盖该编辑，请先另存。

## 验证与限制

2026-10-03 本次运行的前端模块测试结果：24 passed、0 failed、0 skipped。日志：[frontend-tests.log](L:/industry_agent/.runtime/verification/talk-visuals-20261003/frontend-tests.log)。这是实际函数测试，覆盖数据与展示转换，不是在线 UI 联调。

Agent 图稿相关专项结果：42 passed、0 failed、0 skipped。日志：[agent-source-tests.log](L:/industry_agent/.runtime/verification/talk-visuals-20261003/agent-source-tests.log)。复用前一轮隔离脚本的原样副本，禁用 dotenv、外部模型密钥、MySQL、设备控制和真实外部地址，运行真实函数 / Graph 测试。

```powershell
powershell -NoProfile -Command "& ./.runtime/verification/talk-visuals-20261003/run-agent-checks.ps1 -Log agent-source-tests.log -Targets @('services/agent-service/tests/test_agent_entry_contracts.py', 'services/agent-service/tests/test_graph_slimming_contract.py', 'services/agent-service/tests/test_quality_data_gate.py', 'services/agent-service/tests/test_recovery_freshness.py')"
```

生成程序检查全部图元坐标和文字整体边界，随后用 PNG 实际图像逐张检查排版。文档校验还检查四张图片引用、可点击本地文件、SVG XML、输出尺寸及既有讲稿备份摘要。

文档和图稿校验结果全部通过：[document-validation.log](L:/industry_agent/.runtime/verification/talk-visuals-20261003/document-validation.log)。校验命令：

```powershell
& L:/anaconda/python.exe .runtime/verification/talk-visuals-20261003/verify-talk.py
```

本次检查时 8001、8010、8020、8030、8040、8050、4529 均没有本地监听；没有启动服务以伪造“当前效果”。未执行业务 PDF 生成/下载、数据库写入、真实供应商调用、停机或启动。主文档中的 493 项 Agent、6 项相关 Backend、12 项契约测试是上一轮优化的回归记录，与本次前端 24 项和 Agent 专项 42 项区分说明，不能合并成新的生产验收数量。

## 备份和恢复

修改前备份：[原讲稿](L:/industry_agent/.runtime/backups/agent-talk-visuals-20261003/agent-architecture-30-minute-talk.md)。SHA256：`B837580E26B674A6FA040BEB1B28B8306DC6EDF57955073FE696B2473D399BB6`。

恢复命令仅覆盖这份文档，不回滚其他本地修改：

```powershell
Copy-Item -LiteralPath 'L:/industry_agent/.runtime/backups/agent-talk-visuals-20261003/agent-architecture-30-minute-talk.md' -Destination 'L:/industry_agent/docs/agent-architecture-30-minute-talk.md'
```

本次未删除任何业务内容。新增插图与生成程序可以保留，不需要删除业务数据库、工单、报告、文档索引或数据卷。
