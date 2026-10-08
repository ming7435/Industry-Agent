"""运行时用当前正式报警身份检索维修依据，避免长摘要和旧对话污染。"""
from copy import deepcopy

import pytest

from app.runtime.dispatcher import RuntimeDispatcher


def fault_state():
    return {
        'diagnosis': {
            'device_id': 'TRAK-TC820LTYSI-001', 'alarm_code': '700010',
            'summary': '液压总压力跌落。主轴温度正常。此前刀塔故障已处理。' * 20,
            'alarm_definition': {'found': True, 'name': '液压压力未达到', 'alarm_code': '700010'},
        },
        'event': {'device_id': 'TRAK-TC820LTYSI-001', 'device_model': 'TC820LTYsi', 'alarm_code': '700010'},
        'context': {'conversation_history': [{'role': 'user', 'content': '昨天主轴温度为什么异常？'}]},
    }


def test_document_search_uses_alarm_name_model_and_code_instead_of_noisy_summary():
    state = fault_state()
    original = deepcopy(state)
    task = RuntimeDispatcher._task_for_agent('document_search', state, {})
    assert task['query'] == 'TC820LTYsi 700010 液压压力未达到 检查 维修'
    assert task['filters'] == {'device_id': 'TRAK-TC820LTYSI-001', 'alarm_code': '700010'}
    assert task['alarm_active'] is True
    assert task['diagnosis'] == original['diagnosis']
    assert state == original


def test_device_id_is_used_when_the_diagnosis_has_no_model():
    state = fault_state()
    del state['event']['device_model']
    assert RuntimeDispatcher._task_for_agent('document_search', state, {})['query'] == (
        'TRAK-TC820LTYSI-001 700010 液压压力未达到 检查 维修')


def test_normalized_diagnosis_raw_preserves_authoritative_alarm_for_search():
    state = fault_state()
    definition = state['diagnosis'].pop('alarm_definition')
    state['diagnosis']['raw'] = {'alarm_definition': definition, 'device_model': 'TC820LTYsi'}
    del state['event']['device_model']
    assert RuntimeDispatcher._task_for_agent('document_search', state, {})['query'] == (
        'TC820LTYsi 700010 液压压力未达到 检查 维修')


@pytest.mark.parametrize('capability', ['document_search', 'historical_case_search', 'evidence_retrieval'])
def test_explicit_payload_query_overrides_diagnosis_and_conversation(capability):
    task = RuntimeDispatcher._task_for_agent(capability, fault_state(), {'query': 'TC820LTYsi 液压油位 日常检查'})
    assert task['query'] == 'TC820LTYsi 液压油位 日常检查'


@pytest.mark.parametrize('definition', [
    {'found': False, 'name': '未知报警'},
    {'success': False, 'name': '液压压力未达到'},
    {'found': True, 'name': '错误设备报警', 'device_id': 'OTHER'},
    {'found': True, 'name': '其他报警', 'alarm_code': '700006'},
])
def test_unavailable_or_mismatched_definition_cannot_supply_compact_query(definition):
    state = fault_state()
    state['diagnosis']['alarm_definition'] = definition
    state['context'] = {}
    assert RuntimeDispatcher._task_for_agent('document_search', state, {})['query'] == state['diagnosis']['summary']


def test_ordinary_question_keeps_conversation_context_without_a_diagnosed_alarm():
    task = RuntimeDispatcher._task_for_agent('document_search', {
        'user_text': '应该多久维护一次？',
        'context': {'conversation_history': [{'role': 'user', 'content': '我在咨询车床'}]},
    }, {})
    assert task['query'] == '历史对话：用户：我在咨询车床\n当前问题：应该多久维护一次？'
