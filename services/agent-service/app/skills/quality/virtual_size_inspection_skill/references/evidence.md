---
name: evidence
title: 证据、异常与安全边界
when: 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。
order: 2
---

## 证据与数据真实性（Evidence Rules）

Backend读取同操作者任务的已保存产出；job需completed/sync_status=confirmed，产出digest匹配，模拟标识source=factory-simulation/simulation_only=True/synthetic=True正确且不可丢。scope=machining-zone，不等于实物设计验收。

## 异常处理（Error Handling）

任务或摘要/归属不符拒绝；身份错误review，实际值缺失insufficient_data，实测不一致fail，全部一致pass。私有授权上下文缺失时A2A端点抛A2AError，不会生成failed QualityResponse；不得用用户输入测量替代后端产出。

## 安全与权限边界（Safety & Constraints）

仅模拟结果比较，不接受真实设备指令，不声称实物制造验收。synthetic=True是这个域的必要身份，不能套常规生产QMS禁止合成数据的规则。
