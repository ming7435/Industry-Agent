"""专家中心真实 API、文件热加载和监督身份边界回归。"""

from copy import deepcopy
from pathlib import Path
from types import SimpleNamespace
from hashlib import sha256
from concurrent.futures import ThreadPoolExecutor

import pytest
import yaml
from fastapi.testclient import TestClient

from app.api.server import create_app
from app.harness.trace import TraceRecorder
from app.skills.registry import SkillRegistry, _load_markdown_skill


def write_skill(root, agent="diagnosis", name="alarm_diagnosis_skill"):
    path = root / agent / "instructions.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"name": name, "version": "1.0", "goal": "核对故障证据",
               "trigger": "default", "tools": ["get_device_logs"],
               "steps": ["collect_evidence"], "aliases": ["legacy_name"]}
    path.write_text("---\n" + yaml.safe_dump(payload, allow_unicode=True) + "---\n\n# 专家说明\n\n不能编造证据。\n", encoding="utf-8")
    return path


@pytest.fixture
def expert_api(tmp_path, monkeypatch):
    root = tmp_path / "skills"
    path = write_skill(root)
    for agent in ("cad", "knowledge", "maintenance"):
        write_skill(root, agent, agent + "_skill")
    registry = SkillRegistry(root)
    trace = TraceRecorder()
    container = SimpleNamespace(skill_registry=registry, trace=trace,
                                registry=SimpleNamespace(mcp=SimpleNamespace(handlers={"get_device_logs": object()})))
    actors = {"boss": {"user_id": "U-BOSS", "role": "supervisor", "username": "监督人"},
              "worker": {"user_id": "U-WORKER", "role": "technician"},
              "viewer": {"user_id": "U-VIEWER", "role": "viewer"}}
    monkeypatch.setattr("app.api.team_auth.BackendServiceClient", lambda: SimpleNamespace(resolve_session=actors.get))
    app = create_app(SimpleNamespace(container=container))
    client = TestClient(app)
    return SimpleNamespace(client=client, path=path, registry=registry, trace=trace, root=root)


def headers(actor="boss", origin="http://testserver"):
    return {"Cookie": "maintenance_session=" + actor, "Origin": origin}


def detail(api):
    response = api.client.get("/api/expert/skills/diagnosis/alarm_diagnosis_skill", headers=headers())
    assert response.status_code == 200
    return response.json()


def update_body(api):
    current = detail(api)
    return {"expected_revision": current["revision"], "goal": "结合当前设备证据", "version": "1.1",
            "document": "# 新版专家说明\n\n先比较现场温度、振动和报警，不足时继续取证。", "reason": "补充诊断取证规则"}


def save(api, body, actor="boss", origin="http://testserver"):
    # 原有文件/权限回归也使用新的公开测试发布契约。
    if not body.get('test_id') and origin == 'http://testserver' and actor in {'boss', 'worker'} and not set(body) - {
        'expected_revision', 'goal', 'version', 'document', 'reason', 'test_id', 'human_confirmed'
    } and all(str(body.get(key, '')).strip() for key in ('goal', 'document', 'reason')):
        from test_expert_trials import install_model
        install_model(api)
        started = api.client.post('/api/expert/skills/diagnosis/alarm_diagnosis_skill/test',
                                  json={**{k: v for k, v in body.items() if k not in {'test_id', 'human_confirmed'}},
                                        'sample': {'alarm_code': '700006', 'alarm_definition': '刀塔分度超时',
                                                   'scenario': '样例刀塔分度超时，现场待核实', 'expected': '检查分度机构'}},
                                  headers=headers(actor))
        if started.status_code == 200:
            from time import monotonic, sleep
            result = started.json()
            deadline = monotonic() + 15
            while result['status'] == 'running' and monotonic() < deadline:
                sleep(.01)
                result = api.client.get('/api/expert/tests/' + result['test_id'], headers=headers(actor)).json()
            body = {**body, 'test_id': result['test_id'], 'human_confirmed': True}
    # 这些回归隔离文件更新/权限逻辑；生产的机器闭环门禁另有完整测试。
    trials = api.client.app.state.expert_skills.trials
    trials.require_machine_publish = False
    try:
        return api.client.post("/api/expert/skills/diagnosis/alarm_diagnosis_skill", json=body,
                               headers=headers(actor, origin))
    finally:
        trials.require_machine_publish = True


