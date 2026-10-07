# 仅保留 BuildCAD MCP 的本地清理计划

> 执行方式：按用户“只保留通过 MCP 调用 BuildCAD”及连续实施要求，在当前本地目录完成；使用 writing-plans、executing-plans、test-driven-development 和 verification-before-completion，不提交或推送。

**目标：** 核实实际生成链数量，只保留 BuildCAD MCP，移除误导性的旧生成流程残留。

**架构：** 前端 → CAD Agent `model_3d` → `production_modeling_skill` → `buildcad_mcp` → BuildCAD。维修图纸/BOM/部件定位仍为独立查询功能，不是另一套生成器。

**技术栈：** 现有 React、FastAPI、LangGraph、MCP、Redis；不引入新依赖。

**依据：** 当前用户请求及 `docs/buildcad-mcp-integration.md` 的实际调用链。

## 约束与复核重点

- 不改 `.env`、数据库、凭据、机器控制或其它任务的改动。
- 旧接口不得变成另一个生成入口；BuildCAD 失败不得本地造图兜底。
- 保留维修工程查询、鉴权、只读回查和幂等保护。
- 先备份再删除明确的旧缓存；历史图纸、旧环境和业务数据不删除。
- 历史报告标明停用，现行操作指南只介绍 BuildCAD。

## 任务 1：核实并清理

- [x] 并行核对前端、后端、工具注册、启动脚本和构建产物：已只有一套生成逻辑。
- [x] 备份待修改文档；旧缓存删除前另行校验路径和对应源码确已不存在。
- [x] 删除两个 CAD 目录下的 12 个孤立旧 `.pyc`，保留当前模块缓存。
- [x] 更新 README、操作指南、现行报告；历史 CAD 报告及原节点设计/计划增加停用标记。
- [x] 运行既有真实 API/节点/Skill/工具回归、Agent 全量、CAD 查询测试和前端测试；不通过源码字符串断言代替功能测试。
- [x] 只读核对本地已运行服务的旧接口返回 404，记录结果及恢复位置。

## 执行判断

预检发现旧生成源码在本轮前就已经删除，因此不制造生产代码改动或人为失败测试。本轮只清理缓存和文档，用既有行为回归验证唯一入口；不声称修复了远端 BuildCAD 的渲染错误。当前源码无需重建/重启，避免干扰其它任务。

完成记录：BuildCAD 150、Agent 全量 1026、前端 121、浏览器 16 项通过；Document-CAD 66 通过、1 项因本机符号链接权限跳过。旧接口三次只读请求均为 404。独立只读复核确认文档符合当前界面、维修查询与图纸未被误删。备份及完整命令见 `docs/buildcad-mcp-integration.md` 最新章节。
