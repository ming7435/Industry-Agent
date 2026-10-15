"""进程内有界性能计数器；不保存提示词、模型正文、用户身份或凭据。"""
from collections import deque
from collections.abc import Mapping
from datetime import datetime, timezone
import math
from threading import Lock
import time

METRIC_WINDOWS = (5, 15, 60, 1440, 10080, 43200)


def _iso(value):
    return datetime.fromtimestamp(value, timezone.utc).isoformat()


def _number(value):
    return value if type(value) is int and 0 <= value <= 10**12 else None


def _usage(raw):
    raw = raw if isinstance(raw, Mapping) else {}
    incoming = _number(raw.get('prompt_tokens', raw.get('input_tokens')))
    outgoing = _number(raw.get('completion_tokens', raw.get('output_tokens')))
    total = _number(raw.get('total_tokens'))
    if incoming is not None and outgoing is not None:
        if total is None:
            total = incoming + outgoing
        elif total < incoming + outgoing:
            total = None
    return incoming, outgoing, total


def _summary(rows):
    durations = sorted(row['duration_ms'] for row in rows)
    usage = {key: [row['usage'][index] for row in rows if row['usage'][index] is not None]
             for index, key in enumerate(('input_tokens', 'output_tokens', 'total_tokens'))}
    count = len(rows)
    successful = sum(row['success'] for row in rows)
    reported = sum(row['usage'][2] is not None for row in rows)
    return {'calls': count, 'successful': successful, 'failed': count - successful,
            'success_rate': successful / count if count else None,
            'usage': {**{key: sum(values) if values else None for key, values in usage.items()},
                      'reported_calls': reported, 'missing_calls': count - reported},
            'duration_ms': {'average': round(sum(durations) / count, 3) if count else None,
                            'p95': round(durations[math.ceil(count * .95) - 1], 3) if count else None,
                            'maximum': round(durations[-1], 3) if count else None}}


class ModelMetrics:
    """仅描述本模型网关进程，不冒充跨进程、供应商账单或永久历史。"""
    def __init__(self, *, clock=time.time, timer=time.monotonic, maxlen=20000):
        self.clock, self.timer = clock, timer
        self.started = clock()
        self.rows = deque(maxlen=max(1, int(maxlen)))
        self.inflight = 0
        self.dropped_at = None
        self.lock = Lock()

    def begin(self, synthetic=False):
        with self.lock:
            if not synthetic:
                self.inflight += 1
        return self.timer()

    def finish(self, started, capability, synthetic, success, usage=None):
        row = {'at': self.clock(), 'duration_ms': max(0, (self.timer() - started) * 1000),
               'capability': capability, 'synthetic': bool(synthetic), 'success': bool(success),
               'usage': _usage(usage)}
        with self.lock:
            if not synthetic:
                self.inflight = max(0, self.inflight - 1)
            if len(self.rows) == self.rows.maxlen:
                self.dropped_at = self.rows[0]['at']
            self.rows.append(row)

    def snapshot(self, window_minutes=15):
        if type(window_minutes) is not int or window_minutes not in METRIC_WINDOWS:
            raise ValueError('监控时间范围必须为1小时、1天、1周或30天；兼容旧版5/15分钟请求')
        now = self.clock()
        start = max(self.started, now - window_minutes * 60)
        with self.lock:
            rows = [dict(row) for row in self.rows if start <= row['at'] <= now]
            inflight, dropped_at = self.inflight, self.dropped_at
        real = [row for row in rows if not row['synthetic']]
        summary = _summary(real)
        seconds = max(1, now - start)
        bucket_seconds = 60 if window_minutes <= 60 else 3600 if window_minutes <= 1440 else 86400
        # 北京时间整点/零点划分；先聚合一次，长窗口不扫描数万分钟。
        offset = 8 * 3600
        buckets = {}
        for row in real:
            key = int((row['at'] + offset) // bucket_seconds)
            buckets.setdefault(key, []).append(row)
        timeline = []
        for key in range(int((start + offset) // bucket_seconds), int((now + offset) // bucket_seconds) + 1):
            selected = buckets.get(key, [])
            item = _summary(selected)
            timeline.append({'at': _iso(key * bucket_seconds - offset), 'calls': item['calls'], 'failed': item['failed'],
                             'total_tokens': item['usage']['total_tokens']})
        return {**summary, 'available': True, 'scope': 'model_service_process',
                'started_at': _iso(self.started), 'generated_at': _iso(now), 'window_start': _iso(start),
                'window_minutes': window_minutes, 'observed_seconds': round(seconds, 3),
                'bucket_seconds': bucket_seconds, 'timezone': 'Asia/Shanghai',
                'inflight': inflight, 'synthetic_calls': len(rows) - len(real),
                'partial': dropped_at is not None and dropped_at >= start,
                'capacity': self.rows.maxlen,
                'requests_per_minute': summary['calls'] * 60 / seconds,
                'tokens_per_minute': summary['usage']['total_tokens'] * 60 / seconds
                    if summary['usage']['total_tokens'] is not None else None,
                'capabilities': [{'capability': capability, **_summary([row for row in real if row['capability'] == capability])}
                                 for capability in ('chat', 'embedding', 'rerank', 'vision')],
                'timeline': timeline}
