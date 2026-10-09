"""使用真实 Agent、Backend、工具和临时业务库检验图纸参数一致性。"""
from copy import deepcopy
from types import SimpleNamespace

import pytest

from test_business_returns_api import business_runtime
from shared.part_design_quality import build_design_reference, compare_design_parameters
from app.agents.quality.validator import QualityValidator
from app.closure.service import ClosureService


def design():
    return {'run_id': 'FC-' + 'a' * 64, 'status': 'completed', 'prompt': '直径30mm、长50mm的圆柱',
            'validation': {'valid': True, 'step_roundtrip': True, 'solid_count': 1},
            'spec': {'units': 'mm', 'operations': [
                {'type': 'cylinder', 'mode': 'add', 'diameter': 30, 'length': 50, 'axis': 'z', 'position': [0, 0, 0]}]}}


def seed(client, record=None):
    row = record or design()
    client.app.state.freecad_run_store = SimpleNamespace(get=lambda key: deepcopy(row) if key == row['run_id'] else None)
    return row


def save(client, actual=None):
    return client.post('/api/quality/parts/P-CAD/input', json={'design_run_id': design()['run_id'], 'part': {
        'part_name': '生产后圆柱', 'batch_id': 'B-1',
        'measurements': {'operations.0.diameter': '30.000', 'operations.0.length': 50, 'operations.0.axis': 'z'} if actual is None else actual}})


def test_design_baseline_is_read_only_and_actual_values_are_not_prefilled(business_runtime):
    client, _, backend = business_runtime
    seed(client)
    response = client.get('/api/quality/designs/' + design()['run_id'])
    assert response.status_code == 200, response.text
    reference = response.json()['design_reference']
    assert reference['parameters'][0]['expected'] == 30
    assert 'measurements' not in reference
    assert backend.qms('get_production_part', part_id='P-CAD')['found'] is False


def test_cad_quality_roundtrip_only_calls_parameter_tools_and_keeps_baseline_in_report(business_runtime):
    client, container, backend = business_runtime
    seed(client)
    assert save(client).status_code == 200
    response = client.post('/api/quality/parts/P-CAD', json={})
    assert response.status_code == 200, response.text
    result = response.json()
    assert result['status'] == 'pass' and result['passed'] is True
    assert result['comparison_scope'] == 'cad_parameters'
    assert result['inspection_items'][0]['actual'] == 30
    check = backend.get_quality_check(result['quality_check_id'])['quality_check']
    assert check['result'] == 'passed'
    assert check['design_reference']['run_id'] == design()['run_id']
    assert check['measurements']['operations.0.diameter'] == '30.000'
    # 生产闭环报告由后端生命周期负责，隔离测试不启动后台工厂，显式调用已有报告入口。
    report = client.post('/api/reports/generate', json={'quality_check_id': check['quality_check_id']})
    assert report.status_code == 200, report.text
    assert report.json()['report']['persisted'] is True
    assert report.json()['report']['sections']['quality']['design_reference'] == check['design_reference']
    calls = {row.get('tool_name') for row in container.trace.list(trace_id=result['trace_id']) if row['event'] == 'tool_completed'}
    assert {'get_production_part', 'get_part_specification', 'inspect_part_dimensions', 'create_quality_check'} <= calls
    assert not calls & {'inspect_part_appearance', 'inspect_part_material', 'inspect_part_function', 'inspect_part_process'}
    assert client.post('/api/v1/quality/checks/' + check['quality_check_id'] + '/release').status_code == 200


@pytest.mark.parametrize('actual,status', [({}, 'not_tested'), ({'operations.0.diameter': 30}, 'insufficient_data'),
    ({'operations.0.diameter': 31, 'operations.0.length': 50}, 'fail')])
def test_actual_part_missing_or_different_never_passes(business_runtime, actual, status):
    client, _, backend = business_runtime
    seed(client)
    assert save(client, actual).status_code == 200
    result = client.post('/api/quality/parts/P-CAD', json={}).json()
    assert result['status'] == status and result['passed'] is False
    assert backend.get_quality_check(result['quality_check_id'])['quality_check']['result'] != 'passed'


def test_client_cannot_supply_own_design_proof_or_unknown_design(business_runtime):
    client, _, backend = business_runtime
    injected = client.post('/api/quality/parts/P-CAD/input', json={'part': {'design_reference': design(), 'comparison_scope': 'cad_parameters'}})
    assert injected.status_code == 422
    seed(client)
    missing = client.post('/api/quality/parts/P-CAD/input', json={'design_run_id': 'FC-' + 'b' * 64, 'part': {}})
    assert missing.status_code == 404
    assert backend.qms('get_production_part', part_id='P-CAD')['found'] is False


def test_lookup_cannot_bind_a_different_version_under_the_requested_key(business_runtime):
    client, _, _ = business_runtime
    wrong = {**design(), 'run_id': 'FC-' + 'b' * 64}
    client.app.state.freecad_run_store = SimpleNamespace(get=lambda _: deepcopy(wrong))
    assert client.get('/api/quality/designs/' + design()['run_id']).status_code == 409
    assert save(client).status_code == 409


