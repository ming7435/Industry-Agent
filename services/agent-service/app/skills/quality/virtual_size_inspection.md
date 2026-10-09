---
name: virtual_size_inspection_skill
version: 1.0
goal: 对工厂已保存的模拟加工尺寸与原设计版本执行确定性比较。
trigger: virtual_profile_dimensions_v1
steps:
  - id: inspect
    type: tool
    tool: inspect_virtual_output
    required_inputs: [part_id, output_digest]
    failure_policy: stop
tools: [inspect_virtual_output]
failure_policy: stop
---

标准来自任务的固定 CAD 快照，实际值来自工厂完成回执。不得生成观测、随机注入缺陷或使用名义尺寸补齐缺测值。采用 Decimal 精确比较；不依据仿真精度判断制造公差，不写入正式质检或放行记录。
