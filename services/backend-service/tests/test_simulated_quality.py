"""Simulation stays separate from production, with durable and reproducible results."""
from copy import deepcopy
from concurrent.futures import ThreadPoolExecutor
import json
import time

import pytest

from app.workorder.repository import SQLiteRepository
from test_production_part_transaction import repository, Cursor, Connection
from shared import simulated_part_design_quality as sim
from app.quality_simulation.service import SimulatedQualityService


def plate():
    return {'run_id': 'FC-' + 'a' * 56 + '00016973', 'part_name': '安装底板', 'part_number': '',
            'status': 'completed', 'validation': {'valid': True, 'step_roundtrip': True, 'solid_count': 1},
            'spec': {'units': 'mm', 'operations': [
                {'type': 'box', 'mode': 'add', 'length': 100, 'width': 70, 'height': 12, 'position': [0, 0, 0]},
                *[{'type': 'cylinder', 'mode': 'cut', 'diameter': 8, 'length': 14, 'axis': 'z', 'position': [x, y, -1]}
                  for x, y in [(12, 12), (88, 12), (12, 58), (88, 58)]],
                {'type': 'box', 'mode': 'cut', 'length': 60, 'width': 30, 'height': 6, 'position': [20, 20, 8]},
            ]}}


def station(now=None):
    now = now or time.time()
    return {'summary': {'updated_at': now * 1000},
            'devices': [{'device_id': sim.DEVICE_ID, 'device_type': 'equator_gauge', 'name': 'Equator 300', 'status': 'running'},
                        {'device_id': 'TRAK-TC820LTYSI-001', 'device_type': 'turning_center', 'name': 'TRAK 车床', 'status': 'running'}],
            'monitor': {'device_id': sim.DEVICE_ID, 'status': 'running', 'alarm_codes': [],
                        'metrics': {'equator_power_on': 1, 'axis_comm_ok': 1, 'probe_present': 1,
                                    'estop_released': 1, 'probe_fault_flag': 0, 'hold_mode_enabled': 0, 'recalibration_due_hours': 24}},
            'detail': {'device_id': sim.DEVICE_ID, 'control_state': 'running'}}


@pytest.fixture(params=[False, True], ids=['sqlite', 'mysql-dialect'])
def service(tmp_path, monkeypatch, request):
    monkeypatch.setenv('QUALITY_SIMULATION_ENABLED', 'true')
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    monkeypatch.setenv('APP_ENV', 'development')
    if not request.param:
        target = SQLiteRepository(str(tmp_path / 'sim.db'))
    else:
        target = repository(tmp_path, True)
        class ReadCursor(Cursor):
            def fetchall(self):
                rows = self.cursor.fetchall()
                return [dict(zip([field[0] for field in self.cursor.description], row)) for row in rows] if self.dictionary else rows
        class ReadConnection(Connection):
            def cursor(self, dictionary=False): return ReadCursor(self.raw, dictionary)
        from types import SimpleNamespace
        target._connector = SimpleNamespace(connect=lambda **_: ReadConnection(str(tmp_path / 'isolated-records.db')))
    return SimulatedQualityService(target)


def test_plate_standard_uses_finished_intersections_not_cutting_tool_sizes():
    basis = sim.build_basis(plate())
    rows = {row['key']: row for row in basis['parameters']}
    assert rows['operations.0.length']['expected'] == '100'
    assert rows['operations.1.length']['expected'] == '12'
    assert rows['operations.1.position.2']['expected'] == '0'
    assert rows['operations.5.height']['expected'] == '4'
    assert rows['cut_feature_count']['expected'] == '5'
    assert rows['hole_count']['expected'] == '4'
    assert basis['part_number'] == '92531'


