"""真实业务闭环仅在模型、设备和跨服务传输边界使用隔离适配器。"""
from copy import deepcopy
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys

from app.monitor.line_control import LineController
from test_line_control import Factory, Ledger
from runtime_slimming_adapter import build_fault_scenario


class PersistedRAG:
    def __init__(self, scripted, path):
        source = Path(__file__).resolve().parents[2] / "rag-service" / "app" / "api" / "documents.py"
        spec = importlib.util.spec_from_file_location("isolated_rag_documents", source)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        self.store = module.DocumentStore(str(path))
        self.scripted = scripted
        self.upserts = []

    def search(self, query, **kwargs):
        return self.scripted.search(query, **kwargs)

    def upsert(self, document, collection):
        self.upserts.append(deepcopy(document))
        self.store.upsert(document["id"], document["content"], document, collection)
        return {"success": True, "loaded": 1}


class BackendRepairBoundary(Ledger):
    def __init__(self, runtime, tmp_path, device_id):
        super().__init__()
        self.orders_service = runtime.container.workorder_service
        self.order_path = runtime.container.registry.workorder_mcp.repository.path
        self.team_path = tmp_path / "team.sqlite3"
        self.device_id = device_id
        self.actor_id = self.invoke("register", {})["user_id"]

    def invoke(self, action, values):
        # 子进程继承当前隔离环境；只传入测试数据库，绝不读取生产配置。
        result = subprocess.run(
            [sys.executable, str(Path(__file__).with_name("backend_lifecycle_worker.py")),
             str(self.order_path), str(self.team_path), self.device_id],
            input=json.dumps({"action": action, "values": values}), text=True, encoding="utf-8",
            capture_output=True, timeout=15,
            env={**os.environ, "PYTHON_DOTENV_DISABLED": "1", "APP_ENV": "testing",
                 "BACKEND_STORAGE": "sqlite", "BACKEND_SQLITE_PATH": str(self.order_path)},
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        if result.returncode:
            raise AssertionError("真实 Backend 隔离子进程失败：" + result.stderr)
        return json.loads(result.stdout)

    def call(self, tool, arguments):
        if tool == "list_workorders":
            return {"items": self.orders_service.list()}
        if tool == "get_workorder":
            return {"workorder": self.orders_service.get(arguments["workorder_id"])}
        raise AssertionError(tool)

    def request(self, path, body):
        assert path in {"/internal/team/repair/confirm", "/internal/team/repair/poststart"}
        return self.invoke("poststart" if path.endswith("/poststart") else "prestart", body)


def build_lifecycle(tmp_path, monkeypatch, *, review=False, missing_stock_once=False,
                    device_id="D-LIFECYCLE", event_id="EVT-LIFECYCLE"):
    runtime, event = build_fault_scenario(tmp_path, monkeypatch, review=review,
        missing_stock_once=missing_stock_once, device_id=device_id, event_id=event_id)
    rag = PersistedRAG(runtime.test_rag, tmp_path / "rag.sqlite3")
    runtime.container.experience_module.writer.rag = rag
    backend = BackendRepairBoundary(runtime, tmp_path, device_id)
    candidate = runtime.test_boundary.responses[("mes", "query_technicians")]["items"][0]
    candidate["technician_id"] = backend.actor_id
    monkeypatch.setenv("FACTORY_CONTROL_MODE", "virtual")
    factory = Factory()
    factory.states = {device_id: "running", "D-LINE-PEER": "running"}
    controller = LineController(factory, backend)
    runtime.container.operations.repair_controller = controller
    stopped = controller.handle_fault(event_id, device_id, "隔离测试故障")
    assert stopped["state"] == "stopped"
    return runtime, event, rag, backend, factory
