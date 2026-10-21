---
name: evidence
title: 证据、异常与安全边界
when: 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。
order: 2
---

## 证据与数据真实性（Evidence Rules）

每个存在的事实章节附source_refs（section/type/id/source/label），区分事件、诊断、建议、实际反馈、维修验收与执行计数。空trace的0计数结构不是Agent执行证明。产品quality仅属于quality_report，不能用其通过证明维修恢复；其它报告不塞产品质量记录。

## 异常处理（Error Handling）

读记录异常保留found=False/success=False/error；资料不足但有章节时可compose并status=incomplete，可按persist要求保存。保存未确认保留incomplete/report_persistence_failed。空资料按原fallback。不能把空默认file_path填成不存在文件。

## 安全与权限边界（Safety & Constraints）

只汇总已有事实，不诊断、维修、派发、复机或重新做检测。不使用原有引用替代本事件身份。报告正文保存与生成可打开下载的真实PDF必须分别核验。
