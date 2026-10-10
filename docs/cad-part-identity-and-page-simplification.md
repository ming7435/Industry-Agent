# 生产建模：零件标识与页面精简

日期：2026-10-09。范围仅为生产建模页面及 CAD 运行记录的零件标识；未恢复或改动当前空白质检页面，未改变建模算法、节点、技能、工具或设备控制。

## 页面调整

- 增加零件名称和可选零件编号输入，模板与示例会填入对应的名称。
- 当前模型上方醒目显示名称及编号。首次调整时没有用户零件编号会显示完整设计运行编号；随后按用户要求改为五位展示，具体规则见下方补充。
- 生成成功后自动收起需求表单；“零件信息与建模需求”可重新展开，“新建设计”会清除上次零件标识。
- 模板、示例、原始 JSON、完整几何校验和执行记录默认折叠。模型检查状态、外形尺寸、失败提示和生产安全说明仍直接可见。
- 保留真实 STL 交互预览、图内输入与拖动、参数修改、二维图纸、版本切换和导出。
- 零件信息与需求上下排列。修改新需求草稿不能重命名当前模型；修改当前模型生成新版本时沿用当前模型的名称及编号。

## 修改文件

- `frontend/monitor-react/src/app/production-cad/ProductionCadWorkspace.jsx`：输入、结果标识、内容折叠、标识与版本绑定、新旧接口兼容。
- 同目录 `productionCad.css`：上下排列的标识输入、醒目标识区及长编号换行。
- 同目录 `freecad.mjs`：区分当前运行标识和下一需求草稿的会话恢复。
- 同目录 `designEditor.mjs`：设计版本分别保存自己的名称、编号与原有时间。
- `services/agent-service/app/agents/cad/modeling_api.py`：可选 `part_name`、`part_number` 校验、运行记录保存和读取、标识变更的幂等保护、能力声明。名称和编号不拼入几何需求，避免编号中的数字污染尺寸解析。
- 同目录前端测试、`services/agent-service/tests/test_freecad_api.py` 和 `tests/browser/freecad-workspace.test.mjs`：新增行为回归；旧浏览器测试按新折叠交互展开内容后继续原有断言。拖动前滚动到实际端点，保留实际命中与规格变化检查。
- `frontend/monitor`：由当前源码执行 Vite 构建生成，没有手工改打包文件。旧哈希产物由构建器替换为新哈希产物。

## 保存位置与运行版本

- 当前标签页的草稿和设计版本使用既有 `sessionStorage`，页面刷新可恢复，但关闭标签页后不保证保留。
- 新版 CAD 接口将名称和编号与现有 Redis 运行记录一起保存；现有运行记录期限仍为 24 小时。本次没有改为永久档案存储，也没有迁移、删除旧数据。
- 本机 8010 Agent 未开启自动重载，检查时仍运行旧代码。本次未重启服务或中断后台任务。
- 页面先读取接口是否支持新字段。旧服务下不会发送其不支持的字段，因此仍可建模，标识保留在浏览器会话中；服务重启加载新版后，新创建的记录才会同时保存服务端标识。不会自动给旧记录补写名称。
- 旧记录的命令摘要保持兼容；同一命令变更名称或编号会返回 409，不能把另一零件错误当成已生成。

## 测试与验证

先补测试复现缺少标识输入、标识未保存、新旧接口不兼容，再修改实现。第一次全量浏览器回归发现提示被折叠以及拖动坐标超出视窗，已修正提示位置与真实交互步骤，没有删除测试或增加跳过。

最终实际执行：

```powershell
# 仓库根目录；依赖隔离由现有测试配置及适配器提供。
$env:PYTHONIOENCODING = 'utf-8'
L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_freecad_api.py services/agent-service/tests/test_freecad_http_contract.py services/agent-service/tests/test_freecad_graph.py services/agent-service/tests/test_monitor_cad_production_proxy.py -q

$env:PLAYWRIGHT_MODULE_PATH = 'C:/Users/12587/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs'
$env:CHROME_EXECUTABLE = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
node --test --test-concurrency=1 tests/browser/freecad-workspace.test.mjs tests/browser/quality-empty-workspace.test.mjs

# frontend/monitor-react 目录
node --test
npm run build
```

