"""有界、只读加载历史方案；不将完整工具轨迹搬入页面进程。"""
from contextlib import closing
import json
from pathlib import Path
import sqlite3
from threading import Event, Lock, Thread


class EventPlanReader:
    def __init__(self, path):
        self.path = Path(path).resolve()
        self.lock = Lock()
        self.finished = Event()
        self.stopped = Event()
        self.thread = None
        self.connection = None
        self.signature = None
        self.results = []
        self.total = 0
        self.error = ""

    def _signature(self):
        # 同时观察 WAL；没有修改数据库结构、内容、时间戳或旧结果。
        values = []
        for path in (self.path, Path(str(self.path) + "-wal")):
            try:
                stat = path.stat()
                values.append((stat.st_size, stat.st_mtime_ns))
            except FileNotFoundError:
                values.append(None)
        return tuple(values)

    def invalidate(self):
        with self.lock:
            self.signature = None

    def snapshot(self, wait_seconds=0.5):
        with self.lock:
            signature = self._signature()
            if not self.stopped.is_set() and (self.thread is None or not self.thread.is_alive()) and self.signature != signature:
                self.finished.clear()
                self.error = ""
                self.signature = signature
                self.thread = Thread(target=self._read, daemon=True, name="maintenance-history-reader")
                self.thread.start()
        self.finished.wait(max(0, min(wait_seconds, 1)))
        with self.lock:
            loading = not self.finished.is_set()
            return list(self.results), {"status": "failed" if self.error else "loading" if loading else "ready",
                "loaded_records": len(self.results), "total_records": self.total, "error": self.error}

    def _read(self):
        try:
            # 单独只读连接，不占用 DurableJsonStore 的写入锁或写事务。
            with closing(sqlite3.connect(self.path.as_uri() + "?mode=ro", uri=True, timeout=1, check_same_thread=False)) as connection:
                with self.lock:
                    self.connection = connection
                rows = connection.execute("SELECT rowid FROM runtime_state WHERE namespace=? "
                    "ORDER BY updated_at DESC, rowid DESC LIMIT 5000", ("agent_event",)).fetchall()
                with self.lock:
                    self.results = []
                    self.total = len(rows)
                # SQLite 只返回必要子树；一次仅加载一个历史结果，及时展示最新方案。
                fields = ("maintenance_plan", "diagnosis", "event", "task_id", "trace_id", "status", "stop_reason",
                          "workorder", "requires_approval", "dispatch_reason")
                paths = ("$._event_result_store_version", *(f"$.result.{field}" for field in fields), *(f"$.{field}" for field in fields))
                query = "SELECT json_extract(payload," + ",".join("?" for _ in paths) + ") FROM runtime_state WHERE namespace=? AND rowid=?"
                for (row_id,) in rows:
                    if self.stopped.is_set():
                        return
                    row = connection.execute(query, (*paths, "agent_event", row_id)).fetchone()
                    if row is not None:
                        values = json.loads(row[0])
                        size = len(fields)
                        selected = values[1:1 + size] if values[0] == 2 else values[1 + size:1 + 2 * size]
                        result = dict(zip(fields, selected))
                        with self.lock:
                            self.results.append(result)
        except (sqlite3.Error, OSError, ValueError, TypeError):
            with self.lock:
                if not self.stopped.is_set():
                    self.error = "历史方案读取失败，已保留原始事件数据；请检查事件存储可用性"
                self.signature = None
        finally:
            with self.lock:
                self.connection = None
            self.finished.set()

    def close(self):
        self.stopped.set()
        with self.lock:
            if self.connection is not None:
                try:
                    self.connection.interrupt()
                except sqlite3.Error:
                    pass  # 后台刚完成并关闭连接时，关闭仍为幂等操作。
            thread = self.thread
        if thread is not None:
            thread.join(timeout=3)
