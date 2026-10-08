# 本地 FreeCAD + MCP

这里使用真正的 FreeCAD 几何内核与 `neka-nat/freecad-mcp` 的 PyPI 发布包。依赖都在 Git 忽略的 `.runtime` 中，未写入生产 `.env`。

## 固定版本与来源

| 组件 | 版本 | 本地路径 |
| --- | --- | --- |
| FreeCAD Windows portable | 1.1.4，内置 Python 3.11 | `.runtime/freecad/bin/FreeCAD.exe` |
| FreeCAD MCP addon | 0.1.26，来自 PyPI sdist | `.runtime/freecad/Mod/FreeCADMCP` |
| 外部 MCP server | `freecad-mcp==0.1.26`、`mcp==2.3.0`，Python 3.12 | `.runtime/freecad-mcp-venv` |

FreeCAD 采用[官方 SourceForge 1.1.4 发行镜像](https://sourceforge.net/projects/free-cad/files/1.1.4/)。外部 MCP 与 addon 都来自 [PyPI 0.1.26](https://pypi.org/project/freecad-mcp/0.1.26/)，安装过程无需 GitHub clone 或 GitHub 下载。原始包保存在 `.runtime/freecad-downloads`。

安装时核对的 SHA256：

```text
FreeCAD_1.1.4-Windows-x86_64-py311.7z
4828741fc91ee37fafcdb97a1abacb18b04ba451ac4372d9ff7a7349b36f4d6d

freecad_mcp-0.1.26.tar.gz
2ce12350416c54da40572c7fbc86b163d2c66c8a9d248ac0d0501cc39a7da8e1

freecad_mcp-0.1.26-py3-none-any.whl
a4fab5aceb146a6d721dd125e4e3f82721cd88a1ee52d9e538d00b08cdfb0c6a
```

FreeCAD 使用自身的 Python 3.11 执行 addon。外部 MCP 使用独立 Python 3.12 环境；不要把 `freecad-mcp` 安装进 FreeCAD 自带的 Python。

## 启动、状态、停止

在仓库根目录执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/freecad_runtime.ps1 start
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/freecad_runtime.ps1 status
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/freecad_runtime.ps1 stop
```

项目统一启动命令 `L:/anaconda/python.exe -u scripts/start_all.py` 现在也会在本机 Windows 开发环境中启动或复用这套已安装的 FreeCAD，最多等待启动器 55 秒。没有安装时不会下载依赖，CAD 启动失败也不会阻止其他应用服务启动。生产环境不隐式启动 GUI。

统一启动器的 Ctrl+C 管理应用服务，不会结束复用的独立 FreeCAD。需要停止本地 CAD 时使用上面的 `freecad_runtime.ps1 stop`；该命令不控制生产设备。

启动器默认隐藏窗口，运行 `scripts/freecad_bootstrap.FCMacro`，将 RPC 限定在 `127.0.0.1:9875`，等待 addon 写入就绪标记。`status` 检查进程身份；完整连通性使用下面的 smoke 验证。FreeCAD GUI 的事件循环必须保持运行，虽然窗口隐藏。`FreeCADCmd.exe` 不能替代该 GUI RPC 进程。

启动器在 `.runtime/freecad` 保存独立配置、日志、进程 ID 与启动时间。停止前会同时核对可执行文件绝对路径和进程启动时间，防止 PID 重用导致误停。端口被其他进程占用时会直接报错。`stop` 会结束这一个受管理的本地 CAD 进程，未保存的内存文档不会保留；先通过 MCP 保存所需模型。

日志与状态：

```text
.runtime/freecad/stdout.log
.runtime/freecad/stderr.log
.runtime/freecad/runtime-state.json
.runtime/freecad/rpc-ready.json
```

## MCP 客户端命令

MCP 服务使用 stdio，由 Agent/客户端为其会话启动；它不是 9875 端口上的 HTTP MCP 服务。9875 是内部 FreeCAD XML-RPC。

```json
{
  "command": "L:/industry_agent/.runtime/freecad-mcp-venv/Scripts/freecad-mcp.exe",
  "args": ["--host", "127.0.0.1", "--only-text-feedback"]
}
```

安装位置改变时调整绝对路径。不要设置远程 RPC；本部署仅供本机受信任的 Agent 执行 CAD Python 代码。

`execute_code` 的输入示例：

```json
{
  "code": "import FreeCAD, Part\nprint(Part.makeBox(10, 20, 30).Volume)",
  "include_screenshot": false,
  "timeout": 120
}
```

执行成功返回 MCP `content` 中的文本，格式为 `Code executed successfully: Python code executed successfully.\nOutput: ...`。失败可能返回普通文本 `Failed to execute code: ...`，且 `isError` 仍为 `false`；集成方必须检查业务结果或显式输出的 JSON 标记，不能只检查 `isError`。上游未提供结构化输出。

工具包括：`create_document`、`create_object`、`edit_object`、`delete_object`、`execute_code`、`execute_code_async`、`execute_code_headless`、`get_async_status`、`get_view`、`insert_part_from_library`、`get_objects`、`get_object`、`get_parts_list`、`reload_document`、`list_documents`、`get_rpc_status`、`run_fem_analysis`。

MCP 2.x 的 Python 模型属性使用 `input_schema` / `is_error`；JSON wire 名称仍是 `inputSchema` / `isError`。读取结果时可用 `model_dump(by_alias=True)` 统一为 wire 名称。

## 真实模型验证

```powershell
& ./.runtime/freecad-mcp-venv/Scripts/python.exe scripts/freecad_smoke.py
& L:/anaconda/python.exe -m pytest tests/test_freecad_runtime.py tests/test_freecad_smoke.py -q
```

smoke 脚本真实启动上游 MCP stdio server，执行 `initialize`、`tools/list`、`get_rpc_status`、`execute_code`。它在 FreeCAD 中创建 20 × 15 × 10 mm 长方体并钻出半径 3 mm 的贯穿孔，验证：

- 1 个有效 solid，体积为 `3000 - 90π ≈ 2717.256661 mm³`。
- 保存 `.FCStd`、`.step`、`.stl`。
- 将 STEP 重新读入 FreeCAD，核对实体和体积。
- 将 STL 重新读入 Mesh，确认三角面非空。
- 在外部进程验证导出文件大小、STEP 文件头，并记录 SHA256。

每次结果写到新的 `.runtime/verification/freecad-时间戳/`，其中 `verification.json` 包含原始 MCP 回包与几何证据，`mcp-tools.json` 包含实际工具 schema。`--list-only` 仅验证 MCP 握手和工具发现，不能证明 FreeCAD 几何链路可用。

## 重装依赖

从上述官方来源取得包并核对 SHA256 后，将 portable 压缩包内容解压到 `.runtime/freecad`，确保 `bin/FreeCAD.exe` 存在。从 sdist 的 `addon/FreeCADMCP` 复制 addon 到 `.runtime/freecad/Mod/FreeCADMCP`。保留目录层级，不要把整个 sdist 当作 addon。

```powershell
& L:/anaconda/python.exe -m venv .runtime/freecad-mcp-venv
& ./.runtime/freecad-mcp-venv/Scripts/python.exe -m pip install .runtime/freecad-downloads/freecad_mcp-0.1.26-py3-none-any.whl 'mcp[cli]==2.3.0'
& ./.runtime/freecad-mcp-venv/Scripts/python.exe -m pip check
```

本部署验证的是几何建模和导出。没有安装 FEM 求解器，也没有连接加工设备或验证 FEM 分析能力。

启动与复用均核对进程身份、`rpc-ready.json` 归属、回环端口的进程归属以及实际 `get_rpc_status`。`running=true` 仅表示进程存在；只有 `rpc_ready=true` 才可作为启动就绪证据。已有 GUI 但插件未就绪时 `start` 明确失败，不强行终止可能仍在执行的 GUI，应先核对再安全 stop/start。

建模脚本在 FreeCAD 执行端使用 `.execution-claimed` 原子文件认领：即使上游 XML-RPC 对丢失响应隐式重发，也不能重复构造、覆盖同一个任务。重复请求只可回查原始完整 manifest；未取得完整证据时保留不确定状态，不删除认领文件后自动重放。

页面使用与人工核对方法见 [操作说明](cad-modeling-operation-guide.md)，实际回归及真实出图证据见 [接入报告](freecad-local-integration-report.md)。