@pytest.mark.parametrize('change', ['unfinished', 'fake', 'nan'])
def test_incomplete_or_unsupported_whole_model_cannot_be_reported_qualified(change):
    run = plate()
    if change == 'unfinished': run['validation']['step_roundtrip'] = False
    if change == 'fake': run['synthetic'] = True
    if change == 'nan': run['spec']['operations'][0]['length'] = float('nan')
    with pytest.raises(ValueError): sim.build_basis(run)


def observations(basis):
    return {p['key']: {'value': p['expected'], 'unit': p['unit']} for p in basis['parameters']}


def test_comparison_detects_deviation_and_keeps_partial_issue_out_of_complete_denominator():
    basis = sim.build_basis(plate())
    values = observations(basis)
    values['operations.0.length']['value'] = '100.1'
    failed = sim.compare_sample(basis, values)
    assert failed['status'] == 'unqualified'
    assert failed['issues'][0]['difference'] == '0.1'
    del values['operations.0.width']
    partial = sim.compare_sample(basis, values)
    assert partial['status'] == 'pending'
    assert partial['issues'][0]['actual'] == '100.1'


@pytest.mark.parametrize('value,unit', [(True, 'mm'), ('NaN', 'mm'), ('Infinity', 'mm'), ('100', 'cm')])
def test_bad_observations_require_review_not_pass(value, unit):
    basis = sim.build_basis(plate())
    values = observations(basis)
    values['operations.0.length'] = {'value': value, 'unit': unit}
    assert sim.compare_sample(basis, values)['status'] == 'review'


def test_statistics_count_pieces_not_parameters_and_zero_denominator_is_unknown():
    basis = sim.build_basis(plate())
    ok = observations(basis)
    bad = deepcopy(ok); bad['operations.0.length']['value'] = '101'
    samples = [{'part_id': str(i), 'observations': values} for i, values in enumerate([ok]*7 + [bad]*2 + [{}])]
    result = sim.summarize(basis, samples)
    assert result['rates'] == {'qualified': 77.78, 'defect': 22.22, 'coverage': 90.0}
    assert result['counts'] == {'total': 10, 'qualified': 7, 'unqualified': 2, 'pending': 1, 'review': 0, 'determinate': 9}
    assert sim.summarize(basis, [{'part_id': 'a', 'observations': {}}])['rates'] == {'qualified': None, 'defect': None, 'coverage': 0.0}
    with pytest.raises(ValueError): sim.summarize(basis, samples + [samples[0]])


def test_item_rates_show_partial_measurements_without_qualifying_uncovered_parts():
    basis = {'parameters': [
        {'key': 'size', 'name': '外形尺寸', 'expected': '10', 'unit': 'mm', 'kind': 'number', 'comparable': True},
        {'key': 'radius', 'name': '圆角', 'expected': '1', 'unit': 'mm', 'kind': 'number', 'comparable': False},
    ]}
    samples = [{'part_id': str(i), 'observations': values} for i, values in enumerate([
        {'size': {'value': '10.000', 'unit': 'mm'}},
        {'size': {'value': '10.1', 'unit': 'mm'}},
        {},
        {'size': {'value': '10', 'unit': 'cm'}},
    ])]
    summary = sim.summarize_items(basis, samples)
    assert summary['counts'] == {'total': 8, 'qualified': 1, 'unqualified': 1, 'pending': 5, 'review': 1, 'determinate': 2}
    assert summary['rates'] == {'qualified': 50.0, 'defect': 50.0, 'coverage': 25.0}
    assert sim.summarize(basis, samples[:3])['rates']['qualified'] is None
    assert sim.summarize_items(basis, [])['rates'] == {'qualified': None, 'defect': None, 'coverage': None}
    with pytest.raises(ValueError): sim.summarize_items(basis, samples + [samples[0]])


