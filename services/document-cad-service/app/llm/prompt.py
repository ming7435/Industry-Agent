"""Prompt templates for grounded industrial-maintenance diagnosis.

The prompt has one job: force the model to answer *from the retrieved evidence*
and to mark which evidence supports which claim.  Three details matter for the
industrial setting:

* the answer is written for a shop-floor technician, so it is structured as
  ``故障判断 / 可能原因 / 排查步骤 / 维修建议 / 安全提示`` instead of prose;
* every conclusion must carry a ``[n]`` citation, which makes the answer
  auditable against the maintenance manual;
* safety-critical actions (de-energising, depressurising, hot surfaces) must be
  surfaced explicitly rather than buried in the steps.
"""

from __future__ import annotations

SYSTEM_PROMPT = """你是一名资深工业设备维修诊断专家，服务于机械制造产线的设备运维团队。
你基于检索到的现场证据（设备报警记录、历史维修案例、设备维修手册、标准作业流程）为一线维修人员提供诊断与维修建议。

必须严格遵守以下规则：
1. 只能依据【证据】中的内容进行推断，禁止编造设备型号、故障码、参数阈值、备件号或维修步骤。
2. 每个关键结论后面用方括号标注其依据的证据编号，例如：[1][3]。没有证据支撑的判断必须明确标注为“推测”。
3. 若现有证据不足以定位故障，直接说明“现有证据不足”，并给出需要补充采集的信息或下一步排查动作，不要强行给出结论。
4. 涉及安全风险的操作（断电、验电、泄压、降温、高处作业、吊装、受限空间等）必须在“安全提示”中单独列出。
5. 使用简体中文回答，句子简短、动作可执行、可验证，避免空话和营销式表述。
6. 不要重复证据原文，要给出归纳后的判断和可执行动作。
"""

_EMPTY_EVIDENCE = "（未检索到可用证据）"

_USER_TEMPLATE = """【用户问题】
{query}

【证据】
{evidence}

请严格依据上述证据，按以下结构作答：

一、故障判断：一句话给出最可能的结论，并标注依据的证据编号。
二、可能原因：按可能性从高到低排序，逐条说明机理并标注证据编号。
三、排查步骤：按执行顺序编号，每步写明“做什么、如何确认正常/异常、异常时如何处理”。
四、维修建议：包含所需备件/工具、关键参数、复位或试运行要求。
五、安全提示：列出本次作业必须遵守的安全措施。

若证据不足以支撑某一项，请在该项下明确写“现有证据不足，需补充：……”。"""


def build_user_prompt(query: str, evidence_text: str) -> str:
    """Build the user message of the diagnosis prompt.

    Args:
        query: The user's fault description.
        evidence_text: Citation-formatted evidence produced by
            :func:`app.evidence.citation.format_citations`.

    Returns:
        The fully rendered user message.
    """
    evidence = (evidence_text or "").strip() or _EMPTY_EVIDENCE
    return _USER_TEMPLATE.format(query=(query or "").strip(), evidence=evidence)


def build_messages(query: str, evidence_text: str) -> list[dict[str, str]]:
    """Build the chat message list sent to DeepSeek.

    Args:
        query: The user's fault description.
        evidence_text: Citation-formatted evidence.

    Returns:
        ``[{"role": "system", ...}, {"role": "user", ...}]``, ready for
        ``chat.completions.create(messages=...)``.
    """
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": build_user_prompt(query, evidence_text)},
    ]
