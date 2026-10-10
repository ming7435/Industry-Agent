"""Resume knowledge accumulation from persisted completed incidents, without controls."""
from datetime import datetime, timezone
import logging
from threading import Event, Lock, Thread


class KnowledgeSyncWorker:
    def __init__(self, operations, backend):
        self.operations, self.backend = operations, backend
        self._stop, self._lock, self._thread = Event(), Lock(), None

    def start(self):
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = Thread(target=self._run, name='repair-knowledge-sync', daemon=True)
        self._thread.start()

    def close(self):
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=5)

    def _run(self):
        while not self._stop.is_set():
            try:
                self.sync()
            except Exception as error:
                # No credentials, provider responses, or equipment writes in this worker.
                logging.getLogger(__name__).warning('knowledge_sync_retry: %s', type(error).__name__)
            self._stop.wait(5)

    def sync(self, *, force=False):
        from shared.repair_experience import manual_restart_cycle, build_manual_summary
        from shared.technician_confirmation import trusted_technician_confirmation
        with self._lock:
            cycles = self.backend.status().get('completed_cycles') or []
            orders = self.backend.call('list_workorders').get('items') or []
            now = datetime.now(timezone.utc)
            for order in orders:
                if self._stop.is_set():
                    break
                if not trusted_technician_confirmation(order) or order.get('deleted_at'):
                    continue
                try:
                    cycle = manual_restart_cycle(order, cycles)
                except ValueError:
                    continue
                saved = self.backend.call('search_experience', {'source_workorder': order['workorder_id'], 'limit': 100}).get('items') or []
                summary = next((item for item in saved if item.get('learning_scope') == 'manual_case_summary'), {})
                revision = build_manual_summary(order, cycle)['content_revision']
                if summary.get('rag_saved') is True and summary.get('content_revision') == revision:
                    continue
                retry_at = (summary.get('knowledge_sync') or {}).get('next_retry_at')
                if retry_at and not force and datetime.fromisoformat(retry_at.replace('Z', '+00:00')) > now:
                    continue
                self.operations.summarize_repair(order['workorder_id'], sync_knowledge=True)
            pending = self.backend.call('search_experience', {'sync_pending': True, 'limit': 100}).get('items') or []
            for item in pending:
                if self._stop.is_set():
                    break
                self.operations.execute_memory('sync', {'experience': item,
                    'workorder': {'event_id': item.get('source_event_id'), 'device_id': item.get('device_id')},
                    'device_id': item.get('device_id')}, from_agent='report')
            if cycles:
                # Reports follow the saved knowledge receipt independently of UI polling.
                self.backend.call('list_reports')
