from app.agents.knowledge.agent import KnowledgeAgent
from app.agents.knowledge.schemas import KnowledgeQuery


def test_knowledge_query_keeps_active_alarm_scope_for_rag_client():
    request = KnowledgeQuery.from_payload({
        "query": "报警怎么处理",
        "alarm_active": True,
        "device_id": "MACHINE-001",
        "alarm_code": "ALM-001",
    })

    assert request.filters["alarm_active"] is True
    assert request.filters["device_id"] == "MACHINE-001"
    assert request.filters["alarm_code"] == "ALM-001"


def test_knowledge_answer_adds_grounded_final_summary_and_removes_duplicate_blocks():
    answer = "**故障判断：** 先核对报警码。[1]\n\n排查报警映射。[2]\n\n排查报警映射。[2]"

    formatted = KnowledgeAgent._format_grounded_answer(
        answer,
        query="设备 MACHINE-001 报警 ALM-001 怎么处理",
        documents=[{"title": "报警手册", "document_id": "DOC-1"}],
        retrieval_scope="device",
    )

    assert formatted.count("排查报警映射") == 1
    assert "**最后总结：**" in formatted
    assert "当前报警机器" in formatted
