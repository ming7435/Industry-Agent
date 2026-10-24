# 专家技能试运行的沙箱隔离

本文描述如何把**专家中心的技能试运行**放进一次性 OpenSandbox 沙箱执行。生产诊断、知识检索、CAD 建模和质检流程不在本方案范围内。

## 目标与边界

进入沙箱的专家中心测试：

- `/skills/{agent}/{name}/test`（诊断样例试运行）
- `/skills/{agent}/{name}/task-test` 的 `knowledge_flow`、`cad_spec_flow`、`review_flow`
- `/skills/{agent}/{name}/machine-test` 的 `machine_flow`：诊断、维修方案、虚拟工单、模拟维修确认与复机、报告生成
- `instruction_preview` 模式

保留在宿主进程内的：

- 生产诊断与全部业务工具
- 技能编辑、发布、回执与审计

## 执行链路

```text
专家中心
  -> SkillTrials._execute
  -> SkillSandbox（app/clients/skill_sandbox.py）
  -> POST /v1/sandboxes（OpenSandbox Server）
  -> 一次性沙箱 industry-skill-runner
       /work/input.json  = 技能草稿 + 人工样例
       python -m app.skills.sandbox_runner
       /work/result.json = 结构化结果
  -> 读回结果、更新回执、销毁沙箱
```

沙箱内使用只读样例工具和内存中的虚拟工单、设备恢复快照、报告工具，不注册生产 Tool Registry。`machine_flow` 仅从监控中心读取可选故障场景目录，不触发真实故障；测试者须提供 SOP 或知识库样例依据。预期结果只用于人工核对，不作为诊断或维修证据。沙箱模拟完成不代表实际机器已维修或复机。

## 前置条件

- Docker 可用，且能运行 Linux 容器
- Python 3.10+（宿主 SDK 要求）
- OpenSandbox Server 可访问（本地默认 `127.0.0.1:18080`，与网关的 8080 端口错开）
- 宿主安装可选依赖：

```powershell
uv pip install -r services/agent-service/requirements-sandbox.txt
```

`Dockerfile.agent` 已安装该 SDK；Compose 中的 agent-service 通过 `host.docker.internal:18080` 连接 OpenSandbox Server。生产环境可通过 `SKILL_SANDBOX_CONTAINER_DOMAIN` 指定受保护的私网地址。
Compose 中的 SDK 使用 OpenSandbox Server 代理访问临时容器。

## 构建 runner 镜像

在仓库根目录执行；代码变化后重新构建：

```powershell
docker build -f infra/docker/Dockerfile.skill-runner -t industry-skill-runner:0.1 .
```

镜像只安装 LangGraph、Pydantic 和 PyYAML，不包含 cadgen/OCP、视觉模型或数据库驱动。

## 启动 OpenSandbox Server

先运行准备程序。它在忽略提交的 `.runtime/skill-sandbox/` 中生成宿主与容器两套 Server 配置，在根目录 `.env` 中生成 API Key；密钥不会输出到终端。

```powershell
.venv/Scripts/python.exe scripts/skill_sandbox_environment.py prepare
docker compose --env-file .env -f infra/docker/docker-compose.yml --profile sandbox up -d --build skill-sandbox
.venv/Scripts/python.exe scripts/skill_sandbox_environment.py smoke
```

Docker 列表中会常驻 `industry-agent-infra-skill-sandbox-1`；每次试运行另外创建一次性容器，完成后自动销毁。Server 容器通过只读挂载的配置和 Docker Socket 创建沙箱，API 只映射到宿主 `127.0.0.1:18080`。Docker Socket 对宿主 Docker 有管理权限，因此只让受信任的 Server 镜像使用。

如果用 `scripts/start_all.py` 启动本地服务，它会在端口空闲时启动宿主版 Server；已有 Docker Server 时复用当前端口。需要单独运行宿主版 Server 时可执行：

```powershell
.venv/Scripts/python.exe scripts/skill_sandbox_environment.py serve
```

冒烟检查会创建并销毁一次性容器，无需模型服务。宿主客户端通过 Server 代理访问容器，适用于两种部署方式。

