# 维修方案派工修复与审批回归记录

> 历史记录：后续用户于同日明确要求按登录人员及故障设备自动派工。创建工单的风险审批规则已由[新的自动派工规则](online-device-auto-dispatch-2026-10-07.md)替代；下文保留此前修复时的行为和验证结果。

日期：2026-10-07。范围：当前本地代码中的维修方案分类、只读互锁核查、工单门禁和派发状态展示。BuildCAD 接入暂停，未修改模型供应商、生产配置、端口或数据库结构。

## 现场问题与根因

只读查询 `http://127.0.0.1:8001/api/maintenance/plans` 返回 5 条保存方案。最新方案 `PLAN-CC2F44F423` 的设备为 `TRAK-TC820LTYSI-001`，报警为 `700004`，事件为 `EVT-20261007-030904-029-003`。

其诊断置信度为 0.916，证据状态 ready，维修必要性 true。实际报警定义为“开门被禁止：程序、轴、主轴未停止或接料器未下降”，等级 critical。但保存方案的目标是“主轴冷却系统”，风险等级 medium，验证缺项为“涉及拆装或部件操作但缺少 CAD/BOM 依据”。因此本次不能通过降低置信度门槛解决。

确认的问题：

1. 正常主轴温度的背景文字影响了故障分类，互锁报警落入冷却维修。
2. 仅因为诊断中出现“主轴”等名称，就把只读状态核查判成必须取得主轴工程图纸。
3. Runtime 对创建工单无条件要求 CAD，方案即使已经按只读核查范围验证，也会被第二层门禁阻止。
4. DiagnosisResult 将等级保存在 alarm_definition，转换到维修输入时没有读取该字段，严重报警被降成中风险。
5. 页面只显示笼统的“暂不能自动派发”；业务就绪的待审批方案又可能被投影成可自动派发。

CAD 服务 `http://127.0.0.1:8050/health` 返回 ready=true、records=0。连接正常不代表具备工程资料。没有用前端 HTML 模型、演示记录或无关库存填充 CAD/BOM。

## 已修改的文件与行为

| 文件 | 关键行为 |
| --- | --- |
| services/agent-service/app/workorder/repair_profile.py | 增加安全门与接料器互锁分类；优先实际定义和主要故障，不凭报警编号猜含义。共用有界只读核查步骤。 |
| services/agent-service/app/tools/maintenance/generate_repair_plan.py | 草案工具与 Agent 返回相同互锁核查方向，不再返回无关冷却维修。 |
| services/agent-service/app/agents/maintenance/agent.py | 只读互锁核查不强制主轴 CAD，不生成更换备件，不混入检索中的无关拆修步骤或前置检查。输入转换保留报警定义中的严重等级，不能被较低外层等级覆盖。 |
| services/agent-service/app/agents/maintenance/validator.py | 提供 Runtime 共用的 requires_cad 规则；repair_steps、pre_checks、post_checks 中的明确拆修动作仍要求 CAD，cad_required=false 不能自行豁免。 |
| services/agent-service/app/runtime/policy.py | 仅对已经验证就绪、没有缺项、没有备件、没有拆修动作、对应互锁诊断的只读核查方案免除 CAD 必需项。保留其他证据与审批规则。 |
| services/agent-service/app/api/maintenance_plans.py | 保存结果明确为 waiting_approval/approval_required 时，派发投影返回等待审批；业务门禁失败原因仍优先保留。 |
| frontend/monitor-react/src/app/maintenanceWorkspace.mjs | 合并显示具体 validation_findings；区分等待审批、资料阻断、等待系统派发和已关联工单。 |
| frontend/monitor-react/src/app/App.jsx | 每条方案直接显示派发校验原因，关联状态依据实际读取到的工单，不凭方案存在声称已派发。没有重做页面。 |
| services/agent-service/tests/test_interlock_plan_dispatch.py | 新增实际函数、Agent、完整 Runtime 和持久化工单回归。覆盖分类、CAD 范围、库存隔离、低置信度等门禁、严重等级转换、审批恢复及重复审批。 |
| services/agent-service/tests/test_maintenance_plan_returns.py | 补充保存结果待审批投影和置信度原因保留回归。 |
| frontend/monitor-react/src/app/maintenanceWorkspace.test.mjs | 补充具体缺项、等待审批及关联工单状态展示回归。 |

前端产物来自 `npm run build`，没有手工编辑打包 JS。工作区中其他已有修改予以保留，不作为本次修复成果认领。

## 用户确认的业务规则

**所有严重故障工单仍先审批，包括只读互锁核查。** 没有以“不拆修”为理由自动批准高风险动作，也没有信任客户端 context 中的 approval_granted。

本地完整 Runtime 回归验证：严重互锁故障先持久化待审批任务，不产生工单；通过真实 ApprovalManager 审批后恢复执行，自动派给对应设备的测试维修人员；重复审批不会重复创建工单。正常风险、满足业务门禁的核查方案可以自动派发。

只读核查不等于部件维修完成。发现部件问题后，拆修仍须补充相应 CAD/BOM、库存及审批。此范围没有机器控制动作，不会停机、启动、短接互锁或执行轴运动。

## 验证方法及结果

使用系统排障、测试驱动和完成前验证方法：先运行新增测试确认失败，再改被测代码。没有删除失败测试、降低门槛或扩大跳过范围。

