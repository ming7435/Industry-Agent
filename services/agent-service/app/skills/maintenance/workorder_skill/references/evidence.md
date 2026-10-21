---
name: evidence
title: 证据、异常与安全边界
when: 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。
order: 2
---

## 证据与数据真实性（Evidence Rules）

关联本次设备、事件、报警与方案；知识/SOP正文、工程部件/BOM、备件记录分别保留来源。设备总图或reference_only记录不能替代故障部件依据；synthetic/degraded工程和demo_only库存不作正式就绪证明。复用同源资料不重复增加可信度，冲突留在validation_findings。

## 异常处理（Error Handling）

缺诊断或证据时输出未就绪计划；工具草案、查询或库存失败保留来源和finding；互锁/液压与诊断范围错配不能套用普通换件。资料不足不补编库存、工时、备件或安全步骤已执行。Graph本身不执行无限重试；外部协作故障交原状态返回。

## 安全与权限边界（Safety & Constraints）

只负责维修方案及受条件控制的草稿。不能正式创建/派发/关闭工单，不能控制机器、领料、旁路互锁或无依据确定换件。constraints.need_workorder 不绕过方案校验。
