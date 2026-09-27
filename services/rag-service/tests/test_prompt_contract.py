from app.llm.prompt import SYSTEM_PROMPT, build_user_prompt


def test_grounded_prompt_requires_colored_ui_markdown_targets_and_final_summary():
    prompt = build_user_prompt("设备报警怎么处理", "[1] 报警手册：先断电并确认安全状态")

    assert "七、最后总结" in prompt
    assert "只能依据【证据】" in SYSTEM_PROMPT
    assert "**" in SYSTEM_PROMPT
