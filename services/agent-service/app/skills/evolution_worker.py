"""有界后台扫描，不在Agent执行锁或数据库事务中运行模型及模拟测试。"""
import os
from threading import Event, Thread
from time import monotonic


class EvolutionWorker:
    def __init__(self, service, enabled=None):
        self.service = service
        self.enabled = (os.getenv('APP_ENV', 'development') != 'testing' and
                        os.getenv('SKILL_AUTO_UPDATE_ENABLED', 'true').lower() == 'true') if enabled is None else enabled
        self.stop = Event()
        self.wakeup = Event()
        self.thread = None
        self.next_scan = 0
        self.last_error = ''

    def status(self):
        return {'enabled': bool(self.enabled), 'scan_interval_seconds': 60,
                'model_configured': bool(getattr(self.service.client_factory(), 'available', False)),
                'message': self.last_error or ('独立技能优化循环：按完整周计划准备修改稿，最终由人工发布' if self.enabled else '后台自动优化未启动')}

    def tick(self):
        try:
            records = self.service.list()
            active = [r for r in records if r['status'] in
                      {'generating', 'confirmed', 'verification_starting', 'verifying', 'awaiting_publication', 'publishing'}]
            # 每轮每项最多一次读对账；多个进程由服务端租约/CAS隔离。
            for record in active[:4]:
                self.service.advance(record['proposal_id'])
            if monotonic() >= self.next_scan:
                self.next_scan = monotonic() + 60
                self.service.loop.refresh()
                if getattr(self.service.client_factory(), 'available', False):
                    self.service.loop.scan_once(refresh=False)
            self.last_error = ''
        except Exception:
            self.last_error = '自动优化依赖暂不可用，旧版保持不变；请检查MySQL、模型及验证服务'

    def _run(self):
        while not self.stop.is_set():
            self.tick()
            self.wakeup.wait(5)
            self.wakeup.clear()

    def start(self):
        if self.enabled and (self.thread is None or not self.thread.is_alive()):
            self.stop.clear()
            self.thread = Thread(target=self._run, name='skill-evolution', daemon=True)
            self.thread.start()

    def wake(self):
        self.wakeup.set()

    def close(self):
        self.stop.set()
        self.wakeup.set()
        if self.thread is not None:
            self.thread.join(timeout=2)
