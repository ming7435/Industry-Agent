# Skill 自动优化：系统准备修改稿，人工审核、测试、发布

实施日期：2026-10-12。当前本地代码已接入专家中心与 Agent 服务；未自动重启、部署业务服务，未在当前现场运行一次真实验收。

最新要求调整：取消“测试通过后自动发布”。本页当前流程取代早先设计中自动发布的约定。后台只生成稿件、推进人工已启动的测试及只读对账，最终发布必须由审核并测试此稿的维修人员点击。

## 一、现在的流程

```text
业务运行出现校验不足
        ↓
后台读取真实 Agent / Skill 执行记录
        ↓
模型生成追加规则的修改稿（不改线上文件）
        ↓
系统自动填入正文、修改说明（触发依据与改动）、预期结果
        ↓
人工审核 → 点击测试修改（绑定机器、场景和预期）
        ↓
现有模拟机器闭环验证
监控 → 诊断 → 方案 → 工单 → 维修确认 → 整线复机 → 汇总报告
        ↓
原发布门禁核对实际执行、完成状态、草稿指纹、依赖和时效
        ↓
通过：等待人工核对测试结果 → 点击发布到系统 → 备份、发布、加载
未通过：不发布，继续使用旧版
```

人工审核发生在测试前，最终发布发生在测试通过并人工核对结果之后。无需重新编写追加规则、修改说明或预期结果；自动稿尚未发布时，正在使用的 Skill 文件不变。工单中的维修确认是原业务动作，不能由“审核修改稿”代替。

这不是任意自动改代码：模型只能返回中文修改理由、测试预期和 1–6 条追加业务判断规则。原文、权限、工具、结构化步骤、停止条件、审批和验收规则保持不变；自动稿只插入原来的“业务判断规则”章节。新版本自动递增末位版本号。模型不能提交审批、测量或验证成功回执。

## 二、页面怎么使用

1. 正常启动当前源码构建的前端和 Agent 服务，打开“知识资产 → 专家中心”。
2. 登录维修小组账号，选择要查看的技能。原来的人工编辑区仍保留。
3. 查看新增的“自动优化修改稿”区。后台有可用运行来源时生成修改稿；没有来源时显示暂无修改稿，不编造规则。
4. 下方原编辑区自动填入正文、修改说明（运行问题及本次调整）、预期结果；人工草稿已有改动时不会覆盖，可显式选择载入自动稿。无需重新填写，选择本人负责的机器与故障场景。
5. 勾选“我已审核自动修改稿及预期结果，允许开始测试”，点击“测试修改”。不接受前端传入 `passed=true`、操作者或自报审批结果。
6. 系统进入验证中。去工单系统处理本次测试工单，由实际被派工的维修人员填写处理说明并确认维修。
7. 等待正常复机及报告保存，后台核对真实结果；完成后停在“测试通过，等待人工发布”，不会自动替换线上文件。
8. 人工核对实际结果符合预期，勾选已核对并点击“发布到系统”。服务器重新检查真实测试、版本、权限和时效，再通过原门禁发布。

自动稿正文及修改说明为只读审核，预期结果在启动测试前可核对调整，启动后绑定同一确认与测试。刷新技能、发布暂时失败不会丢掉有效测试回执；旧修订的轮询响应不能撤回较新的审核状态。原来的人工编辑、测试与发布流程保持兼容。

自动修改稿区域中，监督人只能查看，不能确认、拒绝或启动机器验证。原有人工编辑接口权限未作无关调整。

注意：模拟验证会触发虚拟故障并暂停模拟产线。必须是虚拟工厂模式、当前整线无其它未处理故障，所选人员负责该设备。已有其它故障、审批未完成、工单派发或报告失败时，验证不能冒充完成。本项目其它业务失败不会因为自动优化接入就被忽略。

## 三、自动收集与模型边界

