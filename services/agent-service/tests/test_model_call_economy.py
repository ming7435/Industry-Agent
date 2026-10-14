"""通过真实 Agent、工具和 RAG HTTP 客户端检验不必要调用的削减。"""
from contextlib import contextmanager
from dataclasses import replace
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from threading import Thread
from types import SimpleNamespace

import pytest

from app.agents.knowledge.agent import KnowledgeAgent
from app.agents.knowledge.planning import skill_plan
from app.agents.knowledge.schemas import KnowledgeQuery
from app.harness.trace import TraceRecorder
from app.rag.client import RAGServiceClient
from app.runtime.dispatcher import RuntimeDispatcher
from app.skills.registry import SkillRegistry
from app.tools.registry import ToolRegistry


@contextmanager
def isolated_rag_server(*, empty_device=False):
    calls = []
    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            payload = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            calls.append(payload)
            corpus = payload.get('filters', {}).get('corpus', 'cases')
            hits = [] if empty_device and payload.get('filters', {}).get('device_id') else [{
                'chunk_id': corpus + ':1', 'text': '主轴轴承异常检查步骤', 'score': .95,
                'metadata': {'corpus': corpus, 'source_name': '轴承手册', 'device_id': 'D-1'},
            }]
            result = {'hits': hits, 'answer': '模型回答 [1]' if payload.get('generate_answer', True) else '',
                      'evidence_status': 'ready' if hits else 'insufficient', 'degraded': False}
            encoded = json.dumps(result, ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)
        def log_message(self, *_args):
            pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    worker = Thread(target=server.serve_forever, kwargs={'poll_interval': .01}, daemon=True)
    worker.start()
    try:
        yield RAGServiceClient(base_url=f'http://127.0.0.1:{server.server_port}'), calls
    finally:
        server.shutdown()
        server.server_close()
        worker.join(1)


@pytest.mark.parametrize('tool', ['search_knowledge', 'search_alarm_knowledge', 'search_sop',
                                 'search_manual', 'search_fault_cases', 'search_semantic_memory'])
def test_diagnosis_search_tools_cannot_enable_unneeded_answer_generation(tool):
    with isolated_rag_server() as (rag, calls):
        registry = ToolRegistry(rag_client=rag, trace=TraceRecorder())
        result = registry.execute(tool, {'query': '主轴轴承异常', 'generate_answer': True},
                                  context={'agent': 'diagnosis'})
    assert result['documents']
    assert result['answer'] == ''
    assert calls[0]['generate_answer'] is False


@pytest.mark.parametrize('tool', ['search_knowledge', 'search_alarm_knowledge', 'search_sop',
                                 'search_manual', 'search_fault_cases', 'search_semantic_memory'])
def test_direct_search_methods_preserve_explicit_evidence_only_mode(tool):
    with isolated_rag_server() as (rag, calls):
        result = getattr(ToolRegistry(rag_client=rag), tool)('主轴轴承异常', generate_answer=False)
    assert result['documents']
    assert result['answer'] == ''
    assert calls[0]['generate_answer'] is False


@pytest.mark.parametrize('purpose, generate_answer', [('maintenance', False), ('', False), ('', True)])
def test_knowledge_graph_preserves_evidence_mode_through_all_search_paths(purpose, generate_answer):
    with isolated_rag_server() as (rag, calls):
        result = KnowledgeAgent(ToolRegistry(rag_client=rag)).run({
            'query': '主轴轴承异常', 'device_id': 'D-1', 'purpose': purpose, 'generate_answer': generate_answer,
        })
    assert result.documents
    assert result.evidence
    assert len(calls) >= 2
    want = generate_answer and purpose != 'maintenance'
    assert all(payload.get('generate_answer', True) is want for payload in calls)
    if not want:
        assert result.answer == '', '只取证不应冒充已生成面向用户的回答'
    else:
        assert '模型回答' in result.answer


def test_scoped_alarm_fallback_retains_evidence_only_mode():
    with isolated_rag_server(empty_device=True) as (rag, calls):
        result = rag.search('报警检查', filters={'device_id': 'D-1', 'alarm_active': True}, generate_answer=False)
    assert result['documents']
    assert result['retrieval_fallback'] is True
    assert len(calls) == 2
    assert all(payload['generate_answer'] is False for payload in calls)


@pytest.mark.parametrize('state, capability, want', [
    ({'entry': 'trigger', 'event': {'device_id': 'D-1', 'alarm_code': '700001'}}, 'document_search', False),
    ({'entry': 'user', 'diagnosis': {'fault': '轴承异常'}}, 'document_search', False),
    ({'entry': 'user', 'user_text': '轴承怎么检查'}, 'document_search', True),
    ({'entry': 'user'}, 'evidence_retrieval', False),
])
def test_runtime_selects_generation_mode_by_business_purpose(state, capability, want):
    task = RuntimeDispatcher._task_for_agent(capability, state, {})
    assert task['generate_answer'] is want


def test_internal_a2a_provider_delivers_evidence_only_to_real_knowledge_agent():
    from app.a2a.client import A2AClient
    from app.a2a.endpoints import A2AEndpoints
    from app.a2a.requests import A2ARequests
    with isolated_rag_server() as (rag, calls):
        agent = KnowledgeAgent(ToolRegistry(rag_client=rag))
        endpoints = A2AEndpoints({'knowledge': SimpleNamespace(execute_agent=agent.run)})
        client = A2AClient()
        client.register('knowledge', endpoints._knowledge_endpoint)
        result = A2ARequests(client).request_knowledge_for_diagnosis({'device_id': 'D-1'}, '主轴轴承异常')
    assert result['documents']
    assert all(payload['generate_answer'] is False for payload in calls)


