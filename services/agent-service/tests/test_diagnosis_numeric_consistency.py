"""诊断数值比较须符合算术事实，不能把结构完整当作内容正确。"""
import pytest
import json
from types import SimpleNamespace

from app.agents.diagnosis.schemas import DiagnosisState
from app.agents.diagnosis.validator import validate_candidate


def validate(text, field='summary'):
    event={'device_id':'D-TEST','realtime_snapshot':{'pressure':66.6}}
    state=DiagnosisState(abnormal_event=event,evidence=['当前测试快照'])
    candidate={'summary':'根据当前快照判断','diagnosis':'仍需补查物理原因','confidence':0.4,
               'recommendation':'核对压力反馈'}
    candidate[field]=text
    return validate_candidate(state,event,candidate,'')


@pytest.mark.parametrize('text', [
    '实时快照显示润滑压力 66.6 psi 已跌破正常下限 66 psi，油液位正常。',
    '压力66 psi低于正常下限66 psi。',
    '温度61.9°C超过允许上限74°C。',
    '电流-2 A高于3 A。',
    '75%高于80%。',
    'Pressure 66.6 psi is below 66 psi.',
    '66.6 < 66',
    '压力6.66e1 psi低于6.6e1 psi。',
    '压力1,000 psi低于999 psi。',
    '- 66.6 psi低于66 psi',
    '* 66.6 psi低于66 psi',
    '温度−3°C高于2°C。',
])
def test_false_numeric_comparison_is_rejected(text):
    result=validate(text)
    assert result['pass'] is False
    assert any('数值比较' in error for error in result['errors'])


@pytest.mark.parametrize('text', [
    '压力47 psi低于正常下限66 psi。',
    '当前压力66.6 psi高于下限66 psi。',
    '当前压力66 psi不低于下限66 psi。',
    '温度-3°C低于-2°C。',
    '不能认为66.6 psi低于66 psi，当前数值高于下限。',
    '压力0.5 MPa高于66 psi。',  # 单位转换不由这条同单位比较校验猜测。
    '历史压力由70.3降至2.2，当前快照为66.6。',
    '压力6.66e1 psi高于6.6e1 psi。',
    '压力1000 mPa低于1 MPa。',
    '转速1,000 rpm高于100 rpm。',
    '压力1e3 psi高于66 psi。',
    '压力差66.6-66=0.6 psi。',
    '速度100 mm/s低于1 m/s。',
    '用时500 ms低于1分钟。',
    '不能认为当前压力66.6 psi低于66 psi。',
    '“66.6 psi低于66 psi”的说法是错误的。',
    '66.6 < 66 + 1',
    '不能说压力66.6低于66。压力47 psi高于66 psi的说法不正确。',
    '温度−3°C低于2°C。',
])
def test_true_comparison_or_unasserted_claim_is_not_rejected(text):
    assert validate(text)['pass'] is True


@pytest.mark.parametrize('field',['summary','diagnosis','recommendation'])
def test_numeric_consistency_applies_to_all_final_diagnostic_text(field):
    assert validate('66.6 psi低于66 psi',field)['pass'] is False


def test_graph_requests_correction_then_accepts_the_corrected_diagnosis():
    from app.agents.diagnosis.graph import validate_diagnosis_candidate
    event={'realtime_snapshot':{'pressure':66.6}}
    runtime=DiagnosisState(abnormal_event=event,evidence=['当前快照'],step_count=1)
    candidate={'summary':'66.6 psi低于66 psi','diagnosis':'应检查压力反馈','confidence':0.4}
    state={'agent':SimpleNamespace(_validate_candidate=validate_candidate),'agent_state':runtime,
           'event':event,'assistant':{'content':json.dumps(candidate)}}
    first=validate_diagnosis_candidate(state)
    assert first['route']=='reason'
    assert '纠正数值比较' in runtime.messages[-1]['content']
    candidate['summary']='66.6 psi高于66 psi，当前压力不低于下限。'
    state['assistant']['content']=json.dumps(candidate)
    second=validate_diagnosis_candidate(state)
    assert second['route']=='final'
    assert runtime.validation_errors==[]
