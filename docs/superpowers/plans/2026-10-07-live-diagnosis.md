# 当前故障诊断及时返回修复计划

> 本次由当前代理在原工作目录连续实施；用户已要求直接修改，不另行确认。实现不分派子任务，收尾按审查技能进行一次独立只读复核。

**目标：** 当前报警使用设备所属工厂定义；诊断完成即展示，不等待维修派工闭环；模型连接异常可定位且不泄密。

**架构：** 保留五服务。正式事件结果仍存 MySQL，阶段性进度存 Redis TTL；只读查询不触发执行或派工。

**技术：** Python、FastAPI、Redis、现有 Runtime、React/Vite、pytest 与 Node 原生测试。

**需求依据：** 用户针对 700004 无诊断、模型 503、旧 Mock 字典及整流程等待问题要求修改。

## 约束与核查重点

- 不修改配置、模型供应商或密钥，不清理业务数据，不控制真实设备。
- 定义必须匹配设备和报警编号，指定设备不退回其他设备或 Mock。
- 模型请求遵守当前代理设置；不为恢复连接而绕过代理、关闭 TLS 验证或无限重试。
- 进度不等于最终完成；低置信度和模型失败仍显示真实状态，不降低派工门禁。
- 事件修订、租户、设备隔离；旧故障回调不能覆盖新故障。

## 任务与验证

### 1. 设备报警定义

文件：`app/tools/diagnosis/get_alarm_definition.py`、`app/tools/registry.py`、`app/runtime/container.py`，路径前缀为 `services/agent-service/`。

- [x] 真实回环工厂测试：定义匹配、设备隔离、服务失败不回 Mock、未知编号不编造。
- [x] 从当前设备 `/api/snapshot` 的结构化 scenarios 读取精确编号与设备归属；名称和严重度保留来源。
- [x] 工具从可信 Runtime 上下文取得设备 ID，不信任模型擅自切换设备。

### 2. 模型连接

文件：`services/model-service/app/providers/gateway.py` 与供应商契约测试。

- [x] 复现长运行 HTTP 客户端使用过期系统代理；失败信息区分连接拒绝、超时、DNS、TLS，不输出异常正文或凭据。
- [x] 请求使用当前代理构造 HTTP 客户端，保留有界重试和 TLS 校验。
- [x] 跑 Model 全套隔离回归；真实验证沿用 Monitor 正常诊断流，不额外使用收费生成作健康检查。

### 3. 阶段性诊断展示

文件：Agent `event_store.py`、`api/server.py`、`runtime/coordinator.py`、`monitor_web_server.py`，前端 `diagnosisView.mjs`。

- [x] 真实事件 API 在后续处理未结束时可读到同事件诊断；不同设备/修订/租户查不到。
- [x] Coordinator 发布诊断阶段输出，临时存 Redis，最终仍以 MySQL 结果为准。
- [x] Monitor 一次 POST，与只读 GET 并行；阶段输出及时更新，超时不覆盖已有正文、不重复提交。
- [x] 前端区分“诊断已返回，后续流程仍在处理”和最终阻塞，失败与降级不得隐藏。
- [x] 针对性回归、Agent/Model 全量、前端全量、源码构建、无业务写入的浏览器验证。

实际结果和剩余外部限制见 `docs/live-diagnosis-fix-report.md`；连续执行记录见 `.runtime/verification/live-diagnosis-progress.md`。保留本地源码与备份，不合并、推送或清理用户工作目录。

## 备份与交付

源码与旧前端已备份到 `.runtime/backups/diagnosis-live-20261007`，不含配置和密钥。恢复前停止应用并备份后续改动，再按原相对路径复制回备份中的源文件并从源码构建前端。报告记录本次实际验证与仍受阻项，不把隔离测试写成生产验收。
