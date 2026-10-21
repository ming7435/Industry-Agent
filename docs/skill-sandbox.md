# 专家技能试运行的沙箱隔离

本文描述如何把**专家中心的技能试运行**放进一次性 OpenSandbox 沙箱执行。生产诊断、知识检索、CAD 建模和质检流程不在本方案范围内。

## 目标与边界

进入沙箱的只有：

- `/skills/{agent}/{name}/test`（诊断样例试运行）
- `/skills/{agent}/{name}/task-test` 中的 `instruction_preview` 模式

保留在宿主进程内的：

- 生产诊断与全部业务工具
- `knowledge_flow`、`cad_spec_flow`、`review_flow`、`machine_flow`
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

沙箱内只装配 `SampleTools` 的只读样例工具，不注册生产 Tool Registry。

## 前置条件

- Docker 可用，且能运行 Linux 容器
- Python 3.10+（宿主 SDK 要求）
- OpenSandbox Server 可访问（默认 `127.0.0.1:8080`）
- 宿主安装可选依赖：

```powershell
uv pip install -r services/agent-service/requirements-sandbox.txt
```

如果 agent-service 也运行在容器镜像中，需要把同一依赖加入该镜像的构建依赖（`Dockerfile.agent` 默认不安装它，保持生产镜像最小）。

## 构建 runner 镜像

在仓库根目录执行：

```powershell
docker build -f infra/docker/Dockerfile.skill-runner -t industry-skill-runner:0.1 .
```

镜像只安装 LangGraph、Pydantic 和 PyYAML，不包含 cadgen/OCP、视觉模型或数据库驱动。

## 启动 OpenSandbox Server

```powershell
uvx opensandbox-server init-config $HOME\.sandbox.toml --example docker --force
# 仅本机无 API Key 验证时使用；生产必须配置 SKILL_SANDBOX_API_KEY
$env:OPENSANDBOX_INSECURE_SERVER='YES'
uvx opensandbox-server --config $HOME\.sandbox.toml
```

首次创建沙箱会拉取 `opensandbox/execd` 和 `opensandbox/egress` 镜像，可能耗时数分钟。建议提前拉取：

```powershell
docker pull opensandbox/execd:v1.1.0
docker pull opensandbox/egress:v1.1.7
```

如 Server 需要 API Key，在根目录 `.env` 中配置 `SKILL_SANDBOX_API_KEY`。

## 配置

在根目录 `.env` 中启用：

```dotenv
SKILL_SANDBOX_ENABLED=true
SKILL_SANDBOX_DOMAIN=127.0.0.1:8080
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
# 仅在容器无法访问宿主 Model Service 时才改为 0.0.0.0
MODEL_SERVICE_BIND_HOST=127.0.0.1
```

`SKILL_SANDBOX_FALLBACK` 默认 `false`。启用沙箱后若沙箱不可用，试运行会失败，**不会**静默退回共享工具环境。只有在本地排障时才建议临时设为 `true`。

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
- 镜像需要随 `app/skills` 和 `app/agents/diagnosis` 版本重新构建，存在版本漂移风险
- `knowledge_flow` / `cad_spec_flow` 依赖 RAG/CAD 服务，暂不沙箱化
- Windows Docker Desktop 下已实测 `host.docker.internal` 与 egress deny；其他平台仍需验证
- 沙箱内不写宿主 Trace；诊断试运行的摘要仍由 `_observe_isolated_agent` 在宿主记录

## 验证

1. 启动 Model Service（默认 `127.0.0.1:8040`；容器访问失败时再设 `MODEL_SERVICE_BIND_HOST=0.0.0.0`）和 OpenSandbox Server
2. 构建 runner 镜像
3. 在专家中心对 `diagnosis/alarm_diagnosis_skill` 发起一次样例试运行
4. 确认回执状态为 `completed`，且 `SKILL_SANDBOX_ENABLED=false` 时仍走原路径
5. 关闭 Model Service，确认试运行失败而不是回退

单元测试：

```powershell
.venv/Scripts/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_skill_sandbox.py -q
```

## 本地实测记录（2026-10-21）

- 环境：Windows + Docker Desktop，OpenSandbox Server 1.1.x，Docker runtime
- `instruction_preview` 与 `diagnosis` 两种模式均通过真实沙箱执行，返回 `ok: true`
- 沙箱内可连通 `host.docker.internal:8041`；`example.com:80` 被 egress 策略拒绝
- 沙箱销毁后无残留容器
- 首次创建因拉取 execd/egress 镜像约 2~5 分钟；镜像预热后约 2 秒

## 回滚

设置 `SKILL_SANDBOX_ENABLED=false` 即可立即回到原有进程内路径；不需要删除镜像或修改业务代码。
