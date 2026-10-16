"""RabbitMQ 事件调度：分区单活消费、持久化幂等、只读对账和有界业务并发。"""
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from functools import partial
import json
import logging
import os
import re
from threading import Event, Lock, Thread
from uuid import uuid4

from .event_jobs import MySQLEventJobs
from .event_store import EventResultConflict

LOG = logging.getLogger(__name__)


@dataclass(frozen=True)
class QueueSettings:
    url: str = field(default='amqp://guest:guest@127.0.0.1:5672/%2F', repr=False)
    prefix: str = 'industry.agent.events'
    partitions: int = 16
    workers: int = 4
    poll_seconds: float = 1.0

    def __post_init__(self):
        if not re.fullmatch(r'[a-zA-Z0-9_.-]{1,100}', self.prefix):
            raise ValueError('RabbitMQ 队列前缀无效')
        if not 1 <= self.partitions <= 64 or not 1 <= self.workers <= 32 or self.poll_seconds <= 0:
            raise ValueError('RabbitMQ 并发、分区或轮询设置无效')
        from urllib.parse import urlparse
        try:
            parsed = urlparse(self.url)
            if parsed.scheme not in {'amqp', 'amqps'} or not parsed.hostname or not parsed.port:
                raise ValueError()
            if os.getenv('APP_ENV', '').lower() in {'prod', 'production'} and parsed.username == 'guest':
                raise ValueError()
        except ValueError:
            raise ValueError('RabbitMQ 连接配置无效；生产环境须使用专用账户') from None

    @classmethod
    def from_env(cls):
        return cls(url=os.getenv('RABBITMQ_URL') or cls.url,
                   prefix=os.getenv('AGENT_EVENT_QUEUE_PREFIX', cls.prefix),
                   partitions=int(os.getenv('AGENT_EVENT_PARTITIONS', '16')),
                   workers=int(os.getenv('AGENT_EVENT_WORKERS', '4')),
                   poll_seconds=float(os.getenv('AGENT_EVENT_QUEUE_POLL_SECONDS', '1')))


def queue_enabled():
    default = 'inline' if os.getenv('APP_ENV', 'development').lower() == 'testing' else 'rabbitmq'
    mode = os.getenv('AGENT_EVENT_TRANSPORT', default).strip().lower()
    if mode not in {'inline', 'rabbitmq'}:
        raise ValueError('AGENT_EVENT_TRANSPORT 只支持 inline 或 rabbitmq')
    if mode == 'inline' and os.getenv('APP_ENV', '').lower() in {'prod', 'production'}:
        raise ValueError('生产事件入口必须使用持久化消息队列')
    return mode == 'rabbitmq'


def connect(settings):
    import pika
    parameters = pika.URLParameters(settings.url)
    parameters.heartbeat = 30
    parameters.socket_timeout = 3
    parameters.stack_timeout = 10
    parameters.blocked_connection_timeout = 5
    parameters.connection_attempts = 1
    return pika.BlockingConnection(parameters)


def queue_name(settings, partition):
    return f'{settings.prefix}.device.{partition}'


def declare(channel, settings, partition=None):
    channel.exchange_declare(exchange=settings.prefix, exchange_type='direct', durable=True)
    channel.exchange_declare(exchange=settings.prefix + '.dead', exchange_type='direct', durable=True)
    channel.queue_declare(queue=settings.prefix + '.dead.records', durable=True,
                          arguments={'x-queue-type': 'quorum'})
    channel.queue_bind(queue=settings.prefix + '.dead.records', exchange=settings.prefix + '.dead', routing_key='failed')
    for partition in range(settings.partitions) if partition is None else [partition]:
        channel.queue_declare(queue=queue_name(settings, partition), durable=True,
            arguments={'x-queue-type': 'quorum', 'x-single-active-consumer': True,
                       'x-delivery-limit': 5, 'x-dead-letter-exchange': settings.prefix + '.dead',
                       'x-dead-letter-routing-key': 'failed'})
        channel.queue_bind(queue=queue_name(settings, partition), exchange=settings.prefix, routing_key=str(partition))


class RabbitPublisher:
    """连接只归发布线程使用，收到 broker confirm 后才更新发件箱。"""
    def __init__(self, settings):
        self.settings = settings
        self.connection = connect(settings)
        try:
            self.channel = self.connection.channel()
            declare(self.channel, settings)
            self.channel.confirm_delivery()
        except Exception:
            self.close()
            raise

    def publish(self, job_id, partition):
        import pika
        self.channel.basic_publish(exchange=self.settings.prefix, routing_key=str(partition), mandatory=True,
            body=json.dumps({'job_id': job_id}).encode(),
            properties=pika.BasicProperties(content_type='application/json', delivery_mode=2, message_id=job_id))

    def close(self):
        if self.connection.is_open:
            self.connection.close()


