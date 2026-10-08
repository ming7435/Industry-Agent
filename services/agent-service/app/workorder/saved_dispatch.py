"""Dispatch existing plans in the background, independently of page refreshes."""
from copy import deepcopy
from datetime import datetime, timezone
from hashlib import sha256
import json
import logging
from threading import Event, Lock, Thread

from shared.workorder_dispatch import followup_values, validate_followup_order
from app.agents.workorder.agent import WorkOrderAgent
from app.runtime.policy import RuntimePolicy
from app.workorder.policy import auto_workorder_decision
from app.workorder.validator import WorkOrderValidator
from app.workorder.service import WorkOrderService


class SavedPlanDispatcher:
    def __init__(self, store, backend, registry):
        self.store, self.backend, self.registry = store, backend, registry
        self._lock, self._stop = Lock(), Event()
        self._thread = None

    def start(self):
        if self._thread and self._thread.is_alive():
            return
        self._thread = Thread(target=self._run, daemon=True, name='saved-plan-workorder-dispatch')
        self._thread.start()

    def close(self):
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=5)

    def _run(self):
        while not self._stop.is_set():
            try:
                self.sync()
            except Exception:
                logging.getLogger('uvicorn.error').exception('saved_plan_workorder_dispatch_unavailable')
            self._stop.wait(2)

    def sync(self):
        # One worker per process; Backend's durable creation key handles multiple workers.
        with self._lock:
            results, history = self.store.list_plan_results()
            if history.get('status') != 'ready' or not results:
                return
            deleted = set(self.store.deleted_plan_ids())
            deleted.update(self.backend.call('list_deleted_maintenance_plan_ids', {})['deleted_plan_ids'])
            orders = self.backend.call('list_workorders', {})
            if orders.get('success') is False or not isinstance(orders.get('items'),list):
                raise ValueError('工单对账数据不可用')
            # Latest unresolved event per device prevents reuse of an older repeated alarm.
            latest = {}
            for fault in self.backend.status().get('faults') or []:
                if not fault.get('resolved'):
                    latest[fault.get('device_id')] = fault.get('event_id')
            seen = set()
            for record in results:
                event, plan = record.get('event') or {}, record.get('maintenance_plan') or {}
                device_id, event_id = event.get('device_id'), event.get('event_id')
                if (not plan or plan.get('plan_id') in deleted or record.get('status') == 'running'
                        or not device_id or not event_id or latest.get(device_id) != event_id
                        or (device_id,event_id) in seen):
                    continue
                seen.add((device_id,event_id))
                existing = next((o for o in orders['items'] if o.get('device_id') == device_id and o.get('event_id') == event_id),None)
                if existing and (existing.get('deleted_at') or existing.get('assignee') or existing.get('status') != 'open'):
                    continue
                if RuntimePolicy._explicit_approval_required({}, record) or record.get('requires_approval'):
                    continue
                current = self.registry.execute('get_device_status', {'device_id':device_id},
                    context={'agent':'workorder','step':'saved_plan_dispatch_readback','event_id':event_id})
                try:
                    checked = datetime.fromisoformat(str(current.get('checked_at') or '').replace('Z','+00:00'))
                    age = (datetime.now(timezone.utc) - checked).total_seconds()
                except (ValueError,TypeError):
                    age = float('inf')
                if (current.get('found') is not True or current.get('success') is not True
                        or current.get('device_id') != device_id or not -30 <= age <= 30
                        or not current.get('alarm_code') or str(current['alarm_code']) != str(event.get('alarm_code'))):
                    continue
                directory = self.backend.call('query_technicians', {'device_id':device_id})
                if directory.get('success') is False or not isinstance(directory.get('items'),list):
                    continue
                candidates = WorkOrderAgent.rank_candidates({'device_id':device_id,'candidates':directory['items']},{},plan)
                if not candidates:
                    continue
                diagnosis = record.get('diagnosis') or plan.get('diagnosis') or {}
                try:
                    WorkOrderValidator.validate_plan(plan)
                    allowed, _ = auto_workorder_decision(diagnosis, plan, event)
                    if (plan.get('plan_id') in self.store.deleted_plan_ids()
                            or plan.get('plan_id') in self.backend.call('list_deleted_maintenance_plan_ids', {})['deleted_plan_ids']):
                        continue
                    if existing:
                        if existing.get('plan_id') != plan.get('plan_id'):
                            continue
                        if existing.get('dispatch_mode') == 'fault_followup':
                            # Recheck the source too; an old open task cannot grant readiness.
                            followup_values(plan,diagnosis,event,existing.get('idempotency_key',''))
                            validate_followup_order(existing)
                        elif not allowed or plan.get('validation_findings') or plan.get('validation_errors'):
                            continue
                        actual = existing
                    else:
                        key = 'saved-plan-workorder:' + sha256(json.dumps([event.get('tenant_id',''),device_id,event_id],ensure_ascii=False).encode()).hexdigest()
                        if allowed and not (plan.get('validation_findings') or plan.get('validation_errors')):
                            values = deepcopy(plan)
                            values.update(event_id=event_id,idempotency_key=key,
                                diagnosis_snapshot=deepcopy(diagnosis),maintenance_plan_snapshot=deepcopy(plan))
                            order = WorkOrderService(self.registry).create_from_plan(values)
                            actual = order.model_dump(mode='json')
                        else:
                            actual = self.backend.call('create_workorder', followup_values(plan,diagnosis,event,key))['workorder']
                        orders['items'].append(actual)
                    if plan.get('plan_id') in self.store.deleted_plan_ids():
                        continue
                    assigned = self.backend.call('assign_workorder', {'workorder_id':actual['workorder_id'], 'assignee':candidates[0]['technician_id']})['workorder']
                    logging.getLogger('uvicorn.error').info('saved_plan_workorder_dispatched plan_id=%s event_id=%s workorder_id=%s assignee=%s',
                        plan['plan_id'],event_id,assigned['workorder_id'],assigned['assignee'])
                except ValueError:
                    # Unknown, mismatched or explicitly blocked evidence stays blocked.
                    continue
