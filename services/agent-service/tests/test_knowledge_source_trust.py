"""检索来源的演示标记必须贯穿文档和证据副本，不能变成真实液压依据。"""
from copy import deepcopy

import pytest

from app.agents.knowledge.agent import KnowledgeAgent
from app.workorder.repair_profile import hydraulic_checking_evidence


def source_document(**changes):
    return {
        "document_id": "HYDRAULIC-SOP", "title": "液压停机核查",
        "content": "保持停机，检查液压油位、可见泄漏和压力反馈并记录。",
        "source": "isolated-source", "score": 0.9, "metadata": {"knowledge_type": "sop"},
        **changes,
    }


@pytest.mark.parametrize("location", ["document", "metadata"])
def test_synthetic_document_and_evidence_copy_cannot_validate_hydraulic_scope(location):
    original = source_document()
    if location == "document":
        original["synthetic"] = True
    else:
        original["metadata"]["synthetic"] = True
    before = deepcopy(original)
    documents = KnowledgeAgent._deduplicate_documents([original])
    evidence = KnowledgeAgent._evidence_from_documents(documents)
    pack = {"documents": [document.model_dump(mode="json") for document in documents], "evidence": evidence}
    assert hydraulic_checking_evidence(pack) is False
    assert documents[0].metadata["synthetic"] is True
    assert evidence[0]["synthetic"] is True
    assert original == before


@pytest.mark.parametrize("reverse", [False, True])
def test_duplicate_source_cannot_drop_explicit_synthetic_marker(reverse):
    candidates = [source_document(synthetic=True, score=0.3), source_document(score=0.95)]
    if reverse:
        candidates.reverse()
    documents = KnowledgeAgent._deduplicate_documents(candidates)
    pack = {"documents": [document.model_dump(mode="json") for document in documents],
            "evidence": KnowledgeAgent._evidence_from_documents(documents)}
    assert len(documents) == 1
    assert hydraulic_checking_evidence(pack) is False


def test_unmarked_real_source_still_supplies_hydraulic_checking_evidence():
    documents = KnowledgeAgent._deduplicate_documents([source_document()])
    assert hydraulic_checking_evidence({
        "documents": [document.model_dump(mode="json") for document in documents],
        "evidence": KnowledgeAgent._evidence_from_documents(documents),
    }) is True


@pytest.mark.parametrize("entry", ["direct", "graph_result"])
def test_synthetic_retrieval_result_keeps_its_source_marker(entry):
    raw = {"synthetic": True, "documents": [source_document()], "source": "isolated-source"}

    class Tools:
        def execute(self, *_args, **_kwargs):
            return deepcopy(raw)

    agent = KnowledgeAgent(tools=Tools())
    if entry == "direct":
        result = agent.search_knowledge("液压停机核查")
    else:
        documents = KnowledgeAgent._deduplicate_documents(raw["documents"])
        result = agent._build_result(
            request={}, query="液压停机核查", query_type="sop", documents=raw["documents"],
            evidence=KnowledgeAgent._evidence_from_documents(documents), status="completed",
            observations=[{"result": raw}], validation_findings=[],
        )
    assert hydraulic_checking_evidence(result.model_dump(mode="json")) is False
    assert result.synthetic is True