def uncertain(result):
    if not isinstance(result, dict):
        return True
    runtime = result.get('runtime_result') or {}
    return result.get('status') in {'unknown', 'timeout', 'running'} \
        or runtime.get('status') in {'unknown', 'timeout', 'running'} \
        or any(str(reason or '').lower() in {'execution_unknown', 'execution_timeout', 'loop_timeout', 'timeout'}
               for reason in (result.get('stop_reason'), runtime.get('stop_reason')))


class EventQueue:
    def __init__(self, jobs, handler, lookup, *, settings=None, trace=None):
        self.jobs, self.handler, self.lookup = jobs, handler, lookup
        self.settings = settings or QueueSettings.from_env()
        self.jobs.bind_transport(self.settings.prefix)
        self.trace = trace
        self.stop_event = Event()
        self.lock = Lock()
        self.threads = []
        self.executor = None
        self.connected = set()
        self.publisher_ready = False
        self.last_error = ''
        self.reconcile_cursor = 0

    def emit(self, name, record):
        LOG.info('event_queue event=%s job_id=%s partition=%s', name, record['job_id'], record['partition_id'])
        if self.trace is not None:
            try:
                self.trace(event=name, type='runtime', name='event_queue', job_id=record['job_id'],
                           event_id=record['event'].get('event_id'), device_id=record['event'].get('device_id'),
                           partition=record['partition_id'])
            except Exception:
                LOG.warning('事件队列审计记录暂不可用')

    def submit(self, event):
        receipt = self.jobs.submit(event)
        self.emit('event_queued', receipt)
        return receipt

    def relay_once(self, publisher):
        count = 0
        for record in self.jobs.pending():
            publisher.publish(record['job_id'], record['partition_id'])
            self.jobs.published(record['job_id'])
            self.emit('event_published', record)
            count += 1
        return count

    def process_message(self, raw, *, partition):
        try:
            value = json.loads(raw)
            if set(value) != {'job_id'} or not re.fullmatch('[a-f0-9]{64}', value['job_id']):
                return 'reject'
        except (ValueError, TypeError):
            return 'reject'
        return self.process(value['job_id'], partition=partition)

    def process(self, job_id, *, partition=None):
        record = self.jobs.get(job_id)
        if record is None:
            return 'reject'
        if partition is not None and record['partition_id'] != partition:
            self.jobs.defer(job_id)
            return 'reject'
        owner = uuid4().hex
        decision = self.jobs.claim(job_id, owner)
        if decision == 'blocked':
            self.jobs.defer(job_id)
            self.emit('event_waiting_predecessor', record)
            return 'ack'
        if decision == 'reconcile':
            try:
                result = self.lookup(record['event'])
            except EventResultConflict:
                result = None
            self.jobs.reconcile(job_id, completed=result is not None and not uncertain(result))
            self.emit('event_reconciled' if result is not None and not uncertain(result) else 'event_outcome_unknown', record)
            return 'ack'
        if decision != 'execute':
            return 'ack' if decision == 'done' else 'reject'
        self.emit('event_worker_started', record)
        try:
            # 设备认领事务已提交；模型和 Agent Loop 不占用数据库事务。
            result = self.handler(record['event'])
        except Exception:
            self.jobs.finish(job_id, owner, 'unknown', 'execution_outcome_unknown')
            self.emit('event_outcome_unknown', record)
            return 'ack'
        status = 'unknown' if uncertain(result) else 'succeeded'
        self.jobs.finish(job_id, owner, status, 'execution_outcome_unknown' if status == 'unknown' else '')
        self.emit('event_outcome_unknown' if status == 'unknown' else 'event_worker_completed', record)
        return 'ack'

    def reconcile_once(self):
        for record in self.jobs.unresolved(self.reconcile_cursor):
            self.reconcile_cursor = record['sequence_id']
            try:
                result = self.lookup(record['event'])
            except EventResultConflict:
                continue  # 不借用其他参数的旧结果；也不阻塞其他设备的对账。
            if result is not None and not uncertain(result):
                self.jobs.reconcile(record['job_id'], completed=True)

    def dead_letter_message(self, body):
        """死信原因写入原任务；不再次执行，不让页面一直停留在排队状态。"""
        try:
            value = json.loads(body)
            if set(value) != {'job_id'} or not re.fullmatch('[a-f0-9]{64}', value['job_id']):
                return
        except (ValueError, TypeError):
            return
        record = self.jobs.get(value['job_id'])
        if record is not None:
            self.jobs.dead_letter(value['job_id'])
            self.emit('event_dead_lettered', record)

    def drain_deadletters(self, publisher):
        for _ in range(20):
            method, properties, body = publisher.channel.basic_get(queue=self.settings.prefix + '.dead.records', auto_ack=False)
            if method is None:
                return
            self.dead_letter_message(body)
            publisher.channel.basic_ack(delivery_tag=method.delivery_tag)

    def start(self):
        if self.threads:
            return
        self.stop_event.clear()
        self.executor = ThreadPoolExecutor(max_workers=self.settings.workers, thread_name_prefix='event-worker')
        for partition in range(self.settings.partitions):
            thread = Thread(target=self.consume, args=(partition,), daemon=True, name=f'rabbit-consumer-{partition}')
            self.threads.append(thread)
        self.threads.append(Thread(target=self.relay, daemon=True, name='event-outbox'))
        for thread in self.threads:
            thread.start()

    def relay(self):
        publisher, failures = None, 0
        while not self.stop_event.is_set():
            try:
                if publisher is None:
                    publisher = RabbitPublisher(self.settings)
                self.reconcile_once()
                self.drain_deadletters(publisher)
                self.relay_once(publisher)
                publisher.connection.process_data_events(time_limit=0)
                with self.lock:
                    self.publisher_ready, self.last_error = True, ''
                failures = 0
            except Exception:
                with self.lock:
                    self.publisher_ready, self.last_error = False, 'queue_delivery_unavailable'
                if publisher is not None:
                    try:
                        publisher.close()
                    except Exception:
                        pass
                publisher, failures = None, min(failures + 1, 5)
            self.stop_event.wait(min(30, 2 ** failures) if failures else self.settings.poll_seconds)
        if publisher is not None:
            try:
                publisher.close()
            except Exception:
                pass

    def consume(self, partition):
        failures = 0
        while not self.stop_event.is_set():
            connection = None
            try:
                connection = connect(self.settings)
                channel = connection.channel()
                declare(channel, self.settings, partition)
                channel.basic_qos(prefetch_count=1)
                def received(ch, method, properties, body):
                    future = self.executor.submit(self.process_message, body, partition=partition)
                    # 回调绑定本次连接，避免旧任务完成时误 ack 新连接上相同的 delivery_tag。
                    def finished(done, conn=connection, target=ch, tag=method.delivery_tag):
                        try:
                            outcome = done.result()
                        except Exception:
                            outcome = 'retry'
                        try:
                            settle = partial(self.settle, target, tag, outcome)
                            conn.add_callback_threadsafe(partial(conn.call_later, 5, settle) if outcome == 'retry' else settle)
                        except Exception:
                            pass  # 未 ack 的消息由 broker 重投，MySQL 认领禁止再次执行业务。
                    future.add_done_callback(finished)
                channel.basic_consume(queue=queue_name(self.settings, partition), on_message_callback=received, auto_ack=False)
                with self.lock:
                    self.connected.add(partition)
                failures = 0
                while not self.stop_event.is_set() and connection.is_open:
                    connection.process_data_events(time_limit=0.5)
            except Exception:
                failures = min(failures + 1, 5)
            finally:
                with self.lock:
                    self.connected.discard(partition)
                if connection is not None and connection.is_open:
                    try:
                        connection.close()
                    except Exception:
                        pass
            self.stop_event.wait(min(30, 2 ** failures))

    @staticmethod
    def settle(channel, tag, outcome):
        if not channel.is_open:
            return
        if outcome == 'ack':
            channel.basic_ack(delivery_tag=tag)
        else:
            channel.basic_nack(delivery_tag=tag, requeue=outcome == 'retry')

    def snapshot(self):
        with self.lock:
            state = {'transport': 'rabbitmq', 'publisher_ready': self.publisher_ready,
                     'connected_partitions': len(self.connected), 'partitions': self.settings.partitions,
                     'workers': self.settings.workers, 'error_code': self.last_error,
                     'ready': self.publisher_ready and len(self.connected) == self.settings.partitions}
        state['jobs'] = self.jobs.counts()
        return state

    def close(self):
        self.stop_event.set()
        for thread in self.threads:
            thread.join(timeout=1)
        if self.executor is not None:
            # Python 无法强行停止已发出的写操作；保留认领供后续只读对账。
            self.executor.shutdown(wait=False, cancel_futures=True)


def build_event_queue(handler, lookup, trace=None):
    settings = QueueSettings.from_env()
    return EventQueue(MySQLEventJobs(partitions=settings.partitions), handler, lookup, settings=settings, trace=trace)
