"""工具精简不得丢失旧调用、查询归属、参数校验及原名权限。"""

import pytest

from app.agents.diagnosis.schemas import DiagnosisState
from app.agents.diagnosis.tool_policy import guard_tool_call
from app.harness.trace import TraceRecorder
from app.tools.registry import ToolRegistry


COMPATIBILITY = {
    'query_cad': 'fetch_engineering_record',
    'query_part_relation': 'query_relation',
    'query_assembly_relation': 'query_relation',
    'get_component_location': 'query_relation',
    'get_drawing_metadata': 'query_drawing',
    'query_stock': 'query_inventory',
    'query_workorder': 'get_workorder',
}


def test_default_candidates_hide_repeated_queries_but_keep_all_handlers():
    tools = ToolRegistry()
    names = {row['function']['name'] for row in tools.tool_schemas()}
    assert not set(COMPATIBILITY) & names
    assert set(COMPATIBILITY.values()) <= names
    assert set(COMPATIBILITY) <= set(tools.mcp.handlers)
    for name, canonical in COMPATIBILITY.items():
        assert tools.definitions[name].compatibility_for == canonical


def test_scoped_schemas_keep_explicit_old_name_without_internal_tools():
    tools = ToolRegistry()
    rows = tools.tool_schemas(allowed_tools=['query_stock', 'record_repair_verification_failed'])
    assert [row['function']['name'] for row in rows] == ['query_stock']
    assert tools.tool_schemas(allowed_tools=[]) == []
    assert tools.tool_schemas(allowed_tools=['not_registered']) == []


@pytest.mark.parametrize('name,arguments', [
    ('search_knowledge', {}),
    ('search_knowledge', {'query': '  '}),
    ('search_sop', {'query': '主轴', 'limit': 0}),
    ('search_manual', {'query': '主轴', 'limit': '5'}),
    ('search_fault_cases', {'query': '主轴', 'filters': []}),
    ('search_alarm_knowledge', {'query': '主轴', 'alarm_code': 700001}),
    ('fetch_document', {}),
    ('fetch_chunk', {'document_id': 'DOC'}),
    ('query_part', {'device_id': ['D-1']}),
    ('query_relation', {'component_id': 123}),
])
def test_invalid_read_arguments_stop_before_transport(monkeypatch, name, arguments):
    trace = TraceRecorder()
    tools = ToolRegistry(trace=trace, cad_base_url='http://isolated-cad.invalid')
    calls = []
    monkeypatch.setattr(tools.mcp, 'call', lambda *args: calls.append(args) or {})
    with pytest.raises(PermissionError, match='invalid_tool_arguments'):
        tools.execute(name, arguments, context={'task_id': 'TASK', 'trace_id': 'TRACE'})
    assert calls == []
    rows = trace.list(task_id='TASK', trace_id='TRACE')
    assert rows[-1]['event'] == 'tool_guard'
    assert rows[-1]['allowed'] is False
    assert not any(row['event'] in {'tool_started', 'tool_completed'} for row in rows)


def test_query_schema_describes_rag_filters_and_structured_cad_scope():
    tools = ToolRegistry()
    schemas = {row['function']['name']: row['function']['parameters'] for row in tools.tool_schemas()}
    assert schemas['search_knowledge']['required'] == ['query']
    assert schemas['search_knowledge']['properties']['limit']['maximum'] == 50
    assert {'query', 'limit', 'filters'} <= set(schemas['search_knowledge']['properties'])
    assert {'device_id', 'device_model', 'component_id', 'part_no', 'request_id', 'query'} <= set(schemas['query_part']['properties'])
    assert schemas['fetch_chunk']['required'] == ['document_id', 'chunk_id']


@pytest.mark.parametrize('name,operation', [
    ('query_part', 'query_part'), ('query_part_relation', 'query_relation'),
    ('query_cad', 'fetch_engineering_record'),
])
def test_cad_contract_keeps_all_original_conditions(monkeypatch, name, operation):
    tools = ToolRegistry(cad_base_url='http://isolated-cad.invalid')
    calls = []
    monkeypatch.setattr(tools.mcp, 'call', lambda server, op, args: calls.append((server, op, args)) or {'components': []})
    args = {'query': '泵', 'device_id': 'D-1', 'device_model': 'TC820', 'component_id': 'C-1', 'part_no': 'P-1', 'request_id': 'R', 'legacy_context': {'note': '只读'}}
    tools.execute(name, args, context={'allowed_tools': [name]})
    assert calls == [('cad', operation, args)]
    assert args['device_id'] == 'D-1'
    denied_name = 'query_relation' if name == 'query_part_relation' else 'query_drawing'
    with pytest.raises(PermissionError, match='tool_not_allowed_for_step'):
        tools.execute(denied_name, args, context={'allowed_tools': [name]})
    assert len(calls) == 1