def test_item_summary_is_a_verified_read_view_and_does_not_rewrite_historical_batches(service):
    result = service.detect('U-1', 'partial-items', flange(), station())
    stored = service.repository.get_record('simulated_quality_batch', result['batch_id'])
    assert 'item_summary' not in stored
    assert result['item_summary']['counts']['determinate'] > 0
    assert result['item_summary']['rates']['qualified'] is not None
    assert result['rates']['qualified'] is None
    assert service.request('U-1', 'partial-items') == result
    assert service.repository.get_record('simulated_quality_batch', result['batch_id']) == stored
    stored['samples'][0]['observations']['model.bounds_mm.0']['value'] = '999'
    service.repository.save_record('simulated_quality_batch', result['batch_id'], stored)
    corrupted = service.request('U-1', 'partial-items')
    assert corrupted['status'] == 'review'
    assert 'item_summary' not in corrupted


@pytest.mark.parametrize('change', ['wrong_device', 'stale', 'future', 'stop', 'fault', 'missing', 'bool', 'calibration', 'contradictory_monitor', 'contradictory_detail'])
def test_station_failure_does_not_generate_quality_results(change):
    now = time.time(); data = station(now)
    if change == 'wrong_device': data['detail']['device_id'] = 'OTHER'
    if change == 'stale': data['summary']['updated_at'] = (now - 31) * 1000
    if change == 'future': data['summary']['updated_at'] = (now + 6) * 1000
    if change == 'stop': data['detail']['control_state'] = 'stopped'
    if change == 'fault': data['monitor']['alarm_codes'] = ['FAULT']
    if change == 'missing': del data['monitor']['metrics']['probe_present']
    if change == 'bool': data['monitor']['metrics']['probe_present'] = True
    if change == 'calibration': data['monitor']['metrics']['recalibration_due_hours'] = 0
    if change == 'contradictory_monitor': data['monitor']['control_state'] = 'emergency_stop'
    if change == 'contradictory_detail': data['detail']['status'] = 'alarm'
    with pytest.raises(ValueError): sim.validate_station(data, now)


def test_detection_is_persisted_replayed_and_never_enters_formal_records(service):
    result = service.detect('U-1', 'click-1', plate(), station())
    assert result['simulation'] is True and result['synthetic'] is True
    assert len(result['samples']) == 10 and result['issues']
    assert result['counts']['qualified'] > 0
    assert result['counts']['unqualified'] > 0
    assert result['counts']['pending'] > 0
    assert result['traceability']['production_device_id'] == 'TRAK-TC820LTYSI-001'
    assert result['traceability']['root_cause_status'] == 'unconfirmed'
    assert result == SimulatedQualityService(service.repository).request('U-1', 'click-1')
    assert result == service.detect('U-1', 'click-1', plate(), {})  # successful replay before fresh source checks
    assert service.request('U-2', 'click-1') is None
    assert service.designs('U-2') == []
    assert service.repository.list_records('quality') == []
    assert service.repository.list_records('production_part') == []
    assert service.repository.list_records('report') == []


def test_request_conflict_and_changed_basis_cannot_overwrite_saved_standard(service):
    first = service.detect('U-1', 'click-1', plate(), station())
    other = plate(); other['run_id'] = 'FC-' + 'b' * 64
    with pytest.raises(ValueError): service.detect('U-1', 'click-1', other, station())
    changed = plate(); changed['spec']['operations'][0]['length'] = 101
    with pytest.raises(ValueError): service.detect('U-1', 'click-2', changed, station())
    assert service.request('U-1', 'click-1') == first


def test_concurrent_duplicate_clicks_save_one_batch(service):
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda _: service.detect('U-1', 'same', plate(), station()), range(4)))
    assert len({r['batch_id'] for r in results}) == 1
    assert len(service.repository.list_records('simulated_quality_batch')) == 1


