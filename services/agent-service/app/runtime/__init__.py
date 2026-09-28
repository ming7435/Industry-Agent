"""Agent 生命周期和直接应用操作。"""

from .container import AgentContainer
from .action import Action, ActionModel, ActionType, Evidence, Observation, StepDefinition, StepResult, ValidationResult
from .capability import Capability, CapabilityDefinition, CapabilityRegistry, build_capability_registry
from .evaluator import EvaluationResult, EvaluationStatus, RuntimeEvaluator
from .execution import ExecutionManager, ExecutionRecord, ExecutionStatus
from .guard import LoopGuard
from .loop_engine import LoopEngine, LoopPolicy
from .planner import Plan, Planner
from .dispatcher import RuntimeDispatcher
from .coordinator import GoalEvent, RuntimeCoordinator, RuntimeInputParser
from .policy import PolicyDecision, PolicyStatus, RuntimePolicy
from .approval import ApprovalManager, PendingTaskStore

__all__ = [
    "AgentContainer", "Action", "ActionModel", "ActionType", "Capability", "CapabilityDefinition", "CapabilityRegistry",
    "build_capability_registry", "StepDefinition", "StepResult", "Observation", "Evidence", "ValidationResult", "EvaluationResult", "EvaluationStatus", "RuntimeEvaluator",
    "ExecutionManager", "ExecutionRecord", "ExecutionStatus", "LoopGuard", "LoopEngine", "LoopPolicy",
    "Plan", "Planner", "RuntimeDispatcher", "GoalEvent", "RuntimeInputParser", "RuntimeCoordinator",
    "PolicyDecision", "PolicyStatus", "RuntimePolicy",
    "ApprovalManager", "PendingTaskStore",
]
