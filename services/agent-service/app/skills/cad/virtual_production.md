---
name: virtual_production_skill
version: 1.0
goal: 根据已校验的 CAD 版本生成并执行受限模拟加工任务。
trigger: virtual_production
steps:
  - id: prepare
    type: tool
    tool: prepare_virtual_production
    required_inputs: [command_id, run, setup, material]
    failure_policy: stop
  - id: submit
    type: tool
    tool: submit_virtual_production
    required_inputs: [job_id, digest]
    failure_policy: stop
  - id: start
    type: tool
    tool: start_virtual_production
    required_inputs: [job_id, digest]
    failure_policy: stop
  - id: sync
    type: tool
    tool: sync_virtual_production
    required_inputs: [job_id]
    failure_policy: stop
tools: [prepare_virtual_production, submit_virtual_production, start_virtual_production, sync_virtual_production]
failure_policy: stop
---

仅接受服务端核实的模拟工厂、登录人员和明确动作。准备、下发与启动分别执行；未知结果按原指令读取核对，禁止自动重放启动、恢复设备或生成替代任务。模拟产出不作为实物制造验收证据。
