"""专家技能试运行沙箱的边界测试。

这些测试不启动 Docker 或 OpenSandbox：它们验证开关、模式路由、结果回执和
宿主侧记录更新，真实沙箱连通性由部署检查覆盖。
"""
from __future__ import annotations

import json
from contextlib import nullcontext
from pathlib import Path
from types import SimpleNamespace

from app.clients.skill_sandbox import SkillSandbox, SkillSandboxConfig, SkillSandboxError
from app.skills.registry import SkillDefinition
from app.skills.sandbox_runner import execute
from app.skills.testing import SkillTrials


class FakeClient:
    available = True
    timeout = 45

    def chat(self, messages, **kwargs):
        return {"choices": [{"message": {"content": json.dumps({
            "summary": "样例摘要",
            "diagnosis": "样例诊断",
            "recommendation": "样例建议",
        }, ensure_ascii=False)}}]}


class DiagnosisModel:
    available = True
    timeout = 45

    def chat(self, messages, **kwargs):
        return {"choices": [{"message": {"content": json.dumps({
            "summary": "样例刀塔分度超时",
            "diagnosis": "需要核对分度机构和就位反馈",
            "confidence": 0.7,
            "recommendation": "检查分度机构，记录现场结果",
        }, ensure_ascii=False)}}]}


class FakeSandbox:
    fallback = False

    def __init__(self, result=None, error=None):
        self.result = result or {"ok": True, "result": {
            "summary": "样例摘要", "diagnosis": "样例诊断",
            "recommendation": "样例建议", "confidence": 0.5}}
        self.error = error
        self.calls = []

    def supports(self, mode):
        return mode == "instruction_preview"

    def run(self, payload):
        self.calls.append(payload)
        if self.error:
            raise self.error
        return self.result


class FailingSandbox(FakeSandbox):
    def __init__(self):
        super().__init__(error=SkillSandboxError("沙箱不可用"))

    def supports(self, mode):
        return True


class ClientRecorder(FakeClient):
    def __init__(self):
        self.calls = 0

    def chat(self, messages, **kwargs):
        self.calls += 1
        return super().chat(messages, **kwargs)


class Manager:
    def __init__(self, root: Path):
        self.backup_root = root
        self.registry = SimpleNamespace(root=root / "skills", source_files=lambda agent: [])
        self.trace = None

    def _transaction(self):
        return nullcontext()

    def _dependencies(self, agent):
        return {}


def definition(name="alarm_diagnosis_skill"):
    return SkillDefinition.from_payload(
        "diagnosis",
        {"name": name, "version": "1.0", "goal": "验证", "tools": [], "steps": []},
        Path("/tmp") / (name + ".md"),
        "技能说明正文",
    )


def test_sandbox_is_disabled_by_default(monkeypatch):
    for key in (
        "SKILL_SANDBOX_ENABLED", "SKILL_SANDBOX_DOMAIN", "SKILL_SANDBOX_API_KEY",
        "SKILL_SANDBOX_IMAGE", "SKILL_SANDBOX_MODEL_BASE_URL",
        "SKILL_SANDBOX_ALLOWED_HOSTS", "SKILL_SANDBOX_FALLBACK",
        "SKILL_SANDBOX_READY_TIMEOUT_SECONDS",
    ):
        monkeypatch.delenv(key, raising=False)
    config = SkillSandboxConfig.from_env()
    assert config.enabled is False
    assert config.fallback is False
    assert config.allowed_hosts == ("host.docker.internal",)
    assert SkillSandbox(config).supports("diagnosis") is False


def test_sandbox_only_supports_trial_modes(monkeypatch):
    monkeypatch.setenv("SKILL_SANDBOX_ENABLED", "true")
    sandbox = SkillSandbox.from_env()
    assert sandbox.supports("diagnosis") is True
    assert sandbox.supports("instruction_preview") is True
    assert sandbox.supports("knowledge_flow") is False
    assert sandbox.supports("machine_flow") is False


