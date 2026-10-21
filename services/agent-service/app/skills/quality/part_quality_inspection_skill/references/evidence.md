---
name: evidence
title: 证据、异常与安全边界
when: 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。
order: 2
---

## 证据与数据真实性（Evidence Rules）

核对零件编号、批次、生产记录时刻、设计run_id/digest和适用范围。CAD基准必须来自completed且valid/step_roundtrip的实际设计，不能用网页草稿或另一版本代替。正式生产检测不使用synthetic/degraded记录；虚拟尺寸技能另有独立模拟身份规则。实测缺项、不同版本和真实不合格必须区分。

## 异常处理（Error Handling）

生产记录未找到、身份未核实、规格缺失或版本不符不能判合格。工具失败保留失败体；缺必需参数为insufficient_data，已测不一致为fail，需人工核实为review。查到记录不等于完成检测，录入passed也不代替独立比较。

## 安全与权限边界（Safety & Constraints）

仅检测生产后的零件与实际基准，不维修机器、不启动产线。正式申诉/整改/复检/Release/Close受服务端权限和事务门禁限制；文档不能让模型虚构检测值或以passed=true绕过核验。
