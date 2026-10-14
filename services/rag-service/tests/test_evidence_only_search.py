"""内部取证不生成回答；真实 HTTP 路由和管道仍返回经过校验的证据。"""
import asyncio

import httpx
import pytest

from app.api.documents import DocumentStore
from app.api.models import SearchRequest
from app.api.pipeline import SearchPipeline
from app.clients.model import RemoteLLM, RemoteReranker
from test_online_connectivity import isolated_pipeline, local_model_server, search_app


@pytest.mark.parametrize('generate_answer, expected_calls', [(False, 0), (True, 1)])
def test_search_only_calls_chat_when_an_answer_is_requested(tmp_path, monkeypatch, generate_answer, expected_calls):
    responses = {
        '/v1/chat/completions': (200, {'choices': [{'message': {'content': '检查轴承 [1]'}}]}, 0),
        '/v1/rerank': (200, {'results': [{'index': 0, 'relevance_score': .95}]}, 0),
    }
    with local_model_server(responses) as (url, calls):
        monkeypatch.setenv('MODEL_SERVICE_BASE_URL', url)
        base = isolated_pipeline(tmp_path)
        pipeline = SearchPipeline(base._bm25, None, None, RemoteReranker(), RemoteLLM())
        app = search_app(monkeypatch, lambda: pipeline, DocumentStore(str(tmp_path / 'documents.sqlite3')))

        async def query():
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://isolated',
                    headers={'Authorization': 'Bearer isolated-rag-token'}) as client:
                return await client.post('/search', json={'query': 'bearing repair', 'top_n': 1,
                                                         'generate_answer': generate_answer})

        response = asyncio.run(query())
    assert response.status_code == 200
    value = response.json()
    assert value['hits'][0]['chunk_id'] == 'case:1'
    assert value['evidence_status'] == 'ready'
    assert 'bearing repair' in value['evidence_text']
    assert len([path for path, _ in calls if path == '/v1/chat/completions']) == expected_calls
    assert len([path for path, _ in calls if path == '/v1/rerank']) == 1
    assert value['generation_requested'] is generate_answer
    if generate_answer:
        assert value['answer'] == '检查轴承 [1]'
        assert value['grounded'] is True
    else:
        assert value['answer'] == ''
        assert value['model_metadata'] == {}
        assert value['latency_ms']['llm'] == 0
        assert value['citation_status'] == 'not_applicable'
        assert value['grounded'] is False


def test_evidence_only_does_not_report_missing_chat_as_a_generation_failure(tmp_path):
    pipeline = isolated_pipeline(tmp_path)
    result = asyncio.run(pipeline.search(SearchRequest(query='bearing', generate_answer=False), 'EVIDENCE-1'))
    assert result.evidence_status == 'ready'
    assert result.degrade_reason != 'llm_timeout'
    assert result.answer == ''
    assert result.generation_requested is False


def test_public_search_defaults_to_generating_an_answer(tmp_path, monkeypatch):
    with local_model_server({'/v1/chat/completions': (200,
            {'choices': [{'message': {'content': '轴承检查 [1]'}}]}, 0)}) as (url, calls):
        monkeypatch.setenv('MODEL_SERVICE_BASE_URL', url)
        pipeline = isolated_pipeline(tmp_path)
        pipeline._llm = RemoteLLM()
        result = asyncio.run(pipeline.search(SearchRequest(query='bearing'), 'QUESTION-1'))
    assert result.answer == '轴承检查 [1]'
    assert len(calls) == 1


@pytest.mark.parametrize('invalid', ['false', 0, None])
def test_generation_mode_rejects_non_boolean_values(invalid):
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        SearchRequest(query='bearing', generate_answer=invalid)
