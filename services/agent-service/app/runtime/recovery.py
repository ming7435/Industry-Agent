"""Server-owned durable checkpoints and single-owner task recovery."""
from __future__ import annotations

from datetime import datetime, timezone
from hashlib import sha256
from typing import Any, Callable, Mapping
from uuid import uuid4
from contextlib import contextmanager
from threading import Event, RLock, Thread
from time import time
import json
import re

NAMESPACE = 'runtime_recovery'
RECEIPTS = 'runtime_recovery_receipt'
OWNERS = 'runtime_recovery_owner'
EVENTS = 'runtime_recovery_event'


class RecoveryConflict(RuntimeError):
    pass


def now():
    return datetime.now(timezone.utc).isoformat()


def clean_error(value):
    text = str(value or '')[:1500]
    text = re.sub(r'(?i)(bearer\s+|(?:api[_-]?key|password|token)\s*[=:]\s*)\S+', r'\1[REDACTED]', text)
    return re.sub(r'(?i)\bsk-[a-z0-9_-]+', '[REDACTED]', text)


def snapshot_state(value, markers=None):
    """Freeze JSON containers without copying immutable evidence into JSON text."""
    if isinstance(value, (dict, list, tuple)):
        markers = set() if markers is None else markers
        identity = id(value)
        if identity in markers:
            raise ValueError('Circular reference detected')
        markers.add(identity)
        try:
            if not isinstance(value, dict):
                return [snapshot_state(item, markers) for item in value]
            result = {}
            for key, item in value.items():
                if not isinstance(key, str):
                    if key is not None and not isinstance(key, (int, float, bool)):
                        raise TypeError('JSON object keys must be strings or numbers')
                    key = json.dumps(key, ensure_ascii=False)
                result[key] = snapshot_state(item, markers)
            return result
        finally:
            markers.remove(identity)
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


