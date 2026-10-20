# text-to-cad 本地与容器运行

生产建模使用 text-to-cad 的 `cadgen==0.7.10`、build123d 和 OCP。Agent 将已经校验的规格交给受控 Python 子进程执行，内核完成实体计算、STEP 回读和 STL 导出。启动服务不再启动 FreeCAD GUI、XML-RPC 或 freecad-mcp。

## 安装和检查

项目支持 Python 3.11 及以上；STL 和工程图导出还需要 Node.js 20 及以上。当前 Windows 项目环境为 `.venv`。在仓库根目录执行：

```powershell
uv pip install --python .venv/Scripts/python.exe -r services/agent-service/requirements.txt
.venv/Scripts/python.exe scripts/text_to_cad_runtime.py status
.venv/Scripts/python.exe scripts/text_to_cad_smoke.py --output-dir .runtime/verification/text-to-cad
.venv/Scripts/python.exe scripts/start_all.py
```

运行时检查会在独立解释器中加载 CAD 内核并建立 1 mm 立方体，版本、有效性、体积和 Node.js 版本同时通过才返回 `ready=true`。冒烟检查建立 20 × 15 × 10 mm 带直径 6 mm 贯通孔的块体，回读 STEP，核对体积 `3000 − 90π mm³`、外形尺寸和 STL 三角面，并保存 `verification.json`。失败会返回非零退出码，启动器会明确提示建模内核不可用；其它业务服务可以继续启动。

如果 uv 共享缓存正在被别的 CAD 插件使用，可以为本项目指定缓存目录：

```powershell
uv --cache-dir .runtime/text-to-cad-uv-cache pip install --python .venv/Scripts/python.exe "cadgen[snapshot]==0.7.10"
```

`scripts/start_all.py` 会自动切换到项目 `.venv` 后再启动应用服务及文档工作进程；环境缺失或不完整时明确退出。`CADGEN_PYTHON` 默认也使用项目 `.venv`，可显式指定独立 CAD 环境的解释器绝对路径。单独启动服务时应使用项目 `.venv` 的 Python。`CADGEN_NODE` 可指定 Node.js 可执行文件绝对路径，留空从 PATH 查找 `node`。修改后重新启动 Agent 与文档工作进程。探测和生成使用同一解释器，不会自动下载依赖。不要再将旧 `FREECAD_MCP_COMMAND` 或 GUI 可执行路径用于 CAD 配置。

生成快照还需要为该解释器安装 Chromium，建模与 STEP/STL 导出不依赖浏览器：

```powershell
.venv/Scripts/python.exe -m playwright install chromium
.venv/Scripts/python.exe -m cadgen.cli step snapshot .runtime/verification/text-to-cad/model.step .runtime/verification/text-to-cad/review.png
```

默认使用项目 `.runtime/text-to-cad-cache` 保存 cadgen 的可重建缓存，`CADGEN_CACHE_DIR` 可指定其它可写目录。该目录应位于同一个文件系统，供内核执行原子写入；它不是历史发布产物目录。

托管执行默认 `CADGEN_DAEMON=0`、`CADGEN_COMPONENT_WORKERS=1`，构建由当前任务的进程负责，避免后台守护进程越过请求超时继续执行。

## 产物和历史数据

新模型提供 `model.step`、`model.stl`、可重建的 `model.py` 和结构化 `model.json`，不再新增 FCStd 文件。STEP 保存可交换的精确几何，STL 用于三维预览；Python 和 JSON 保存重建依据。历史 FCStd 保留为旧版本附件，不会被脚本删除或冒充新后端的可编辑文档。

默认目录继续使用 `.runtime/cad-models`、`.runtime/cad-designs` 和 `output/freecad-documents`。原任务、运行标识、MySQL 文档与发布记录保留；目录名称中的 `freecad` 属于兼容存储约定。`TEXT_TO_CAD_ARTIFACT_ROOT` 和 `TEXT_TO_CAD_DOCUMENT_ARTIFACT_ROOT` 可以覆盖产物目录；旧 `FREECAD_ARTIFACT_ROOT`、`FREECAD_DOCUMENT_ARTIFACT_ROOT` 仍为回退配置。迁移已有数据时先确认所有服务指向同一目录，不要直接切换到空目录。

旧 `scripts/freecad_smoke.py`、`scripts/freecad_document_worker.py` 和 `scripts/freecad_runtime.ps1` 仅转发到新入口。旧 PowerShell 的 `stop` 返回 `no_background_runtime`，不修改或停止机器上已有的 FreeCAD 安装、进程和历史运行目录。

## 持久文档工作进程

根目录 `.env` 设置 `CAD_DOCUMENTS_ENABLED=true` 后，一键启动器会启动 `scripts/text_to_cad_document_worker.py`。新开关优先于旧 `FREECAD_DOCUMENTS_ENABLED`；未设置新开关时兼容旧值。工作进程与 API 共用内部鉴权及产物目录，使用 `CAD_WORKER_LOCK` 防止重复执行者，默认锁路径为 `.runtime/cad-document-worker.lock`。

文档队列、幂等命令和不可变发布机制继续保留。迁移前已有未确认结果的任务仍按原任务查询，不应另建命令重放。仅有历史 FCStd 的旧文档需要提供可重建规格或新后端的 `model.json`；STEP 可以保留几何，不能恢复原参数树。旧二进制不能直接当作新内核源模型。

## Docker 和 CI

`Dockerfile.agent` 包含 Node.js 22，安装相同固定版本的内核，并在镜像构建时执行真实几何探测。容器内 `CADGEN_PYTHON=/usr/local/bin/python`；无需挂载宿主机 GUI。`agent-runtime-data` 保存运行及模型，`agent-output-data` 保存持久文档产物；API 与工作进程共用这两个卷。

基础 Compose 继续使用 `apps` profile。启用持久文档时同时设置 `CAD_DOCUMENTS_ENABLED=true` 并启动可选 profile：

```powershell
docker compose -f infra/docker/docker-compose.yml --profile apps --profile cad-documents up -d --build
```

生产部署追加 `-f infra/docker/docker-compose.production.yml`，并提供生产模板要求的内部令牌。CI 除原服务测试外，还运行原生 STEP/STL 冒烟测试及 Agent 镜像内相同检查。只做 Python 单元测试通过并不代表 CAD 原生内核已通过验收。
