"""显式隔离 RabbitMQ + 临时 MySQL 联调；无真实设备、模型或工单写入。"""
from contextlib import contextmanager
import os
from threading import Event, Lock
from time import monotonic, sleep
from uuid import uuid4

import pytest

from queue_test_support import event, jobs, queue_mysql_config


def wait_until(condition, timeout=20):
    deadline = monotonic() + timeout
    while monotonic() < deadline:
        if condition():
            return
        sleep(0.05)
    assert condition(), '隔离消息链路未在限定时间内达到预期状态'


@contextmanager
def live_queue(jobs, handler, lookup=lambda _: None):
    url = os.getenv('QUEUE_TEST_RABBITMQ_URL')
    if not url:
        pytest.skip('需显式提供独立测试 RabbitMQ；不使用业务消息服务')
    from app.runtime.event_queue import EventQueue, QueueSettings, connect, queue_name
    settings = QueueSettings(url=url, partitions=4, workers=2, poll_seconds=0.1,
                             prefix='test.queue.' + uuid4().hex)
    service = EventQueue(jobs, handler, lookup, settings=settings)
    try:
        yield service
    finally:
        service.close()
        connection = connect(settings)
        try:
            channel = connection.channel()
            for partition in range(settings.partitions):
                channel.queue_delete(queue=queue_name(settings, partition))
            channel.queue_delete(queue=settings.prefix + '.dead.records')
            channel.exchange_delete(exchange=settings.prefix)
            channel.exchange_delete(exchange=settings.prefix + '.dead')
        finally:
            connection.close()


def test_live_consumers_parallel_across_devices_and_serial_for_same_device(jobs):
    entered, release, other_done = Event(), Event(), Event()
    calls, active, violations, lock = [], set(), [], Lock()
    def business(e):
        with lock:
            if e['device_id'] in active:
                violations.append(e['event_id'])
            active.add(e['device_id'])
            calls.append(e['event_id'])
        try:
            if e['event_id'] == 'E-1':
                entered.set()
                assert release.wait(15)
            if e['event_id'] == 'E-3':
                other_done.set()
            return {'status': 'completed'}
        finally:
            with lock:
                active.remove(e['device_id'])
    with live_queue(jobs, business) as service:
        first, second = service.submit(event()), service.submit(event('E-2'))
        from app.runtime.event_jobs import event_identity
        other_device = next('OTHER-' + str(n) for n in range(100)
            if int(event_identity(event('E-3', 'OTHER-' + str(n)))[2], 16) % 4 != first['partition_id'])
        third = service.submit(event('E-3', other_device))
        service.start()
        try:
            assert entered.wait(12)
            assert other_done.wait(8), '另一设备不能等待慢模型释放'
            assert jobs.get(second['job_id'])['status'] == 'queued'
        finally:
            release.set()
        wait_until(lambda: jobs.get(second['job_id'])['status'] == 'succeeded')
        assert violations == []
        assert calls.count('E-1') == calls.count('E-2') == calls.count('E-3') == 1
        assert calls.index('E-1') < calls.index('E-2')


def test_live_confirmed_but_unmarked_publish_can_repeat_without_reexecuting(jobs):
    from app.runtime.event_queue import RabbitPublisher
    calls = []
    with live_queue(jobs, lambda e: calls.append(e) or {'status': 'completed'}) as service:
        receipt = service.submit(event())
        publisher = RabbitPublisher(service.settings)
        try:
            # 模拟已确认发布、还没更新发件箱就退出；之后 relay 会再次发布。
            publisher.publish(receipt['job_id'], receipt['partition_id'])
            publisher.publish(receipt['job_id'], receipt['partition_id'])
        finally:
            publisher.close()
        assert jobs.pending()
        service.start()
        wait_until(lambda: jobs.get(receipt['job_id'])['status'] == 'succeeded')
        wait_until(lambda: service.snapshot()['ready'])
        sleep(0.5)
        assert calls == [event()]


def test_live_orphaned_claim_is_reconciled_never_replayed(jobs):
    from app.runtime.event_queue import RabbitPublisher
    calls = []
    with live_queue(jobs, lambda e: calls.append(e) or {'status': 'completed'}) as service:
        receipt = service.submit(event())
        jobs.claim(receipt['job_id'], 'crashed-worker')
        publisher = RabbitPublisher(service.settings)
        try:
            publisher.publish(receipt['job_id'], receipt['partition_id'])
        finally:
            publisher.close()
        service.start()
        wait_until(lambda: jobs.get(receipt['job_id'])['status'] == 'unknown')
        assert calls == []


def test_live_api_submission_reaches_rabbitmq_worker_and_saved_result(jobs):
    from types import SimpleNamespace
    from fastapi.testclient import TestClient
    from app.api.server import create_app
    from app.runtime.event_queue import EventQueue
    calls = []
    class Runtime:
        container = SimpleNamespace()
        def run_abnormal_event(self, e):
            calls.append(e)
            return {'status': 'completed', 'event': e, 'diagnosis': {'summary': '隔离适配器已返回'}}
    with live_queue(jobs, lambda _: {}) as cleanup:
        def factory(handler, lookup, trace):
            return EventQueue(jobs, handler, lookup, settings=cleanup.settings, trace=trace)
        with TestClient(create_app(Runtime(), event_queue_factory=factory)) as client:
            response = client.post('/api/v1/agent/event', json={'event': event()})
            assert response.status_code == 202
            wait_until(lambda: jobs.get(response.json()['job_id'])['status'] == 'succeeded')
            result = client.get('/api/v1/agent/event/E-1/result',
                params={'device_id': 'D-1', 'event_revision': 1, 'tenant_id': 'plant-1'})
            assert result.status_code == 200
            assert result.json()['result']['diagnosis']['summary'] == '隔离适配器已返回'
            assert calls == [event()]