def test_single_retrieval_option_does_not_call_a_model():
    calls = []
    def chat(messages, **_kwargs):
        calls.append(messages)
        return {'choices': [{'message': {'content': '{"retrieval_plan":["search_sop"]}'}}]}
    agent = SimpleNamespace(client=SimpleNamespace(available=True, chat=chat))
    result, consumed = skill_plan(agent, [SimpleNamespace(document='核对 SOP')], {'query': '检索规程'}, ['search_sop'])
    assert result == ['search_sop']
    assert consumed is False
    assert calls == []


def test_multiple_retrieval_choices_still_use_skill_model_order():
    calls = []
    def chat(messages, **_kwargs):
        calls.append(messages)
        return {'choices': [{'message': {'content': '{"retrieval_plan":["search_sop","search_manual"]}'}}]}
    result, consumed = skill_plan(SimpleNamespace(client=SimpleNamespace(available=True, chat=chat)),
        [SimpleNamespace(document='优先 SOP')], {'query': '轴承检查'}, ['search_manual', 'search_sop'])
    assert result == ['search_sop', 'search_manual']
    assert consumed is True
    assert len(calls) == 1


@pytest.mark.parametrize('invalid', ['false', 0, None])
def test_knowledge_generation_mode_is_strict_boolean(invalid):
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        KnowledgeQuery(query='轴承检查', generate_answer=invalid)


def test_same_execution_review_is_not_submitted_twice(monkeypatch):
    from concurrent.futures import ThreadPoolExecutor
    from threading import BoundedSemaphore, Event
    from pathlib import Path
    from app.skills import review
    definition = SkillRegistry(Path(__file__).parents[1] / 'app/skills').get('router', 'intent_routing_skill')
    definition = replace(definition, document=definition.document + '\n' + review.MARKER + 'T-1）：\n- 核对已确认意图。')
    calls, entered, release = [], Event(), Event()
    def chat(messages, **_kwargs):
        calls.append(messages)
        entered.set()
        assert release.wait(2)
        return {'choices': [{'message': {'content': json.dumps({'skills': {
            definition.name: {'highlights': ['/output/intent'], 'missing': []}}})}}]}
    trace = TraceRecorder()
    kwargs = dict(client=SimpleNamespace(available=True, chat=chat), trace=trace,
                  context={'task_id': 'TASK-1', 'trace_id': 'TRACE-1', 'agent_run_id': 'AGENT-1'})
    with ThreadPoolExecutor(max_workers=2) as pool:
        monkeypatch.setattr(review, '_POOL', pool)
        monkeypatch.setattr(review, '_SLOTS', BoundedSemaphore(2))
        try:
            review.schedule_review([definition], {'query': '维修手册'}, {'intent': 'knowledge'}, **kwargs)
            assert entered.wait(1)
            review.schedule_review([definition], {'query': '维修手册'}, {'intent': 'knowledge'}, **kwargs)
        finally:
            release.set()
    assert len(calls) == 1
    assert len([r for r in trace.list() if r['event'] == 'skill_review_completed']) == 1
    assert any(r['event'] == 'skill_review_reused' for r in trace.list())


@pytest.mark.parametrize('changed', ['input', 'output', 'skill', 'execution', 'trace', 'none'])
def test_review_deduplication_preserves_changed_data_versions_and_execution_scope(monkeypatch, changed):
    from pathlib import Path
    from threading import BoundedSemaphore
    from app.skills import review
    definition = SkillRegistry(Path(__file__).parents[1] / 'app/skills').get('router', 'intent_routing_skill')
    definition = replace(definition, document=definition.document + '\n' + review.MARKER + 'T-1）：\n- 核对意图。')
    calls = []
    def chat(messages, **_kwargs):
        calls.append(messages)
        return {'choices': [{'message': {'content': json.dumps({'skills': {
            definition.name: {'highlights': ['/output/intent'], 'missing': []}}})}}]}
    class ImmediateExecutor:
        def submit(self, action):
            action()
    monkeypatch.setattr(review, '_POOL', ImmediateExecutor())
    monkeypatch.setattr(review, '_SLOTS', BoundedSemaphore(2))
    trace = TraceRecorder()
    context = {'task_id': 'TASK-1', 'trace_id': 'TRACE-1', 'agent_run_id': 'AGENT-1'}
    source_input, source_output = {'query': '维修手册'}, {'intent': 'knowledge'}
    kwargs = dict(client=SimpleNamespace(available=True, chat=chat), trace=trace, context=context)
    review.schedule_review([definition], source_input, source_output, **kwargs)
    if changed == 'input':
        source_input = {'query': '轴承手册'}
    elif changed == 'output':
        source_output = {'intent': 'maintenance'}
    elif changed == 'skill':
        definition = replace(definition, document=definition.document + '\n- 核对来源。')
    elif changed == 'execution':
        kwargs['context'] = {**context, 'agent_run_id': 'AGENT-2'}
    elif changed == 'trace':
        kwargs['trace'] = TraceRecorder()
    review.schedule_review([definition], source_input, source_output, **kwargs)
    assert len(calls) == (1 if changed == 'none' else 2)