- 读取最近最多 500 条真实轨迹；要求稳定 `trace_record_id`、`trace_id`、已注册 Agent 和实际使用 Skill。
- 接受带业务校验不足的终态，或明确的 fallback / insufficient_evidence。运行中、未知技能、纯模型连接/超时/余额错误不会成为优化来源。
- 专家草稿测试由服务器 `DraftRegistry` 作用域在真实 Harness 中标记，不能依赖客户端恰好带有 `test_id`。测试轨迹和自动优化自身记录被排除，防止根据自己试验反复优化。
- 每分钟最多扫描一次，单轮最多生成一份修改稿；同一来源和技能幂等，不因为发布新版本就重用旧来源。候选列表读取最近 100 份，单轮最多推进 4 份在途记录。
- 只使用项目现有 `get_default_llm_client` / Model 服务及其已选供应商，不新增或替换模型提供方。模型未配置、MySQL或轨迹不可用时停止收集，旧版不变。
- 优化器为一份候选发起一次 `chat` 调用，客户端请求超时上限 60 秒；上游模型网关自身的重试和计费仍按原配置，这不代表供应商绝对只计一次费用。测试使用合成响应，本轮未调用收费模型。
- 生成器不执行模型返回的业务工具。理由、规则和预期统一通过敏感内容检查；发现常见供应商密钥或 Bearer 凭据拒绝整个候选，不落盘。预期不能要求跳过审批等门禁。来源编号不符合单行安全格式时，正文只写编号哈希摘要，审计仍保留结构化关联。
- 修改依据从来源运行的业务校验 findings 提取，理由说明本次追加内容；模型给出 `expected_result` 作为待人工核对的测试预期。兼容旧模型未返回预期时提供明确的默认补查预期，不声称已有测试成功。

自动收集默认在非 `APP_ENV=testing` 且 `SKILL_AUTO_UPDATE_ENABLED=true` 时启动。后一个开关未设置时默认开启；设为 `false` 可停用后台自动推进。它是新增环境开关，本轮未修改任何生产配置或模型配置，也没有输出、复制密钥。

## 四、发布与故障恢复

人工确认绑定完整候选哈希、线上文件修订号、设备/场景/预期及服务器身份。确认超过 24 小时、登录失效、角色不符或线上技能被其它修改更新时不能发布。确认会话的解析闭包只留在进程内存，不进入 MySQL、API 返回或审计。

后台使用 MySQL `revision` CAS 和 180 秒所有权租约；模型与设备请求都在事务外执行。有效外部租约只能等待，不凭进程编号终止别的进程，不重复注入虚拟故障。

发布仍走真实 `MachineTrials.validate_publish` 和 `SkillManager.publish`，要求完整 `machine_flow`，不能用说明试读代替。原门禁检查测试完成状态、相同人员/技能、草稿指纹、全部技能依赖和时效。

新增 `/api/expert/evolution/{proposal_id}/publish` 仅接收候选哈希，身份与最终发布意图来自当前登录会话和同源 POST；没有客户端自报通过字段。等待人工发布时服务重启，可由同一维修人员登录后使用有效新会话发布已完成的测试，仍受原 24 小时和依赖门禁限制，不恢复旧 Cookie。

最终 `os.replace` 周围增加内部发布栅栏：在既有跨进程文件锁内，使用 MySQL 行锁再次校验候选、租约、所有者和确认记录；行锁持续到实际文件替换及应用标记写入完成，阻止旧进程在所有权撤销后继续发布。锁不包住模型、登录解析或设备请求。此内部回调不对前端暴露。

文件与 MySQL 无法组成分布式原子事务。文件可能已经应用而发布状态回执丢失时，后台只根据当前文件和原发布审计对账，不再替换文件。无法确认则进入 `outcome_unknown`，不能自动重试写入。

| 状态 | 含义与处理 |
| --- | --- |
| awaiting_confirmation | 等待人工确认，可查看或拒绝；没有启动测试 |
| confirmed / verification_starting | 已确认，准备启动；启动回执不确定时禁止重发故障 |
| verifying | 读取同一测试结果，不创建第二次测试 |
| awaiting_publication | 测试通过，等待人工最终发布；过期时转失败退出活动队列 |
| publishing / published | 人工点击后经原门禁发布；回执丢失只读对账 |
| generation_failed | 模型/输出失败或生成租约过期；不重放模型调用，后续新运行可以重新收集 |
| verification_failed / stale | 失败、会话无效或线上版本变化；保留旧版，该稿不能继续发布 |
| outcome_unknown | 启动或发布结果不确定；须核对测试、线上版本和审计，不重复执行 |
| rejected | 人工拒绝，旧版不变 |

生成期间进程退出不会永久卡在 `generating`：租约到期后标记 `generation_failed`。验证期间重启不会恢复丢失的确认权限，也不自动重放虚拟故障。需要先处理原工单/机器状态，再使用后续新来源生成的候选或原人工编辑流程重新核对、测试；失败终态没有“直接重试并发布”按钮。

待发布稿超过原 24 小时有效期，后台或同一审核者发布时标记 `verification_failed`，不发布、不延长有效期，后续新业务来源仍可生成新稿，不能永久卡住该 Skill 的优化。

## 五、数据放在哪里

