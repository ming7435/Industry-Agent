# 虚拟 CAD 生产与维修返回实施计划

> 执行者使用 Superpowers 的逐项执行、先测试后实现和完成前验证流程；用户已要求直接连续实施，不重复请求阶段批准。不提交 Git、不创建新工作树，保留本地文件。

**目标：** 接通受限但真实执行的虚拟加工闭环，并恢复维修方案的可见性与工单失败原因。

**架构：** CAD Agent 保存确认过的设计和独立加工包；本地工厂独立接收及模拟程序。维修修复与 CAD 分离。前端上下排版，不重做其他页面。

**技术：** Python/FastAPI、现有 CadQuery、标准库 HTTP/文件事务、React/Three.js。

**设计：** `docs/superpowers/specs/2026-10-05-virtual-cad-production-design.md`。

## 全局约束

- 不改生产配置，不输出密钥，不调用真实控制、收费模型和生产数据库。
- 不绕过证据、诊断置信度、审批、维修人员及设备恢复校验。
- 仿真专用 NC 不标记真实机床可执行；未支持形状明确拒绝，不降级为默认圆柱。
- 超时状态不确定，只读对账，不自动重试写入。

## 重点审查

- 加工摘要、刀路与实体文件被修改后必须拒绝放行。
- 故障、停线和重启后不得自动继续模拟程序。
- 相同命令参数改变必须冲突，不能重复生产。
- 独立方案必须保留未派工原因，不以工单缺失假称没有方案。
- 上传不支持的几何或缺少工艺字段不得产生成功加工包。

## 任务 1：维修返回

文件：维修相关 API/展示辅助及对应测试；不修改 CAD 模块。

- [x] 复现：真实持久化方案被关联工单和登录请求隐藏；错误 detail 丢失。
- [x] 测试先失败，再实现只读方案列表、实时方案合并和原因显示；补齐实际大历史库读取超时修复与加载状态。
- [x] 回归 Agent/前端及代理鉴权，报告外部 CAD/库存/模型依赖，不降低派工门禁。

## 任务 2：虚拟刀路与后处理

文件：`agents/cad/turning_program.py`、`tests/test_cad_turning_program.py`。

接口：`build_turning_program(design: Mapping, setup: Mapping) -> dict`，输出遵循设计加工包契约，不负责存储或 HTTP。

- [x] 测试圆柱/同心通孔尺寸、单位、毛坯与夹持、刀具、异常参数、未支持形状和数值限制。
- [x] 运行失败，再实现确定性刀路、仿真和固定虚拟后处理。
- [x] 真实 CAD 体积与输出比对；不能仅比较源码字符串。

## 任务 3：虚拟工厂生产接口

文件：工厂 `simulator/production.py`、`server.py` 和工厂测试；备份 server.py。

接口：设计文档中的 `/api/production/*`；`ProductionStore(root, factory)` 提供 `capabilities()`、`submit(command_id, program)`、`get(job_id)`、`by_command(command_id)`、`start(job_id, digest, operator)`、`tick(seconds)`。

- [x] 测试真实临时工厂上的接收、执行、故障暂停、人工恢复、幂等冲突、重启中断、恶意程序拒绝。
- [x] 失败后实现持久化执行器和窄 HTTP 路由，不调用 control_device。
- [x] 所有工厂测试回归。

## 任务 4：CAD API 与界面

文件：`manufacturing_schemas.py`、`manufacturing_service.py`、`manufacturing_client.py`、现有 `modeling_api.py`、`production-cad/` 页面与辅助/测试。

- [x] 测试确认门禁、版本绑定、参数变更幂等、文件摘要、鉴权、HTTP 超时仅对账。
- [x] 失败后实现加工包生成、下载、放行、实际工厂回执与状态查询。
- [x] 界面提供明确工艺输入、刀路预览、下载和独立生产确认；逐任务显示实际调用输入输出。
- [x] 运行针对性与整套 Agent/前端测试，按源码构建。

## 任务 5：整体验证与交付

- [x] 隔离跨服务测试，调用真实 CAD → HTTP → 真正模拟执行器，核对完成/故障暂停；追加实际工作台 HTTP 文件打开/下载/手工确认与执行验收。
- [x] 进行独立最终审查，重要问题补失败测试修复并回归。
- [x] 生成交付报告、测试日志、备份与恢复清单。按用户要求运行本地服务，但不由测试启动正式加工任务。

交付记录：`docs/cad-production-and-repair-delivery.md`；操作说明：`docs/cad-modeling-operation-guide.md`。Agent 652、Backend 35、RAG 48、Document-CAD 8、Model 5、工厂 68、前端 51、跨服务 5 通过。没有把专项叠加为全量，也没有把隔离测试标记为生产验收。现场 CAD/BOM MySQL、正式库存和未探测模型能力仍按报告记录受阻。
