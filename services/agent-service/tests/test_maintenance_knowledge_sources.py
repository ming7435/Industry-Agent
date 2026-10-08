"""维修依据检索覆盖案例/SOP来源，普通报警解释保持原检索范围。"""
from app.agents.knowledge.agent import KnowledgeAgent
from app.agents.knowledge.schemas import KnowledgeQuery
from app.runtime.dispatcher import RuntimeDispatcher
from app.tools.registry import ToolRegistry


class IsolatedRag:
    """仅隔离外部检索，实际运行 Graph、工具过滤器及证据校验。"""
    def __init__(self, empty=False):
        self.calls = []
        self.empty = empty

    def search(self, query, *, limit, filters):
        self.calls.append({'query': query, 'limit': limit, 'filters': dict(filters)})
        kind = filters.get('knowledge_type') or 'alarm'
        if self.empty or kind == 'sop':
            return {'documents': [], 'source': 'isolated-rag'}
        is_case = kind == 'case'
        return {'source': 'isolated-rag', 'documents': [{
            'document_id': 'CASE-HYDRAULIC' if is_case else 'ALARM-INDEX',
            'title': '液压压力未达到处理卡片' if is_case else '报警目录',
            'content': 'TC820LTYsi 700010 液压压力未达到，检查油位及外部可见泄漏。' if is_case else '700010 液压压力未达到',
            'source': 'isolated-manual', 'score': 0.9,
            'metadata': {'knowledge_type': kind, 'device_id': 'TRAK-TC820LTYSI-001'},
        }]}


def maintenance_task(payload=None):
    return RuntimeDispatcher._task_for_agent('document_search', {
        'diagnosis': {'device_id': 'TRAK-TC820LTYSI-001', 'alarm_code': '700010',
                      'alarm_definition': {'name': '液压压力未达到', 'found': True}},
        'event': {'device_id': 'TRAK-TC820LTYSI-001', 'device_model': 'TC820LTYsi', 'alarm_code': '700010'},
    }, payload or {})


def test_runtime_marks_diagnosed_alarm_search_as_maintenance_without_requiring_every_source():
    request = KnowledgeQuery.from_payload(maintenance_task()).model_dump()
    assert request.get('purpose') == 'maintenance'
    assert request['required_sources'] == []
    assert request['max_steps'] == 4


def test_maintenance_alarm_retrieves_case_evidence_even_when_sop_is_empty():
    rag = IsolatedRag()
    result = KnowledgeAgent(ToolRegistry(rag_client=rag)).run(maintenance_task())
    assert 'CASE-HYDRAULIC' in [document.document_id for document in result.documents]
    assert sorted(call['filters'].get('knowledge_type', '') for call in rag.calls) == ['', 'alarm', 'case', 'sop']
    assert all(call['filters']['device_id'] == 'TRAK-TC820LTYSI-001' for call in rag.calls)
    assert result.status == 'completed'
    assert not result.validation_findings


def test_explicit_maintenance_query_preserves_purpose_and_queries_all_four_sources():
    rag = IsolatedRag()
    task = maintenance_task({'query': 'TC820LTYsi 700010 液压现场检查', 'purpose': 'maintenance'})
    result = KnowledgeAgent(ToolRegistry(rag_client=rag)).run(task)
    assert 'CASE-HYDRAULIC' in [document.document_id for document in result.documents]
    assert len(rag.calls) == 4
    assert all(call['query'] == 'TC820LTYsi 700010 液压现场检查' for call in rag.calls)


def test_ordinary_alarm_explanation_does_not_force_sop_or_case_search():
    rag = IsolatedRag()
    result = KnowledgeAgent(ToolRegistry(rag_client=rag)).run({
        'query': '700010 是什么意思？', 'device_id': 'TRAK-TC820LTYSI-001', 'alarm_code': '700010',
    })
    assert [call['filters'].get('knowledge_type', '') for call in rag.calls] == ['alarm', '']
    assert result.status == 'completed'
    assert not result.validation_findings


def test_maintenance_search_stays_within_callers_smaller_budget():
    rag = IsolatedRag()
    KnowledgeAgent(ToolRegistry(rag_client=rag)).run({**maintenance_task(), 'max_steps': 2})
    assert len(rag.calls) == 2


def test_empty_maintenance_search_reports_missing_evidence_without_exceeding_budget():
    rag = IsolatedRag(empty=True)
    result = KnowledgeAgent(ToolRegistry(rag_client=rag)).run(maintenance_task())
    assert len(rag.calls) == 4
    assert result.status == 'insufficient_evidence'
    assert not result.documents


def test_single_alarm_lookup_cache_cannot_replace_complementary_maintenance_search():
    task = maintenance_task()
    state = {'diagnosis': {'tool_calls': [{
        'name': 'search_alarm_knowledge', 'arguments': {'query': task['query']},
        'result': {'documents': [{'document_id': 'ALARM-INDEX', 'content': '700010 液压压力未达到'}]},
    }]}}
    assert RuntimeDispatcher._cached_knowledge_result(state, task) is None
    assert RuntimeDispatcher._cached_knowledge_result(state, {**task, 'purpose': ''}) is not None
