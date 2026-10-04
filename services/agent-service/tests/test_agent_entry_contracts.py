"""工具声明必须与授权一致，执行日志不得凭默认回退伪造 Skill 归属。"""

from types import SimpleNamespace

import pytest

from app.agents.base import trace_skill_node
from app.agents.diagnosis.tool_policy import tool_schemas_for
from app.harness.trace import TraceRecorder
from app.tools.registry import ToolRegistry


@pytest.mark.parametrize('name', [
    'query_cad', 'query_part_relation', 'query_assembly_relation',
    'get_component_location', 'get_drawing_metadata', 'query_stock', 'query_workorder',
])
def test_diagnosis_explicit_compatibility_schema_keeps_authorized_original_name(name):
    tools = ToolRegistry()
    declarations = tool_schemas_for(tools, [name])
    assert [row['function']['name'] for row in declarations] == [name]
    assert tools.guard_call(name, {}, context={'allowed_tools': [name]})['allow'] is True
    canonical = tools.definitions[name].compatibility_for
    assert tools.guard_call(canonical, {}, context={'allowed_tools': [name]})['allow'] is False


@pytest.mark.parametrize('allowed', [[], ['not_registered'], ['record_repair_verification_failed']])
def test_diagnosis_empty_unknown_and_internal_scope_have_no_declarations(allowed):
    assert tool_schemas_for(ToolRegistry(), allowed) == []


def test_legacy_zero_argument_adapter_is_filtered_without_expanding_permissions():
    class LegacyAdapter:
        def tool_schemas(self):
            return [
                {'function': {'name': 'search_knowledge'}},
                {'function': {'name': 'delete_workorder'}},
            ]

    assert tool_schemas_for(LegacyAdapter(), ['search_knowledge']) == [
        {'function': {'name': 'search_knowledge'}},
    ]


def test_modern_scoped_adapter_receives_scope_and_cannot_add_other_tools():
    class ScopedAdapter:
        def tool_schemas(self, *, allowed_tools):
            assert allowed_tools == ['query_stock']
            return [{'function': {'name': 'query_stock'}}, {'function': {'name': 'delete_workorder'}}]

    assert tool_schemas_for(ScopedAdapter(), ['query_stock']) == [{'function': {'name': 'query_stock'}}]


def test_schema_provider_internal_type_error_is_not_retried_as_legacy_call():
    class FailingAdapter:
        def __init__(self):
            self.calls = 0

        def tool_schemas(self, allowed_tools=None):
            self.calls += 1
            raise TypeError('适配器内部 schema 错误')

    adapter = FailingAdapter()
    with pytest.raises(TypeError, match='适配器内部 schema 错误'):
        tool_schemas_for(adapter, ['search_knowledge'])
    assert adapter.calls == 1


@pytest.mark.parametrize('selected', [['not_registered'], [], '', None])
def test_explicit_empty_or_unknown_skill_is_not_relabelled_as_default(selected):
    trace = TraceRecorder()
    original = {
        'agent': SimpleNamespace(runtime_trace=trace),
        'task_id': 'TASK-EXPLICIT', 'trace_id': 'TRACE-EXPLICIT',
        'request': {'query': 'BOM'}, 'active_skills': selected,
    }
    result = trace_skill_node('cad', 'query_engineering', lambda state: {'items': []}, skill_step='resolve_bom')(original)
    assert original['active_skills'] == selected
    assert result['step_history'][-1]['skill'] == ''
    rows = trace.list(task_id='TASK-EXPLICIT', trace_id='TRACE-EXPLICIT')
    assert [row['event'] for row in rows] == ['step_started', 'step_completed']
    assert all(row['state_change']['mapped'] is False for row in rows)
    assert all(row['state_change']['skill'] == '' for row in rows)


def test_unspecified_skill_still_uses_actual_context_selection():
    trace = TraceRecorder()
    result = trace_skill_node('cad', 'query_engineering', lambda state: {}, skill_step='resolve_bom')({
        'agent': SimpleNamespace(runtime_trace=trace), 'request': {'query': 'BOM'},
    })
    assert result['step_history'][-1]['skill'] == 'drawing_lookup_skill'
    assert all(row['state_change']['mapped'] is True for row in trace.list())


@pytest.mark.parametrize('selected', [['bom_analysis_skill'], ['not_registered', 'part_search_skill']])
def test_explicit_known_alias_maps_canonical_skill_and_retains_requested_names(selected):
    trace = TraceRecorder()
    result = trace_skill_node('cad', 'query_engineering', lambda state: {}, skill_step='resolve_bom')({
        'agent': SimpleNamespace(runtime_trace=trace), 'request': {'query': 'BOM'}, 'active_skills': selected,
    })
    assert result['step_history'][-1]['skill'] == 'drawing_lookup_skill'
    assert result['step_history'][-1]['requested_skills'] == selected
    assert all(row['state_change']['mapped'] is True for row in trace.list())


def test_unknown_skill_failure_remains_unmapped_and_preserves_original_exception():
    trace = TraceRecorder()

    def failure(state):
        raise ValueError('原始操作失败')

    with pytest.raises(ValueError, match='原始操作失败'):
        trace_skill_node('cad', 'query_engineering', failure, skill_step='resolve_bom')({
            'agent': SimpleNamespace(runtime_trace=trace), 'request': {'query': 'BOM'},
            'active_skills': ['not_registered'],
        })
    rows = trace.list()
    assert [row['event'] for row in rows] == ['step_started', 'step_failed']
    assert all(row['state_change']['skill'] == '' for row in rows)
    assert rows[-1]['error'] == '原始操作失败'


def test_real_report_prepare_does_not_claim_unknown_skill_before_actual_selection():
    from app.agents.report.agent import ReportAgent

    agent = ReportAgent()
    agent.runtime_trace = trace = TraceRecorder()
    result = agent.graph.invoke({
        'agent': agent, 'request': {
            'report_type': 'full_case_report', 'persist': False,
            'task_id': 'TASK-REPORT', 'trace_id': 'TRACE-REPORT',
        },
        'active_skills': ['not_registered'],
    }, interrupt_after=['prepare'])
    assert result['active_skills'] == ['closure_report_skill']
    rows = trace.list(task_id='TASK-REPORT', trace_id='TRACE-REPORT')
    assert [row['name'] for row in rows] == ['initialize', 'initialize', 'load_skill', 'load_skill']
    assert all(row['state_change']['mapped'] is False for row in rows)