def test_storage_failure_rolls_back_basis_batch_and_request(service, monkeypatch):
    save = service.repository.save_record
    def fail(kind, key, payload):
        if kind == 'simulated_quality_request': raise RuntimeError('disk error')
        return save(kind, key, payload)
    monkeypatch.setattr(service.repository, 'save_record', fail)
    with pytest.raises(RuntimeError): service.detect('U-1', 'broken', plate(), station())
    for kind in ['simulated_quality_basis', 'simulated_quality_batch', 'simulated_quality_request']:
        assert service.repository.list_records(kind) == []


def test_tampered_saved_values_do_not_return_trusted_rates(service):
    result = service.detect('U-1', 'click-1', plate(), station())
    stored = service.repository.get_record('simulated_quality_batch', result['batch_id'])
    stored['samples'][0]['observations']['operations.0.length']['value'] = '900'
    service.repository.save_record('simulated_quality_batch', result['batch_id'], stored)
    reviewed = service.request('U-1', 'click-1')
    assert reviewed['status'] == 'review'
    assert reviewed['rates'] == {'qualified': None, 'defect': None, 'coverage': None}


def test_disabled_or_production_environment_cannot_generate(service, monkeypatch):
    monkeypatch.setenv('APP_ENV', 'production')
    with pytest.raises(ValueError): service.detect('U-1', 'click-1', plate(), station())


@pytest.mark.parametrize('shape', ['box', 'cylinder'])
def test_touching_cuts_cannot_be_counted_as_independent_finished_features(shape):
    run = plate(); run['spec']['operations'] = run['spec']['operations'][:1]
    if shape == 'box':
        cuts = [{'type': 'box', 'mode': 'cut', 'length': 20, 'width': 30, 'height': 6, 'position': [x, 20, 8]} for x in [20, 40]]
    else:
        cuts = [{'type': 'cylinder', 'mode': 'cut', 'diameter': 8, 'length': 12, 'axis': 'z', 'position': [x, 12, 0]} for x in [12, 20]]
    run['spec']['operations'].extend(cuts)
    basis = sim.build_basis(run)
    assert sim.compare_sample(basis, observations(basis))['status'] == 'pending'


@pytest.mark.parametrize('change', ['overlap', 'cavity', 'fillet'])
def test_uncovered_finished_features_remain_visible_but_cannot_be_reported_qualified(change):
    run = plate()
    if change == 'overlap': run['spec']['operations'][5]['position'] = [10, 10, 8]
    if change == 'cavity': run['spec']['operations'][5].update(height=2, position=[20, 20, 5])
    if change == 'fillet': run['spec']['operations'].append({'type': 'fillet', 'radius': 1, 'edges': 'all'})
    basis = sim.build_basis(run)
    assert sim.compare_sample(basis, observations(basis))['status'] == 'pending'


def test_generator_exercises_discrete_features_and_replays_same_observations():
    basis = sim.build_basis(plate())
    kinds = set()
    for seed in range(50):
        samples = sim.generate_samples(basis, str(seed), 123)
        assert samples == sim.generate_samples(basis, str(seed), 123)
        for sample in samples:
            kinds.update(row['kind'] for row in sim.compare_sample(basis, sample['observations'])['issues'])
    assert {'number', 'count', 'choice'} <= kinds


def flange():
    return {'run_id': 'FC-' + 'c'*56 + '69877401', 'part_name': '法兰轴套', 'part_number': '62017',
            'status': 'completed', 'validation': {'valid': True, 'step_roundtrip': True, 'solid_count': 1,
                                                 'bounds_mm': [70, 70, 42]},
            'spec': {'units': 'mm', 'operations': [
                {'type': 'cylinder', 'mode': 'add', 'diameter': 70, 'length': 12, 'axis': 'z', 'position': [0, 0, 0]},
                {'type': 'cylinder', 'mode': 'add', 'diameter': 32, 'length': 30, 'axis': 'z', 'position': [0, 0, 12]},
                {'type': 'cylinder', 'mode': 'cut', 'diameter': 16, 'length': 42, 'axis': 'z', 'position': [0, 0, 0]},
                {'type': 'fillet', 'radius': 1, 'edges': 'all'},
            ]}}


