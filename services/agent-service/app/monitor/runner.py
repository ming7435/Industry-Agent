"""连续设备监测的后台运行器。"""

from __future__ import annotations

from dataclasses import dataclass
from threading import Event, Lock, Thread, current_thread
from time import monotonic
from typing import Callable, Optional

from .models import DiagnosisTrigger, DeviceSample, MonitorResult
from .monitor import DeviceMonitor


SampleProvider = Callable[[], DeviceSample]
ResultHandler = Callable[[MonitorResult], None]
ErrorHandler = Callable[[Exception], None]


@dataclass(frozen=True)
class RunnerSnapshot:
    """监控运行器暴露给外部的运行状态快照。"""

    running: bool
    enabled: bool
    interval_seconds: float
    last_sample_at: Optional[str]
    last_error: Optional[str]


class MonitorRunner:
    """持续读取设备采样，并送入 ``DeviceMonitor`` 处理。

    ``enabled`` 是用户可控制的监测开关。关闭开关只暂停采样，
    不会清空设备历史和异常状态，后续重新开启时可继续累计。
    """

    def __init__(
        self,
        monitor: DeviceMonitor,
        sample_provider: SampleProvider,
        interval_seconds: float = 0.5,
        on_result: Optional[ResultHandler] = None,
        on_trigger: Optional[Callable[[DiagnosisTrigger], None]] = None,
        on_error: Optional[ErrorHandler] = None,
    ) -> None:
        if interval_seconds <= 0:
            raise ValueError("interval_seconds must be positive")
        self.monitor = monitor
        self.sample_provider = sample_provider
        self.interval_seconds = interval_seconds
        self.on_result = on_result
        self.on_trigger = on_trigger
        self.on_error = on_error
        self._enabled = True
        self._stop_event = Event()
        self._state_lock = Lock()
        self._thread: Optional[Thread] = None
        self._last_sample_at: Optional[str] = None
        self._last_error: Optional[str] = None

    @property
    def enabled(self) -> bool:
        """返回当前自动监测开关状态。"""

        with self._state_lock:
            return self._enabled

    @property
    def running(self) -> bool:
        """返回后台采样线程是否仍在运行。"""

        with self._state_lock:
            return self._thread is not None and self._thread.is_alive()

    def set_enabled(self, enabled: bool) -> bool:
        """开启或关闭自动监测，并返回新的开关值。"""

        with self._state_lock:
            self._enabled = bool(enabled)
            return self._enabled

    def toggle(self) -> bool:
        """反转自动监测开关，并返回新的开关值。"""

        with self._state_lock:
            self._enabled = not self._enabled
            return self._enabled

    def start(self) -> None:
        """启动一次后台监测循环，重复调用不会创建多个线程。"""

        with self._state_lock:
            if self._thread is not None and self._thread.is_alive():
                return
            self._stop_event.clear()
            self._last_error = None
            self._thread = Thread(
                target=self._run,
                name="device-monitor",
                daemon=True,
            )
            self._thread.start()

    def stop(self, timeout: Optional[float] = None) -> None:
        """通知后台循环停止，并等待线程退出。"""

        self._stop_event.set()
        thread = self._thread
        if thread is not None and thread is not current_thread():
            thread.join(timeout)
        with self._state_lock:
            if thread is self._thread and (thread is None or not thread.is_alive()):
                self._thread = None

    def run_once(self) -> Optional[MonitorResult]:
        """开关开启时读取并处理一条采样。"""

        if not self.enabled:
            return None
        return self._process_sample()

    def snapshot(self) -> RunnerSnapshot:
        """返回适合 UI、API 或 CLI 展示的安全状态快照。"""

        with self._state_lock:
            return RunnerSnapshot(
                running=self._thread is not None and self._thread.is_alive(),
                enabled=self._enabled,
                interval_seconds=self.interval_seconds,
                last_sample_at=self._last_sample_at,
                last_error=self._last_error,
            )

    def _run(self) -> None:
        """后台线程主循环，按固定间隔触发采样。"""

        next_run = monotonic()
        while not self._stop_event.is_set():
            now = monotonic()
            if now >= next_run:
                if self.enabled:
                    try:
                        self._process_sample()
                    except Exception as error:  # pragma: no cover，防御性线程边界。
                        self._record_error(error)
                next_run = now + self.interval_seconds
            wait_seconds = max(0.0, min(self.interval_seconds, next_run - monotonic()))
            self._stop_event.wait(wait_seconds)

    def _process_sample(self) -> MonitorResult:
        """执行一次采样、监控判定和回调通知。"""

        sample = self.sample_provider()
        result = self.monitor.observe(sample)
        with self._state_lock:
            self._last_sample_at = sample.timestamp.isoformat()
            self._last_error = None
        if self.on_result:
            self.on_result(result)
        if result.trigger and self.on_trigger:
            self.on_trigger(result.trigger)
        return result

    def _record_error(self, error: Exception) -> None:
        """记录采样循环中的错误，并交给外部错误回调。"""

        with self._state_lock:
            self._last_error = "%s: %s" % (type(error).__name__, error)
        if self.on_error:
            self.on_error(error)