def test_same_produced_part_cannot_switch_design_version(business_runtime):
    client, _, backend = business_runtime
    seed(client)
    assert save(client).status_code == 200
    next_version = seed(client, {**design(), 'run_id': 'FC-' + 'b' * 64})
    response = client.post('/api/quality/parts/P-CAD/input', json={'design_run_id': next_version['run_id'],
        'part': {'batch_id': 'B-1', 'part_name': '生产圆柱', 'measurements': {}}})
    assert response.status_code == 409, response.text
    assert backend.qms('get_production_part', part_id='P-CAD')['part']['design_reference']['run_id'] == design()['run_id']


def test_web_parameter_mode_does_not_inspect_unbound_legacy_part(business_runtime):
    from test_business_returns_api import sample_part
    client, container, _ = business_runtime
    assert client.post('/api/quality/parts/P-OLD/input', json={'part': sample_part()}).status_code == 200
    result = client.post('/api/quality/parts/P-OLD', json={'production_context': {'comparison_scope': 'cad_parameters'}}).json()
    assert result['passed'] is False and result['status'] == 'review'
    calls = {row.get('tool_name') for row in container.trace.list(trace_id=result['trace_id']) if row['event'] == 'tool_completed'}
    assert 'inspect_part_dimensions' not in calls


def test_requested_design_and_measurement_snapshot_must_match_saved_part(business_runtime):
    client, _, _ = business_runtime
    seed(client)
    assert save(client).status_code == 200
    reference = build_design_reference(design())
    for context in ({'expected_design_run_id': 'FC-' + 'b' * 64},
                    {'expected_design_digest': 'different'},
                    {'expected_recorded_at': 'different'}):
        result = client.post('/api/quality/parts/P-CAD', json={'production_context': {
            'comparison_scope': 'cad_parameters', 'expected_design_run_id': reference['run_id'],
            'expected_design_digest': reference['digest'], **context}}).json()
        assert result['passed'] is False and result['status'] == 'review'


def test_unfinished_design_rejected_and_saved_reference_survives_redis_expiration(business_runtime):
    client, _, _ = business_runtime
    seed(client, {**design(), 'status': 'needs_input'})
    assert save(client).status_code == 409
    seed(client)
    assert save(client).status_code == 200
    client.app.state.freecad_run_store = SimpleNamespace(get=lambda _: None)
    assert save(client, {'operations.0.diameter': 30, 'operations.0.length': 50, 'operations.0.axis': 'z'}).status_code == 200
    assert client.post('/api/quality/parts/P-CAD', json={}).json()['passed'] is True


def test_validator_recomputes_evidence_and_local_closure_uses_same_rule():
    reference = build_design_reference(design())
    measurements = {'operations.0.diameter': 30, 'operations.0.length': 50, 'operations.0.axis': 'z'}
    part = {'part_id': 'P-CAD', 'batch_id': 'B-1', 'comparison_scope': 'cad_parameters',
            'design_reference': reference, 'measurements': measurements}
    check = compare_design_parameters(reference, measurements)
    decision = QualityValidator.validate_design(part, check)
    assert decision['passed'] is True
    untrusted = QualityValidator.validate_design(part, {**check, 'synthetic': True})
    assert untrusted['passed'] is False
    assert all(row['passed'] is False for row in untrusted['inspection_items'])
    assert QualityValidator.validate_design(part, {**check, 'items': check['items'][:1]})['passed'] is False
    closure = ClosureService()
    payload = {**part, 'target_id': 'P-CAD', 'result': 'passed', 'quality_validation': {'dimensions': check}}
    record = closure.record_part_quality(payload)
    assert record['result'] == 'passed' and record['design_reference'] == reference
    assert record['measurements'] == measurements
    assert closure.record_part_quality({**payload, 'measurements': {}})['result'] != 'passed'


def test_parameter_failure_rectification_reinspection_release_and_close(business_runtime):
    client, container, backend = business_runtime
    seed(client)
    assert save(client, {'operations.0.diameter': 31, 'operations.0.length': 50}).status_code == 200
    failed = client.post('/api/quality/parts/P-CAD', json={}).json()
    check_id = failed['quality_check_id']
    task = client.post('/api/v1/closure-tasks', json={'quality_check_id': check_id, 'title': '按图纸修正直径',
        'owner': 'U-1', 'actions': ['重新测量直径']})
    assert task.status_code == 200, task.text
    assert client.post('/api/v1/quality/checks/' + check_id + '/release').status_code == 409
    assert client.post('/api/v1/closure-tasks/' + task.json()['closure_task_id'] + '/complete?note=完成修正并重测').status_code == 200
    assert save(client).status_code == 200
    passed = client.post('/api/quality/parts/P-CAD', json={}).json()
    reinspected = client.post('/api/v1/quality/checks/' + check_id + '/reinspect',
                             json={'passed': True, 'reinspection_check_id': passed['quality_check_id']})
    assert reinspected.status_code == 200, reinspected.text
    assert client.post('/api/v1/quality/checks/' + check_id + '/release').status_code == 200
    closed = client.post('/api/v1/quality/checks/' + check_id + '/close', json={'note': '参数复检一致'})
    assert closed.status_code == 200, closed.text
    assert backend.get_quality_check(check_id)['quality_check']['status'] == 'closed'
    logs = container.trace.list(trace_id=failed['trace_id'])
    assert any(row.get('skill') == 'part_quality_inspection_skill' and row.get('tool_name') == 'close_quality_check' for row in logs)