def test_flange_displays_every_saved_design_parameter_without_treating_tool_dimensions_as_finished():
    basis = sim.build_basis(flange())
    rows = {p['key']: p for p in basis['parameters']}
    assert basis['part_number'] == '62017'
    assert rows['operations.0.diameter']['expected'] == '70'
    assert rows['operations.1.length']['expected'] == '30'
    assert rows['operations.2.diameter']['expected'] == '16'
    assert rows['operations.3.radius']['expected'] == '1'
    assert rows['operations.3.edges']['expected'] == 'all'
    assert rows['operations.0.position.0']['expected'] == '0'
    assert rows['operations.3.radius']['comparable'] is False
    assert rows['model.bounds_mm.2']['expected'] == '42'
    assert rows['model.bounds_mm.2']['comparable'] is True
    compared = sim.compare_sample(basis, {'model.bounds_mm.2': {'value': '42.2', 'unit': 'mm'}})
    assert compared['status'] == 'pending'
    assert compared['issues'][0]['difference'] == '0.2'
    assert next(p for p in compared['items'] if p['key'] == 'operations.3.radius')['actual'] is None


@pytest.mark.parametrize('spec', [
    {'units': 'mm', 'operations': [{'type': 'sphere', 'mode': 'add', 'diameter': 20, 'position': [0, 0, 0]}]},
    {'units': 'mm', 'operations': [{'type': 'gear', 'module': 2, 'teeth': 20, 'width': 10, 'pressure_angle': 20}]},
    {'units': 'mm', 'operations': [{'type': 'thread', 'major_diameter': 30, 'pitch': 2, 'hand': 'right'}]},
    {'units': 'mm', 'operations': [{'type': 'loft', 'sections': [{'z': 0, 'diameter': 20, 'center': [0, 0]}, {'z': 30, 'diameter': 10, 'center': [0, 0]}]}]},
    {'units': 'mm', 'sheet_metal': {'thickness': 2, 'bends': [{'angle': 90, 'radius': 3}]}},
    {'units': 'mm', 'parts': [{'name': '底座', 'operations': [{'type': 'box', 'length': 10}]}, {'name': '销轴', 'operations': [{'type': 'cylinder', 'diameter': 3}]}]},
    {'units': 'mm', 'operations': [{'type': 'future_feature', 'new_dimension': 25, 'options': {'enabled': True}}]},
])
def test_every_verified_model_shape_has_parameters_and_uncovered_features_stay_pending(spec):
    run = flange(); run['spec'] = spec
    if 'parts' in spec: run['validation']['solid_count'] = 2
    basis = sim.build_basis(run)
    assert basis['spec'] == spec
    assert basis['parameters'] and any(p.get('comparable') is False for p in basis['parameters'])
    assert sim.verify_basis(basis) == basis
    samples = sim.generate_samples(basis, 'complex-shape', 123)
    assert all(key.startswith('model.') for s in samples for key in s['observations'])
    result = sim.summarize(basis, samples)
    assert result['status'] == 'partial'
    assert result['counts']['pending'] == 10
    assert result['rates'] == {'qualified': None, 'defect': None, 'coverage': 0.0}


def test_partial_complex_batch_is_persisted_replayed_and_does_not_change_legacy_batches(service):
    legacy = service.detect('U-1', 'legacy', plate(), station())
    result = service.detect('U-1', 'flange', flange(), station())
    assert result['status'] == 'partial' and result['counts']['pending'] == 10
    assert result['issues']
    assert service.request('U-1', 'flange') == result
    assert service.design('U-1', flange()['run_id'])['latest'] == result
    assert service.request('U-1', 'legacy') == legacy
    assert len(service.designs('U-1')) == 2
    damaged = deepcopy(result['basis']); damaged['parameters'][0]['comparable'] = False
    with pytest.raises(ValueError): sim.verify_basis(damaged)
    assert service.repository.list_records('quality') == []


