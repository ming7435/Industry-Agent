"""Graph 执行层使用的顶层 Runtime 协调器。"""

from __future__ import annotations

import re
import os
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Mapping

from .action import ActionModel
from .loop_engine import LoopEngine, LoopPolicy, LoopResult
from .evaluator import RuntimeEvaluator
from .capability import build_capability_registry
from .policy import RuntimePolicy
from app.skills import get_skill_registry


@dataclass(frozen=True)
class GoalEvent:
    """供 Runtime Planner 和 Trace 边界共用的标准化输入。"""

    goal: str
    entities: dict[str, Any] = field(default_factory=dict)
    constraints: dict[str, Any] = field(default_factory=dict)
    required_capabilities: tuple[str, ...] = ()
    source: str = "unknown"
    raw: dict[str, Any] = field(default_factory=dict)
    validation_findings: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, Any]:
        return {
            "goal": self.goal,
            "entities": dict(self.entities),
            "constraints": dict(self.constraints),
            "required_capabilities": list(self.required_capabilities),
            "source": self.source,
            "raw": dict(self.raw),
            "validation_findings": list(self.validation_findings),
        }


class RuntimeInputParser:
    """在规划前标准化用户请求和监控事件。

    这里刻意保持为小型确定性边界：不调用 AI 模型、不选择 Agent、不执行工具，
    也不控制 Runtime 循环。
    """

    EVENT_CAPABILITIES = (
        "fault_analysis",
        "document_search",
        "drawing_search",
        "repair_planning",
        "workorder_create",
    )

    def parse(self, payload: Any) -> GoalEvent:
        if isinstance(payload, str):
            text = payload.strip()
            return GoalEvent(
                goal=text or "处理工业运维请求",
                required_capabilities=self._user_capabilities(text),
                source="user",
                raw={"user_text": payload},
                validation_findings=("goal is blank",) if not text else (),
            )
        findings: list[str] = []
        if not isinstance(payload, Mapping):
            findings.append("payload must be a mapping or string")
        raw = dict(payload or {}) if isinstance(payload, Mapping) else {}
        user_text = str(raw.get("user_text") or raw.get("goal") or "").strip()
        event_type = str(raw.get("event_type") or raw.get("alarm_code") or "设备异常").strip()
        is_event = bool(raw.get("event_id") or raw.get("abnormal_metrics") or raw.get("realtime_snapshot"))
        source = "event" if is_event else "user"
        goal = user_text or "处理%s" % event_type
        entities = {
            key: value
            for key, value in raw.items()
            if key not in {"user_text", "goal", "constraints", "required_capabilities"}
            and value not in (None, "", [], {})
        }
        constraints = dict(raw.get("constraints") or {}) if isinstance(raw.get("constraints"), Mapping) else {}
        capabilities = raw.get("required_capabilities")
        if isinstance(capabilities, (list, tuple)):
            required = tuple(str(item) for item in capabilities if str(item).strip())
        elif is_event:
            required = self.EVENT_CAPABILITIES
        else:
            required = self._user_capabilities(user_text)
        if capabilities is not None and not isinstance(capabilities, (list, tuple)):
            findings.append("required_capabilities must be a list")
        if not user_text and not is_event:
            findings.append("goal is blank")
        if required in {"workorder_update", "workorder_query"}:
            # Router 不可用时也不能把自然语言查询默认成 update。
            raw = {**raw, "target_input": {**entities, "action": self._fallback_workorder_action(user_text, required)}}
        return GoalEvent(
            goal=goal,
            entities=entities,
            constraints=constraints,
            required_capabilities=required,
            source=source,
            raw=raw,
            validation_findings=tuple(findings),
        )

    @staticmethod
    def _user_capabilities(text: str) -> tuple[str, ...]:
        value = str(text or "").lower()
        # “有哪些故障/常见故障”是知识目录查询，不是针对当前设备的故障诊断。
        if re.search(r"(?:有哪些|哪些|什么).{0,12}(?:故障|报警|问题)", value):
            return ("document_search",)
        if any(token in value for token in ("质检", "质量", "零件检测", "inspection")):
            return ("quality_inspection",)
        if any(token in value for token in ("工单", "派工", "维修完成", "重开")):
            if any(token in value for token in ("查询", "查看", "状态", "获取") ) and not any(token in value for token in ("创建", "新建", "生成", "派工", "更新", "关闭", "维修完成", "重开")):
                return ("workorder_query",)
            return ("workorder_update",)
        if any(token in value for token in ("图纸", "bom", "部件", "装配", "cad")):
            return ("drawing_search",)
        if any(token in value for token in ("报告", "report")):
            return ("case_reporting",)
        if any(token in value for token in ("经验", "手册", "sop", "案例", "知识", "维修")):
            return ("document_search",)
        if any(token in value for token in ("故障", "报警", "诊断", "异常", "fault")):
            return ("fault_analysis",)
        return ("document_search",)

    @staticmethod
    def _fallback_workorder_action(text: str, capability: str) -> str:
        if capability == "workorder_query":
            return "query"
        value = str(text or "")
        if any(token in value for token in ("创建工单", "新建工单", "生成工单")):
            return "create"
        if "关闭工单" in value:
            return "close"
        if "重新打开工单" in value or "重开工单" in value:
            return "reopen"
        if "派工" in value:
            return "assign"
        if "维修完成" in value or "提交维修结果" in value:
            return "mark_repair_completed"
        if "更新工单" in value:
            return "update"
        return "query"


