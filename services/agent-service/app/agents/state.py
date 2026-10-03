"""各领域图共用的执行身份和步骤轨迹，不合并业务状态。"""

from typing import Any, TypedDict


class AgentExecutionState(TypedDict, total=False):
    active_agent: str
    active_skills: list[str]
    current_step: str
    step_history: list[dict[str, Any]]
    completed_steps: list[dict[str, Any]]
    failed_steps: list[dict[str, Any]]
