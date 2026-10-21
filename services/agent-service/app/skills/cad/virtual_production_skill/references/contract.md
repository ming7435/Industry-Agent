---
name: contract
title: 输入契约与真实示例
when: 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。
order: 3
---

## 输入与前置条件（Inputs）

公开Plan：command_id、design_run_id（FC-加64小写hex）、setup对象、material（1–200）、可选batch_id；提交/启动公共体ProgramIdentity仅digest，job_id在路径。sync用严格空体。run、actor、_virtual_context由服务器核实，不能作为客户端授权字段。

setup需stock_diameter_mm/stock_length_mm/grip_length_mm/clearance_mm/pass_depth_mm/spindle_rpm/feed_mm_per_rev/tolerance_mm/tool_id/device_id/postprocessor。有孔另需drill_tool_id/drill_diameter_mm；刀号1–99，钻头与车刀不同。设备固定TRAK-TC820LTYSI-001，postprocessor为virtual-trak-turning-v1。工艺值为有限正数，毛坯覆盖主体与夹持段；刀路点≤4000，时长≤604800秒。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "command_id": "example-turning",
  "design_run_id": "FC-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "material": "45钢",
  "setup": {
    "stock_diameter_mm": 50,
    "stock_length_mm": 80,
    "grip_length_mm": 20,
    "clearance_mm": 2,
    "pass_depth_mm": 1,
    "spindle_rpm": 800,
    "feed_mm_per_rev": 0.2,
    "tolerance_mm": 0.1,
    "tool_id": 1,
    "device_id": "TRAK-TC820LTYSI-001",
    "postprocessor": "virtual-trak-turning-v1"
  }
}
```

### 处理与依据

仅在示例design_run_id确有对应已校验圆柱、操作者和全部工艺核验通过时可到prepared；下面是返回片段示意，不代表本机已执行。

### 示例输出

```json
{
  "job_id": "SIM-JOB-cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
  "design_run_id": "FC-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "status": "prepared",
  "sync_status": "pending",
  "source": "factory-simulation",
  "simulation_only": true
}
```
