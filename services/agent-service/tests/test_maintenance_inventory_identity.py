"""维修库存查询必须来自工程件号，诊断摘要不是备件身份。"""
import pytest
from app.agents.maintenance.agent import MaintenanceAgent
from app.agents.maintenance.graph import check_parts_tools


def state_with(cad):
    calls = []

    def tool(name, arguments):
        calls.append((name, dict(arguments)))
        identity = arguments['query']
        return {'parts': [{'part_no': identity, 'name': '维修备件', 'stock': 2, 'available': True},
                          {'part_no': 'UNRELATED', 'name': '不属于本次方案', 'stock': 4, 'available': True}]}

    agent = MaintenanceAgent.__new__(MaintenanceAgent)
    agent._safe_tool = tool
    diagnosis = MaintenanceAgent._normalize_diagnosis({
        'device_id': 'D-1', 'summary': 'TRAK 车削中心触发报警，当前指标均处于正常范围。',
        'alarm_definition': {'name': '驱动功能报警'}, 'evidence': ['当前设备快照']})
    state = {'agent': agent, 'diagnosis': diagnosis, 'query': diagnosis.fault,
             'cad': cad, 'plan_payload': {'repair_target': '驱动系统'}}
    return state, calls


def test_no_engineering_part_number_never_uses_diagnosis_as_inventory_identity():
    state, calls = state_with({'drawings': [{'drawing_id': 'DWG-DEVICE'}]})
    result = check_parts_tools(state)
    assert calls == []
    assert result['plan_payload']['parts'] == []
    assert result['plan_payload']['required_parts'] == []


def test_each_numbered_engineering_part_is_queried_exactly_and_unrelated_stock_is_excluded():
    state, calls = state_with({'components': [{'component_id': 'DRIVE', 'part_no': 'DRIVE-01', 'name': '驱动器'},
                                            {'part_no': 'DRIVE-02', 'name': '反馈模块'}]})
    result = check_parts_tools(state)
    assert {arguments['query'] for _, arguments in calls} == {'DRIVE-01', 'DRIVE-02'}
    assert len(calls) == 4
    assert set(result['plan_payload']['required_parts']) == {'DRIVE-01', 'DRIVE-02'}
    assert all('UNRELATED' not in part for part in result['plan_payload']['parts'])
    assert {part['part_no'] for part in result['inventory']['parts']} == {'DRIVE-01', 'DRIVE-02'}


def test_reference_drawing_part_numbers_do_not_become_required_spares():
    state, calls = state_with({'evidence_scope': 'device_reference',
                              'components': [{'part_no': 'REFERENCE-ONLY', 'name': '设备参考图'}]})
    result = check_parts_tools(state)
    assert calls == []
    assert result['plan_payload']['required_parts'] == []


def test_large_bom_keeps_existing_six_part_selection_budget():
    state, calls = state_with({'bom_items': [{'part_no': f'DRIVE-{index:02}', 'name': '驱动备件'} for index in range(20)]})
    result = check_parts_tools(state)
    assert len(calls) == 12
    assert len(result['plan_payload']['required_parts']) == 6


def test_engineering_component_without_part_number_is_reported_instead_of_clearing_requirement():
    state, calls = state_with({'components': [{'component_id': 'DRIVE', 'name': '驱动器'}]})
    result = check_parts_tools(state)
    assert calls == []
    assert any('备件编号' in item for item in result.get('validation_findings', []))


def test_unrelated_bom_does_not_hide_the_matching_component_or_its_inventory_requirement():
    state, calls = state_with({'components': [{'component_id': 'LUB', 'part_no': 'LUB-01', 'name': '润滑泵'}],
                              'bom_items': [{'part_no': 'TEMP-01', 'name': '温度传感器'}]})
    state['diagnosis'] = MaintenanceAgent._normalize_diagnosis({
        'device_id': 'D-1', 'fault': '润滑压力未达到',
        'alarm_definition': {'name': '润滑压力未达到'}, 'evidence': ['润滑报警']})
    result = check_parts_tools(state)
    assert len(calls) == 2
    assert {arguments['query'] for _, arguments in calls} == {'LUB-01'}
    assert result['plan_payload']['required_parts'] == ['LUB-01']


@pytest.mark.parametrize('identity,name', [(' DRIVE-01 ', '驱动器'), ('DRIVE-01', ' 驱动器 ')])
def test_engineering_field_whitespace_does_not_lose_the_structured_identity(identity, name):
    state, calls = state_with({'components': [{'part_no': identity, 'name': name}]})
    result = check_parts_tools(state)
    assert {arguments['query'] for _, arguments in calls} == {'DRIVE-01'}
    assert result['plan_payload']['required_parts'] == ['DRIVE-01']
    assert not result['validation_findings']