def test_native_json_key_normalization_cannot_invalidate_complex_standards_or_replayed_batches(service, monkeypatch):
    save = service.repository.save_record
    def normalized_save(kind, key, payload):
        return save(kind, key, json.loads(json.dumps(payload, sort_keys=True)))
    monkeypatch.setattr(service.repository, 'save_record', normalized_save)
    result = service.detect('U-1', 'native-json-flange', flange(), station())
    assert service.request('U-1', 'native-json-flange') == result
    assert service.design('U-1', flange()['run_id'])['basis'] == result['basis']
    assert service.detect('U-1', 'another-native-json', flange(), station())['status'] == 'partial'


def test_json_float_reformatting_preserves_exact_saved_standards_and_refresh_results(service, monkeypatch):
    # Reproduce the measured SQL boundary, not a different CAD standard or tolerance.
    raw = getattr(service.repository, 'raw', service.repository)
    save = raw.save_record
    def binary_json_save(kind, key, payload):
        reformatted = json.loads(json.dumps(payload), parse_float=lambda text: float(format(float(text), '.15g')))
        return save(kind, key, reformatted)
    monkeypatch.setattr(raw, 'save_record', binary_json_save)
    run = flange()
    run['validation']['bounds_mm'][2] = 10.000000199999999
    run['spec']['operations'][3]['radius'] = 1.0000000000000002
    first = service.detect('U-1', 'precision-first', run, station())
    refreshed = SimulatedQualityService(service.repository)
    saved = refreshed.design('U-1', run['run_id'])
    z = next(p for p in saved['basis']['parameters'] if p['key'] == 'model.bounds_mm.2')
    assert z['expected'] == '10.000000199999999'
    assert saved['basis']['validation']['bounds_mm'][2] == 10.000000199999999
    assert saved['basis']['spec']['operations'][3]['radius'] == 1.0000000000000002
    assert saved['latest'] == first
    assert refreshed.request('U-1', 'precision-first') == first
    assert refreshed.designs('U-1')[0]['part_number'] == '62017'
    second = refreshed.detect('U-1', 'precision-second', run, station())
    assert second['status'] == 'partial' and second['batch_id'] != first['batch_id']
    assert second['item_summary']['rates']['qualified'] is not None
    assert refreshed.request('U-1', 'precision-second') == second
    assert len(refreshed.repository.list_records('simulated_quality_batch')) == 2


def test_legacy_unwrapped_quality_records_keep_all_original_integrity_gates(service):
    first = service.detect('U-1', 'legacy-encoding', plate(), station())
    raw = getattr(service.repository, 'raw', service.repository)
    for kind, identity in [
        ('simulated_quality_basis', sim.digest(['U-1', plate()['run_id']])),
        ('simulated_quality_batch', first['batch_id']),
        ('simulated_quality_request', sim.digest(['U-1', 'legacy-encoding'])),
    ]:
        raw.save_record(kind, identity, service.repository.get_record(kind, identity))
    assert service.request('U-1', 'legacy-encoding') == first
    assert service.design('U-1', plate()['run_id'])['latest'] == first
    identity = sim.digest(['U-1', plate()['run_id']])
    changed = raw.get_record('simulated_quality_basis', identity)
    changed['basis']['spec']['operations'][0]['length'] = 101
    raw.save_record('simulated_quality_basis', identity, changed)
    with pytest.raises(ValueError):
        service.basis('U-1', plate()['run_id'])


