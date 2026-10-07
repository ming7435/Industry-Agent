# 本地设备图纸接入与验证

2026-10-07：`frontend/monitor-react/public/drawings` 中的三份设备图纸确实存在。原故障是 Document CAD 只查询 MySQL 工程元数据，没有关联这些前端静态文件；修复前实际查询返回空数组，数据库 `cad_drawings`、`cad_entities` 均为 0。不能据此认定设备没有图纸。

## 文件与设备对应关系

| 设备 | 文件 | 核实内容 |
| --- | --- | --- |
| TRAK-TC820LTYSI-001 | TC820si.html | 原生 eDrawings/HOOPS 模型，包含内嵌 SC_MODEL_DATA |
| LNS-QL-SERVO-80-S2-001 | QLS80S2.html | 四张 LNS 原厂安装尺寸图及程序构建的三维参考模型 |
| RENISHAW-EQUATOR300-001 | Equator300.html | RENISHAW 防碰撞尺寸原图及程序构建的三维参考模型 |

三份文件原文未修改。HTML 中的设备尺寸图、参考模型及部件名称不能直接证明本次故障部件的料号、材料或 BOM；此轮保留来源并标记设备级资料，不生成不存在的工程记录。

## 修复结果

- 共享只读目录按确切设备/型号查找文件。CAD 的图纸查询与工程查询在没有匹配数据库记录时返回文件链接；错误设备、冲突型号、未声明的项目/版本等范围不匹配。数据库故障仍返回错误。
- 健康检查独立显示 `reference_drawings: 3`，原工程 `records: 0` 如实保留。每次查询只检查文件状态，不读取或执行大体积 HTML。
- 已保存且未就绪、没有工单的维修方案也显示“设备图纸参考”入口。新方案保留 `engineering_context.available_drawings`、查看器和来源信息，前端兼容旧的 `reference_drawings` 字段。
- 需要拆修的方案继续核验 CAD 状态、部件和 BOM；明确失败的工程校验不能因存在设备图纸而变为通过。有设备图纸时明确提示故障部件级资料缺项。
- 当前历史方案不重新诊断、不改写原校验结果。实际页面已显示“查看 TC820LTYsi 原始设备图纸”，该历史方案仍为未就绪，原诊断判定无需维修。

## 验证

新增回归先失败后通过，日志位于 `.runtime/verification/local-drawings-20261007/`。

| 范围 | 结果 |
| --- | --- |
| Agent 非 CAD / BuildCAD 套件 | 872 通过 |
| 最后补充无设备范围保护后，方案返回、设备范围相关回归 | 16 通过 |
| Document CAD 全套 | 66 通过，1 项因 Windows 不允许创建符号链接跳过；路径越界保护有独立通过用例 |
| Maintenance 相关回归 | 91 通过，包含于上述 Agent 套件 |
| 前端 Node 全套 | 121 通过 |
| 图纸浏览器回归 | 最终 4 通过；此前与现有自动派发 6 项联合运行 9 项通过 |
| 前端构建 | 成功，产物 `index-BLATuAZE.js`；保留原有包体积提示 |

实际服务已经加载修改，验收脚本 `verify-live.py` 完成六次三设备图纸/工程查询和四项错误范围检查；三份实际 HTTP 文件的 SHA-256 与源文件全部一致。现有 1 条方案返回正确图纸链接。`verify-live-browser.mjs` 直接访问当前运行页面，验证图纸入口、未就绪状态及零 JavaScript 异常，无业务写请求。

统一重启仅处理校验过身份的应用进程；Factory PID 20144 及其创建时间不变。没有写入图纸数据库、创建工单、注入故障、调用收费模型或安装 CAD 环境。

证据：`live-verification.json`、`live-browser.json`、`html-facts.md`、`drawing-metadata.json`、`cad-implementation-result.md`、`maintenance-result.md`、`frontend-canonical-result.md`、`agent-noncad.xml`、`returns-final-green.log`。
