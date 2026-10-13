# 服务异常兜底实施计划

> 本会话连续本地实施，使用 executing-plans 与测试驱动；按用户此前要求不逐任务等待“继续”。不提交、部署或覆盖其它工作。

**目标：** 失败记录只读保留，关联异常核查待办与人工反馈报告。

**架构：** 独立 ServiceExceptionCases 复用原持久化，Recovery 终态收集；公开 API 与前端仅运行记录/反馈操作，不续跑原任务。

**技术：** Python、FastAPI、既有 MySQL JSON/CAS、React、pytest、Playwright。

**设计：** ../specs/2026-10-13-service-exception-fallback-design.md

## 全局约束

- 保留所有失败记录、审批、工具日志和已完成结果。
- 异常已人工接管不等于维修、质检或生产完成，不改原门禁。
- 不使用模型补造业务数据；不调用设备或真实收费接口。
- 同一任务幂等；原操作结果未知不能重试执行。
- 内部旧数据兼容对账保留，但公开 resume 入口移除。

## 复核重点

1. 维修方案缺失仍能关联已知故障，不能虚构维修工单或自动启动。
2. 未知副作用与正常等待审批不能当作可重试异常。
3. 未登录、监督人、其它维修人员与跨源写入不能处理私有记录。
4. 响应丢失、重复反馈、参数变化或多个标签页不能重复关闭或重放业务。
5. 原 Backend 报告不可读不阻塞独立异常报告；持久化失败不能显示成功。

## 任务一：记录与受控人工闭环

新增 app/runtime/service_exceptions.py；修改 runtime/recovery.py。

接口：ServiceExceptionCases.record(record)、list/get、handle(case_id,feedback,actor,request_id)、report(case_id)。只保存抽取事实，CAS 保护处理反馈。

- [x] 用新 test_service_exception_cases.py 复现缺少兜底关联与故障、人审、幂等、敏感数据和状态隔离。
- [x] 实现 Case 持久化与 Recovery 终态收集及旧失败记录回填。
- [x] 运行记录相关回归，保持原 checkpoint 状态和未知副作用语义。

## 任务二：只读失败接口与异常报告

修改 api/task_recovery.py；新增 api/service_exceptions.py；修改 api/server.py。

消费任务一 Case，提供受权限保护的列表、反馈、报告；EXR 读取接入既有 PDF 工具，不依赖原失败报告服务。

- [x] 先验证旧 resume 不得调用执行器，原列表仍可读；新增严格身份、CSRF、反馈、报告/PDF 测试。
- [x] 移除公开续跑接口，挂载 Case 路由和真实报告读取。
- [x] 运行 API/工单/报告相关回归。

## 任务三：相关中心展示与交付

修改 TaskRecoveryPanel.jsx/taskRecovery.mjs；新增 ServiceExceptionPanel.jsx，App.jsx 挂载相关业务入口。

- [x] 浏览器复现旧续跑按钮仍出现、无关联故障/反馈/报告，以及跨账号/迟到响应问题。
- [x] 只读失败列表；展示异常原因与故障，反馈后查看异常报告及 PDF。
- [ ] 针对性→Agent 全量→前端单元/浏览器→隔离构建，报告测试失败与未执行项。

## 执行账本

Pre-flight：记录模块接口提供 Case，API 消费相同 Case，前端字段以 API 实际返回为准。

Ruling：业务闭环定义为异常记录→人工接管反馈→异常处理报告，不伪称原故障已修复；保留旧内部对账但删除公开续跑，以保留既有审批/历史数据。若用户需要无方案实际拆修或自动复机，须另外提供受控维修依据，不能本轮推断。

审查补充：独立质检、报告、CAD、经验检索和模拟检测不都经过主流程断点。最小扩展是在这些入口的最终服务失败处记录同一类事实，不接管原业务、不捕获内部重试；相关源文件先增量备份。政策/权限拒绝排除，业务依据不足保留核查；质检尺寸不合格不等同于服务故障。同步补真实入口回归。
