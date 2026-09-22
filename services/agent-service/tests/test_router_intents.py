def test_repair_intent_beats_cad_component_words():
    from app.agents.router.agent import RouterAgent

    intent, _ = RouterAgent._classify_intent("主轴轴承坏了怎么维修", {})
    assert intent == "maintenance"


def test_router_uses_shared_numeric_alarm_parser():
    from app.agents.router.agent import RouterAgent

    entities = RouterAgent._extract_entities("设备 700223 为什么报警", {})
    assert entities["alarm_code"] == "700223"
    intent, _ = RouterAgent._classify_intent("设备 700223 是什么含义", entities)
    assert intent == "knowledge"
