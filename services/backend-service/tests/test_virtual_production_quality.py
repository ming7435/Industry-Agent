"""Factory-derived inspections remain deduplicated and scoped to design/batch/owner."""
from copy import deepcopy
import math
import pytest
from shared.virtual_turning import VirtualProductionError, digest
from test_virtual_production_store import service, factory, prepare, complete, OWNER, OTHER, SUPERVISOR


def test_incomplete_production_cannot_be_inspected(service):
    job = prepare(service)
    with pytest.raises(VirtualProductionError): service.inspect(OWNER, job['part_id'], 'a' * 64)
    assert service.repository.list_records('sim_quality_check') == []
    rates = service.quality(OWNER, job['design_run_id'], job['batch_id'])['rates']
    assert rates == {'consistent': None, 'inconsistent': None, 'coverage': None}


def test_completed_output_inspection_is_durable_and_idempotent(service, factory):
    job, _ = complete(service, factory, prepare(service))
    check = service.inspect(OWNER, job['part_id'], job['output']['output_digest'])
    assert check['status'] == 'pass'
    assert check['rule'] == 'virtual_profile_dimensions_v1'
    assert service.inspect(OWNER, job['part_id'], job['output']['output_digest'])['check_id'] == check['check_id']
    assert len(service.repository.list_records('sim_quality_check')) == 1
    summary = service.quality(OWNER, job['design_run_id'], job['batch_id'])
    assert summary['counts']['total'] == 1
    assert summary['rates'] == {'consistent': 100.0, 'inconsistent': 0.0, 'coverage': 100.0}
    assert service.repository.list_records('quality') == []


def test_coverage_counts_saved_outputs_in_one_owner_batch(service, factory):
    first, _ = complete(service, factory, prepare(service))
    complete(service, factory, prepare(service, 'second'))
    service.inspect(OWNER, first['part_id'], first['output']['output_digest'])
    prepare(service, 'foreign', actor=OTHER)
    prepare(service, 'different-batch', batch='batch-2')
    summary = service.quality(OWNER, first['design_run_id'], first['batch_id'])
    assert summary['counts']['total'] == 2
    assert summary['rates']['coverage'] == 50.0


def test_wrong_output_digest_or_corruption_does_not_reuse_pass(service, factory):
    job, _ = complete(service, factory, prepare(service))
    service.inspect(OWNER, job['part_id'], job['output']['output_digest'])
    with pytest.raises(VirtualProductionError): service.inspect(OWNER, job['part_id'], 'b' * 64)
    output = service.repository.get_record('sim_produced_part', job['part_id'])
    output['profile']['outer_diameter_mm'] = 19
    service.repository.save_record('sim_produced_part', job['part_id'], output)
    with pytest.raises(VirtualProductionError): service.inspect(OWNER, job['part_id'], job['output']['output_digest'])
    summary = service.quality(OWNER, job['design_run_id'], job['batch_id'])
    assert summary['counts']['review'] == 1
    assert summary['rates']['consistent'] is None


def test_factory_dimension_deviation_is_compared_without_random_generation(service, factory):
    job = prepare(service)
    received = factory.submit(job['factory_command_id'], job['program'])
    saved = service.record_receipt(OWNER, job['job_id'], job['revision'], received)
    factory.start(received['job_id'], received['program_digest'], '测试'); factory.tick(20)
    receipt = factory.get(received['job_id'])
    receipt['result_profile']['outer_diameter_mm'] = 20.1
    receipt['simulated_volume_mm3'] = math.pi * 20.1 ** 2 / 4 * 10
    saved = service.record_receipt(OWNER, job['job_id'], saved['revision'], receipt)
    result = service.inspect(OWNER, saved['part_id'], saved['output']['output_digest'])
    assert result['status'] == 'fail'
    assert result['items'][0]['difference'] == '0.1'


def test_supervisor_same_batch_name_requires_owner_selection(service, factory):
    job, _ = complete(service, factory, prepare(service))
    prepare(service, actor=OTHER)
    with pytest.raises(VirtualProductionError) as error:
        service.quality(SUPERVISOR, job['design_run_id'], job['batch_id'])
    assert error.value.code == 'ambiguous_quality_owner'
    scoped = service.quality(SUPERVISOR, job['design_run_id'], job['batch_id'], owner_job_id=job['job_id'])
    assert scoped['counts']['total'] == 1
    assert scoped['actor_id'] == OWNER['user_id']
