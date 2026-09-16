"""Diagnosis Agent 的 LangGraph Reason-Act-Observe-Validate 工作流。"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional, TypedDict

from langgraph.graph import END, START, StateGraph

from app.agents.diagnosis.schemas import AgentStatus, DiagnosisResult, DiagnosisState


class DiagnosisGraphState(TypedDict, total=False):
    """LangGraph 节点之间传递的运行时状态。"""

    agent: Any
    event: Dict[str, Any]
    agent_state: DiagnosisState
    event_id: str
    device_id: str
    alarm_code: Any
    task_id: str
    triggered_at: Any
    diagnosis_run_id: str
    response: Dict[str, Any]
    assistant: Dict[str, Any]
    guarded_calls: List[Dict[str, Any]]
    pending_observations: List[Dict[str, Any]]
    validation: Dict[str, Any]
    route: str
    error: str
    final_result: Optional[DiagnosisResult]


def initialize_diagnosis_state(state: DiagnosisGraphState) -> Dict[str, Any]:
    """初始化消息上下文，并在模型不可用时转入本地降级路径。"""
    agent = state["agent"]
    runtime = state["agent_state"]
    runtime.messages = list(agent._messages(state["event"]))
    runtime.status = AgentStatus.RUNNING
    runtime.current_agent = "diagnosis.initialize"

    if not getattr(agent.client, "available", True):
        runtime.error = "未配置 DeepSeek 密钥"
        runtime.stop_reason = "llm_unavailable"
        return {"agent_state": runtime, "route": "fallback"}

    return {"agent_state": runtime, "route": "load_skill"}


def load_diagnosis_skill(state: DiagnosisGraphState) -> Dict[str, Any]:
    """加载当前事件对应的 Skill 和工具白名单。"""
    agent = state["agent"]
    runtime = state["agent_state"]
    skill = agent._select_skill(state["event"])
    runtime.active_skill = skill["name"]
    runtime.allowed_tools = list(skill["allowed_tools"])
    runtime.current_agent = "diagnosis.load_skill"
    runtime.messages.append({
        "role": "system",
        "content": (
            "当前诊断Skill=%s；允许工具=%s。必须遵守工具白名单。"
            % (runtime.active_skill, ",".join(runtime.allowed_tools))
        ),
    })
    return {"agent_state": runtime, "route": "reason"}


def request_diagnosis_reasoning(state: DiagnosisGraphState) -> Dict[str, Any]:
    """调用模型决定继续取证，还是进入候选诊断校验。"""
    agent = state["agent"]
    runtime = state["agent_state"]
    runtime.current_agent = "diagnosis.reason"

    if runtime.step_count >= runtime.max_steps:
        error = "诊断工具调用超过最大轮次：%s" % runtime.max_steps
        runtime.error = error
        runtime.stop_reason = "max_steps"
        return {"agent_state": runtime, "route": "fallback", "error": error}

    if runtime.repeated_observation_count >= 1:
        runtime.error = "连续没有新的 Observation"
        runtime.stop_reason = "no_new_observation"
        return {"agent_state": runtime, "route": "validate", "error": runtime.error}

    runtime.step_count += 1
    alarm_code = state.get("alarm_code")
    tool_choice = None
    if alarm_code and not agent._has_tool_call(runtime, "get_alarm_definition"):
        tool_choice = {"type": "function", "function": {"name": "get_alarm_definition"}}

    response = agent.client.chat(
        runtime.messages,
        tools=agent._tool_schemas_for(runtime.allowed_tools),
        tool_choice=tool_choice,
    )
    assistant = dict(agent._assistant_message(response))
    calls = assistant.get("tool_calls") or []

    if not calls and alarm_code and not agent._has_tool_call(runtime, "get_alarm_definition"):
        calls = [{
            "id": "forced_get_alarm_definition",
            "type": "function",
            "function": {
                "name": "get_alarm_definition",
                "arguments": json.dumps({"alarm_code": alarm_code}, ensure_ascii=False),
            },
        }]
        assistant["tool_calls"] = calls

    runtime.messages.append(assistant)
    # 自动异常诊断需要知识证据时，通过 Orchestrator 注入的 A2A 回调调用 Knowledge。
    # 结果写回当前 Diagnosis Observation，后续模型继续基于证据判断，避免外层重复检索。
    if not calls and getattr(agent, "knowledge_provider", None) and not agent._has_tool_call(runtime, "search_knowledge"):
        query = agent._knowledge_query(state["event"])
        arguments = {"query": query, "limit": 5}
        try:
            result = agent.request_knowledge(state["event"], query)
        except Exception as error:
            result = {
                "success": False,
                "found": False,
                "source": "a2a-error",
                "error": {"code": type(error).__name__, "message": str(error)},
            }
        record = {
            "step": runtime.step_count,
            "name": "search_knowledge",
            "arguments": arguments,
            "result": result,
            "source": "a2a",
        }
        runtime.tool_calls.append(record)
        runtime.tool_results.append(result)
        observation = agent._observation_from_tool("search_knowledge", arguments, result, runtime.step_count)
        runtime.observations.append(observation)
        for item in agent._evidence_from_observation(observation):
            if item not in runtime.evidence:
                runtime.evidence.append(item)
        runtime.messages.append({
            "role": "tool",
            "tool_call_id": "a2a-knowledge",
            "name": "search_knowledge",
            "content": json.dumps(result, ensure_ascii=False),
        })
        runtime.next_action = "基于 Knowledge Evidence 完成诊断"
        return {"agent_state": runtime, "route": "reason"}

    route = "tool_guard" if calls else "validate"
    return {"agent_state": runtime, "response": response, "assistant": assistant, "route": route}


def guard_tool_calls(state: DiagnosisGraphState) -> Dict[str, Any]:
    """校验模型工具调用，只放行当前 Skill 允许的工具。"""
    agent = state["agent"]
    runtime = state["agent_state"]
    runtime.current_agent = "diagnosis.tool_guard"
    assistant = state.get("assistant") or {}
    guarded: List[Dict[str, Any]] = []
    denied: List[Dict[str, Any]] = []

    for call in assistant.get("tool_calls") or []:
        function = call.get("function") or {}
        name = str(function.get("name") or "")
        arguments = agent._json_arguments(function.get("arguments"))
        arguments = agent._normalize_tool_arguments(name, arguments, state)
        decision = agent._guard_tool_call(name, arguments, runtime)
        normalized_call = dict(call)
        normalized_call["function"] = {"name": name, "arguments": json.dumps(arguments, ensure_ascii=False)}
        if decision["allow"]:
            guarded.append(normalized_call)
            continue
        denied.append({"call": normalized_call, "decision": decision})
        result = {
            "success": False,
            "found": False,
            "tool": name,
            "source": "tool-guard",
            "data": None,
            "error": {"code": decision["code"], "message": decision["message"]},
        }
        runtime.tool_calls.append({"step": runtime.step_count, "name": name, "arguments": arguments, "result": result, "guard": "deny"})
        runtime.tool_results.append(result)
        runtime.messages.append({
            "role": "tool",
            "tool_call_id": call.get("id") or "tool_call",
            "name": name,
            "content": json.dumps(result, ensure_ascii=False),
        })

    if guarded:
        return {"agent_state": runtime, "guarded_calls": guarded, "route": "act"}
    runtime.messages.append({"role": "system", "content": "工具调用被 Tool Guard 拒绝，请基于已有证据重新选择允许工具或输出低置信度诊断。"})
    return {"agent_state": runtime, "guarded_calls": [], "route": "reason", "error": json.dumps(denied, ensure_ascii=False)}


def execute_tool_calls(state: DiagnosisGraphState) -> Dict[str, Any]:
    """执行已通过白名单校验的工具调用并保留原始结果。"""
    agent = state["agent"]
    runtime = state["agent_state"]
    runtime.current_agent = "diagnosis.act"
    pending: List[Dict[str, Any]] = []

    for call in state.get("guarded_calls") or []:
        function = call.get("function") or {}
        name = function.get("name") or ""
        arguments = agent._json_arguments(function.get("arguments"))
        try:
            result = agent.tools.execute(name, arguments)
        except Exception as error:
            result = {
                "success": False,
                "found": False,
                "tool": name,
                "source": "tool-error",
                "data": None,
                "error": {"code": type(error).__name__, "message": str(error)},
            }

        call_record = {"step": runtime.step_count, "name": name, "arguments": arguments, "result": result}
        runtime.tool_calls.append(call_record)
        runtime.tool_results.append(result)
        pending.append({"call": call, "record": call_record, "result": result})

    return {"agent_state": runtime, "pending_observations": pending, "route": "observe"}


def record_tool_observations(state: DiagnosisGraphState) -> Dict[str, Any]:
    """把工具返回转换为可追踪 Observation，并检测重复证据。"""
    agent = state["agent"]
    runtime = state["agent_state"]
    runtime.current_agent = "diagnosis.observe"
    observations: List[Dict[str, Any]] = []

    for item in state.get("pending_observations") or []:
        call = item["call"]
        record = item["record"]
        result = item["result"]
        observation = agent._observation_from_tool(record["name"], record["arguments"], result, runtime.step_count)
        observations.append(observation)
        runtime.observations.append(observation)
        for evidence in agent._evidence_from_observation(observation):
            if evidence not in runtime.evidence:
                runtime.evidence.append(evidence)
        runtime.messages.append({
            "role": "tool",
            "tool_call_id": call.get("id") or "tool_call",
            "name": record["name"],
            "content": json.dumps(result, ensure_ascii=False),
        })

    fingerprint = agent._observation_hash(observations)
    if fingerprint and fingerprint == runtime.last_observation_hash:
        runtime.repeated_observation_count += 1
    else:
        runtime.repeated_observation_count = 0
    runtime.last_observation_hash = fingerprint
    runtime.next_action = "判断是否需要更多诊断依据"
    return {"agent_state": runtime, "route": "reason"}


def validate_diagnosis_candidate(state: DiagnosisGraphState) -> Dict[str, Any]:
    """校验模型候选诊断的 JSON、证据和置信度是否完整。"""
    agent = state["agent"]
    runtime = state["agent_state"]
    runtime.current_agent = "diagnosis.validate"
    assistant = state.get("assistant") or {}
    final_text = str(assistant.get("content") or "")
    parsed = agent._parse_json(final_text)
    validation = agent._validate_candidate(runtime, state["event"], parsed, final_text)
    runtime.validation_errors = list(validation.get("errors") or [])

    if validation.get("pass"):
        runtime.stop_reason = runtime.stop_reason or "validator_pass"
        return {"agent_state": runtime, "validation": validation, "route": "final"}

    if runtime.step_count >= runtime.max_steps:
        runtime.error = "; ".join(runtime.validation_errors) or "Validator 未通过"
        runtime.stop_reason = runtime.stop_reason or "validator_failed_max_steps"
        return {"agent_state": runtime, "validation": validation, "route": "fallback", "error": runtime.error}

    runtime.messages.append({
        "role": "system",
        "content": "Validator未通过：%s。请只调用允许工具补充证据，仍不足时输出低置信度并说明需人工检查。" % "；".join(runtime.validation_errors),
    })
    return {"agent_state": runtime, "validation": validation, "route": "reason"}


def build_final_diagnosis_result(state: DiagnosisGraphState) -> Dict[str, Any]:
    """将通过校验的模型输出转换为最终诊断结果。"""
    agent = state["agent"]
    runtime = state["agent_state"]
    assistant = state.get("assistant") or {}
    final_text = str(assistant.get("content") or "")
    result = agent._result_from_model(
        state=runtime,
        event_id=state["event_id"],
        device_id=state["device_id"],
        alarm_code=state.get("alarm_code"),
        parsed=agent._parse_json(final_text),
        raw_text=final_text,
        task_id=state.get("task_id", ""),
        triggered_at=state.get("triggered_at"),
        diagnosis_run_id=state["diagnosis_run_id"],
    )
    return {"agent_state": runtime, "final_result": result}


def build_fallback_diagnosis_result(state: DiagnosisGraphState) -> Dict[str, Any]:
    """模型或校验失败时，根据已有事件和工具证据生成降级结果。"""
    agent = state["agent"]
    runtime = state["agent_state"]
    result = agent._build_fallback_result(
        state=runtime,
        event_id=state["event_id"],
        device_id=state["device_id"],
        alarm_code=state.get("alarm_code"),
        error=state.get("error") or runtime.error or "诊断流程未完成",
        task_id=state.get("task_id", ""),
        triggered_at=state.get("triggered_at"),
        diagnosis_run_id=state["diagnosis_run_id"],
    )
    return {"agent_state": runtime, "final_result": result}


def select_next_diagnosis_route(state: DiagnosisGraphState) -> str:
    """读取节点写入的 route，决定诊断图下一跳。"""
    return state.get("route", "fallback")


def build_diagnosis_graph():
    """构建并编译一次 Diagnosis Agent 工作流。"""

    workflow = StateGraph(DiagnosisGraphState)
    workflow.add_node("initialize", initialize_diagnosis_state)
    workflow.add_node("load_skill", load_diagnosis_skill)
    workflow.add_node("reason", request_diagnosis_reasoning)
    workflow.add_node("tool_guard", guard_tool_calls)
    workflow.add_node("act", execute_tool_calls)
    workflow.add_node("observe", record_tool_observations)
    workflow.add_node("validate", validate_diagnosis_candidate)
    workflow.add_node("final", build_final_diagnosis_result)
    workflow.add_node("fallback", build_fallback_diagnosis_result)

    workflow.add_edge(START, "initialize")
    # 初始化和 Skill 加载都可能因配置问题直接进入降级路径。
    workflow.add_conditional_edges("initialize", select_next_diagnosis_route, {"load_skill": "load_skill", "fallback": "fallback"})
    workflow.add_conditional_edges("load_skill", select_next_diagnosis_route, {"reason": "reason", "fallback": "fallback"})
    # 推理结果决定是否调用工具；没有工具调用时先经过 Validator。
    workflow.add_conditional_edges("reason", select_next_diagnosis_route, {"reason": "reason", "tool_guard": "tool_guard", "validate": "validate", "fallback": "fallback"})
    workflow.add_conditional_edges("tool_guard", select_next_diagnosis_route, {"act": "act", "reason": "reason", "fallback": "fallback"})
    workflow.add_conditional_edges("act", select_next_diagnosis_route, {"observe": "observe", "fallback": "fallback"})
    workflow.add_edge("observe", "reason")
    workflow.add_conditional_edges("validate", select_next_diagnosis_route, {"final": "final", "reason": "reason", "fallback": "fallback"})
    workflow.add_edge("final", END)
    workflow.add_edge("fallback", END)
    return workflow.compile()