class RuntimeCoordinator:
    """为一个 Goal/Event 执行有界的 Planner → Action → Agent 循环。"""

    def __init__(self, container: Any) -> None:
        self.container = container
        self.input_parser = RuntimeInputParser()
        # 直接 Runtime 测试使用的小型兼容容器可能只提供 planner/dispatcher/trace。
        # 在不要求完整应用容器的前提下保留元数据边界。
        self.capabilities = (
            getattr(container, "capabilities", None)
            or getattr(getattr(container, "dispatcher", None), "capabilities", None)
            or build_capability_registry()
        )

    def run(self, state: Mapping[str, Any]) -> dict[str, Any]:
        initial = dict(state)
        knowledge_only = initial.get("entry") == "knowledge"
        source_payload = dict(initial.get("event") or {}) if initial.get("entry") == "trigger" else {
            "user_text": initial.get("user_text", ""),
            **dict(initial.get("context") or {}),
        }
        goal_event: GoalEvent = self.input_parser.parse(source_payload)
        if knowledge_only:
            goal_event = GoalEvent(
                goal=goal_event.goal, entities=goal_event.entities,
                constraints={**goal_event.constraints, "execution_scope": "knowledge_read_only"},
                required_capabilities=("document_search",), source="user",
                raw=goal_event.raw, validation_findings=goal_event.validation_findings,
            )
        # 自然语言请求统一先经过 RouterAgent；RuntimeInputParser 只负责规范化
        # 事件结构和作为路由不可用时的确定性兜底，不再覆盖 Router 的动作意图。
        if goal_event.source == "user" and not knowledge_only:
            router = (getattr(self.container, "agents", {}) or {}).get("router")
            if router is not None and str(source_payload.get("user_text") or "").strip():
                try:
                    route = router.run({"user_text": str(source_payload.get("user_text") or ""), "context": dict(goal_event.entities)})
                    route_dict = route.model_dump() if hasattr(route, "model_dump") else dict(route or {})
                    intent = str(route_dict.get("intent") or "")
                    capability_by_intent = {
                        "diagnosis": "fault_analysis", "knowledge": "document_search", "cad": "drawing_search",
                        "maintenance": "repair_planning", "workorder_query": "workorder_query", "workorder_action": "workorder_update",
                        "quality": "quality_inspection", "report": "case_reporting", "memory": "experience_retrieval",
                    }
                    capability = capability_by_intent.get(intent)
                    try:
                        route_confidence = float(route_dict.get("confidence") or 0.0)
                    except (TypeError, ValueError):
                        route_confidence = 0.0
                    if capability and route_confidence >= 0.8:
                        target_input = dict(route_dict.get("target_input") or {})
                        entities = {**goal_event.entities, **dict(route_dict.get("entities") or {})}
                        goal_event = GoalEvent(
                            goal=goal_event.goal,
                            entities=entities,
                            constraints={**goal_event.constraints, "router_intent": intent, "router_target_agent": route_dict.get("target_agent", "")},
                            required_capabilities=(capability,),
                            source=goal_event.source,
                            raw={**goal_event.raw, "route_result": route_dict, "target_input": target_input},
                            validation_findings=tuple(route_dict.get("validation_findings") or goal_event.validation_findings),
                        )
                except Exception:
                    # 路由器不可用时保留确定性解析结果，不把一次路由异常伪装成业务成功。
                    pass
        planner_context = {
            **goal_event.entities,
            "constraints": dict(goal_event.constraints),
            "event": dict(goal_event.raw),
            "target_input": dict((goal_event.raw or {}).get("target_input") or {}) if isinstance(goal_event.raw, Mapping) else {},
            "required_capabilities": list(goal_event.required_capabilities),
            "task_id": initial.get("task_id", ""),
            "trace_id": initial.get("trace_id", ""),
        }
        resume = initial.get("runtime_resume")
        if isinstance(resume, Mapping) and isinstance(resume.get("plan"), Mapping):
            plan = self._plan_from_dict(resume["plan"], goal_event.goal)
            resume_index = int(resume.get("next_index") or 0)
        else:
            plan = self.container.planner.plan(goal_event.goal, planner_context)
            resume_index = 0
        min_evidence_score = float(os.getenv("RUNTIME_MIN_EVIDENCE_SCORE", "0.8"))
        min_confidence = float(os.getenv("RUNTIME_MIN_CONFIDENCE", "0.8"))
        evaluator = RuntimeEvaluator(min_evidence_score=min_evidence_score, min_confidence=min_confidence)
        replan_count = 0
        self.container.trace.record(
            type="runtime", name="runtime", node="runtime", agent="runtime",
            event="goal_parsed", task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
            state_change=goal_event.as_dict(), keys=list(goal_event.as_dict()), tool_name="", latency=0.0,
            error="; ".join(goal_event.validation_findings),
        )
        runtime_state = {
            **initial,
            "route": "runtime",
            "route_result": {"intent": "runtime", "target_agent": "runtime", "goal": goal_event.goal},
            "goal_event": goal_event.as_dict(),
            "runtime_plan": plan.as_dict(),
            "runtime_next_index": resume_index,
            "runtime_outputs": dict(initial.get("runtime_outputs") or {}),
            "active_agent": "runtime",
            "active_skills": [],
            "current_step": "",
            "step_history": list(initial.get("step_history") or []),
            "completed_steps": list(initial.get("completed_steps") or []),
            "failed_steps": list(initial.get("failed_steps") or []),
            "tool_calls": list(initial.get("tool_calls") or []),
            "observations": list(initial.get("observations") or []),
            "evidence": list(initial.get("evidence") or []),
            "evidence_records": list(initial.get("evidence_records") or []),
            "validation": dict(initial.get("validation") or {}),
            "validation_results": list(initial.get("validation_results") or []),
            "next_action": {},
        }

        def step(current: dict[str, Any], _context: Any) -> dict[str, Any]:
            nonlocal plan, replan_count
            index = int(current.get("runtime_next_index") or 0)
            if index >= len(plan.actions):
                return {"state": current, "action": ActionModel.final(), "evidence_score": 1.0, "done": True}
            action = self._enrich_action(plan.actions[index], current)
            # 每次派发都复核顶层只读边界，覆盖首次计划、Agent 建议和重规划。
            if knowledge_only and not (
                action.action_type.value == "AGENT" and action.target == "knowledge"
                and self.capabilities.canonical_name(action.required_capability) == "document_search"
                and not action.side_effect
            ):
                return {
                    "state": {**current, "status": "blocked", "stop_reason": "knowledge_read_only_scope"},
                    "action": action, "terminal_status": "blocked",
                    "terminal_reason": "knowledge_read_only_scope", "evidence_score": 0.0, "done": False,
                }
            step_started_at = datetime.now(timezone.utc).isoformat()
            current = {
                **current,
                "active_agent": str(action.payload.get("agent") or action.target),
                "active_skills": list(action.payload.get("active_skills") or []),
                "current_step": str(action.payload.get("step") or ""),
                "next_action": action.as_dict(),
            }
            self.container.trace.record(
                type="runtime", name="runtime", node="runtime", agent=str(current.get("active_agent") or "runtime"),
                event="skill_selected", task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                state_change={"skills": list(current.get("active_skills") or []), "step": current.get("current_step", ""), "action": action.as_dict()},
                keys=["skills", "step", "action"], tool_name="", latency=0.0, error="",
            )
            result = self.container.dispatcher.dispatch(action, current)
            if not result.success:
                if (
                    RuntimePolicy(self.capabilities)._effective_capability(action, current) == "workorder_create"
                    and (
                        result.output.get("status") == "waiting_for_personnel"
                        or result.output.get("stop_reason") == "personnel_query_failed"
                    )
                ):
                    # 保留已建工单及人员目录的等待/读取失败原因供后续续派，
                    # 不丢弃业务结果，也不继续执行维修之后的动作。
                    waiting = dict(result.output)
                    directory_failed = waiting.get("stop_reason") == "personnel_query_failed"
                    terminal_status = "blocked" if directory_failed else "waiting_for_personnel"
                    terminal_reason = "personnel_query_failed" if directory_failed else "waiting_for_personnel"
                    return {
                        "state": {
                            **current,
                            "workorder": waiting,
                            "runtime_outputs": {**dict(current.get("runtime_outputs") or {}), "workorder": waiting},
                            "status": terminal_status,
                            "stop_reason": terminal_reason,
                            "failed_steps": [
                                *list(current.get("failed_steps") or []),
                                *([{"step": action.step, "agent": action.target, "reason": terminal_reason}]
                                  if directory_failed else []),
                            ],
                            "step_history": [
                                *list(current.get("step_history") or []),
                                {
                                    "step_id": action.step,
                                    "started_at": step_started_at,
                                    "completed_at": datetime.now(timezone.utc).isoformat(),
                                    "status": terminal_status,
                                    "input_keys": sorted(action.payload),
                                    "output_keys": sorted(waiting),
                                    "tool": "",
                                    "error": str(waiting.get("error") or terminal_reason) if directory_failed else "",
                                    "reason": str(waiting.get("error") or terminal_reason),
                                },
                            ],
                        },
                        "action": action,
                        "terminal_status": terminal_status,
                        "terminal_reason": terminal_reason,
                        "done": False,
                    }
                policy_status = str(result.output.get("policy_status") or "")
                if policy_status in {"deny", "require_approval"}:
                    policy_output = dict(result.output or {})
                    next_state = {
                        **current,
                        "runtime_policy": {
                            "status": policy_status,
                            "reason": str(policy_output.get("reason") or "policy_denied"),
                            "risk_level": str(policy_output.get("risk_level") or "normal"),
                            "missing_evidence": list(policy_output.get("missing_evidence") or []),
                        },
                        "failed_steps": [
                            *list(current.get("failed_steps") or []),
                            {"step": action.payload.get("step", ""), "agent": action.payload.get("agent", ""), "reason": policy_output.get("reason", "")},
                        ],
                        "step_history": [
                            *list(current.get("step_history") or []),
                            {
                                "step_id": action.step,
                                "started_at": step_started_at,
                                "completed_at": datetime.now(timezone.utc).isoformat(),
                                "status": "failed",
                                "input_keys": sorted(action.payload),
                                "output_keys": sorted(policy_output),
                                "tool": action.target if action.action_type.value == "TOOL" else "",
                                "error": str(policy_output.get("reason") or "policy_denied"),
                            },
                        ],
                    }
                    if policy_status == "require_approval":
                        approvals = getattr(self.container, "approvals", None)
                        if approvals is not None:
                            pending_state = {
                                **current,
                                "runtime_plan": plan.as_dict(),
                                "runtime_next_index": index,
                            }
                            pending = approvals.create_pending(
                                action=action.as_dict(),
                                state=pending_state,
                                plan=plan.as_dict(),
                                next_index=index,
                                policy=policy_output,
                            )
                            next_state["runtime_pending_task"] = pending
                    return {
                        "state": next_state,
                        "action": action,
                        "terminal_status": "waiting_approval" if policy_status == "require_approval" else "blocked",
                        "terminal_reason": str(policy_output.get("reason") or "policy_denied"),
                        "evidence_ids": [],
                        "evidence_score": 0.0,
                        "confidence": None,
                        "done": False,
                    }
                current["failed_steps"] = [
                    *list(current.get("failed_steps") or []),
                    {"step": action.step, "agent": action.target, "reason": str(result.output.get("error") or "Runtime Action failed")},
                ]
                current["step_history"] = [
                    *list(current.get("step_history") or []),
                    {
                        "step_id": action.step,
                        "started_at": step_started_at,
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                        "status": "failed",
                        "input_keys": sorted(action.payload),
                        "output_keys": sorted(result.output or {}),
                        "tool": action.target if action.action_type.value == "TOOL" else "",
                        "error": str(result.output.get("error") or "Runtime Action failed"),
                    },
                ]
                raise RuntimeError(str(result.output.get("error") or "Runtime Action failed"))
            capability = action.required_capability or action.target
            canonical_capability = self.capabilities.canonical_name(capability)
            outputs = dict(current.get("runtime_outputs") or {})
            result_key = self.capabilities.result_key_for(capability)
            outputs[result_key] = result.output
            if result_key == "diagnosis" and initial.get("entry") == "trigger":
                stage_store = getattr(self.container, "event_results", None)
                if stage_store is not None:
                    try:
                        stage_store.record_stage(dict(initial.get("event") or {}), {
                            "event": dict(initial.get("event") or {}), "task_id": initial.get("task_id"),
                            "trace_id": initial.get("trace_id"), "status": "running", "diagnosis": result.output,
                        })
                    except Exception as error:
                        # 不记录异常正文，避免缓存地址或凭据泄漏；主业务仍继续执行。
                        logging.getLogger(__name__).warning("诊断阶段缓存写入失败：%s", type(error).__name__)
            result_tool_calls = result.output.get("tool_calls") if isinstance(result.output, Mapping) else []
            if not isinstance(result_tool_calls, list):
                result_tool_calls = []
            validation_payload = dict(result.validation or {
                "passed": True,
                "checks": {},
                "findings": [],
                "missing": [],
                "recommended_action": {"type": "continue", "reason": "no_domain_validator"},
            })
            next_state = {
                **current,
                "runtime_next_index": index + 1,
                "runtime_outputs": outputs,
                result_key: result.output,
                "evidence_status": "ready" if result.evidence else "pending",
                "active_agent": str(action.payload.get("agent") or action.target),
                "active_skills": list(action.payload.get("active_skills") or []),
                "current_step": str(action.payload.get("step") or ""),
                "completed_steps": [
                    *list(current.get("completed_steps") or []),
                    {"step": action.payload.get("step", ""), "agent": action.payload.get("agent", ""), "action_id": action.action_id, "success": result.success},
                ],
                "tool_calls": [*list(current.get("tool_calls") or []), *result_tool_calls],
                "step_history": [
                    *list(current.get("step_history") or []),
                    {
                        "step_id": action.step,
                        "started_at": step_started_at,
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                        "status": "completed" if result.success else "failed",
                        "input_keys": sorted(action.payload),
                        "output_keys": sorted(result.output or {}),
                        "tool": action.target if action.action_type.value == "TOOL" else "",
                        "error": "",
                    },
                ],
                "observations": [*list(current.get("observations") or []), *list(result.observations or [])],
                "evidence": [*list(current.get("evidence") or []), *list(result.evidence or [])],
                "evidence_records": [*list(current.get("evidence_records") or []), *list(result.evidence or [])],
                "validation": validation_payload,
                "validation_results": [*list(current.get("validation_results") or []), validation_payload],
                "next_action": (
                    self._enrich_action(plan.actions[index + 1], current).as_dict()
                    if index + 1 < len(plan.actions)
                    else {"action_type": "FINAL", "target": "final", "reason": "planned_actions_complete"}
                ),
            }
            if canonical_capability == "workorder_create":
                workorder_output = dict(result.output or {})
                nested_order = workorder_output.get("workorder") if isinstance(workorder_output.get("workorder"), Mapping) else {}
                backend_status = str(workorder_output.get("status") or nested_order.get("status") or "").strip().lower()
                next_state["backend_status"] = backend_status
                next_state["lifecycle_status"] = self._workorder_lifecycle_status(backend_status, workorder_output)
                next_state["status"] = next_state["lifecycle_status"]
            domain = self.capabilities.domain_for(capability)
            trace_agent = str(action.payload.get("agent") or action.target)
            if result.observations:
                self.container.trace.record(
                    type="runtime", name="runtime", node="runtime", agent=trace_agent,
                    event="observation_added", task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                    state_change={"observations": list(result.observations), "step": action.payload.get("step", "")},
                    keys=["observations", "step"], tool_name="", latency=0.0, error="",
                )
            if result.evidence:
                self.container.trace.record(
                    type="runtime", name="runtime", node="runtime", agent=trace_agent,
                    event="evidence_added", task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                    state_change={"evidence": list(result.evidence), "step": action.payload.get("step", "")},
                    keys=["evidence", "step"], tool_name="", latency=0.0, error="",
                )
            self.container.trace.record(
                type="runtime", name="runtime", node="runtime", agent=trace_agent,
                event="validation_result", task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                state_change={"validation": validation_payload, "step": action.payload.get("step", "")},
                keys=["validation", "step"], tool_name="", latency=0.0, error="",
            )
            evaluation = evaluator.evaluate({"domain": domain, "result": dict(result.output or {})})
            self.container.trace.record(
                type="runtime", name="runtime_evaluator", node="runtime", agent="runtime",
                event="evaluation_result", task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                state_change={
                    "capability": capability,
                    "domain": domain,
                    "status": evaluation.status.value,
                    "reason": evaluation.reason,
                    "confidence": evaluation.confidence,
                    "evidence_score": evaluation.evidence_score,
                    "missing_evidence": list(evaluation.missing_evidence),
                    "recommended_action": evaluation.recommended_action,
                },
                keys=["capability", "domain", "status", "reason", "confidence", "evidence_score", "missing_evidence"],
                tool_name="", latency=0.0, error="",
            )
            self.container.trace.record(
                type="runtime", name="runtime_evaluator", node="runtime", agent="runtime",
                event="decision", task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                state_change={"status": evaluation.status.value, "reason": evaluation.reason, "recommended_action": evaluation.recommended_action},
                keys=["status", "reason", "recommended_action"], tool_name="", latency=0.0, error="",
            )
            if domain == "knowledge" and evaluation.status.value != "final":
                # Knowledge Graph 已完成自己的有界补检；仍缺证据时不能把
                # “剩余计划”误当作补检计划，直接启动维修和派工。
                return {
                    "state": {**next_state, "status": "blocked", "stop_reason": "knowledge_evidence_gate"},
                    "action": action,
                    "terminal_status": "blocked",
                    "terminal_reason": "knowledge_evidence_gate",
                    "evidence_ids": self._evidence_ids(result.evidence),
                    "evidence_score": evaluation.evidence_score,
                    "confidence": evaluation.confidence,
                    "done": False,
                }
            if evaluation.status.value == "replan":
                if replan_count < 2:
                    replan_count += 1
                    requested = self._replan_capabilities(capability, result.output or {}, plan.actions[index + 1:])
                    replan_context = {
                        **planner_context,
                        **next_state,
                        "required_capabilities": requested,
                        "replan_reason": evaluation.reason,
                        "missing_evidence": list(evaluation.missing_evidence),
                    }
                    plan = self.container.planner.plan(goal_event.goal, replan_context)
                    next_state["runtime_next_index"] = 0
                    next_state["runtime_plan"] = plan.as_dict()
                    next_state["runtime_replan_count"] = replan_count
                    self.container.trace.record(
                        type="runtime", name="runtime", node="runtime", agent="runtime", event="replan",
                        task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                        state_change={"reason": evaluation.reason, "missing_evidence": list(evaluation.missing_evidence),
                                      "actions": [item.as_dict() for item in plan.actions]},
                        keys=["reason", "missing_evidence", "actions"], tool_name="", latency=0.0, error="",
                    )
                else:
                    # 重复请求重新规划属于终止性安全条件。
                    # 在前置证据仍无效时，不要继续执行副作用（例如创建工单）。
                    result.output = {
                        **dict(result.output or {}),
                        "status": "blocked",
                        "reason": "replan_limit_exceeded",
                    }
            elif evaluation.status.value == "blocked":
                # 领域 BLOCKED 是硬终止，不得继续消费计划中的后续动作，
                # 尤其不能在证据失败后执行创建工单、关闭工单等副作用。
                return {
                    "state": {**next_state, "status": "blocked", "stop_reason": evaluation.reason},
                    "action": action,
                    "terminal_status": "blocked",
                    "terminal_reason": evaluation.reason,
                    "evidence_ids": self._evidence_ids(result.evidence),
                    "evidence_score": evaluation.evidence_score,
                    "confidence": evaluation.confidence,
                    "done": False,
                }
            elif result.next_actions:
                # Agent 可能观察到会改变下一项有效能力的证据。决策必须留在 Runtime 契约内：
                # 提取能力要求，请 Planner 生成新的 Action 计划，再由普通 dispatcher 选择已注册 Agent。
                # 绝不要直接在外层循环执行 Agent 的建议。
                requested = self._next_action_capabilities(
                    result.next_actions,
                    plan.actions[index + 1:],
                )
                remaining = [
                    item.required_capability
                    for item in plan.actions[index + 1:]
                    if item.required_capability
                ]
                if requested and requested != remaining and replan_count < 2:
                    replan_count += 1
                    replan_context = {
                        **planner_context,
                        **next_state,
                        "required_capabilities": requested,
                        "next_actions": list(result.next_actions),
                        "replan_reason": "agent_next_actions",
                    }
                    plan = self.container.planner.plan(goal_event.goal, replan_context)
                    next_state["runtime_next_index"] = 0
                    next_state["runtime_plan"] = plan.as_dict()
                    next_state["runtime_replan_count"] = replan_count
                    self.container.trace.record(
                        type="runtime", name="runtime", node="runtime", agent="runtime", event="replan",
                        task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                        state_change={
                            "reason": "agent_next_actions",
                            "requested_capabilities": requested,
                            "actions": [item.as_dict() for item in plan.actions],
                        },
                        keys=["reason", "requested_capabilities", "actions"],
                        tool_name="", latency=0.0, error="",
                    )
            return {
                "state": next_state,
                "action": action,
                # 领域评估器决定动作是否需要重新规划；只有 replan 会传给 LoopEngine。
                # 领域 FINAL 不代表整个计划结束。
                "domain": domain if evaluation.status.value == "replan" else "",
                "result": dict(result.output or {}) if evaluation.status.value == "replan" else {},
                "evidence_ids": self._evidence_ids(result.evidence) or ["action:%s" % capability],
                "evidence_score": result.confidence if result.confidence else (1.0 if result.evidence else 0.0),
                # 计划循环是有边界的动作序列，而不是置信度复核循环；领域置信度保留在 AgentResult 输出中，
                # 不得提前停止剩余 Action。
                "confidence": None,
                # 不同领域可以使用同一批证据完成不同业务动作。
                # 真实领域验收通过属于进展，但不等于整个计划结束。
                "progress_made": evaluation.status.value == "final",
                "done": False,
            }

        def trace(event: str, payload: dict[str, Any]) -> None:
            self.container.trace.record(
                type="loop", name="runtime", node="runtime", agent="runtime", event=event,
                task_id=initial.get("task_id", ""), trace_id=initial.get("trace_id", ""),
                state_change=dict(payload), keys=list(payload), tool_name="", latency=0.0, error="",
            )

        execution_manager = getattr(self.container, "execution_manager", None)
        execution_timeout = float(getattr(execution_manager, "timeout_seconds", 30.0))
        result: LoopResult = LoopEngine(
            LoopPolicy(
                max_iterations=max(1, len(plan.actions) * 3 + 2),
                min_evidence_score=min_evidence_score,
                timeout_seconds=max(1.0, execution_timeout + 1.0),
            ),
        ).run(
            runtime_state,
            step,
            evaluator=evaluator,
            trace=trace,
            trace_context={"task_id": initial.get("task_id", ""), "trace_id": initial.get("trace_id", "")},
        )
        final_state = dict(result.state)
        final_state["runtime_result"] = {
            "status": result.status,
            "stop_reason": result.stop_reason,
            "iterations": result.iterations,
            "evidence_score": result.evidence_score,
            "actions": list(result.actions),
            "history": list(result.history),
        }
        final_state["runtime_actions"] = list(result.actions)
        if result.status != "completed":
            final_state["status"] = result.status
            final_state["stop_reason"] = result.stop_reason
        return final_state

    def _enrich_action(self, action: ActionModel, state: Mapping[str, Any]) -> ActionModel:
        """把 Skill 派生的执行元数据附加到标准 Action 上。"""

        payload = dict(action.payload)
        capability = action.required_capability or action.target
        registry = get_skill_registry()
        agent = ""
        try:
            matches = self.capabilities.find(capability)
            agent = str(matches[0]) if matches else ""
        except Exception:
            agent = ""
        agent = agent or str(payload.get("agent") or action.target).split(".", 1)[0]
        # 工具授权和 Skill 元数据不能反过来当作业务意图参与 trigger 匹配。
        trigger_payload = {
            key: value for key, value in payload.items()
            if key not in {"allowed_tools", "active_skills", "skills", "skill", "step"}
        }
        try:
            selected = registry.select(
                agent,
                context={
                    **dict(state.get("context") or {}),
                    **dict(state.get("event") or {}),
                    **trigger_payload,
                    "capability": capability,
                    "user_text": str(state.get("user_text") or ""),
                },
            )
        except Exception:
            selected = []
        skill_names = [item.name for item in selected]
        steps = [step for item in selected for step in item.normalized_steps()]
        payload.setdefault("agent", agent)
        # Action 自带的 Skill 名称可能来自 Planner 或客户端，不作为授权依据。
        payload["active_skills"] = skill_names
        payload["skill"] = skill_names[0] if skill_names else ""
        payload["step"] = steps[0].id if steps else ""
        # 一个 Runtime Action 可能执行所选 Skill 的多个步骤；守卫只接收
        # 当前选中 Skill 的工具，不把该 Agent 其他 Skill 的工具全部放行。
        # Planner/客户端给出的 allowed_tools 不是授权来源；每次以实际
        # 选中的 Skill 重新计算，避免旧动作或嵌套参数扩大本轮工具范围。
        payload["allowed_tools"] = registry.merge_tools(selected)
        return action.model_copy(update={"payload": payload})

    def resume_pending(self, record: Mapping[str, Any]) -> dict[str, Any]:
        """恢复已持久化的 Action，且不再次调用 Planner。"""

        state = dict(record.get("state") or {})
        state.update({
            "runtime_resume": {
                "plan": dict(record.get("plan") or {}),
                "next_index": int(record.get("next_index") or 0),
                "pending_id": str(record.get("pending_id") or ""),
            },
        })
        return self.run(state)

    @staticmethod
    def _plan_from_dict(value: Mapping[str, Any], goal: str) -> Any:
        from .planner import Plan

        actions = [ActionModel.coerce(item) for item in value.get("actions") or []]
        return Plan(
            goal=str(value.get("goal") or goal),
            actions=[item for item in actions if item is not None],
            metadata=dict(value.get("metadata") or {}),
        )

    def _replan_capabilities(self, capability: str, output: Mapping[str, Any], remaining: list[ActionModel]) -> list[str]:
        definition = self.capabilities.metadata_for(capability)
        if definition and definition.replan_capabilities:
            # 复核能力只替换失败动作，未完成的后续任务仍须交给 Planner。
            # 与 Agent 建议路径共用顺序去重，避免重复加入创建等副作用能力。
            return self._next_action_capabilities(list(definition.replan_capabilities), remaining)
        return [item.required_capability for item in remaining if item.required_capability] or [capability]

    @staticmethod
    def _next_action_capabilities(next_actions: list[Any], remaining: list[ActionModel]) -> list[str]:
        """从 AgentResult.next_actions 封装中提取 Planner 输入。

        这里只接受明确的能力要求，以保持 Action → Registry → Agent 边界，
        避免自由格式的 Agent 输出变成隐式 Dispatcher 命令。
        """
        requested: list[str] = []
        for item in next_actions:
            if isinstance(item, str):
                capability = item.strip()
            elif isinstance(item, Mapping):
                payload = item.get("payload")
                payload = payload if isinstance(payload, Mapping) else {}
                capability = (
                    item.get("required_capability")
                    or item.get("capability")
                    or payload.get("required_capability")
                    or ""
                )
                capability = str(capability).strip()
            else:
                capability = ""
            if capability and capability not in requested:
                requested.append(capability)

        # Agent 请求能力后保留尚未完成的计划工作，除非 Agent 明确请求了同一能力序列。
        for action in remaining:
            capability = action.required_capability
            if capability and capability not in requested:
                requested.append(capability)
        return requested

    @staticmethod
    def _workorder_lifecycle_status(raw_status: str, result: Mapping[str, Any] | None = None) -> str:
        """区分工单已创建、待派工和已进入维修，避免状态语义混用。"""
        value = str(raw_status or "").strip().lower()
        if value == "open":
            return "waiting_dispatch"
        if value in {"waiting_for_personnel", "in_progress", "awaiting_verification", "completed", "closed", "rejected", "timeout"}:
            return value
        return "created" if (result or {}).get("success") else "workorder_error"

    @staticmethod
    def _evidence_ids(items: list[Any]) -> list[str]:
        values: list[str] = []
        for item in items:
            if isinstance(item, Mapping):
                value = item.get("id") or item.get("document_id") or item.get("component_id") or item.get("content")
            else:
                value = item
            if value:
                values.append(str(value))
        return values


__all__ = ["RuntimeCoordinator"]