def test_corrupt_other_users_envelope_cannot_block_my_design_list(service):
    first = service.detect('U-1', 'my-good-batch', plate(), station())
    service.detect('U-2', 'other-batch', plate(), station())
    raw = getattr(service.repository, 'raw', service.repository)
    other_key = sim.digest(['U-2', plate()['run_id']])
    corrupt = raw.get_record('simulated_quality_basis', other_key)
    corrupt['payload_json'] = '{broken'
    raw.save_record('simulated_quality_basis', other_key, corrupt)
    assert service.designs('U-1') == [{'run_id': plate()['run_id'], 'part_name': '安装底板', 'part_number': '92531'}]
    assert service.request('U-1', 'my-good-batch') == first
    with pytest.raises(ValueError):
        service.designs('U-2')
    with pytest.raises(ValueError):
        service.basis('U-2', plate()['run_id'])


def test_envelope_owner_cannot_disagree_with_the_saved_record_owner(service):
    service.detect('U-1', 'owner-integrity', plate(), station())
    raw = getattr(service.repository, 'raw', service.repository)
    identity = sim.digest(['U-1', plate()['run_id']])
    envelope = raw.get_record('simulated_quality_basis', identity)
    envelope['actor_id'] = 'U-2'
    raw.save_record('simulated_quality_basis', identity, envelope)
    with pytest.raises(ValueError):
        service.basis('U-1', plate()['run_id'])


@pytest.mark.parametrize('envelope', [
    {'schema': 'unknown', 'actor_id': 'U-1', 'payload_json': '{}'},
    {'schema': 'simulated-quality-record-v1', 'actor_id': 'U-1', 'payload_json': '[]'},
    {'schema': 'simulated-quality-record-v1', 'actor_id': 'U-1', 'payload_json': '{broken'},
    {'schema': 'simulated-quality-record-v1', 'actor_id': 'U-1', 'payload_json': '{"value":NaN}'},
    {'schema': 'simulated-quality-record-v1', 'actor_id': 'U-1', 'payload_json': 123},
    {'schema': 'simulated-quality-record-v1', 'actor_id': 'U-1', 'payload_json': '{}', 'passed': True},
    {'schema': 'simulated-quality-record-v1', 'payload_json': '{"actor_id":"U-1"}'},
])
def test_invalid_saved_quality_envelopes_never_return_trusted_records(service, envelope):
    raw = getattr(service.repository, 'raw', service.repository)
    identity = sim.digest(['U-1', plate()['run_id']])
    raw.save_record('simulated_quality_basis', identity, envelope)
    with pytest.raises(ValueError):
        service.basis('U-1', plate()['run_id'])


def test_actual_sheet_metal_and_bim_design_fields_keep_their_units_while_pending():
    run = flange(); run['spec'] = {'units': 'mm', 'sheet_metal': {'width': 100, 'base_length': 80,
        'flange_length': 40, 'thickness': 2, 'bend_radius': 3, 'bend_angle': 90, 'k_factor': .4}}
    rows = {p['key']: p for p in sim.build_basis(run)['parameters']}
    assert rows['sheet_metal.base_length']['unit'] == 'mm'
    assert rows['sheet_metal.flange_length']['unit'] == 'mm'
    assert rows['sheet_metal.bend_radius']['unit'] == 'mm'
    assert rows['sheet_metal.bend_angle']['unit'] == '°'
    assert rows['sheet_metal.k_factor']['unit'] == '—'
    assert rows['sheet_metal.bend_angle']['comparable'] is False
    run['spec'] = {'units': 'mm', 'bim': {'walls': [{'name': '墙体', 'start': [0, 0, 0],
        'end': [1000, 0, 0], 'height': 2500, 'thickness': 200}],
        'openings': [{'name': '窗', 'wall': '墙体', 'offset': 100, 'sill': 900, 'width': 600, 'height': 800}]}}
    rows = {p['key']: p for p in sim.build_basis(run)['parameters']}
    assert rows['bim.walls.0.start.0']['unit'] == 'mm'
    assert rows['bim.walls.0.end.0']['unit'] == 'mm'
    assert rows['bim.openings.0.offset']['unit'] == 'mm'
    assert rows['bim.openings.0.sill']['unit'] == 'mm'
