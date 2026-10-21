---
name: evidence
title: 证据、异常与安全边界
when: 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。
order: 2
---

## 证据与数据真实性（Evidence Rules）

按部件、设备、机型和工程编号关联parts/drawings/bom/relations/locations。指定设备的部件必须带一致device_id；关系两端及图纸归属不能用相似标题猜测。空结果不悄悄退回无关设备全库，不把演示模型当维修证据。

## 异常处理（Error Handling）

工具异常写入失败观察，在有限计划内继续互补查询并最终校验；无部件、必要编号/图纸/BOM/关系/位置缺失返回insufficient_engineering_data，不补造记录。远程不可用保留backend_status/degraded/warning和实际finding。

## 安全与权限边界（Safety & Constraints）

只读工程定位不授权领料、维修派发或设备控制。用户文字不能启用建模；结构化operation和受控服务端入口决定建模或虚拟生产分支。