def test_catalog_prioritizes_actual_internal_loops(expert_api):
    response = expert_api.client.get("/api/expert/skills", headers=headers())
    assert response.status_code == 200
    assert {item["agent"] for item in response.json()["items"]} == {"diagnosis", "knowledge", "cad"}
    assert all(item["internal_loop"] for item in response.json()["items"])
    all_items = expert_api.client.get("/api/expert/skills?loop_only=false", headers=headers("worker")).json()
    assert {item["agent"] for item in all_items["items"]} == {"diagnosis", "knowledge", "cad", "maintenance"}


def test_update_preserves_permissions_backs_up_and_reloads_second_registry(expert_api):
    old_bytes = expert_api.path.read_bytes()
    old_payload, _ = _load_markdown_skill(expert_api.path)
    second = SkillRegistry(expert_api.root)
    frozen = second.get("diagnosis", "alarm_diagnosis_skill")
    body = update_body(expert_api)
    response = save(expert_api, body)
    assert response.status_code == 200, response.text
    assert response.json()["revision"] != body["expected_revision"]
    loaded = second.get("diagnosis", "alarm_diagnosis_skill")
    assert loaded.document == body["document"]
    assert loaded.version == "1.1"
    assert frozen.document == "# 专家说明\n\n不能编造证据。"
    new_payload, _ = _load_markdown_skill(expert_api.path)
    assert {k: v for k, v in new_payload.items() if k not in {"goal", "version"}} == {
        k: v for k, v in old_payload.items() if k not in {"goal", "version"}}
    manager = expert_api.client.app.state.expert_skills
    assert any(p.read_bytes() == old_bytes for p in manager.backup_root.rglob("*.md"))
    assert any(record["event"] == "skill_updated" for record in expert_api.trace.list())


@pytest.mark.parametrize("actor", ["viewer", "expired"])
def test_request_cannot_claim_supervisor_role(expert_api, actor):
    before = expert_api.path.read_bytes()
    response = expert_api.client.post("/api/expert/skills/diagnosis/alarm_diagnosis_skill",
                                     json=update_body(expert_api), headers={**headers(actor), "X-Actor-Role": "supervisor"})
    assert response.status_code == (403 if actor == "viewer" else 401)
    assert expert_api.path.read_bytes() == before


def test_missing_session_and_cross_origin_never_write(expert_api):
    body = update_body(expert_api)
    before = expert_api.path.read_bytes()
    assert expert_api.client.get("/api/expert/skills").status_code == 401
    assert save(expert_api, body, origin="http://evil.example").status_code == 403
    assert expert_api.client.post("/api/expert/skills/diagnosis/alarm_diagnosis_skill", json=body,
                                 headers={"Cookie": "maintenance_session=boss"}).status_code == 403
    assert expert_api.path.read_bytes() == before


@pytest.mark.parametrize("extra", ["tools", "steps", "actor", "trigger", "path"])
def test_protected_runtime_metadata_cannot_be_edited(expert_api, extra):
    body = update_body(expert_api)
    body[extra] = ["machine_start"]
    assert save(expert_api, body).status_code == 422


def test_concurrent_or_manual_changes_reject_stale_revision(expert_api):
    body = update_body(expert_api)
    assert save(expert_api, body).status_code == 200
    before = expert_api.path.read_bytes()
    assert save(expert_api, body).status_code == 409
    assert expert_api.path.read_bytes() == before
    new_body = update_body(expert_api)
    expert_api.path.write_text(expert_api.path.read_text(encoding="utf-8") + "\n现场补充\n", encoding="utf-8")
    manual = expert_api.path.read_bytes()
    assert save(expert_api, new_body).status_code == 409
    assert expert_api.path.read_bytes() == manual


@pytest.mark.parametrize("field,value", [("document", " "), ("document", "中" * 24001),
                                          ("version", "abc"), ("reason", ""), ("goal", "")],
                         ids=["blank-document", "oversize-document", "invalid-version", "blank-reason", "blank-goal"])
def test_invalid_content_does_not_replace_source(expert_api, field, value):
    body = update_body(expert_api)
    body[field] = value
    before = expert_api.path.read_bytes()
    assert save(expert_api, body).status_code == 422
    assert expert_api.path.read_bytes() == before


