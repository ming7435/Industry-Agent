"""Restore pending jobs from Backend with bounded GET-only workers and no browser dependency."""
from concurrent.futures import ThreadPoolExecutor
from threading import Event, Lock, Thread
import time


class VirtualProductionReconciler:
    MAX_WORKERS = 4
    MAX_PER_TICK = 24

    def __init__(self, coordinator, backend, clock=time.time):
        self.coordinator, self.backend, self.clock = coordinator, backend, clock
        self._stop, self._lock = Event(), Lock()
        self._thread = None
        self._cursor = ''
        self._schedule = {}
        self.last_error = ''

    @property
    def running(self): return self._thread is not None and self._thread.is_alive()

    def _one(self, job, now):
        try:
            if self._stop.is_set(): return 'stopped'
            result = self.coordinator.reconcile_saved(job)
            if result.get('status') == 'completed':
                self._schedule.pop(job['job_id'], None)
            elif result.get('sync_status') in {'unavailable', 'outcome_unknown'}:
                self._failure(job['job_id'], now)
            else:
                self._schedule[job['job_id']] = {'at': now + (30 if result.get('status') == 'paused' else 2), 'failures': 0}
            return 'checked'
        except Exception:
            self.last_error = '生产事实暂不可核对，已保留原任务'
            self._failure(job['job_id'], now)
            return 'unavailable'

    def _failure(self, job_id, now):
        failures = self._schedule.get(job_id, {}).get('failures', 0) + 1
        self._schedule[job_id] = {'at': now + [5, 10, 20, 30][min(failures - 1, 3)], 'failures': failures}

    def run_once(self, now: float):
        if self._stop.is_set() or not self._lock.acquire(blocking=False): return {'checked': 0}
        counts = {'checked': 0, 'unavailable': 0, 'stopped': 0}
        try:
            page = self.backend.pending(now, cursor=self._cursor, limit=50)
            jobs = [job for job in page['items'] if self._schedule.get(job['job_id'], {}).get('at', 0) <= now][:self.MAX_PER_TICK]
            # At most four futures exist at once; no unbounded executor queue.
            with ThreadPoolExecutor(max_workers=self.MAX_WORKERS, thread_name_prefix='virtual-fact-read') as executor:
                for offset in range(0, len(jobs), self.MAX_WORKERS):
                    if self._stop.is_set(): break
                    futures = [executor.submit(self._one, job, now) for job in jobs[offset:offset+self.MAX_WORKERS]]
                    for future in futures: counts[future.result()] += 1
            self._cursor = jobs[-1]['job_id'] if jobs and (page['next_cursor'] or len(page['items']) > len(jobs)) else ''
            return counts
        finally:
            self._lock.release()

    def _loop(self):
        failures = 0
        while not self._stop.is_set():
            delay = 2
            try:
                self.run_once(self.clock())
                failures = 0
            except Exception:
                self.last_error = '生产对账目录暂不可用'
                failures += 1
                delay = [5, 10, 20, 30][min(failures - 1, 3)]
            self._stop.wait(delay)

    def start(self):
        if self.running: return
        self._stop.clear()
        self._thread = Thread(target=self._loop, name='virtual-production-reconciler', daemon=True)
        self._thread.start()

    def close(self):
        self._stop.set()
        if self._thread is not None: self._thread.join(timeout=45)