class RecoveryManager:
    def __init__(self, store):
        self.store = store
        from .service_exceptions import ServiceExceptionCases
        self.cases = ServiceExceptionCases(store)
        self.case_storage_warning = ''
        self.instance_id = uuid4().hex
        self._lock = RLock()
        self._active = set()
        self._scopes = {}
        self._stop = Event()
        self._thread = None

    def _heartbeat(self):
        with self._lock:
            self.store.set(OWNERS, self.instance_id, {
                'instance_id': self.instance_id, 'expires_at': time() + 45,
                'active_tasks': sorted(self._active | self._scopes.keys())})

    def start(self):
        if self._thread is not None:
            return
        self._stop.clear()
        def run():
            next_case_sync = 0
            while not self._stop.wait(5):
                try:
                    self._heartbeat()
                    if time() >= next_case_sync:
                        self.collect_exception_cases()
                        next_case_sync = time() + 60
                except Exception:
                    # Lost storage connectivity must not manufacture a live lease.
                    pass
        self._heartbeat()
        self.collect_exception_cases()
        self._thread = Thread(target=run, name='recovery-heartbeat', daemon=True)
        self._thread.start()

    def close(self):
        self._stop.set()
        if self._thread is not None:
            self._thread.join(2)
            self._thread = None
        with self._lock:
            self._active.clear()
            self._scopes.clear()
            self.store.set(OWNERS, self.instance_id, {'instance_id': self.instance_id, 'expires_at': 0, 'active_tasks': []})

    @contextmanager
    def execution_scope(self, task_id, kind='runtime'):
        identity = self.identifier(task_id, kind)
        with self._lock:
            self._scopes[identity] = self._scopes.get(identity, 0) + 1
            self._heartbeat()
        try:
            yield
        finally:
            with self._lock:
                count = self._scopes.get(identity, 1) - 1
                if count:
                    self._scopes[identity] = count
                else:
                    self._scopes.pop(identity, None)
                    self._active.discard(identity)
                self._heartbeat()

    def _owner_active(self, record, owners=None):
        lease = (owners.get(record.get('instance_id')) if owners is not None
                 else self.store.get(OWNERS, record.get('instance_id'))) or {}
        return lease.get('expires_at', 0) > time() and record['recovery_id'] in lease.get('active_tasks', [])

    @staticmethod
    def identifier(task_id, kind='runtime'):
        return 'REC-' + sha256((kind + ':' + str(task_id)).encode()).hexdigest()[:32]

    def checkpoint(self, state: Mapping[str, Any], status: str, *, error='', kind='runtime'):
        status = 'failed' if status == 'error' else status
        task_id = str(state.get('task_id') or '')
        if not task_id:
            raise ValueError('checkpoint requires a task identity')
        recovery_id = self.identifier(task_id, kind)
        event = state.get('event') or {}
        if kind == 'runtime' and state.get('entry') == 'trigger' and event.get('event_id'):
            from .event_store import scoped_event_key
            identity = {'recovery_id': recovery_id, 'fingerprint': self.event_fingerprint(event)}
            saved_identity = self.store.get_or_create(EVENTS, scoped_event_key(event), lambda: identity)
            if saved_identity != identity:
                raise RecoveryConflict('该事件已有原任务记录，请查看日志中的失败原因和异常核查待办；不能重复执行')
        header_reader = getattr(self.store, 'recovery_header', None)
        old = (header_reader(recovery_id) if callable(header_reader) else self.get(recovery_id)) or {}
        epoch = int(state.get('runtime_recovery_epoch') or 0)
        if epoch < int(old.get('epoch') or 0):
            raise RecoveryConflict('旧执行尝试不能覆盖新的恢复断点')
        if old and epoch == old.get('epoch') and old.get('instance_id') != self.instance_id \
                and old['status'] in {'running', 'resuming'} and self._owner_active(old):
            raise RecoveryConflict('原执行者仍在执行，不能覆盖断点')
        snapshot = snapshot_state(dict(state))
        record = {**old, 'recovery_id': recovery_id, 'kind': kind, 'task_id': task_id,
                  'trace_id': str(state.get('trace_id') or task_id), 'status': status,
                  'state': snapshot, 'error': clean_error(error), 'instance_id': self.instance_id,
                  'updated_at': now(), 'created_at': old.get('created_at') or now(),
                  'attempts': int(old.get('attempts') or 0)}
        record['epoch'] = epoch
        if old:
            replacer = getattr(self.store, 'replace_recovery_checkpoint', None)
            saved = (replacer(recovery_id, old.get('updated_at'), record) if callable(replacer)
                     else self.store.compare_and_set(NAMESPACE, recovery_id, 'updated_at', old.get('updated_at'), record))
            if saved is None:
                raise RecoveryConflict('恢复断点已更新，请读取最新状态')
        else:
            actual = self.store.get_or_create(NAMESPACE, recovery_id, lambda: record)
            if actual != record:
                raise RecoveryConflict('任务断点已存在，请读取最新状态')
        with self._lock:
            if status in {'running', 'resuming'}:
                self._active.add(recovery_id)
            else:
                self._active.discard(recovery_id)
            self._heartbeat()
        try:
            self.cases.record(record)
            self.case_storage_warning = ''
        except Exception:
            # 原失败断点已保存，不以附加记录写入失败替换原故障，更不能重跑原步骤。
            self.case_storage_warning = '异常核查记录暂未保存，原失败记录保留'
        return record

    def collect_exception_cases(self):
        """有界回填历史失败元数据，不调用任何原业务、Agent 或设备。"""
        try:
            known = {item['recovery_id'] for item in self.cases.list()}
            reader = getattr(self.store, 'recovery_records', None)
            records = reader(5000) if callable(reader) else self.store.values(NAMESPACE, 5000)
            owners = {item['instance_id']:item for item in self.store.values(OWNERS,5000)}
            count = 0
            for header in records:
                if header.get('recovery_id') in known or count >= 100:
                    continue
                interrupted = header.get('status') in {'running','resuming'} and not self._owner_active(header,owners)
                if not interrupted and header.get('status') not in {'failed','error','blocked','timeout','outcome_unknown','interrupted'}:
                    continue
                full = self.get(header['recovery_id'])
                if full is not None:
                    observed = {**full,'observed_status':'interrupted'} if interrupted else full
                    if self.cases.record(observed) is not None:
                        count += 1
            self.case_storage_warning = ''
        except Exception:
            self.case_storage_warning = '历史异常核查记录暂未同步，原失败记录保留'

    def get(self, recovery_id):
        return self.store.get(NAMESPACE, recovery_id)

    @staticmethod
    def event_fingerprint(event):
        return sha256(json.dumps(event, ensure_ascii=False, sort_keys=True, default=str).encode('utf-8')).hexdigest()

    def for_event(self, event):
        from .event_store import scoped_event_key
        key = scoped_event_key(event)
        identity = self.store.get(EVENTS, key) if key else None
        if identity is None:
            return None
        if identity['fingerprint'] != self.event_fingerprint(event):
            raise RecoveryConflict('相同事件修订的请求参数不一致')
        record = self.get(identity['recovery_id'])
        if record is None:
            raise RecoveryConflict('原事件断点暂不可读取，不能重新创建任务')
        return record

    def summary(self, record, owners=None):
        state = record.get('state') or {}
        action = state.get('next_action') or {}
        status = record['status']
        owner_active = self._owner_active(record, owners)
        interrupted = status in {'running', 'resuming'} and not owner_active
        execution = state.get('runtime_execution') or {}
        unknown = interrupted or status in {'timeout', 'outcome_unknown'} or execution.get('side_effect_status') == 'unknown' or execution.get('execution_status') in {'TIMEOUT', 'UNKNOWN'}
        result = state.get('runtime_result') or {}
        reason = str(result.get('stop_reason') or state.get('stop_reason') or '')
        forbidden = reason in {'policy_denied', 'knowledge_read_only_scope', 'approval_required'} or status == 'waiting_approval'
        possible = interrupted or status in {'failed', 'blocked', 'timeout', 'outcome_unknown', 'waiting_for_personnel'}
        if record.get('_recovery_projection_version') == 1:
            has_checkpoint = bool(record.get('has_checkpoint'))
        else:
            has_checkpoint = record.get('kind') == 'production' or bool((state.get('runtime_plan') or {}).get('actions'))
        completed = [{key: item.get(key) for key in ('agent', 'step', 'action_id') if item.get(key)}
                     for item in state.get('completed_steps') or [] if isinstance(item, dict)]
        return {key: record.get(key) for key in ('recovery_id', 'kind', 'task_id', 'trace_id', 'created_at', 'updated_at', 'attempts')} | {
            'status': 'interrupted' if interrupted else status,
            'failed_agent': str(action.get('target') or state.get('active_agent') or 'runtime'),
            'failed_step': str(action.get('required_capability') or action.get('step') or state.get('current_step') or ''),
            'completed_steps': completed, 'error': clean_error(record.get('error') or reason),
            'can_resume': possible and has_checkpoint and not forbidden and not owner_active,
            'requires_reconcile': bool(unknown and action.get('side_effect')),
            'actor_id': str(state.get('recovery_actor_id') or ''),
            'device_id': str((state.get('event') or {}).get('device_id') or '')}

    def list(self):
        reader = getattr(self.store, 'recovery_records', None)
        records = reader(5000) if callable(reader) else self.store.values(NAMESPACE, 5000)
        owners = {item['instance_id']: item for item in self.store.values(OWNERS, 5000) if item.get('instance_id')}
        return sorted((self.summary(item, owners) for item in records), key=lambda item: item['updated_at'], reverse=True)

    def resume(self, recovery_id: str, request_id: str, callback: Callable):
        receipt_key = recovery_id + ':' + request_id
        receipt = self.store.get(RECEIPTS, receipt_key)
        if receipt is not None:
            return receipt
        record = self.get(recovery_id)
        if record is None:
            raise KeyError('失败任务不存在或没有可用断点')
        summary = self.summary(record)
        if record['status'] == 'completed':
            return summary
        if not summary['can_resume']:
            raise RecoveryConflict('任务仍在执行、需要原审批或没有可靠恢复断点')
        with self.execution_scope(record['task_id'], record['kind']):
            return self._resume_claimed(record, request_id, callback, summary)

    def _resume_claimed(self, record, request_id, callback, summary):
        recovery_id = record['recovery_id']
        receipt_key = recovery_id + ':' + request_id
        epoch = int(record.get('epoch') or 0) + 1
        claimed = self.store.compare_and_set(NAMESPACE, recovery_id, 'updated_at', record['updated_at'],
            {'status': 'resuming', 'instance_id': self.instance_id, 'attempts': record['attempts'] + 1,
             'epoch': epoch, 'state': {**record['state'], 'runtime_recovery_epoch': epoch}, 'updated_at': now()})
        if claimed is None:
            raise RecoveryConflict('任务已由另一请求恢复，请刷新查看结果')
        claimed['reconcile_only'] = summary['requires_reconcile']
        try:
            result = callback(claimed)
            status = str((result.get('runtime_result') or {}).get('status') or result.get('recovery_status') or 'failed')
            self.checkpoint(result, status, kind=record['kind'], error=result.get('recovery_error') or result.get('stop_reason'))
        except Exception as error:
            current = self.get(recovery_id) or claimed
            if current.get('epoch') != epoch or current.get('instance_id') != self.instance_id:
                raise RecoveryConflict('该恢复尝试已失效，请读取最新执行结果') from error
            self.checkpoint({**current['state'], 'runtime_recovery_epoch': epoch}, 'blocked', kind=record['kind'], error=error)
        current = self.get(recovery_id)
        receipt = self.summary(current)
        self.store.set(RECEIPTS, receipt_key, receipt)
        return receipt
