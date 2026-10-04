# Agent 执行入口继续优化报告

日期：2026-10-03。范围：当前本地 `L:/industry_agent`。本轮承接工具/Skill 优化，完成上一轮延后的 Diagnosis 旧工具名 schema 选择，并修复执行日志的 Skill 归属回退。没有继续压缩业务节点或合并业务状态。

## 实际修改

- [tool_policy.py](L:/industry_agent/services/agent-service/app/agents/diagnosis/tool_policy.py)：`tool_schemas_for` 对支持显式范围的提供者传递原名白名单，使七个兼容查询可以准确声明。仍二次按原名过滤，不授权推荐名。旧式零参数适配器仍支持；调用前仅检查接口形状，提供者内部 TypeError 原样传播，不重复调用。
- [base.py](L:/industry_agent/services/agent-service/app/agents/base.py)：`trace_skill_node` 明确区分未声明 active_skills 和显式空/未知选择；显式选择无结果不再自动标为默认 Skill。合法旧别名映射规范名称，原请求名、输入输出字段摘要、任务/Trace 身份、异常和真实操作记录保留。
- 新增 [test_agent_entry_contracts.py](L:/industry_agent/services/agent-service/tests/test_agent_entry_contracts.py)：22 项真实 Registry、日志包装器和 Report Graph 回归；旧/新适配器只作为边界形状测试，不替换被测权限和映射逻辑。
- 新增 [30 分钟中文讲解稿](L:/industry_agent/docs/agent-architecture-30-minute-talk.md)：11 段时间表、完整口播、两次短代码导览、12 个问答备页及本地源码链接。正文中文字符约 7,800（含表格）；应按预算计时排练，不承诺不同语速都精确 30 分钟。

日志修复不是删除日志，也不是撤销实际操作权限。mapped=false 仅代表当前声明与步骤无法匹配；尚未选择 Skill 的准备阶段可以未映射，后续真实选择会记录有效归属。授权仍由原 Guard/Policy 判断。

## 数量和功能边界

九个 Agent、51 个领域图节点、三个领域内部循环、27 个 Markdown Skill、58 个默认模型工具候选、66 个执行入口不变。五服务架构、维修必要性、诊断置信度、审批、工单迁移、恢复验收、质检和设备控制规则未改。

没有增加缓存或重试策略，没有删文件/业务数据，没有新依赖，没有数据库或生产配置迁移。前一轮的本地未提交改动全部保留。

## 测试记录

隔离运行器：`.runtime/verification/agent-entry-20261003/run-tests.ps1`。仅影响测试子进程：禁用 dotenv、清除模型密钥和业务服务连接，停用 MySQL、工厂控制和 OTEL 导出，采用现有临时数据库配置。

| 测试 | 通过 | 失败 | 跳过 | 日志 |
| --- | --- | --- | --- | --- |
| 修改前 Agent 全量 | 471 | 0 | 0 | baseline.log |
| 新增回归 RED | 8 | 14 | 0 | entry-red-confirmed.log |
| 新增回归 GREEN | 22 | 0 | 0 | entry-green.log |
| 修改后 Agent 全量 | 493 | 0 | 0 | agent-suite.log |
| 跨服务契约 | 12 | 0 | 0 | contracts.log |
| 相关 Backend | 6 | 0 | 0 | backend.log |
| 独立审查专项及契约 | 34 | 0 | 0 | review-tests.log |
| 审查后 Agent 全量 | 493 | 0 | 0 | final-agent.log |
| 审查后跨服务契约 | 12 | 0 | 0 | final-contracts.log |
| 审查后相关 Backend | 6 | 0 | 0 | final-backend.log |

实际命令：