def test_typed_argument_denial_has_invalid_argument_diagnosis_code():
    state = DiagnosisState(abnormal_event={'device_id': 'D-1'}, allowed_tools=['search_knowledge'])
    decision = guard_tool_call('search_knowledge', {'query': '主轴', 'limit': 'bad'}, state, ToolRegistry())
    assert decision['allow'] is False
    assert decision['code'] == 'INVALID_ARGUMENT'


def test_schema_output_mutation_cannot_change_next_guard():
    tools = ToolRegistry()
    schemas = tools.tool_schemas()
    selected = next(row['function'] for row in schemas if row['function']['name'] == 'search_knowledge')
    selected['parameters']['properties']['limit']['maximum'] = 10000
    assert tools.guard_call('search_knowledge', {'query': '主轴', 'limit': 9999})['allow'] is False


class RagTransport:
    """只替换外部传输，注册表及 API 参数处理使用实际实现。"""

    def __init__(self):
        self.calls = []

    def search(self, query, *, limit, filters):
        self.calls.append(('search', query, limit, filters))
        return {'query': query, 'documents': [], 'source': 'isolated-rag'}

    def fetch_document(self, document_id):
        self.calls.append(('fetch_document', document_id))
        return {'document_id': document_id}

    def fetch_chunk(self, document_id, chunk_id):
        self.calls.append(('fetch_chunk', document_id, chunk_id))
        return {'document_id': document_id, 'chunk_id': chunk_id}


@pytest.mark.parametrize('name,arguments', [
    ('search_knowledge', {'query': ' '}),
    ('search_knowledge', {'query': '主轴', 'limit': 0}),
    ('search_sop', {'query': '主轴', 'limit': 51}),
    ('search_manual', {'query': 123}),
    ('search_alarm_knowledge', {'query': '主轴', 'alarm_code': 123}),
    ('search_fault_cases', {'query': '主轴', 'filters': []}),
    ('search_semantic_memory', {'query': '主轴', 'limit': False}),
    ('fetch_document', {'document_id': ''}),
    ('fetch_chunk', {'document_id': 'DOC', 'chunk_id': ' '}),
    ('query_part', {'device_id': ['D-1']}),
    ('query_drawing', {'part_no': 123}),
])
def test_public_read_wrappers_share_argument_contract_without_transport(name, arguments):
    rag = RagTransport()
    tools = ToolRegistry(rag_client=rag)
    with pytest.raises(ValueError, match='invalid_tool_arguments'):
        getattr(tools, name)(**arguments)
    assert rag.calls == []


@pytest.mark.parametrize('path', ['/api/v1/rag/search', '/api/rag/search'])
@pytest.mark.parametrize('params', [
    {'query': ' '}, {'query': '主轴', 'limit': 0},
    {'query': '主轴', 'limit': 51}, {'query': '主轴', 'limit': 'bad'},
])
def test_actual_rag_api_rejects_invalid_input_before_transport(path, params):
    from types import SimpleNamespace
    from fastapi.testclient import TestClient
    from app.api.server import create_app

    rag = RagTransport()
    tools = ToolRegistry(rag_client=rag)
    app = create_app(SimpleNamespace(container=SimpleNamespace(registry=tools)))
    response = TestClient(app, raise_server_exceptions=False).get(path, params=params)
    assert response.status_code == 422
    assert rag.calls == []


def test_valid_rag_api_keeps_query_filters_and_single_transport():
    from types import SimpleNamespace
    from fastapi.testclient import TestClient
    from app.api.server import create_app

    rag = RagTransport()
    tools = ToolRegistry(rag_client=rag)
    app = create_app(SimpleNamespace(container=SimpleNamespace(registry=tools)))
    response = TestClient(app).get('/api/v1/rag/search', params={'query': '主轴', 'limit': 3})
    assert response.status_code == 200
    assert response.json()['source'] == 'isolated-rag'
    assert rag.calls == [('search', '主轴', 3, None)]
