"""Agent Runtime 的生命周期、超时和重试边界。"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError
from dataclasses import dataclass
from time import perf_counter
from typing import Any
from uuid import uuid4

from .trace import TraceRecorder


class AgentExecutionError(RuntimeError):
    """Agent 在 Harness 生命周期内未能完成任务。"""


@dataclass(frozen=True)
class HarnessConfig:
    timeout_seconds: float = 45.0
    max_retries: int = 1


class AgentHarness:
    """统一执行一个 Agent 任务，避免入口层直接调用 Agent 内部实现。"""

    def __init__(
        self,
        agent: Any,
        timeout_seconds: float = 45.0,
        max_retries: int = 1,
        trace: TraceRecorder | None = None,
    ) -> None:
        self.agent = agent
        self.config = HarnessConfig(
            timeout_seconds=max(0.1, float(timeout_seconds)),
            max_retries=max(0, int(max_retries)),
        )
        self.trace = trace or TraceRecorder()

    def trace_records(self):
        """返回本次 Harness 记录的执行轨迹，供 API 和监控页面展示。"""

        return self.trace.list()

    def execute_agent(self, abnormal_event: Any):
        """执行一次 Agent 任务，失败时按配置重试。"""

        last_error: Exception | None = None
        for attempt in range(self.config.max_retries + 1):
            started = perf_counter()
            task_id = abnormal_event.get("task_id", "") if isinstance(abnormal_event, dict) else ""
            trace_id = abnormal_event.get("trace_id", "") if isinstance(abnormal_event, dict) else ""
            agent_run_id = "AGENT-RUN-" + uuid4().hex[:12].upper()
            agent_name = getattr(self.agent, "name", type(self.agent).__name__)
            self.trace.record(type="agent", name=agent_name, event="agent_started", agent=agent_name, agent_run_id=agent_run_id, task_id=task_id, trace_id=trace_id, attempt=attempt + 1)
            # 每次尝试使用独立线程池，使单次超时不会阻塞后续重试。
            executor = ThreadPoolExecutor(
                max_workers=1,
                thread_name_prefix="agent-runtime",
            )
            future = executor.submit(self.agent.run, abnormal_event)
            try:
                result = future.result(timeout=self.config.timeout_seconds)
                self.trace.record(type="agent", name=agent_name, event="agent_completed", agent=agent_name, agent_run_id=agent_run_id, task_id=task_id, trace_id=trace_id, attempt=attempt + 1, elapsed_ms=round((perf_counter() - started) * 1000, 2))
                return result
            except TimeoutError as error:
                last_error = AgentExecutionError(
                    "Agent 执行超时（%.1f 秒，第 %s 次）"
                    % (self.config.timeout_seconds, attempt + 1)
                )
                future.cancel()
                self.trace.record(type="agent", name=agent_name, event="agent_timeout", agent=agent_name, agent_run_id=agent_run_id, task_id=task_id, trace_id=trace_id, attempt=attempt + 1, elapsed_ms=round((perf_counter() - started) * 1000, 2), error=str(last_error))
            except Exception as error:
                last_error = error
                self.trace.record(type="agent", name=agent_name, event="agent_error", agent=agent_name, agent_run_id=agent_run_id, task_id=task_id, trace_id=trace_id, attempt=attempt + 1, elapsed_ms=round((perf_counter() - started) * 1000, 2), error=str(error))
            finally:
                executor.shutdown(wait=False, cancel_futures=True)

        raise AgentExecutionError(
            "Agent 执行失败：%s" % last_error
        ) from last_error


def execute_agent(
    agent: Any,
    abnormal_event: Any,
    timeout_seconds: float = 45.0,
    max_retries: int = 1,
):
    """函数式 Runtime 入口，便于 Web、消息队列等入口复用。"""

    return AgentHarness(
        agent=agent,
        timeout_seconds=timeout_seconds,
        max_retries=max_retries,
    ).execute_agent(abnormal_event)
