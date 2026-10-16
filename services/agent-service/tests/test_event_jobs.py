"""调用实际 MySQL 任务仓库，覆盖幂等、重启和设备顺序。"""
from concurrent.futures import ThreadPoolExecutor

import pytest

from queue_test_support import event, jobs, queue_mysql_config


def test_duplicate_submissions_share_one_durable_job(jobs):
    with ThreadPoolExecutor(max_workers=6) as executor:
        receipts = list(executor.map(lambda _: jobs.submit(event()), range(12)))
    assert len({r['job_id'] for r in receipts}) == 1
    assert len(jobs.pending()) == 1
    assert all(r['status'] == 'queued' for r in receipts)


def test_changed_parameters_cannot_reuse_event_revision(jobs):
    first = jobs.submit(event())
    with pytest.raises(ValueError, match='参数'):
        jobs.submit(event(alarm_code='700002'))
    second = jobs.submit(event(event_revision=2, alarm_code='700002'))
    assert second['job_id'] != first['job_id']


def test_recreated_repository_reads_original_outbox(jobs, queue_mysql_config):
    from app.runtime.event_jobs import MySQLEventJobs
    receipt = jobs.submit(event())
    other = MySQLEventJobs(queue_mysql_config, partitions=4, prefix=jobs.prefix)
    assert other.get(receipt['job_id'])['event'] == event()
    assert other.pending()[0]['job_id'] == receipt['job_id']
    with pytest.raises(ValueError, match='分区'):
        MySQLEventJobs(queue_mysql_config, partitions=8, prefix=jobs.prefix)


def test_device_order_blocks_second_but_not_other_device(jobs):
    first = jobs.submit(event('E-1'))
    second = jobs.submit(event('E-2'))
    other = jobs.submit(event('E-3', 'D-2'))
    assert jobs.claim(first['job_id'], 'worker-a') == 'execute'
    assert jobs.claim(second['job_id'], 'worker-b') == 'blocked'
    assert jobs.claim(other['job_id'], 'worker-c') == 'execute'
    jobs.finish(first['job_id'], 'worker-a', 'succeeded')
    assert jobs.claim(second['job_id'], 'worker-b') == 'execute'


def test_claim_is_atomic_across_concurrent_workers(jobs):
    receipt = jobs.submit(event())
    with ThreadPoolExecutor(max_workers=6) as executor:
        results = list(executor.map(lambda i: jobs.claim(receipt['job_id'], str(i)), range(6)))
    assert results.count('execute') == 1
    assert results.count('reconcile') == 5


def test_uncertain_job_never_executes_again_and_blocks_later_device_job(jobs):
    first = jobs.submit(event())
    second = jobs.submit(event('E-2'))
    jobs.claim(first['job_id'], 'original')
    jobs.finish(first['job_id'], 'original', 'unknown')
    assert jobs.claim(first['job_id'], 'replacement') == 'reconcile'
    assert jobs.claim(second['job_id'], 'replacement') == 'blocked'
    assert jobs.finish(first['job_id'], 'replacement', 'succeeded') is False
    assert jobs.finish(first['job_id'], 'original', 'succeeded') is True
    assert jobs.claim(second['job_id'], 'replacement') == 'execute'


def test_acknowledged_publish_does_not_remove_business_record(jobs):
    receipt = jobs.submit(event())
    jobs.published(receipt['job_id'])
    assert jobs.pending() == []
    assert jobs.get(receipt['job_id'])['status'] == 'queued'


def test_deferred_message_only_becomes_publishable_after_predecessor_finishes(jobs):
    first = jobs.submit(event())
    second = jobs.submit(event('E-2'))
    jobs.published(second['job_id'])
    jobs.claim(first['job_id'], 'owner')
    jobs.defer(second['job_id'])
    assert second['job_id'] not in {j['job_id'] for j in jobs.pending()}
    jobs.finish(first['job_id'], 'owner', 'succeeded')
    assert second['job_id'] in {j['job_id'] for j in jobs.pending()}


@pytest.mark.parametrize('bad', [event(device=''), event(identifier=''), event(event_revision=0), event(event_revision=True)])
def test_invalid_identity_is_rejected_before_writing(jobs, bad):
    with pytest.raises(ValueError):
        jobs.submit(bad)
    assert jobs.pending() == []