```powershell
powershell -NoProfile -File .runtime/verification/agent-entry-20261003/run-tests.ps1 -Log baseline.log
powershell -NoProfile -Command "& ./.runtime/verification/agent-entry-20261003/run-tests.ps1 -Log entry-red-confirmed.log -Targets @('services/agent-service/tests/test_agent_entry_contracts.py')"
powershell -NoProfile -Command "& ./.runtime/verification/agent-entry-20261003/run-tests.ps1 -Log entry-green.log -Targets @('services/agent-service/tests/test_agent_entry_contracts.py')"
powershell -NoProfile -File .runtime/verification/agent-entry-20261003/run-tests.ps1 -Log agent-suite.log
powershell -NoProfile -Command "& ./.runtime/verification/agent-entry-20261003/run-tests.ps1 -Log contracts.log -Targets @('services/agent-service/tests/test_agent_contract.py','services/agent-service/tests/test_shared_contracts.py','services/agent-service/tests/test_quality_backend_contract.py','tests/integration/test_runtime_rag_cad_contract.py')"
powershell -NoProfile -Command "& ./.runtime/verification/agent-entry-20261003/run-tests.ps1 -Config pytest-backend.ini -Log backend.log -Targets @('services/backend-service/tests/test_team_dispatch.py','services/backend-service/tests/test_team_repair_confirmation.py')"
powershell -NoProfile -File .runtime/verification/agent-entry-20261003/run-tests.ps1 -Log final-agent.log
powershell -NoProfile -Command "& ./.runtime/verification/agent-entry-20261003/run-tests.ps1 -Log final-contracts.log -Targets @('services/agent-service/tests/test_agent_contract.py','services/agent-service/tests/test_shared_contracts.py','services/agent-service/tests/test_quality_backend_contract.py','tests/integration/test_runtime_rag_cad_contract.py')"
powershell -NoProfile -Command "& ./.runtime/verification/agent-entry-20261003/run-tests.ps1 -Config pytest-backend.ini -Log final-backend.log -Targets @('services/backend-service/tests/test_team_dispatch.py','services/backend-service/tests/test_team_repair_confirmation.py')"
```

首次 RED 的 Report 图测试把任务身份放在非状态声明的顶层字段，导致日志过滤不到结果；先改成真实 request 字段后再观察预期行为失败，entry-red.log 保留。这不是产品修复或跳过测试。没有删除失败测试、替换真实被测方法或降低校验。

统计存在重叠，不能合计为独立覆盖数。没有执行其他四服务的全量测试、在线五服务联调、真实数据库/PLC、收费模型或性能基准；本轮离线通过不是生产验收。

## 备份与恢复

源码修改前的两份文件位于 `.runtime/backups/agent-entry-optimization-20261003/`，manifest.md 记录相对路径与 SHA256。备份是本轮开始时的本地版本，包含前一轮修改，已核对，不是远程覆盖版本。

恢复时先保存后续改动，再逐文件比较并复制同名备份。不要整目录覆盖、git reset/checkout 或恢复生产配置。新增测试和两份文档单独核对；数据库和业务记录不需恢复。

## 讲解稿的事实边界

讲稿明确区分默认配置与实际可达性、模型调用与 Agent 循环、工具声明与授权、日志字段摘要与完整返回体、产品质检与维修验收、虚拟工厂与真实 PLC。明确标注本地零件演示夹具和生产适配器/验收标准仍需验收，不把现有状态门禁说成已经完美质检。

## 最终检查

一次 fresh-context 独立只读审查完成：0 Critical、0 Important，无需要整改的新 Minor。审查复跑 22 项新增回归和 12 项契约，34 passed；作者收尾复跑 Agent 493、契约 12、相关 Backend 6，全部通过且无跳过。没有安排第二次审查或新增无意义重构。

`L:/anaconda/python.exe -m compileall -q services/agent-service/app services/agent-service/tests` 与 `git diff --check` exit 0；两份备份摘要一致，讲稿全部源码链接存在。Git 只提示 Windows LF/CRLF 转换，不是测试失败。

桌面原生文件面板打开尝试返回 Invalid app tool request（两种 Windows 路径形式均失败），未声称自动打开成功。文档已实际保存，交付可点击本地文件链接；此 UI 限制不影响源码或回归结果。

审查未判定的边界及处置：

- 真实数据库、付费模型和五服务在线联调：保留隔离边界，不声称实际可用。
- 真实 PLC、现场互锁、检测仪器来源和工业验收标准：不在本轮控制授权内，讲稿明确需单独验收。
- 在线并发恢复、长期稳定性、延迟和费用收益：没有实验，不作性能或安全验收结论。
- 任意第三方/不可反射适配器：仓库无实际实例，仅承诺已测试的 Registry 和新旧接口形状，不宣称覆盖所有扩展接口。
- 前一轮所有未提交差异：两份本轮备份是审查起点，不重复算作本轮改动；此前报告作为历史记录保留。
- 演讲者是否都恰好讲满 30 分钟：只交付对应结构和篇幅，实际计时需要排练。
- 历史节点和 Skill 数量演变：依据已有本地交付记录说明，未重放历史修改；本轮数量与调用链按当前源码及回归核对。

使用技能的影响：brainstorming 将续作限制为两处已有调用边界，TDD/systematic-debugging 确认失败后最小修复，requesting-code-review 核对兼容性及讲稿事实，verification-before-completion/finishing-a-development-branch 完成收尾。按用户连续本地实施要求不再逐项审批，保留分支 codex/virtual-line-team-design 和目录 L:/industry_agent；未提交、合并、推送、重启或部署。