首次创建沙箱会拉取 `opensandbox/execd` 和 `opensandbox/egress` 镜像，可能耗时数分钟。建议提前拉取：

```powershell
docker pull opensandbox/execd:v1.1.0
docker pull opensandbox/egress:v1.1.7
```

Server 使用 `.env` 中的 `SKILL_SANDBOX_API_KEY`；若为空，准备程序会自动生成。Docker Desktop 中的 agent-service 通过 `host.docker.internal` 访问映射到宿主的端口。

若用 Compose 启动业务服务，显式指定根目录 `.env`，并在修改 agent 镜像后重新构建：

```powershell
docker compose --env-file .env -f infra/docker/docker-compose.yml build agent-service
docker compose --env-file .env -f infra/docker/docker-compose.yml --profile apps --profile sandbox up -d
```

## 配置

在根目录 `.env` 中启用：

```dotenv
SKILL_SANDBOX_ENABLED=true
SKILL_SANDBOX_DOMAIN=127.0.0.1:18080
SKILL_SANDBOX_CONTAINER_DOMAIN=host.docker.internal:18080
SKILL_SANDBOX_PROTOCOL=http
SKILL_SANDBOX_API_KEY=
SKILL_SANDBOX_IMAGE=industry-skill-runner:0.1
SKILL_SANDBOX_MODEL_BASE_URL=http://host.docker.internal:8040
SKILL_SANDBOX_ALLOWED_HOSTS=host.docker.internal
SKILL_SANDBOX_TIMEOUT_SECONDS=180
SKILL_SANDBOX_READY_TIMEOUT_SECONDS=300
SKILL_SANDBOX_CPU=1
SKILL_SANDBOX_MEMORY=1Gi
SKILL_SANDBOX_FALLBACK=false
SKILL_SANDBOX_USE_SERVER_PROXY=true
# 仅在容器无法访问宿主 Model Service 时才改为 0.0.0.0
MODEL_SERVICE_BIND_HOST=127.0.0.1
```

`SKILL_SANDBOX_FALLBACK` 默认 `false`。启用沙箱后若沙箱不可用，试运行会失败。`machine_flow` 始终失败关闭，即使该开关被设为 `true`；未启用沙箱时公开的 `/machine-test` 返回错误，不会创建真实工单。

### Model Service 监听地址

沙箱通过 `host.docker.internal:8040` 访问宿主 Model Service。Docker Desktop 通常可以直接访问绑定在 `127.0.0.1:8040` 的服务；如果容器内连接失败，再把服务改为监听所有网卡：

```dotenv
MODEL_SERVICE_BIND_HOST=0.0.0.0
```

这会扩大 Model Service 的监听范围。仅在本机可信网络使用；生产部署应通过反向代理、网络策略或独立模型代理限制来源。

Linux Docker 默认没有 `host.docker.internal` 时，可把 `SKILL_SANDBOX_MODEL_BASE_URL` 改为宿主网桥地址（例如 `http://172.17.0.1:8040`），`SKILL_SANDBOX_ALLOWED_HOSTS` 会自动取该 URL 的 host；如需显式配置，保持两者一致。

模型密钥仍只存在于 Model Service，沙箱进程不会拿到供应商密钥。

## 安全性质

- 沙箱内没有 MySQL、Redis、Backend、CAD、RAG 的生产地址
- 出站策略默认 `deny`，只放行 `SKILL_SANDBOX_ALLOWED_HOSTS`
- 沙箱只挂载 `/work` 内的输入输出，不挂载宿主目录
- CPU、内存和 180 秒超时由沙箱约束
- 每次试运行使用独立沙箱，结束即销毁
- 模型或工具失败只返回固定文案，不把堆栈、路径、供应商错误正文带回浏览器

## 已知限制

