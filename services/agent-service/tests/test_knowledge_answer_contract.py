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


def test_knowledge_documents_bound_external_retrieval_scores() -> None:
    documents = KnowledgeAgent._deduplicate_documents([
        {
            "document_id": "DOC-HIGH",
            "title": "报警定义",
            "content": "内容",
            "source": "bm25",
            "score": 3.0,
        },
        {
            "document_id": "DOC-MID",
            "title": "辅助检查",
            "content": "内容",
            "source": "bm25",
            "score": 1.5,
        },
        {
            "document_id": "DOC-LOW",
            "title": "辅助说明",
            "content": "内容",
            "source": "bm25",
            "score": -1.0,
        },
        {
            "document_id": "DOC-INVALID",
            "title": "异常分数",
            "content": "内容",
            "source": "bm25",
            "score": float("inf"),
        },
    ])

    assert [document.score for document in documents] == [1.0, 0.5, 0.0, 0.0]


def test_empty_knowledge_results_return_an_empty_evidence_list() -> None:
    assert KnowledgeAgent._deduplicate_documents([]) == []


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


def test_knowledge_answer_builds_chinese_fallback_when_model_returns_empty():
    formatted = KnowledgeAgent._format_grounded_answer(
        "",
        query="主轴温度过高怎么检查",
        documents=[
            {
                "title": "主轴温升检查SOP",
                "content": "检查冷却液流量、冷却泵、散热器和主轴负载；温度恢复后空载运行确认。",
                "document_id": "SOP-1",
            }
        ],
        retrieval_scope="all",
    )

    assert "主轴温升检查SOP" in formatted
    assert "检查冷却液流量" in formatted
    assert "没有可展示的回答" not in formatted
    assert "以原文为准" not in formatted
    assert "以手册为准" not in formatted


def test_knowledge_answer_removes_internal_manual_disclaimer():
    formatted = KnowledgeAgent._format_grounded_answer(
        "检查冷却系统并复测。具体操作请以设备官方维修手册为准。",
        query="主轴温度异常怎么检查",
        documents=[{"title": "温升检查", "document_id": "DOC-1"}],
        retrieval_scope="device",
    )

    assert "检查冷却系统并复测" in formatted
    assert "官方维修手册为准" not in formatted


def test_knowledge_fallback_hides_retrieval_table_metadata():
    formatted = KnowledgeAgent._format_grounded_answer(
        "",
        query="对比仪有哪些故障",
        documents=[
            {
                "title": "报警码卡片",
                "content": "文档: alarms.pdf 页码: 98 内容类型: table [table | 第98页 | p98-table1-part1] 表格行1: 故障名称 fault_name_zh/TC-700007 · 700007 对刀仪升降错误：检查反馈信号。: 报警码 alarm_code；对刀仪升降错误：检查反馈信号。: 英文原名 alarm_message_en；Tool probe up/down error",
                "document_id": "DOC-1",
            }
        ],
        retrieval_scope="all",
    )

    assert "对刀仪升降错误" in formatted
    assert "内容类型" not in formatted
    assert "表格行1" not in formatted
    assert "[table" not in formatted
    assert "alarm_code" not in formatted
    assert "fault_name_zh" not in formatted
    assert "alarm_message_en" not in formatted
    assert "Tool probe" not in formatted