测试调用实际业务函数、真实 Agent 图、Runtime、审批管理器和工单服务；只隔离外部模型、知识、工程、库存、人员与设备适配边界。数据库为测试临时路径，不是生产数据库；SQLite 仅用于既有隔离测试夹具，本次没有把运行存储改回 SQLite。没有调用收费模型或真实设备，没有注入现场故障、真实派工或预留库存。

在 `L:/industry_agent` 执行：

```powershell
$env:PYTHONIOENCODING = 'utf-8'
& L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_interlock_plan_dispatch.py services/agent-service/tests/test_maintenance_fault_dispatch.py services/agent-service/tests/test_runtime_policy.py services/agent-service/tests/test_business_gates.py services/agent-service/tests/test_maintenance_plan_returns.py -q --junitxml=.runtime/verification/maintenance-targeted-results.xml
& L:/anaconda/python.exe -m pytest -c pytest-agent.ini --junitxml=.runtime/verification/maintenance-agent-full-results.xml -q
& L:/anaconda/python.exe -m pytest -c pytest-agent.ini tests/integration/test_virtual_line_team_contract.py -q
```

在 `L:/industry_agent/frontend/monitor-react` 执行：

```powershell
$frontendTestFiles = @(rg --files src | Where-Object { $_ -match '\.test\.mjs$' })
node --test @frontendTestFiles
npm run build
```

| 验证 | 通过 | 失败 | 错误 | 跳过 |
| --- | ---: | ---: | ---: | ---: |
| 派工相关针对性回归 | 88 | 0 | 0 | 0 |
| Agent 当前完整套件 | 839 | 20 | 12 | 0 |
| 产线与维修人员跨服务契约 | 1 | 0 | 0 | 0 |
| frontend/monitor-react/src 全部 Node 测试 | 97 | 0 | 0 | 0 |
| 现场维修方案页面只读浏览器检查 | 1 | 0 | 0 | 0 |

前端构建成功，保留现有超过 500 kB 的分包警告，没有通过提高警告阈值掩盖它。

浏览器检查使用实际 Chrome/Playwright 打开现有页面，5 条方案可见，CAD/BOM 阻断原因明确展示，页面异常 0，业务写请求 0。截图位于 `.runtime/verification/maintenance-dispatch/live-maintenance.png`。没有点击重新诊断、派工、审批或设备控制。

完整套件的 20 项失败、12 项 setup 错误集中在 CAD 建模/加工测试。独立调用当前未修改的 modeling_worker.build 并保留原始 traceback，确认测试解释器 `L:/anaconda/python.exe` 缺少 cadquery；默认隔离内核路径 `.runtime/cad-modeling-venv/Scripts/python.exe` 也不存在。该环境阻断未解决，不把完整套件写成全部通过。详细用例和错误保留在完整套件 JUnit XML。

执行期间发现其他工作区修改及质检测试暂时失败，未覆盖其文件或删除测试；上述前端 97 项是随后重新执行全部 src 测试的实际通过结果。

## 运行态与历史数据

源码已修改，前端已重新构建。现有 start_all.py 管理的后台仍是旧进程，本次没有重启，也没有自动部署。这意味着现场历史方案仍保留原目标、风险和阻断结果，不能称为现场派发验收通过。

要使用新后台逻辑，需在本地维护时机统一重新加载受管理服务，之后由已登录人员使用既有“重新校验并自动派工”，读取当前设备重新生成方案。严重故障的待审批任务仍通过既有、受写入身份保护的 Runtime 审批接口处理，不能由页面请求自行宣布批准。本次没有增加新的审批按钮或角色授权。

既有方案、事件、工单和审计记录没有覆盖或批量重跑。非只读核查的维修方案仍可能因实际工程记录、库存、知识证据或人员不足而阻断，这是保留的业务门禁，不是承诺无条件派发。

## 配置、备份与恢复边界

没有配置变更、数据迁移、数据卷删除或数据库清理。

可用副本位于 `.runtime/backups/maintenance-dispatch-20261007/`：

- 顶层保留修改前的 api/maintenance_plans.py、runtime/policy.py、test_maintenance_plan_returns.py 副本。
- `after-fix/` 是本次修复后源码快照，不是修改前备份。
- `before-approval-reconstructed/` 根据本轮修改前实际读取的 Maintenance Agent、Validator、maintenanceWorkspace 及其测试内容，反向移除本轮审批显示、风险转换及前置检查补充改动；它是重建副本，不声称预先复制。
- 没有找到覆盖最初分类修复全部文件的修改前备份，不能声称可以一键完整回滚。
- assets 副本是中间构建产物，不能配合任意旧 index.html 直接恢复。

恢复前先逐文件比较副本和当前源文件，另存此后新增改动；按所需范围恢复源文件后，在 frontend/monitor-react 执行 npm run build，再统一重新加载本地服务。不要整目录覆盖当前工作区，不恢复生产配置，不删除任何业务记录。

## 尚未完成或未执行

- 后台新代码重载及真实数据下的重新诊断、审批、派发：未执行。
- CAD 内核测试依赖恢复：环境受阻，未在本次派工任务中安装或替换 CAD 实现。
- 需要拆修的正式 CAD/BOM、库存记录及现场设备验收：仍需真实适配器和业务资料；未猜测合格阈值。
- BuildCAD MCP：尚未接入。当前生产建模工具仍调用本地 CadQuery，不把连通性测试当作接入完成。

隔离回归通过不等于真实设备或生产验收通过。
