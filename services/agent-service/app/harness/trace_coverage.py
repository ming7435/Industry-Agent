"""持久化记录器覆盖证明：缺口不随 deque 淘汰或进程重启消失。"""
from datetime import datetime, timedelta, timezone
import json
from threading import Lock
from uuid import uuid4


def coverage_complete(rows, start, end):
    """UTC无时区数据库值；所有相交实例都无缺口且覆盖连续才算完整。"""
    intervals = []
    for row in rows:
        left, right, closed = row['started_at'], row['last_covered_at'], row['closed_at']
        if left >= end or closed is not None and closed <= start:
            continue
        if max(start, right) < min(end, closed or end):
            return False
        try:
            days = json.loads(row['gap_days']) if isinstance(row['gap_days'], str) else row['gap_days']
            for day in days or []:
                gap = datetime.fromisoformat(day)
                if gap < end and gap + timedelta(days=1) > start:
                    return False
        except (ValueError, TypeError):
            return False
        intervals.append((left, min(right, closed or right)))
    covered = start
    for left, right in sorted(intervals):
        if left > covered:
            break
        covered = max(covered, right)
    return covered >= end


class CoverageTracker:
    def __init__(self, clock=None):
        self.clock = clock or (lambda: datetime.now(timezone.utc).replace(tzinfo=None))
        self.instance = uuid4().hex
        self.gap_days = set()
        self.lock = Lock()

    def initialize(self, cursor):
        cursor.execute('CREATE TABLE IF NOT EXISTS agent_trace_coverage ('
            'instance_id CHAR(32) PRIMARY KEY, started_at DATETIME(6) NOT NULL, '
            'last_covered_at DATETIME(6) NOT NULL, closed_at DATETIME(6) NULL, gap_days JSON NOT NULL, '
            'INDEX coverage_window(started_at,closed_at)) ENGINE=InnoDB')
        self._open(cursor)

    def _open(self, cursor):
        now = self.clock()
        cursor.execute('INSERT INTO agent_trace_coverage(instance_id,started_at,last_covered_at,gap_days) '
                       'VALUES (%s,%s,%s,%s)', (self.instance, now, now, '[]'))

    def note_failure(self):
        with self.lock:
            self.gap_days.add(self.clock().date().isoformat())

    def progress(self, cursor, *, close=False):
        now = self.clock()
        with self.lock:
            gaps = json.dumps(sorted(self.gap_days))
        cursor.execute('UPDATE agent_trace_coverage SET last_covered_at=%s,closed_at=%s,gap_days=%s '
                       'WHERE instance_id=%s AND closed_at IS NULL',
                       (now, now if close else None, gaps, self.instance))
        if cursor.rowcount == 0 and not close:
            # 旧实例已因心跳过期关闭：开启新覆盖段，不把暂停期间补写成连续。
            self.instance = uuid4().hex
            self._open(cursor)

    def check(self, cursor, start, end):
        self.progress(cursor)
        now = self.clock()
        # 丢失心跳不等于期间无执行：关闭在当前时刻，未覆盖尾段明确为缺口。
        cursor.execute('UPDATE agent_trace_coverage SET closed_at=%s WHERE closed_at IS NULL '
                       'AND last_covered_at<%s AND instance_id<>%s',
                       (now, now - timedelta(seconds=180), self.instance))
        cursor.execute('SELECT started_at,last_covered_at,closed_at,gap_days FROM agent_trace_coverage '
                       'WHERE started_at<%s AND (closed_at IS NULL OR closed_at>%s) ORDER BY started_at LIMIT 5001',
                       (end, start))
        rows = cursor.fetchall()
        if len(rows) > 5000:
            return False
        fields = ('started_at', 'last_covered_at', 'closed_at', 'gap_days')
        return coverage_complete([row if isinstance(row, dict) else dict(zip(fields, row)) for row in rows], start, end)