- 线上 Skill：`services/agent-service/app/skills/{agent}/*.md`，仍为原 Markdown 格式。
- 自动候选、确认、状态历史：既有 MySQL `runtime_records_mysql`，命名空间 `skill_evolution`；来源防重复为 `skill_evolution_source`。通过既有 `MySQLJsonStore` 读写，不新增 SQLite、JSON 候选数据库或新数据表，不删除旧数据。
- 模拟测试回执：复用既有 `.runtime/skill-revisions/tests/{test_id}.json`。这是原测试实现，不把本次候选长期记录改成文件数据库。
- 发布旧版本与审计：`.runtime/skill-revisions/{agent}/{name}/{edit_id}.md` 及同名 `.json`，记录 old/new 修订、操作者、测试和原因。
- 状态变化日志：`SKILL-EVOLUTION-{proposal_id}`，附原来源运行、Agent、Skill、候选哈希、确认者、测试编号和状态；业务测试中的工具输入输出继续由原 Harness / 工具轨迹记录。

没有自动迁移或删除历史数据。备份数据库时沿用现有 MySQL 备份方法，并一并保留 `.runtime/skill-revisions`；只备份候选记录不能恢复 Skill 源文件。

## 六、实际修改文件

新增：

- `services/agent-service/app/skills/evolution.py`：追加规则生成、确认、验证推进、发布对账。
- `.../evolution_sources.py`：运行来源筛选和关联。
- `.../evolution_store.py`：MySQL 存储适配和最终发布行锁栅栏。
- `.../evolution_worker.py`：有界后台调度、过期生成恢复。
- `services/agent-service/app/api/skill_evolution.py`：受鉴权及同源限制的列表、详情、确认、拒绝、最终人工发布接口。
- `frontend/monitor-react/src/app/SkillEvolutionPanel.jsx`、`skillEvolution.css`：独立修改稿界面，不重做其它中心。
- `services/agent-service/tests/test_skill_evolution.py`、`test_skill_evolution_api.py`、`test_skill_human_publish.py`、`tests/browser/skill-evolution.test.mjs`：真实函数/API/浏览器回归。

原文件的最小接入：`app/api/expert.py` 增加路由，`app/api/server.py` 增加工作线程生命周期，`ExpertWorkspace.jsx` 嵌入面板，`app/skills/management.py` 增加内部文件发布栅栏；`app/skills/testing.py` 标记草稿注册表，`app/harness/runtime.py` 在真实作用域标记专家试验来源。均位于上面的服务或前端目录。保留当前工作目录已有修改，没有提交、克隆或下载远程项目。

## 七、回归与本次验收边界

所有命令在 `L:/industry_agent` 执行，构建在 `frontend/monitor-react` 执行。测试未读取本机密钥、生产数据库或真实设备，模型和数据库传输使用隔离适配器；状态机、Harness、技能解析、发布门禁和真实文件替换没有被 mock 掉。

针对性后端及代理：

```powershell
L:/anaconda/python.exe -X utf8 -m pytest -c pytest-agent.ini services/agent-service/tests/test_skill_human_publish.py services/agent-service/tests/test_skill_evolution.py services/agent-service/tests/test_skill_evolution_api.py services/agent-service/tests/test_expert_center.py services/agent-service/tests/test_expert_trials.py services/agent-service/tests/test_monitor_expert_proxy.py -q --tb=short
```

最新结果：104 通过，0 失败，0 跳过（日志：`.runtime/verification/skill-human-publish-targeted-final2.log`）。覆盖未人工点击不发布、鲜活会话恢复、原真实门禁复核、24 小时过期释放来源、发布幂等、确认修订号，以及先前发布竞态、生成中断、真实试验来源、Markdown 注入、密钥和监督人只读。

技能与实际模拟闭环契约：

```powershell
L:/anaconda/python.exe -X utf8 -m pytest -c pytest-agent.ini services/agent-service/tests/test_expert_machine_trials.py services/agent-service/tests/test_runtime_skill_scope.py services/agent-service/tests/test_runtime_maintenance_skill_scope.py services/agent-service/tests/test_skill_standardization.py -q --tb=short
```

结果：131 通过，0 失败，0 跳过。使用原模拟测试/运行作用域实现；这不是本机在线五服务或设备验收。

浏览器：

```powershell
$env:PLAYWRIGHT_MODULE_PATH='C:/Users/12587/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs'
$env:CHROME_EXECUTABLE='C:/Program Files/Google/Chrome/Application/chrome.exe'
L:/nodejs/node.exe --test tests/browser/skill-evolution.test.mjs tests/browser/expert-center.test.mjs
```

