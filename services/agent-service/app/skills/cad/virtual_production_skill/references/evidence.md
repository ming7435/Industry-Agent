---
name: evidence
title: 证据、异常与安全边界
when: 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。
order: 2
---

## 证据与数据真实性（Evidence Rules）

设计必须已完成且valid/step_roundtrip、单实体、毫米，非synthetic/degraded；仅圆柱或单同轴贯穿孔可生成受限模拟车削。job/design/program/output各摘要一致并绑定操作者；source=factory-simulation与simulation_only=True明确标记，不把模拟产出当实物测量。

## 异常处理（Error Handling）

重复command_id但设计/工艺变化拒绝；任务归属、摘要、状态冲突或工厂未知返回现有VirtualProductionError/code/message/status。review/outcome_unknown不能包装接收成功，读取失败不重启任务。

## 安全与权限边界（Safety & Constraints）

严格仅模拟工厂且服务端登记人员授权；不得调用真实PLC/CNC。毛坯/刀具/工艺需要明确输入，不能以示例参数替代。同步不能自动启动、复机或创建替代任务。
