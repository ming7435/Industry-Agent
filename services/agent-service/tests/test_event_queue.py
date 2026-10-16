"""只替换外部发布边界；任务仓库、认领及执行逻辑均使用真实实现。"""
from concurrent.futures import ThreadPoolExecutor
from threading import Event

import pytest

from queue_test_support import event, jobs, queue_mysql_config


def queue(jobs, handler, lookup=lambda _: None):
    from app.runtime.event_queue import EventQueue, QueueSettings
    return EventQueue(jobs, handler, lookup, settings=QueueSettings(partitions=4))


def test_publish_failure_keeps_transactional_outbox_for_later_delivery(jobs):
    receipt = jobs.submit(event())
    service = queue(jobs, lambda _: {})
    class Offline:
        def publish(self, *_):
            raise ConnectionError('测试外部消息服务离线')
    with pytest.raises(ConnectionError):
        service.relay_once(Offline())
    assert jobs.pending()[0]['job_id'] == receipt['job_id']
    assert jobs.get(receipt['job_id'])['status'] == 'queued'


def test_duplicate_delivery_reuses_committed_result_without_running_again(jobs):
    calls = []
    service = queue(jobs, lambda e: calls.append(e) or {'status': 'completed'})
    receipt = service.submit(event())
    assert service.process(receipt['job_id']) == 'ack'
    assert service.process(receipt['job_id']) == 'ack'
    assert calls == [event()]
    assert jobs.get(receipt['job_id'])['status'] == 'succeeded'


def test_unknown_external_write_is_not_retried_by_redelivery(jobs):
    effects = []
    def write(e):
        effects.append(e)
        raise TimeoutError('包含敏感地址的外部异常不能直接写入状态')
    service = queue(jobs, write)
    receipt = service.submit(event())
    assert service.process(receipt['job_id']) == 'ack'
    assert service.process(receipt['job_id']) == 'ack'
    row = jobs.get(receipt['job_id'])
    assert row['status'] == 'unknown'
    assert row['error_code'] == 'execution_outcome_unknown'
    assert len(effects) == 1


def test_replayed_running_job_only_reconciles_original_result(jobs):
    receipt = jobs.submit(event())
    jobs.claim(receipt['job_id'], 'lost-worker')
    calls = []
    service = queue(jobs, lambda _: calls.append('wrong'), lambda _: {'status': 'completed'})
    assert service.process(receipt['job_id']) == 'ack'
    assert calls == []
    assert jobs.get(receipt['job_id'])['status'] == 'succeeded'


def test_unknown_runtime_result_does_not_unblock_next_device_job(jobs):
    service = queue(jobs, lambda _: {'status': 'unknown'})
    first, second = service.submit(event()), service.submit(event('E-2'))
    assert service.process(first['job_id']) == 'ack'
    assert service.process(second['job_id']) == 'ack'
    assert jobs.get(first['job_id'])['status'] == 'unknown'
    assert jobs.get(second['job_id'])['status'] == 'queued'
    assert jobs.pending() == []


@pytest.mark.parametrize('result', [
    {'status': 'blocked', 'stop_reason': 'execution_timeout'},
    {'status': 'blocked', 'runtime_result': {'status': 'blocked', 'stop_reason': 'execution_unknown'}},
])
def test_blocked_runtime_with_still_running_action_keeps_device_blocked(jobs, result):
    service = queue(jobs, lambda _: result)
    first = service.submit(event())
    service.process(first['job_id'])
    assert jobs.get(first['job_id'])['status'] == 'unknown'


def test_late_result_reconciliation_releases_device_without_reexecution(jobs):
    available, effects = {}, []
    service = queue(jobs, lambda e: effects.append(e) or {'status': 'unknown'}, lambda _: available.get('result'))
    first, second = service.submit(event()), service.submit(event('E-2'))
    service.process(first['job_id'])
    available['result'] = {'status': 'completed'}
    service.reconcile_once()
    assert jobs.get(first['job_id'])['status'] == 'succeeded'
    assert second['job_id'] in {r['job_id'] for r in jobs.pending()}
    assert len(effects) == 1


def test_reconciliation_visits_late_rows_after_one_hundred_unresolved_jobs(jobs):
    service = queue(jobs, lambda _: {}, lambda e: {'status': 'completed'} if e['event_id'] == 'LATE' else None)
    for n in range(101):
        service.submit(event('OLD-' + str(n), 'DEVICE-' + str(n)))
    late = service.submit(event('LATE', 'OTHER-DEVICE'))
    # 初始化历史孤儿任务；被测扫描及对账方法不作替换。
    with jobs.session() as cursor:
        cursor.execute(f"UPDATE {jobs.table} SET status='unknown',owner='lost-worker'")
    service.reconcile_once()
    service.reconcile_once()
    assert jobs.get(late['job_id'])['status'] == 'succeeded'


def test_dead_letter_cannot_leave_a_queued_task_loading_forever(jobs):
    service = queue(jobs, lambda _: {'status': 'completed'})
    receipt = service.submit(event())
    jobs.published(receipt['job_id'])
    service.dead_letter_message(('{"job_id":"' + receipt['job_id'] + '"}').encode())
    row = jobs.get(receipt['job_id'])
    assert row['status'] == 'failed'
    assert row['error_code'] == 'delivery_exhausted'


def test_changing_queue_prefix_cannot_silently_abandon_published_jobs(jobs):
    from app.runtime.event_queue import EventQueue, QueueSettings
    queue(jobs, lambda _: {})
    with pytest.raises(ValueError, match='队列'):
        EventQueue(jobs, lambda _: {}, lambda _: None,
                   settings=QueueSettings(partitions=4, prefix='different.routing'))


def test_slow_device_does_not_block_other_device_or_hold_mysql_transaction(jobs):
    entered, release, other_done = Event(), Event(), Event()
    def business(e):
        if e['device_id'] == 'D-1':
            entered.set()
            assert release.wait(5)
        else:
            other_done.set()
        return {'status': 'completed'}
    service = queue(jobs, business)
    first, other = service.submit(event()), service.submit(event('E-2', 'D-2'))
    with ThreadPoolExecutor(max_workers=2) as executor:
        one = executor.submit(service.process, first['job_id'])
        assert entered.wait(2)
        two = executor.submit(service.process, other['job_id'])
        try:
            assert other_done.wait(2)
            # 同时读取实际数据库，验证长任务没有占用全局写事务。
            assert jobs.get(first['job_id'])['status'] == 'running'
        finally:
            release.set()
        assert one.result(3) == two.result(3) == 'ack'


@pytest.mark.parametrize('raw', ['not-json', '{}', '{"job_id":"bad"}', '{"job_id":"' + 'a'*64 + '","event":{"approved":true}}'])
def test_invalid_messages_are_dead_lettered_without_executing(jobs, raw):
    calls = []
    service = queue(jobs, lambda _: calls.append('wrong'))
    assert service.process_message(raw.encode(), partition=0) == 'reject'
    assert calls == []