最新结果：23 通过，0 失败，0 跳过（日志：`.runtime/verification/skill-human-publish-browser-final2.log`）；覆盖自动回填修改说明/预期、先审核再测试、通过仍须人工发布、刷新与临时失败保留回执、人工草稿/预期不被迟到稿覆盖、修订保护，以及原专家页面功能。

可复现验证构建：

```powershell
L:/nodejs/node.exe L:/industry_agent/frontend/monitor-react/node_modules/vite/bin/vite.js build --outDir L:/industry_agent/.runtime/verification/skill-human-publish-build
```

成功，保留现有大于 500 kB 的分包警告。本轮产物在隔离验证目录，没有手工改 assets，也没有用验证产物覆盖正在使用的前端。

完整 Agent 套件：

```powershell
L:/anaconda/python.exe -X utf8 -m pytest -c pytest-agent.ini -q --tb=short --junitxml=.runtime/verification/skill-human-publish-full-final.xml
```

最新结果：2314 通过、72 失败、3 跳过，无 collection error。失败集合与此次人工发布调整的最终修正前全量运行一致；比早前一轮的 71 项多一项其它维修任务代码相关 interlock 测试，逐项名称见 `.runtime/verification/skill-human-publish-full-final.log`。不能称作“全项目全部通过”。

| 未通过的测试模块 | 数量 |
| --- | ---: |
| test_buildcad_alignment | 48 |
| test_buildcad_api | 9 |
| test_buildcad_http_contract | 1 |
| test_buildcad_node | 8 |
| test_business_returns_api | 2 |
| test_business_trace_returns | 1 |
| test_full_agent_runtime_e2e | 1 |
| test_p0_p1_lifecycle_smoke | 1 |
| test_interlock_plan_dispatch | 1 |

旧 BuildCAD 相关 66 项、质检相关 3 项，以及旧维修核验闭环 2 项没有在本轮修改去迎合过时契约或降低校验；需要各自独立核实修复。3 项跳过来自原 Windows 符号链接权限和未显式开启的 FreeCAD 内核验收，未扩大 skip 范围。不同命令的测试覆盖有重叠，不将通过数累加为互不重复的测试数量。

另一失败名称为 `test_interlock_plan_dispatch::test_interlock_inspection_never_bypasses_business_gates[changes3]`：测试建造方案时诊断 `maintenance_required=false`，当前维护代码直接拒绝生成方案，抛出 ValueError；该维护代码不在本轮修改范围。本轮保留失败及业务校验，没有修改它来制造通过。

独立审查一次：两个 Important 均已先复现后修复——刷新/发布暂时失败丢失回执，以及隔天待发布稿永久占位。未调用真实外部依赖；未将自然语言建议正确性、真实 MySQL 事务联调或其它业务失败作为已验收事项。

未执行：真实 MySQL 多进程栅栏联调、收费模型生成优化稿、用户当前虚拟工厂在线故障/维修闭环、真实设备验收和现场阈值判断。本轮没有新增工业合格阈值，不把模型建议或离线回归当成生产验收通过。

## 八、备份与恢复

修改前原文件备份：`L:/industry_agent/.local-backups/skill-evolution-20261012`，按原目录保存 `api/expert.py`、`api/server.py`、`skills/management.py`、`skills/testing.py`、`harness/runtime.py` 和前端 `ExpertWorkspace.jsx`。

本次“人工审核、测试、发布”调整前快照另在 `L:/industry_agent/.local-backups/skill-human-publish-20261012`，包括 evolution 服务/工作线程/栅栏/API、两个前端组件、相关既有测试及本文件。回退时核对这些局部差异，不整文件覆盖并行任务修改；此轮没有配置、数据表或数据库迁移。

恢复代码时先停止或关闭自动优化，保存当前修改，再逐文件对照此目录撤回本轮接入，不用备份整文件覆盖后续他人的修改。新增模块可先断开路由/线程/面板引用后归档，不删除 MySQL 历史或测试工单。

恢复某次已发布 Skill：先停自动推进并保存当前正文，查对应发布审计的 `old_revision` / `new_revision` 和 `.md` 备份，确认目标技能及当前版本；通过原专家中心重新审核、测试和发布恢复版本。紧急离线恢复需要停止相关服务、核对原文哈希后仅恢复明确的单个 Skill 文件，再重启加载；不得盲目恢复整个技能目录。数据库记录与文件恢复应保留审计，不能将历史已发布记录改写为未发生。
