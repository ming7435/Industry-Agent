"""Agent Runtime 的生命周期、超时和重试边界。"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError
from dataclasses import dataclass
import json
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

    def _tool_context(self, task: Any, task_id: str, trace_id: str) -> dict[str, Any]:
        """从 Runtime 状态构建可选的共用 Tool Guard 上下文。"""

        raw = task.get("runtime_context") if isinstance(task, dict) else None
        context = dict(raw) if isinstance(raw, dict) else {}
        context.setdefault("agent", str(getattr(self.agent, "name", type(self.agent).__name__)))
        context.setdefault("task_id", task_id)
        context.setdefault("trace_id", trace_id)
        return context

    @staticmethod
    def _trace_payload(value: Any) -> Any:
        """在轨迹存储中明确记录 Agent 输入和输出，并确保可序列化为 JSON。"""

        if hasattr(value, "model_dump"):
            value = value.model_dump(mode="json")
        elif hasattr(value, "to_dict"):
            value = value.to_dict()
        try:
            return json.loads(json.dumps(value, ensure_ascii=False, default=str))
        except (TypeError, ValueError):
            return str(value)

    def _agent_trace_context(self, task: Any, task_id: str, trace_id: str, agent_run_id: str, attempt: int) -> dict[str, Any]:
        context = self._tool_context(task, task_id, trace_id)
        context.update({"agent_run_id": agent_run_id, "attempt": attempt})
        return context

    def _begin_attempt(self, task: Any, attempt: int) -> tuple[dict[str, Any], float]:
        task_id = task.get("task_id", "") if isinstance(task, dict) else ""
        trace_id = task.get("trace_id", "") if isinstance(task, dict) else ""
        agent_run_id = "AGENT-RUN-" + uuid4().hex[:12].upper()
        agent_name = getattr(self.agent, "name", type(self.agent).__name__)
        context = self._agent_trace_context(task, task_id, trace_id, agent_run_id, attempt)
        record = {
            "type": "agent", "name": agent_name, "agent": agent_name,
            "agent_run_id": agent_run_id, "task_id": task_id,
            "trace_id": trace_id, "attempt": attempt, "context": context,
        }
        started = perf_counter()
        self.trace.record(event="agent_started", input=self._trace_payload(task), **record)
        return record, started

    def _run_bound(self, task: Any, record: dict[str, Any]) -> Any:
        tools = getattr(self.agent, "tools", None)
        bind_trace = getattr(tools, "trace_context", None)
        if callable(bind_trace):
            with bind_trace(task_id=record["task_id"], trace_id=record["trace_id"], context=record["context"]):
                return self.agent.run(task)
        return self.agent.run(task)

    def _finish_attempt(self, event: str, task: Any, record: dict[str, Any], started: float, *, result: Any = None, error: Exception | None = None) -> None:
        details: dict[str, Any] = {"elapsed_ms": round((perf_counter() - started) * 1000, 2)}
        if event == "agent_completed":
            details["output"] = self._trace_payload(result)
        else:
            details.update({"error": str(error), "input": self._trace_payload(task)})
        self.trace.record(event=event, **record, **details)

    def execute_once(self, abnormal_event: Any):
        """执行一次尝试；超时和重试策略由 RuntimeDispatcher 管理。"""

        record, started = self._begin_attempt(abnormal_event, 1)
        try:
            result = self._run_bound(abnormal_event, record)
            self._finish_attempt("agent_completed", abnormal_event, record, started, result=result)
            return result
        except Exception as error:
            self._finish_attempt("agent_error", abnormal_event, record, started, error=error)
            raise

    def execute_agent(self, abnormal_event: Any):
        """执行一次 Agent 任务，失败时按配置重试。"""

        last_error: Exception | None = None
        agent_name_for_policy = str(getattr(self.agent, "name", type(self.agent).__name__)).lower()
        # 超时的 Python 线程无法被强制停止。如果重试带副作用的 Agent，
        # 可能会并发执行两次写入；这类 Agent 必须依赖幂等边界并只执行一次。
        max_retries = 0 if agent_name_for_policy in {"workorder", "memory", "quality"} else self.config.max_retries
        for attempt in range(max_retries + 1):
            record, started = self._begin_attempt(abnormal_event, attempt + 1)
            # 每次尝试使用独立线程池，使单次超时不会阻塞后续重试。
            executor = ThreadPoolExecutor(
                max_workers=1,
                thread_name_prefix="agent-runtime",
            )
            future = executor.submit(self._run_bound, abnormal_event, record)
            try:
                result = future.result(timeout=self.config.timeout_seconds)
                self._finish_attempt("agent_completed", abnormal_event, record, started, result=result)
                return result
            except TimeoutError:
                last_error = AgentExecutionError(
                    "Agent 执行超时（%.1f 秒，第 %s 次）"
                    % (self.config.timeout_seconds, attempt + 1)
                )
                future.cancel()
                self._finish_attempt("agent_timeout", abnormal_event, record, started, error=last_error)
            except Exception as error:
                last_error = error
                self._finish_attempt("agent_error", abnormal_event, record, started, error=error)
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
