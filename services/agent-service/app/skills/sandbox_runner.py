"""专家技能试运行的沙箱内执行入口。

该模块只运行在 OpenSandbox 沙箱里，输入和输出都是 JSON 文件：

    python -m app.skills.sandbox_runner --input /work/input.json --output /work/result.json

设计边界：
- 只接收技能草稿目录和人工样例，不读取生产数据库、Redis、设备客户端或宿主文件。
- 只装配 ``SampleTools`` 的只读样例工具，不注册任何生产工具。
- 模型调用走 ``MODEL_SERVICE_BASE_URL``，密钥留在宿主 Model Service，不进入沙箱。
- 任何失败都写入结构化结果，不把内部堆栈、路径或密钥回传给调用方。
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Iterable, Mapping

from app.agents.diagnosis.agent import DiagnosisAgent
from app.agents.diagnosis.parsing import assistant_message, parse_final_json
from app.skills.registry import SkillDefinition
from app.skills.testing import SampleTools, TrialClient, TrialFailure


SUPPORTED_MODES = frozenset({"diagnosis", "instruction_preview"})


class StaticRegistry:
    """把 JSON 中的技能草稿还原成注册表接口，避免读取宿主技能目录。"""

    def __init__(self, definitions: Iterable[SkillDefinition]) -> None:
        self.definitions = tuple(definitions)

    def list(self, agent: str) -> list[SkillDefinition]:
        return [item for item in self.definitions if item.agent == agent]

    def get(self, agent: str, name: str) -> SkillDefinition | None:
        return next(
            (
                item
                for item in self.list(agent)
                if name == item.name or name in item.aliases
            ),
            None,
        )

    def select(
        self,
        agent: str,
        context: Mapping[str, Any] | None = None,
        names: list[str] | tuple[str, ...] | None = None,
    ) -> list[SkillDefinition]:
        if names is None:
            return self.list(agent)
        selected: list[SkillDefinition] = []
        seen: set[str] = set()
        for name in names:
            item = self.get(agent, str(name))
            if item is not None and item.name not in seen:
                selected.append(item)
                seen.add(item.name)
        return selected

    @staticmethod
    def merge_tools(definitions: Iterable[SkillDefinition]) -> list[str]:
        tools: list[str] = []
        for definition in definitions:
            for tool in definition.tools:
                if tool and tool not in tools:
                    tools.append(tool)
        return tools

    @staticmethod
    def merge_steps(definitions: Iterable[SkillDefinition]) -> list[str]:
        steps: list[str] = []
        for definition in definitions:
            for step in definition.normalized_steps():
                if step.id and step.id not in steps:
                    steps.append(step.id)
        return steps


def _definitions(agent: str, payloads: Iterable[Mapping[str, Any]]) -> list[SkillDefinition]:
    definitions: list[SkillDefinition] = []
    for index, item in enumerate(payloads):
        metadata = dict(item.get("metadata") or {})
        document = str(item.get("document") or "")
        name = str(metadata.get("name") or "skill-%s" % index)
        path = Path("/work/skills") / (name + ".md")
        definitions.append(SkillDefinition.from_payload(agent, metadata, path, document))
    return definitions


def _diagnosis_event(record: Mapping[str, Any], sample: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "event_id": "SAMPLE-" + str(record.get("test_id") or "sandbox"),
        "device_id": "EXPERT-SAMPLE",
        "alarm_code": sample.get("alarm_code") or None,
        "severity": sample.get("severity"),
        "summary": sample.get("scenario"),
        "description": sample.get("scenario"),
        "realtime_snapshot": {"现场记录": sample.get("scenario")},
        "abnormal_metrics": sample.get("abnormal_metrics"),
        "occurrence_count": sample.get("occurrence_count"),
    }


def _run_diagnosis(
    payload: Mapping[str, Any],
    registry: StaticRegistry,
    client: Any,
) -> dict[str, Any]:
    sample = dict(payload.get("sample") or {})
    tools = SampleTools(sample)
    trial_client = TrialClient(client, "diagnosis")
    if not trial_client.available:
        return {"ok": False, "message": "尚未配置模型服务，无法试运行，请联系管理员。"}

    agent = DiagnosisAgent(client=trial_client, tools=tools, skill_registry=registry)
    result = agent.run(_diagnosis_event(payload, sample)).to_dict()

    name = str(payload.get("name") or "")
    if name not in result.get("active_skills", []):
        return {
            "ok": False,
            "message": "此样例未触发当前技能，请调整报警编号、异常指标或严重程度后重新测试。",
        }
    if (
        result.get("status") != "completed"
        or result.get("stop_reason") != "validator_pass"
        or result.get("error")
        or not trial_client.last_candidate
        or tools.denied
        or any(call.get("guard") == "deny" for call in result.get("tool_calls", []))
    ):
        return {
            "ok": False,
            "message": "试运行未完成诊断：请检查模型服务，补充样例资料并核对草稿后重试。",
        }

    output = {
        key: result.get(key)
        for key in ("summary", "diagnosis", "recommendation", "confidence")
    }
    # 这些字段只用于宿主 Trace 语义，不进入试运行回执的公开结果。
    output.update({
        "status": result.get("status"),
        "stop_reason": result.get("stop_reason"),
        "active_skills": list(result.get("active_skills") or []),
    })
    return {
        "ok": True,
        "message": "试运行已完成，请对照预期结果人工核对后发布",
        "result": output,
        "checks": {
            "active_skills": list(result.get("active_skills") or []),
            "stop_reason": result.get("stop_reason"),
            "tool_calls": len(result.get("tool_calls") or []),
        },
    }


def _run_instruction_preview(
    payload: Mapping[str, Any],
    registry: StaticRegistry,
    client: Any,
) -> dict[str, Any]:
    skill = registry.get(str(payload.get("agent") or ""), str(payload.get("name") or ""))
    if skill is None:
        return {"ok": False, "message": "未找到对应技能草稿。"}

    trial_client = TrialClient(client, "instruction_preview")
    if not trial_client.available:
        return {"ok": False, "message": "尚未配置模型服务，无法试运行，请联系管理员。"}

    sample = dict(payload.get("sample") or {})
    messages = [
        {
            "role": "system",
            "content": "这是专家说明的隔离试读，不调用工具，不执行设备或业务操作。"
            "根据草稿说明和故障样例返回 JSON，字段 summary、diagnosis、recommendation。"
            "没有证据时明确说明不确定性。预期结果是人工对照依据，不能把它当成现场事实。",
        },
        {"role": "system", "content": skill.document},
        {
            "role": "user",
            "content": json.dumps(
                {key: value for key, value in sample.items() if key != "expected"},
                ensure_ascii=False,
            ),
        },
    ]
    response = trial_client.chat(messages)
    output = parse_final_json(str(assistant_message(response).get("content") or ""))
    output = {
        key: output.get(key)
        for key in ("summary", "diagnosis", "recommendation")
    }
    if not all(
        isinstance(output.get(key), str) and output[key].strip()
        for key in ("summary", "diagnosis", "recommendation")
    ):
        return {
            "ok": False,
            "message": "模型未返回完整的诊断内容，请核对样例后重新测试。",
        }
    return {
        "ok": True,
        "message": "试运行已完成，请对照预期结果人工核对后发布",
        "result": output,
    }


def execute(payload: Mapping[str, Any], client: Any = None) -> dict[str, Any]:
    """执行一次试运行；``client`` 仅用于测试注入。"""

    mode = str(payload.get("mode") or "")
    if mode not in SUPPORTED_MODES:
        return {"ok": False, "message": "当前模式不支持沙箱试运行。"}

    agent = str(payload.get("agent") or "")
    registry = StaticRegistry(_definitions(agent, payload.get("definitions") or []))

    if client is None:
        from app.llm import get_default_llm_client

        client = get_default_llm_client()

    try:
        if mode == "diagnosis":
            return _run_diagnosis(payload, registry, client)
        return _run_instruction_preview(payload, registry, client)
    except TrialFailure as error:
        return {"ok": False, "message": str(error)}
    except Exception:
        # 不把堆栈、路径和供应商错误正文回传给宿主。
        return {"ok": False, "message": "沙箱试运行执行失败，请检查模型服务后重试。"}


def _write(path: Path, value: Mapping[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(dict(value), ensure_ascii=False), encoding="utf-8")
    temporary.replace(path)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="OpenSandbox skill trial runner")
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args(argv)

    source = Path(args.input)
    destination = Path(args.output)
    try:
        payload = json.loads(source.read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("invalid payload")
        result = execute(payload)
    except Exception:
        result = {"ok": False, "message": "试运行输入无法读取或解析。"}

    _write(destination, result)
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    sys.exit(main())
