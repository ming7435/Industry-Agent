"""Watch a trusted local image drop folder and inspect each completed image once."""
from __future__ import annotations

import base64
import os
from pathlib import Path
from threading import Event, Lock, Thread
from time import time_ns
from uuid import uuid4

from app.vision.service import MAX_IMAGE_BYTES, VisionServiceError


_MIME = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp'}


class VisionAutoInbox:
    """Single-process local image feed; results never link to a production part."""

    def __init__(self, vision, root, *, interval=1.5, settle_seconds=1.5):
        self.vision = vision
        self.root = Path(root).resolve()
        self.owner = 'local-auto-inbox'
        self.model_id = 'patchcore-gear'
        self.interval = interval
        self.settle_seconds = settle_seconds
        self._seen = {}
        self._lock = Lock()
        self._stop = Event()
        self._thread = None
        self._latest = None
        self._processed = 0
        self._failed = 0
        self._last_error = ''

    @property
    def incoming(self):
        return self.root / 'incoming'

    def start(self):
        if self._thread is not None and self._thread.is_alive():
            return
        self.incoming.mkdir(parents=True, exist_ok=True)
        (self.root / 'processed').mkdir(parents=True, exist_ok=True)
        (self.root / 'failed').mkdir(parents=True, exist_ok=True)
        self._stop.clear()
        self._thread = Thread(target=self._run, name='vision-auto-inbox', daemon=True)
        self._thread.start()

    def stop(self):
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=self.interval + 2)

    def status(self):
        with self._lock:
            latest = self._latest
            result = {'enabled': True, 'running': self._thread is not None and self._thread.is_alive(),
                      'input_dir': str(self.incoming), 'processed_count': self._processed,
                      'failed_count': self._failed, 'last_error': self._last_error,
                      'latest': ({key: latest.get(key) for key in ('inspection_id', 'filename', 'status', 'score',
                                                                     'threshold', 'created_at')}
                                 if latest else None)}
        try:
            result['pending_count'] = sum(path.is_file() and not path.is_symlink() and path.suffix.lower() in _MIME
                                          for path in self.incoming.iterdir())
        except OSError:
            result['pending_count'] = 0
        return result

    def latest(self):
        with self._lock:
            return self._latest

    def _record_error(self, message):
        with self._lock:
            self._last_error = message

    def _archive(self, source, folder):
        target_dir = self.root / folder
        target_dir.mkdir(parents=True, exist_ok=True)
        target = target_dir / source.name
        if target.exists():
            target = target_dir / f'{source.stem}-{uuid4().hex[:10]}{source.suffix}'
        os.replace(source, target)

    def _process(self, source, signature):
        if signature[0] > MAX_IMAGE_BYTES:
            self._archive(source, 'failed')
            with self._lock:
                self._failed += 1
            self._record_error(f'{source.name} 超过 4 MiB，已移至 failed。')
            return False
        try:
            image_bytes = source.read_bytes()
            check = source.stat()
            if (check.st_size, check.st_mtime_ns) != signature or len(image_bytes) != signature[0]:
                return False
            model, _ = self.vision._model(self.owner, self.model_id)
            encoded = 'data:' + _MIME[source.suffix.lower()] + ';base64,' + base64.b64encode(image_bytes).decode('ascii')
            result = self.vision.detect(self.owner, {
                'algorithm': 'patchcore', 'model_id': self.model_id, 'image': encoded,
                'filename': source.name, 'part_id': '', 'quality_part_id': '',
                'image_source': 'local_inbox', 'threshold': model['suggested_threshold'],
                'confidence': .25, 'iou': .45,
            })
            self._archive(source, 'processed')
            with self._lock:
                self._latest = result
                self._processed += 1
                self._last_error = ''
            return True
        except VisionServiceError as error:
            if error.status_code in (413, 422):
                self._archive(source, 'failed')
                with self._lock:
                    self._failed += 1
                self._record_error(f'{source.name} 图片无效，已移至 failed。')
            else:
                self._record_error(f'{source.name} 检测暂未完成：{error.detail}')
        except OSError:
            self._record_error(f'{source.name} 暂不可读取，稍后重试。')
        return False

    def scan_once(self):
        self.incoming.mkdir(parents=True, exist_ok=True)
        processed = 0
        paths = sorted((path for path in self.incoming.iterdir()
                        if path.is_file() and not path.is_symlink() and path.suffix.lower() in _MIME),
                       key=lambda path: path.name)
        current = set(paths)
        for stale in set(self._seen) - current:
            del self._seen[stale]
        for path in paths:
            try:
                stat = path.stat()
            except OSError:
                continue
            signature = (stat.st_size, stat.st_mtime_ns)
            if self._seen.get(path) != signature:
                self._seen[path] = signature
                continue
            if time_ns() - stat.st_mtime_ns < self.settle_seconds * 1_000_000_000:
                continue
            processed += int(self._process(path, signature))
            if not path.exists():
                self._seen.pop(path, None)
        return processed

    def _run(self):
        while not self._stop.is_set():
            try:
                self.scan_once()
            except OSError:
                self._record_error('收图目录暂不可读取，稍后重试。')
            self._stop.wait(self.interval)