def test_alias_and_unknown_agent_not_write_targets(expert_api):
    body = update_body(expert_api)
    for path in ("diagnosis/legacy_name", "unknown/alarm_diagnosis_skill"):
        assert expert_api.client.post("/api/expert/skills/" + path, json=body, headers=headers()).status_code == 404


def test_file_failure_retains_original(expert_api, monkeypatch):
    body = update_body(expert_api)
    from test_expert_trials import install_model, trial
    install_model(expert_api)
    result = trial(expert_api, body)
    assert result['status'] == 'completed'
    body.update(test_id=result['test_id'], human_confirmed=True)
    before = expert_api.path.read_bytes()
    monkeypatch.setattr("app.skills.management.os.replace", lambda *a: (_ for _ in ()).throw(OSError("测试写入故障")))
    assert save(expert_api, body).status_code == 503
    assert expert_api.path.read_bytes() == before
    assert detail(expert_api)["revision"] == body["expected_revision"]


def test_changed_markdown_enters_real_diagnosis_context(expert_api, monkeypatch):
    from app.agents.diagnosis.graph import load_diagnosis_skill
    from app.agents.diagnosis.schemas import DiagnosisState
    body = update_body(expert_api)
    assert save(expert_api, body).status_code == 200
    monkeypatch.setattr("app.agents.diagnosis.graph.get_skill_registry", lambda: expert_api.registry)
    monkeypatch.setattr("app.agents.diagnosis.graph.tool_policy.select_skill", lambda event: {
        "name": "alarm_diagnosis_skill", "allowed_tools": ["get_device_logs"]})
    runtime = DiagnosisState(abnormal_event={"alarm_code": "ALM-TEST"})
    load_diagnosis_skill({"event": {"alarm_code": "ALM-TEST"}, "agent_state": runtime})
    assert body["document"] in "\n".join(m["content"] for m in runtime.messages)
    assert "1.1" in "\n".join(m["content"] for m in runtime.messages)
    assert runtime.allowed_tools == ["get_device_logs"]


def test_detail_revision_and_body_come_from_one_file_read(expert_api, monkeypatch):
    from app.skills.management import SkillManager
    manager = SkillManager(expert_api.registry, ["get_device_logs"])
    original = expert_api.path.read_bytes()
    expert_api.registry.list("diagnosis")
    original_read = Path.read_bytes
    changed = False
    def concurrent_file_change(path):
        nonlocal changed
        source = original_read(path)
        if path == expert_api.path and not changed:
            changed = True
            path.write_text(source.decode("utf-8").replace("不能编造证据。", "另一个专家刚更新的正文。"), encoding="utf-8")
        return source
    monkeypatch.setattr(Path, "read_bytes", concurrent_file_change)
    result = manager.detail("diagnosis", "alarm_diagnosis_skill")
    assert result["revision"] == sha256(original).hexdigest()
    assert result["document"] == "# 专家说明\n\n不能编造证据。"


def test_two_managers_cannot_publish_same_revision_twice(expert_api):
    from app.skills.management import SkillManager, SkillEditError
    managers = [SkillManager(expert_api.registry, ["get_device_logs"]),
                SkillManager(SkillRegistry(expert_api.root), ["get_device_logs"])]
    body = update_body(expert_api)
    def publish(manager):
        try:
            manager.update("diagnosis", "alarm_diagnosis_skill", body, {"user_id": "U-TEST"})
            return 200
        except SkillEditError as error:
            return error.status
    with ThreadPoolExecutor(max_workers=2) as pool:
        statuses = list(pool.map(publish, managers))
    assert sorted(statuses) == [200, 409]
    assert detail(expert_api)["document"] == body["document"]


def test_existing_technician_identity_can_update_without_new_account_system(expert_api):
    body = update_body(expert_api)
    response = save(expert_api, body, actor="worker")
    assert response.status_code == 200
    assert response.json()["can_edit"] is True
    assert detail(expert_api)["document"] == body["document"]
    assert any(record.get("actor_id") == "U-WORKER" for record in expert_api.trace.list())


def test_malformed_source_returns_unavailable_without_internal_paths(expert_api):
    expert_api.path.write_text('---\nname: [broken\n---\n\n# 专家说明\n', encoding='utf-8')
    response = expert_api.client.get('/api/expert/skills', headers=headers())
    assert response.status_code == 503
    assert str(expert_api.root) not in response.text