- 本地 Docker 创建沙箱约 1~3 秒；不是 Kubernetes Firecracker 的毫秒级
- 镜像需要随技能、智能体和验证代码更新后重新构建，存在版本漂移风险
- `knowledge_flow` / `cad_spec_flow` 使用提供的样例资料，在沙箱内运行任务图，不访问生产 RAG/CAD 服务
- 模拟闭环内的维修确认和复机快照是虚拟数据，只能验证流程编排和技能草稿，不能作为现场安全或实际维修凭据
- Windows Docker Desktop 下已实测 `host.docker.internal` 与 egress deny；其他平台仍需验证
- 沙箱内不写宿主 Trace；诊断试运行的摘要仍由 `_observe_isolated_agent` 在宿主记录

## 验证

1. 启动 Model Service（默认 `127.0.0.1:8040`；容器访问失败时再设 `MODEL_SERVICE_BIND_HOST=0.0.0.0`）和 OpenSandbox Server
2. 构建 runner 镜像
3. 在专家中心对 `diagnosis/alarm_diagnosis_skill` 选择模拟故障场景、填写 SOP 样例并点击“测试修改”
4. 确认回执状态为 `completed`、`simulation=true`，且没有实际 `event_id`、工单或报告 ID
5. 关闭 Model Service，确认试运行失败而不是回退

单元测试：

```powershell
.venv/Scripts/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_skill_sandbox.py -q
```

## 本地实测记录（2026-10-21）

- 环境：Windows + Docker Desktop，OpenSandbox Server 1.1.x，Docker runtime
- `instruction_preview` 与 `diagnosis` 两种模式均通过真实沙箱执行，返回 `ok: true`
- 专家中心 API 的 `/skills/{agent}/{name}/test` → `/tests/{test_id}` 完整链路也已在临时技能目录、临时回执目录下验证：诊断和说明试读均返回 `completed`，未发布技能或写入生产记录。可用 `RUN_LIVE_SKILL_SANDBOX=1` 运行 `services/agent-service/tests/test_skill_sandbox_live.py` 复核。
- 沙箱内可连通 `host.docker.internal:8041`；`example.com:80` 被 egress 策略拒绝
- 沙箱销毁后无残留容器
- 首次创建因拉取 execd/egress 镜像约 2~5 分钟；镜像预热后约 2 秒

## 环境补全验证（2026-10-23）

- 本机 OpenSandbox Server 在 `127.0.0.1:18080` 启动，`smoke` 成功创建、执行并销毁一次性容器。
- 带根目录 `.env` 启动的 Compose `agent-service` 容器通过 Server 代理完成同一条容器生命周期，验证了容器内 SDK、鉴权、路由和清理。
- 初始版本的沙箱单元测试 7 项通过；诊断和说明试读的专家中心 API 端到端测试 2 项通过。

## Docker 部署验证（2026-10-23）

- `industry-agent-infra-skill-sandbox-1` 已作为 Compose 服务运行并通过健康检查。
- 宿主冒烟测试和 Compose `agent-service` 内的调用都已通过：创建、执行、读取结果、销毁临时沙箱。
- Docker Server 上的专家中心诊断与说明试读端到端测试均通过（2 项）；沙箱单元测试 7 项通过，临时容器均已销毁。
- Docker Server 使用独立配置与持久化数据卷；宿主版 Server 与 Docker 版不能同时绑定 18080 端口。

## 完整模拟闭环验证（2026-10-23）

- `machine_flow` 在真实 OpenSandbox runner 中通过诊断、维修方案、虚拟工单派工、模拟维修确认与复机校验、模拟报告阶段。
- 专家中心 `/machine-test` → `/tests/{test_id}` 在真实沙箱中返回 `simulation=true` 和通过的验收回执；工厂未收到故障触发或场景清除调用，回执没有实际事件、工单、报告 ID。
- `knowledge_flow`、`cad_spec_flow`、`review_flow` 已接入沙箱 runner 并通过本地任务图单测；完整机器闭环失败时不会回退到真实业务流程。
- 相关回归测试 71 项通过，前端构建通过；临时沙箱执行容器已销毁，Compose Server 保持健康。本地演示服务已重启，agent 与监控页面健康检查均返回 200。

## 回滚

设置 `SKILL_SANDBOX_ENABLED=false` 会停止公开的机器闭环测试入口并返回配置错误。其它试运行模式仍按原有开关回到进程内路径；原有技能版本不受影响。
