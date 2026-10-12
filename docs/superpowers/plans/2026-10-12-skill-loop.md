# Skill Loop 独立优化闭环实施计划

> **执行方式：**使用 superpowers:executing-plans 在当前本地工作目录连续实施，步骤用复选框记录；测试先失败，再修改实现。沿用用户“不再逐项询问”的要求，不提交或覆盖他人的工作区改动。

**目标：**把现有候选稿、人工审核/测试/发布连成可观察、有预算、能回流的 Skill Loop，明确与业务 Agent Loop 分离。

**架构：**SkillEvolution 仍是唯一候选入口。Skill Loop 只读取实际执行轨迹，按版本统计完整周，产生至多三项周计划，用 MySQL CAS 预留额度后交给原候选服务；原人工门禁保持。当前周只作观察，发布收益无独立可比评测时保留未评估，不用运营成功冒充质量收益。

**技术栈：**现有 Python/FastAPI、MySQL JSON/CAS、React、pytest、Chrome/Playwright；不增加服务或数据库。

**设计依据：**`docs/superpowers/specs/2026-10-12-skill-flywheel-design.md`，尤其 1.1 的两个 Loop 边界。

## 全局约束

- 在当前项目修改前备份具体文件；不读取、复制或修改密钥和生产配置。
- 只加选择版本/执行步骤的观测，不修改 Agent 业务图、循环次数、工单状态或工具权限。
- 人工审核 → 实际虚拟业务测试 → 人工最终发布；不自动上线、回退或控制设备。
- 旧日志缺版本、窗口不完整、基础设施错误、不支持回放和没有真实收益时明确标识，不补造数据。
- Asia/Shanghai 周一零点为窗口边界；每周最多三个合格 Skill，预算不随进程重启归零，失败请求也占额度。
- 原生连续执行；不使用 Git 提交脚本，也不自动部署构建产物。

## 审查重点

1. 发布发生在任务中途时，记录当时真正选择的版本，混合版本不参与优化/收益。
2. 一次业务任务有多次尝试或多个 Skill 时，按服务端 attempt 编号去重，未完成项不能变成 pass。
3. 轨迹分页中断、数据库失败或只剩内存缓存不能显示“完整一周”。
4. 多进程同时选择、超时和重启不得突破三项额度，过期稿不能重用原来源反复收费。
5. 账号切换、迟到 API 响应、人工已有草稿不能被优化界面覆盖，暂停优化不暂停业务机器。

## 任务 1：选择快照与可信窗口（L0）

**文件：**修改 `app/skills/registry.py`、`app/harness/runtime.py`、`app/agents/base.py`、`app/harness/trace_store.py`、`app/harness/trace.py`；新增 `tests/test_skill_loop_observation.py`。

**接口：**`SkillDefinition.observation() -> dict` 返回实际加载对象的版本、内容指纹、声明步骤。`skill_observation_scope(callback)` 只在本次 Harness 的 ContextVar 作用域记录真实选择，不缓存业务输出。`TraceRecorder.skill_window_page(start, end, after=0, upper=None, limit=200) -> dict` 返回固定最大序号的投影页、游标、是否结束和持久化完整性。

- [ ] 写测试：真实 Harness 选旧版后文件改变，旧观测不被当前版本覆盖；并发作用域隔离；步骤带版本；分页固定边界不吞新写入；无持久化不声称完整。
- [ ] `L:/anaconda/python.exe -X utf8 -m pytest -c pytest-agent.ini services/agent-service/tests/test_skill_loop_observation.py -q`，观察新能力缺失导致失败。
- [ ] 最小实现 ContextVar 观测和 UTC 窗口参数化查询；投影不传完整输入/工具返回大正文，连接最终关闭。
- [ ] 同命令通过，追加 registry、harness、原 scope 契约回归。

## 任务 2：健康统计与完整性（L1）

**文件：**新增 `app/skills/loop_analytics.py`、`tests/test_skill_loop_analytics.py`。

**接口：**`week_windows(now) -> dict`；`aggregate(records, registry, complete) -> list[dict]`。每行带名称、版本、内容指纹、verdict 数量、实际覆盖、最后执行、真实来源及 `last_gain='not_evaluated'`。

