# CAD 加工准备与虚拟生产闭环

日期：2026-10-05。用户要求连续实施，不重复询问是否继续。

## 目标与事实

在当前 CAD 建模后加入工艺参数、刀路、仿真、专用后处理、人工放行、虚拟工厂接收及运行状态。维修方案/工单返回缺陷单独修复，不取消诊断、证据、审批、人员和恢复校验。

实际虚拟工厂源码在 `C:/Users/12587/Desktop/Factory`；现有服务只有遥测、场景和启停，没有程序接收接口。新增明确的虚拟程序接口及持久化模拟执行器，不假装存在真实机床接口，不将启动命令当成加工命令。

## 支持与边界

首个加工器支持 Z 轴同心圆柱和同长同心通孔套筒。设计必须来自已校验、已确认的参数化实体，单位统一为毫米。导入后无可确认工艺特征的 STEP、偏心孔、螺纹、曲面和其他形状仍可建模下载，但不能获得假的加工程序。

毛坯直径/长度、夹持长度、刀具号、钻头直径（有孔时）、径向切深、退刀距离、转速、每转进给和公差由用户明确填写；不推测工业设备安全阈值。仿真检查计算几何、刀路尺寸、有限坐标、切削顺序和版本一致性，不声称验证完整刀具碰撞或真实加工质量。

后处理名称 `virtual-trak-turning-v1`。输出的是此模拟器解析的虚拟 NC，不是经真实 TRAK 控制器验收的加工文件；文件、界面、API 均保留仅虚拟用途标记。

## 流程与状态

已确认设计 → 输入工艺 → 生成刀路并进行几何仿真 → 保存不可变加工包与摘要 → 人工确认该摘要 → 接收加工包 → 明确启动此虚拟生产任务 → 查询运行/暂停/完成。

设计确认不触发生产。生产确认必须单独勾选仅虚拟用途并提交当前加工包摘要。故障/停线时不允许启动，执行中发现任一线路设备故障则暂停；恢复后必须人工再次放行，不自动启动。模拟完成不写成质检通过。

网络超时保留 `uncertain`，通过命令身份/任务 ID 只读对账；不盲目重复接收或启动。幂等身份绑定设计、加工参数、调用者、程序摘要，不同参数冲突。工厂重启将运行任务中断保留，不自动执行。

## 接口契约

- CAD：`POST /api/cad/designs/{id}/manufacturing`、`GET /api/cad/designs/{id}/manufacturing`、`GET /api/cad/designs/{id}/manufacturing/{program_id}`。
- CAD：`POST .../{program_id}/dispatch`，只允许明确人工确认；`GET .../{program_id}/production`，只读查询/对账；`GET .../{program_id}/files/{kind}`，打开/下载虚拟 NC、刀路 JSON、加工包。
- 工厂：`GET /api/production/capabilities`；`POST /api/production/jobs`；`GET /api/production/jobs/by-command/{command_id}`；`GET /api/production/jobs/{job_id}`；`POST /api/production/jobs/{job_id}/start`。

加工包字段：`schema_version=virtual-turning-v1`、`simulation_only=true`、`postprocessor=virtual-trak-turning-v1`、`device_id`、`design_id`、`design_digest`、`material`、`setup`、`profile`、`toolpath`、`simulation`、`nc_program`。`profile` 包含 `outer_diameter_mm`、`inner_diameter_mm`、`length_mm`。`toolpath` 是 `motion=rapid/cut`、`operation=turn/drill`、`x_mm`（直径坐标）、`z_mm`（前端面零点、切削为负）、`tool_id` 的有序点。仿真包含 `passed`、`duration_seconds`、`expected_volume_mm3`、`simulated_volume_mm3`、`checks`；不能只检查 `passed=true`。

后处理生成函数由 CAD Agent 内部模块提供，固定白名单，不能执行上传代码。外部工厂独立校验加工包、NC、尺寸及刀路，不依赖调用方自称通过。

## 验证与恢复

先编写失败测试，运行实际生成器/API/模拟执行器，外部 HTTP 契约测试使用临时端口、临时目录和新的 VirtualFactory，不修改正在运行的产线。实际验证顺序：针对性 → Agent 与工厂测试 → 前端测试/构建 → 隔离跨服务契约。测试不调用收费模型、生产数据库或真实设备。

源码改动前逐文件备份并记录摘要；配置与密钥不复制、不输出。保留既有数据，最终报告记录真实结果、未覆盖加工类型、设备验收边界和恢复方式。
