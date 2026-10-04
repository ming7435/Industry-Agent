# CAD Agent 生产前建模实施计划

> 执行方式：用户要求开始修改代码，在当前会话连续实施。使用 executing-plans 与 TDD；不自动提交、部署或创建其他工作树。

目标：在 CAD Agent 与前端范围内实现需求/图纸输入、真实实体建模、校验、查看和下载，不接入机器下发。

架构：CAD Agent 内增加结构化几何解释、隔离 CAD 工作进程和本地版本化任务存储。Agent API 只挂载 CAD 专用路由；前端增加独立页面和实体预览组件。Document-CAD、Backend、RAG、Model、数据库、根配置及设备控制不修改。

技术：现有 FastAPI/Pydantic、CadQuery 2.8.0（项目内独立环境）、现有 PyMuPDF、React/Three.js。

设计依据：前述生产建模设计，以及用户随后确认的“仅 CAD Agent 相关代码和前端，其他先不动”。后者优先，覆盖设计文档中原拟修改 Document-CAD 与数据库的内容。

## 全局约束

- 修改前逐文件备份，保留已有改动；源码编辑使用 apply_patch。
- 只增加 CAD 专用模块和 API 挂载，不改动其他业务规则。
- 缺失尺寸、非法几何、未知操作不能返回默认实体或成功状态。
- 不执行模型或上传文件中的脚本；原始资料仅作为数据。
- 模型调用使用现有 ModelServiceClient，测试使用隔离响应，不连接收费模型。
- 模型文件存储在项目 .runtime/cad-designs，测试显式使用临时目录；不使用生产数据库。
- 前端构建来自源码，不手改打包文件；保留旧工单定位。

## 重点复核

1. 图片/PDF 缺少尺寸时保留上传资料并要求补充，而不是生成猜测实体。
2. 确认版本摘要后修改参数不能保留确认状态。
3. 超时和并发提交不产生重复任务或半成品下载。
4. 单位转换与 STEP 回读的尺寸、实体数量必须一致。
5. 文件名、下载路径、鉴权与 SVG 内容不能导致越权或代码执行。

## 任务 1：CAD 专用 API 与输入契约

文件：新增 agents/cad/modeling_schemas.py、modeling_api.py；server.py 只挂载路由；新增 tests/test_cad_modeling_api.py。

接口：POST /api/cad/designs、POST /api/cad/designs/import、GET /api/cad/designs、GET /api/cad/designs/{id}、POST revisions/confirm、GET artifacts。

- [x] 先写测试：创建任务返回任务编号，未知操作/非法尺寸拒绝，上传路径拒绝，认证失败拒绝。
- [x] 用 pytest-agent.ini 运行，确认新入口现有代码返回 404。
- [x] 实现结构化单位、几何操作、上传与任务输入，沿用写入令牌边界。
- [x] 真实调用 API 回归，错误响应不含内部路径或密钥。

## 任务 2：实体、图纸与隔离工作进程

文件：新增 agents/cad/modeling_engine.py、modeling_worker.py、modeling_drawings.py、requirements-modeling.txt。

接口：CADKernel.build(spec, output_dir, import_path=None) 返回校验、输出清单与实际几何数据。固定程序解释白名单操作，不 eval/exec。

- [x] 先写真实几何测试：带通孔实体、组合台阶、单位转换、STEP 回读、无效实体、未知操作。
- [x] 验证现有代码没有建模入口，测试失败。
- [x] 隔离环境安装 CadQuery；工作进程生成 STEP、STL、SVG/DXF 与参数文件，检查有效实体及尺寸。
- [x] 根据实际视图生成中文 PDF，输出路径只来自任务目录。
- [x] 运行真实 CAD 测试，不跳过几何验证来报告完成。

## 任务 3：CAD Agent 任务与上传闭环

文件：新增 agents/cad/modeling_service.py、modeling_analysis.py；CADAgent 增加建模入口；新增 tests/test_cad_modeling_service.py。

接口：submit(request, idempotency_key)、get(id)、revise(id, request)、confirm(id, digest)、artifact(id, artifact_id)；通过有界后台队列执行并记录输入输出。

- [x] 先补幂等冲突、超时中断、文件一致性、版本重置、缺失输入与损坏导入测试。
- [x] 实现原子 JSON 文件记录与版本关联，队列满明确拒绝，状态不伪造。
- [x] 复用模型服务解析文字/PDF/图片；STEP 真正导入实体，DXF 轮廓必须有三维约束。
- [x] 运行针对性测试、Agent 全套回归及现有 CAD 契约。

## 任务 4：前端页面与回归交付

文件：新增 app/production-cad/ 独立组件、状态与 API 辅助函数、CSS、Node 测试；App.jsx 和 WorkbenchShell.jsx 只连接入口。

接口：页面请求上述 CAD 专用 API，STL 预览由已生成的真实实体文件加载，不用前端虚构几何。

- [x] 先写 Node 测试：状态/文件路径/上传限制/无模型时不显示成功/版本提交身份。
- [x] 实现文字、结构化参数与图纸上传，缺失项、真实校验、模型与文件上下排版。
- [x] 验证 Node 测试、前端生产构建与浏览器交互；只运行隔离 CAD 测试服务，不控制工厂。
- [x] 记录实际测试数量、功能边界、依赖与备份恢复方法。

结果：531 项 Agent、30 项 Node、8 组浏览器验证通过；未执行真实收费模型和设备联调。最终审查发现项均有失败复现与修复回归；复杂模型提取参数须先人工核对。详见 docs/production-cad-modeling-report.md。