- [ ] 写表驱动测试：明确 validator pass、fail、fallback、timeout、缺终态、重复编号、跨尝试、专家测试、混合版本；字面期望不用被测 helper 计算。
- [ ] 运行 `... -m pytest -c pytest-agent.ini services/agent-service/tests/test_skill_loop_analytics.py -q`，新模块缺失失败。
- [ ] 仅统计受信运行，基础设施分类独立，旧日志保留 unknown；声明步骤覆盖不冒充场景覆盖，未知收益不填 0。
- [ ] 同命令通过；窗口查询失败时保存明确不完整状态。

## 任务 3：周计划、预算、暂停与原修改稿（L2/L3/L5）

**文件：**新增 `app/skills/loop.py`；修改 `evolution.py`、`evolution_worker.py`；新增 `tests/test_skill_loop.py`。

**接口：**`SkillLoop.refresh(now=None)` 构造健康快照和不可变周计划；`SkillLoop.scan_once(now=None)` 只从周计划预留一项，然后调用 `SkillEvolution.generate_source(source)`；`SkillLoop.status(agent='',name='')` 只读；`set_paused(paused,actor)` 使用修订 CAS 留痕。

- [ ] 写测试：少于三个不补齐；旧基线、纯连接错误、未知版本和固定算法正文不选；请求失败不退额度；两个服务并发总量不超过三；重启不重试已预留项；暂停不影响原人工验证推进。
- [ ] 运行 `... -m pytest -c pytest-agent.ini services/agent-service/tests/test_skill_loop.py services/agent-service/tests/test_skill_evolution.py -q`，新能力失败而原行为可核对。
- [ ] 复用 MySQL namespace 保存窗口、计划与预算；每周最多三份，失败/不确定也占位。原 minute 扫描改为 Skill Loop 入口，原 `advance` 仍只处理确认、验证和人工发布后的对账。
- [ ] 自动修改说明携带完整窗口、排序事实和关联周期，模型只分析摘要，候选保留原权限/正文约束；不改变原发布门禁。
- [ ] 同命令通过；所有业务写操作仍需原审核/审批。

## 任务 4：专家中心与发布后观察（L4/L5 展示）

**文件：**修改 `app/api/skill_evolution.py`、`SkillEvolutionPanel.jsx`、`skillEvolution.css`；新增 API 和浏览器行为测试。

**接口：**GET `/api/expert/skill-loop?agent=&name=` 只读现有健康/计划/候选阶段与发布观察；POST `/api/expert/skill-loop/control` 严格 `paused:bool`，同源已认证维修人员；不接受客户端通过结果、预算或版本。前端在现有修改稿上方纵向展示，不新建编辑器。

- [ ] API RED：无身份 401、监督者写 403、跨源 403、额外字段 422；GET 不触发模型或测试，发布阶段与优化周期/业务任务明确分离。
- [ ] 浏览器 RED：健康分类、周计划余量、未知收益清楚；暂停后业务未被操作；刷新/账号切换不恢复旧账号数据；保留原审核、测试、最终发布流程。
- [ ] 实现当前周按实际新旧版本的观察回流、持久化历史引用；未经同基线对照只展示统计，`last_gain` 始终未评估。模型自然语言评价不解锁发布。
- [ ] API/浏览器通过，构建到隔离目录，不更新运行中的 assets。

## 本版不伪造的能力与后续条件

真实同基线 A/B + 独立 holdout、统计收益门槛、漂移真值和所有领域只读执行适配器尚未具备，不能凭一条故障记录生成独立验证集。此版将收益明确标为未评估，保留原虚拟闭环人工门禁；不把这一标记宣称为已实现严格 A/B。历史旧版仍通过原备份恢复流程审核、测试、发布，本版不引入无验证的恢复按钮。PSI/MMD/KL、bandit、生产灰度按已确认设计暂不启用。

## 最终验证与交付

- [ ] 针对性后端 → 原技能/门禁/代理契约 → 浏览器 → 隔离前端构建 → 全 Agent 测试套件。
- [ ] 所有失败逐项记录，不删除失败测试，不改 skip 制造通过。
- [ ] 按 executing-plans 做一次独立代码审查；Important 先复现再修正。
- [ ] 新增 `docs/skill-loop-implementation.md`，说明真实实现、缺失条件、命令/数量、未在线验收、备份恢复。
