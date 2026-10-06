"""真实工具执行的身份、技能关联、脱敏和失败返回测试。"""
from types import SimpleNamespace
from app.harness.trace import TraceRecorder
from app.tools.registry import ToolRegistry
from app.agents.base import trace_skill_node
from app.agents.report.agent import ReportAgent
from app.harness.runs import build_run_records


def test_repeated_tool_calls_have_separate_call_ids():
    trace = TraceRecorder()
    tools = ToolRegistry(trace=trace)
    with tools.trace_context(task_id='TASK-1', trace_id='TRACE-1', agent_run_id='RUN-1'):
        tools.execute('get_alarm_definition', {'alarm_code': '700223'})
        tools.execute('get_alarm_definition', {'alarm_code': '700223'})
    calls = [r for r in trace.list() if r['event'] == 'tool_started']
    assert len({r['tool_call_id'] for r in calls}) == 2
    for start in calls:
        matching = [r for r in trace.list() if r.get('tool_call_id') == start['tool_call_id']]
        assert matching[-1]['event'] == 'tool_completed'


def test_skill_node_binds_tools_to_actual_agent_call_and_records_values():
    trace = TraceRecorder()
    tools = ToolRegistry(trace=trace)
    agent = SimpleNamespace(tools=tools, runtime_trace=trace)
    def node(state):
        result = tools.execute('get_trace_summary', {'trace': [], 'trace_id': 'TRACE-1'})
        return {'count': result['summary']['total'] if 'total' in result['summary'] else 0}
    wrapped = trace_skill_node('report', 'collect_sources', node)
    with tools.trace_context(task_id='TASK-1', trace_id='TRACE-1', agent_run_id='RUN-1', agent='report'):
        wrapped({'agent': agent, 'request': {'task_id': 'TASK-1', 'trace_id': 'TRACE-1'}, 'note': '中文输入'})
    steps = [r for r in trace.list() if r['type'] == 'agent_step']
    assert all(r['agent_run_id'] == 'RUN-1' for r in steps)
    assert steps[0]['input']['note'] == '中文输入'
    assert steps[-1]['output']['count'] == 0
    tool = next(r for r in trace.list() if r['event'] == 'tool_called')
    assert tool['context']['step'] == 'collect_sources'
    assert tool['context']['skill']


def test_trace_redacts_secrets_and_avoids_recursive_history():
    trace = TraceRecorder()
    trace.record(type='tool', context={'api_key': 'SECRET-PRIVATE', 'nested': {'password': 'PASSWORD-PRIVATE'}},
                 input={'trace': [{'large': 'history'}], 'note': '正常'}, output={'text': 'x' * 100000})
    record = trace.list()[0]
    assert 'SECRET-PRIVATE' not in str(record) and 'PASSWORD-PRIVATE' not in str(record)
    assert len(str(record)) < 50000
    assert record['input']['note'] == '正常'


def test_report_storage_failure_cannot_be_completed():
    tools = ToolRegistry()
    def fail(**_):
        raise OSError('隔离数据库离线')
    tools.mcp.handlers['persist_report'] = fail
    result = ReportAgent(tools).run({'report_type': 'incident_report', 'event': {'event_id': 'EV-1', 'device_id': 'M-1'}})
    assert result.persisted is False
    assert result.status != 'completed'
    assert result.stop_reason == 'report_persistence_failed'
    assert any('持久化' in text for text in result.validation_findings)


def test_report_failed_tool_payload_is_not_a_business_record():
    assert ReportAgent._record({'success': False, 'found': False, 'error': '离线'}) == {}


def test_quality_report_and_persistence_remain_in_same_task():
    records = [
        {'type': 'agent', 'name': 'quality', 'event': 'agent_completed', 'trace_id': 'T-Q', 'task_id': 'Q-1'},
        {'type': 'agent', 'name': 'report', 'event': 'agent_completed', 'trace_id': 'T-Q', 'task_id': 'Q-1'},
        {'type': 'tool', 'name': 'persist_report', 'event': 'tool_completed', 'trace_id': 'T-Q', 'task_id': 'Q-1'},
    ]
    runs = build_run_records(records)
    assert len(runs) == 1 and runs[0]['event_count'] == 3