| 验证 | 通过 | 失败 | 跳过 |
| --- | ---: | ---: | ---: |
| CAD API、HTTP、图、Monitor 代理契约 | 105 | 0 | 0 |
| 前端单元测试 | 201 | 0 | 0 |
| 真实 React / STL / WebGL 浏览器测试及空白质检页面保护 | 36 | 0 | 0 |

构建成功，仍有既有的大包体积提示；没有隐藏或提高提示阈值。最初使用项目 `.venv` 运行 pytest 时发现其没有 pytest，后续使用本机已安装依赖的 `L:/anaconda/python.exe`，没有安装新依赖。

只读访问 `http://127.0.0.1:8001/?view=cad` 返回 200，并确认引用本次生成的新前端脚本。浏览器截图已经检查，保存在 `.runtime/verification/freecad-workbench-browser/compact-named-design.png`；这是受控测试数据的界面截图，不是生产设备验收图。

本次未调用收费模型、未控制真实设备、未写入生产业务数据库，未执行全项目五服务验收，也未把隔离测试通过宣称为工业生产验收通过。

## 备份与恢复

改动前的九个源码及测试文件已按原目录结构备份到：

`L:\industry_agent\.runtime\backups\cad-part-identity-20261009-142035`

如需恢复，先另存本次之后的新修改，再将该备份中各文件复制回 `L:\industry_agent` 下的对应位置。备份只包含本次修改的源码与测试，不包含配置文件或密钥。

恢复前端源码后，在 `frontend/monitor-react` 重新执行 `npm run build`，即可重新生成旧源码对应的页面产物；不要混用不同版本的 `index.html` 和哈希脚本。恢复服务源码后，在确认没有正在运行的任务时通过现有启动方式重新加载 Agent。无需删除数据库、Redis、文件产物或任何数据卷。

## 补充：编号只显示五位（2026-10-09）

- 新需求的可选零件编号只接受五位数字，例如 `00123`；前导零保留。输入不足五位或含字母时显示错误且不提交建模。
- 已有五位编号原样展示。未填写编号或历史编号不符合新规则的设计，主界面显示五位“设计短号”。短号从完整运行编号稳定计算，仅用于展示，不保证全局唯一，不作为业务查询键。
- 完整运行编号仍用于查询、版本切换、幂等关联和下载。历史原始零件编号保留在技术记录及原存储中，修改历史模型时仍沿用原标识；没有重写或删除旧数据。
- 本次只修改生产建模前端及其测试，未修改后端编号校验、数据库、配置或质检实现，也未重启 Agent。当前页面已重新构建，刷新即可加载。

先新增测试确认旧页面仍显示完整长编号、允许 80 位输入，针对性浏览器测试出现 2 个预期失败；实现后针对性单元测试 7 项、浏览器测试 5 项全部通过。随后执行上述 `node --test`、两份浏览器测试及 `npm run build`：前端单元测试 **204 通过、0 失败、0 跳过**；浏览器测试 **43 通过、0 失败、0 跳过**；构建成功，原有大包警告保留。测试还检查显示短号碰撞时两个设计的实际产物地址仍不同，防止展示编号被误作唯一标识。

只读访问本地 CAD 页面返回 200，并确认引用 `index-Mhyxf3Uq.js`。本轮未重复运行后端或五服务测试，原因是改动仅涉及前端；未调用真实建模、收费模型或设备控制接口。

本轮修改前备份：`L:\industry_agent\.runtime\backups\cad-five-digit-number-20261009-145331`。恢复时先另存后续修改，将该备份中的五个源码、测试及文档文件按对应路径复制回项目，然后重新执行前端构建；不需要删除业务数据或数据卷。
