"""维修检索词应保留当前故障，不用通用占位词覆盖诊断。"""
import pytest

from app.agents.maintenance.schemas import MaintenanceQuery


@pytest.mark.parametrize('field', ['diagnosis', 'diagnosis_result'])
def test_diagnosis_fault_becomes_query_when_caller_omits_query(field):
    diagnosis = {'device_id': 'TRAK-TC820LTYSI-001', 'fault': '液压压力未达到', 'cause': '压力源需现场核查'}
    request = MaintenanceQuery.from_payload({field: diagnosis, 'runtime_managed': True})
    assert request.query == '液压压力未达到'
    assert request.diagnosis == diagnosis
    assert request.diagnosis_result == diagnosis


@pytest.mark.parametrize('diagnosis,expected', [
    ({'summary': '液压系统整体失压'}, '液压系统整体失压'),
    ({'diagnosis': '液压站供压异常'}, '液压站供压异常'),
    ({'cause': '需核查液压油位及可见泄漏'}, '需核查液压油位及可见泄漏'),
])
def test_diagnosis_text_fallbacks_are_used_before_generic_placeholder(diagnosis, expected):
    assert MaintenanceQuery.from_payload({'diagnosis_result': diagnosis}).query == expected


@pytest.mark.parametrize('fields,expected', [
    ({'query': '指定液压SOP', 'user_text': '用户描述', 'fault': '顶层故障'}, '指定液压SOP'),
    ({'user_text': '指定现场现象', 'fault': '顶层故障'}, '指定现场现象'),
    ({'fault': '顶层故障'}, '顶层故障'),
])
def test_explicit_query_user_text_and_legacy_fault_keep_priority(fields, expected):
    assert MaintenanceQuery.from_payload({**fields, 'diagnosis_result': {'fault': '液压压力未达到'}}).query == expected


def test_query_uses_same_diagnosis_source_as_maintenance_assessment():
    request = MaintenanceQuery.from_payload({
        'diagnosis_result': {'fault': '当前液压压力未达到'},
        'diagnosis': {'fault': '之前的温度异常'},
    })
    assert request.query == '当前液压压力未达到'


def test_missing_diagnosis_still_has_generic_query():
    assert MaintenanceQuery.from_payload({}).query == '设备维修'