def test_failed_memory_trace_survives_later_successful_persistence():
    class Store:
        def __init__(self): self.records = []
        def append(self, record):
            if not self.records and record['name'] == 'first': raise OSError('离线')
            self.records.append(record)
        def list(self, **_): return list(self.records)
    trace = TraceRecorder(store=Store())
    trace.record(name='first', trace_id='T')
    trace.record(name='second', trace_id='T')
    assert [r['name'] for r in trace.list(trace_id='T')] == ['first', 'second']


def test_large_input_cannot_truncate_stable_task_identity():
    trace = TraceRecorder()
    trace.record(input={'huge':['x' * 9000] * 60}, task_id='TASK-STABLE', trace_id='TRACE-STABLE', agent_run_id='RUN-STABLE')
    assert trace.list()[0]['task_id'] == 'TASK-STABLE'
    assert trace.list()[0]['trace_id'] == 'TRACE-STABLE'


def test_report_harness_never_retries_uncertain_write():
    from app.harness.runtime import AgentHarness, AgentExecutionError
    class Report:
        name = 'report'
        def __init__(self): self.calls = 0
        def run(self, _):
            self.calls += 1
            raise OSError('写入后连接中断，结果未知')
    agent = Report()
    import pytest
    with pytest.raises(AgentExecutionError): AgentHarness(agent, max_retries=2).execute_agent({})
    assert agent.calls == 1


def test_blocked_business_result_is_not_logged_as_completed_phase():
    records = [{'event':'agent_completed','type':'agent','name':'workorder','trace_id':'T','event_id':'EV',
                'output':{'success':False,'status':'blocked','validation_findings':['库存不足']}}]
    phase = next(p for p in build_run_records(records)[0]['phases'] if p['id']=='workorder')
    assert phase['status'] == 'blocked'


def test_report_completion_does_not_overwrite_quality_insufficient_data():
    records=[{'event':'agent_completed','name':'quality','type':'agent','trace_id':'QC-T','output':{'status':'not_tested','passed':False}},
             {'event':'agent_completed','name':'report','type':'agent','trace_id':'QC-T','output':{'status':'completed','persisted':True}}]
    run=build_run_records(records)[0]
    assert run['status']=='blocked'
    assert run['phases'][0]['status']=='blocked'


def test_fault_report_source_reads_are_not_an_independent_quality_run():
    records = [
        {'event':'goal_parsed','trace_id':'T-F','state_change':{'source':'trigger','raw':{'event_id':'EV-F'}}},
        {'event':'agent_completed','type':'agent','name':'report','agent':'report','trace_id':'T-F'},
        {'event':'tool_completed','type':'tool','agent':'report','tool_name':'get_quality_record','trace_id':'T-F'},
        {'event':'tool_completed','type':'tool','agent':'report','tool_name':'get_diagnosis_record','trace_id':'T-F'},
    ]
    runs=build_run_records(records)
    assert len(runs)==1 and runs[0]['run_type']=='fault'
    assert next(p for p in runs[0]['phases'] if p['id']=='report')['event_count']==3


def test_standalone_quality_pdf_context_remains_a_quality_task():
    records=[{'event':'agent_completed','type':'agent','agent':'report','trace_id':'QC-OLD',
              'context':{'run_type':'quality'},'output':{'success':True}}]
    assert build_run_records(records)[0]['run_type']=='quality'


def test_quality_report_identifies_actual_part_instead_of_unknown_machine():
    result=ReportAgent().run({'report_type':'quality_report','quality':{'part_id':'P-PIN','part_name':'销轴','device_id':'M-PIN','passed':False,'result':'review'},'persist':False})
    assert result.title == '销轴质量检测报告'
    assert 'unknown' not in result.summary
    assert '销轴' in result.summary


def test_quality_pdf_fields_and_missing_data_have_chinese_labels():
    from app.tools.report.generate_report_file import _value_lines
    lines='\n'.join(_value_lines({'quality_check_id':'QC-1','target_type':'production_part','result':'not_tested',
                                'measurements':{'diameter_mm':10},'reinspection':{'passed':False}}))
    assert '质检编号: QC-1' in lines and '未检测' in lines
    assert 'quality check id' not in lines and 'not_tested' not in lines