def test_runner_instruction_preview_returns_structured_result():
    payload = {
        "agent": "diagnosis",
        "name": "alarm_diagnosis_skill",
        "mode": "instruction_preview",
        "test_id": "T-SANDBOX-1",
        "definitions": [{"metadata": definition().metadata, "document": definition().document}],
        "sample": {"alarm_code": "A1", "severity": "critical", "scenario": "主轴过热"},
    }
    result = execute(payload, client=FakeClient())
    assert result["ok"] is True
    assert result["result"] == {
        "summary": "样例摘要",
        "diagnosis": "样例诊断",
        "recommendation": "样例建议",
    }


def test_runner_diagnosis_mode_uses_real_skill_without_production_tools():
    from app.skills.registry import SkillRegistry

    registry = SkillRegistry(Path(__file__).resolve().parents[1] / "app" / "skills")
    skill = registry.get("diagnosis", "alarm_diagnosis_skill")
    assert skill is not None

    payload = {
        "agent": "diagnosis",
        "name": "alarm_diagnosis_skill",
        "mode": "diagnosis",
        "test_id": "T-SANDBOX-2",
        "definitions": [{"metadata": dict(skill.metadata), "document": skill.document}],
        "sample": {
            "alarm_code": "700006",
            "alarm_definition": "刀塔旋转超时",
            "scenario": "刀塔分度超时，现场尚未确定原因。",
            "expected": "应建议检查分度机构，不能直接断言需要换件。",
        },
    }
    result = execute(payload, client=DiagnosisModel())
    assert result["ok"] is True, result
    assert result["result"]["summary"] == "样例刀塔分度超时"
    assert result["checks"]["stop_reason"] == "validator_pass"


def test_runner_rejects_unsupported_mode():
    result = execute({"mode": "machine_flow"}, client=FakeClient())
    assert result["ok"] is False
    assert "不支持" in result["message"]


def test_trial_writes_sandbox_result_without_touching_local_paths(tmp_path, monkeypatch):
    monkeypatch.setenv("SKILL_SANDBOX_ENABLED", "true")
    manager = Manager(tmp_path)
    trials = SkillTrials(manager, client_factory=lambda: FakeClient())
    sandbox = FakeSandbox()

    record = {
        "test_id": "a" * 32,
        "actor_id": "U-1",
        "agent": "diagnosis",
        "name": "alarm_diagnosis_skill",
        "mode": "instruction_preview",
        "dependencies": {},
        "status": "running",
        "sample": {"scenario": "主轴过热"},
    }
    # DraftRegistry 为每个 Agent 返回冻结定义；这里直接构造一个最小注册表接口。
    class Frozen:
        def list(self, agent):
            return [definition()]

    trials._execute_sandboxed(record, Frozen(), sandbox)

    receipt = json.loads((tmp_path / "tests" / ("a" * 32 + ".json")).read_text(encoding="utf-8"))
    assert receipt["status"] == "completed"
    assert receipt["result"]["summary"] == "样例摘要"
    assert sandbox.calls and sandbox.calls[0]["mode"] == "instruction_preview"
    assert sandbox.calls[0]["definitions"][0]["document"] == "技能说明正文"


def test_sandbox_failure_is_fail_closed_by_default(tmp_path, monkeypatch):
    monkeypatch.setenv("SKILL_SANDBOX_ENABLED", "true")
    manager = Manager(tmp_path)
    client = ClientRecorder()
    trials = SkillTrials(manager, client_factory=lambda: client)
    trials._sandbox_executor = FailingSandbox()

    record = {
        "test_id": "b" * 32,
        "actor_id": "U-1",
        "agent": "diagnosis",
        "name": "alarm_diagnosis_skill",
        "mode": "instruction_preview",
        "dependencies": {},
        "status": "running",
        "sample": {"scenario": "主轴过热"},
    }

    class Frozen:
        def list(self, agent):
            return [definition()]

    assert trials.slots.acquire(blocking=False)
    trials._execute(record, Frozen())

    receipt = json.loads((tmp_path / "tests" / ("b" * 32 + ".json")).read_text(encoding="utf-8"))
    assert receipt["status"] == "failed"
    assert receipt["message"] == "沙箱不可用"
    # 默认 SKILL_SANDBOX_FALLBACK=false：沙箱失败不能静默走进程内模型。
    assert client.calls == 0
