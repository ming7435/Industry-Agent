"""维修方案浏览器回归夹具：只开放隔离测试数据，绝不连接现场服务。"""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
from types import SimpleNamespace
import json
import os
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "services" / "agent-service"), str(ROOT)]


def main():
    with TemporaryDirectory(prefix="industry-maintenance-browser-") as directory:
        os.environ["APP_ENV"] = "testing"
        os.environ["PYTHON_DOTENV_DISABLED"] = "1"
        for key in ("BACKEND_SERVICE_BASE_URL", "MODEL_SERVICE_BASE_URL", "RAG_SERVICE_BASE_URL", "CAD_SERVICE_BASE_URL", "MCP_CAD_URL", "MCP_MES_URL", "MCP_QMS_URL", "MCP_INVENTORY_URL", "AGENT_API_TOKEN", "BACKEND_INTERNAL_TOKEN", "MYSQL_HOST", "REDIS_URL"):
            os.environ[key] = ""
        for key in ("EVENT_STORE_PATH", "WORKORDER_STORE_PATH", "REPORT_STORE_PATH", "LEARNING_RESULT_STORE_PATH", "PENDING_TASK_STORE_PATH", "LINE_SAFETY_STORE_PATH"):
            os.environ[key] = str(Path(directory) / (key + ".sqlite3"))
        from fastapi import HTTPException
        from fastapi.testclient import TestClient
        import app.api.server as api
        from app.runtime.durable_store import DurableJsonStore
        store = DurableJsonStore(os.environ["EVENT_STORE_PATH"])
        for index in range(1, 4):
            store.set("agent_event", str(index), {"maintenance_plan": {"plan_id": f"PLAN-BROWSER-{index}", "repair_steps": ["隔离测试步骤"], "workorder_ready": False, "validation_findings": ["缺少 CAD/BOM 依据", "备件库存为演示数据"]}, "event": {"device_id": "M-BROWSER"}, "stop_reason": "replan_limit_exceeded", "workorder": {"workorder_id": "WO-AUDIT"}})

        def actor(request):
            if request.cookies.get("maintenance_session") != "browser-test-only":
                raise HTTPException(401, "请先登录")
            return {"user_id": "USER-BROWSER", "role": "technician"}
        api.team_actor = actor
        operations = SimpleNamespace(execute_workorder=lambda *args, **kwargs: {"items": []})
        app = api.create_app(orchestrator=SimpleNamespace(container=SimpleNamespace(operations=operations)))
        with TestClient(app) as client:
            class Handler(BaseHTTPRequestHandler):
                def handle_request(self):
                    if self.path == "/fixture/verify":
                        body = {"records_preserved": len(store.keys("agent_event")), "deleted": len(store.keys("maintenance_plan_deleted"))}
                        code = 200
                    elif self.path == "/fixture/shutdown":
                        body, code = {"stopped": True}, 200
                        Thread(target=self.server.shutdown, daemon=True).start()
                    else:
                        size = int(self.headers.get("Content-Length", 0))
                        result = client.request(self.command, self.path, content=self.rfile.read(size) if size else None,
                                                headers={"Cookie": self.headers.get("Cookie", ""), "Content-Type": "application/json"})
                        body, code = result.json(), result.status_code
                    self.send_response(code)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps(body, ensure_ascii=False).encode("utf-8"))
                do_GET = handle_request
                do_POST = handle_request
                do_DELETE = handle_request
                def log_message(self, *args):
                    pass
            server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
            print(json.dumps({"port": server.server_port, "test_fixture": True}), flush=True)
            try:
                server.serve_forever()
            finally:
                server.server_close()


if __name__ == "__main__":
    main()
