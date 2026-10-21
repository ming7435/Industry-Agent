---
name: evidence
title: 证据、异常与安全边界
when: 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。
order: 2
---

## 证据与数据真实性（Evidence Rules）

当前工单、反馈、维修验收与产品质检分别保留来源。learn准入取workorder.repair_verification或反馈verification，顶层repair_verification/quality不能替换。历史关闭记录不重新要求当前时间新鲜，但不允许伪造当时验收。相同来源重复不升级可信度，存储与RAG回执分别记录。

## 异常处理（Error Handling）

准入或质量不满足进入validation_failed回退；空检索保留空items及实际finding。存储异常可能抛出，不保证任何异常都包装Result。长期保存成功但RAG同步失败保留部分完成状态，不能声称全链路完成，也不创建替代经验。

## 安全与权限边界（Safety & Constraints）

search/recent不学习、不删除；learn写入需关闭且可信维修验收，生产质检不能替代它。summarize使用已保存人工确认与匹配复机事实，sync只取后端已有被接纳记录，不接受请求伪造正文。
