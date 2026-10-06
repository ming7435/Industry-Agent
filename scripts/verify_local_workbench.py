"""限范围本机工作台检查：默认只读，可显式验证建模/PDF，不下发生产或控制。"""

from __future__ import annotations

import argparse
import hashlib
import json
import time
from urllib.error import HTTPError
from urllib.request import Request, build_opener, ProxyHandler


BASE = "http://127.0.0.1:8001"
HTTP = build_opener(ProxyHandler({}))


def call(path, body=None, timeout=50):
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body is not None else None
    request = Request(BASE + path, data=data, headers={"Content-Type": "application/json", "Origin": BASE})
    started = time.monotonic()
    try:
        with HTTP.open(request, timeout=timeout) as response:
            raw = response.read()
            return response.status, response.headers, raw, round(time.monotonic() - started, 3)
    except HTTPError as error:
        error.close()
        return error.code, {}, b"", round(time.monotonic() - started, 3)


def emit(path, status, seconds, **facts):
    print(json.dumps({"path": path, "http_status": status, "seconds": seconds, **facts}, ensure_ascii=False), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--artifacts", action="store_true", help="生成一份明确标记的联调CAD及一份既有报告PDF，不控制产线")
    args = parser.parse_args()
    reports = []
    for path in ["/api/monitor/snapshot", "/api/maintenance/plans", "/api/reports", "/api/v1/quality/checks",
                 "/api/v1/runs?limit=5", "/api/cad/designs/status", "/api/team/devices", "/api/workorders"]:
        status, headers, raw, seconds = call(path)
        value = json.loads(raw) if raw else {}
        facts = {"count": len(value.get("items", []))} if "items" in value else {}
        if path == "/api/monitor/snapshot":
            facts = {"runner": value.get("runner"), "diagnosis_task_count": value.get("diagnosis_task_count"), "pending_diagnosis_count": value.get("pending_diagnosis_count")}
            facts["devices"] = len(value.get("devices", []))
        elif path == "/api/cad/designs/status":
            facts = {key: value.get(key) for key in ["ready", "production_connected"]}
        elif path == "/api/maintenance/plans":
            facts["history"] = value.get("history") or value.get("history_load")
        if path == "/api/reports":
            reports = value.get("items", [])
        emit(path, status, seconds, **facts)
    if not args.artifacts:
        return 0
    payload = {"command_id": "connectivity-20261005-cylinder-v1", "name": "联调验证圆柱（非生产任务）",
               "material": "C45", "technical_requirements": "仅验证建模、实体回读和下载，不下发机器",
               "spec": {"units": "mm", "operations": [{"type": "cylinder", "diameter": 30, "length": 50}]}}
    status, _, raw, seconds = call("/api/cad/designs", payload)
    emit("/api/cad/designs", status, seconds)
    assert status == 202, "建模提交失败"
    identifier = json.loads(raw)["design_id"]
    deadline = time.monotonic() + 60
    while time.monotonic() < deadline:
        status, _, raw, seconds = call(f"/api/cad/designs/{identifier}")
        design = json.loads(raw)
        if design["status"] in {"ready", "failed", "needs_input"}:
            break
        time.sleep(0.2)
    emit(f"/api/cad/designs/{identifier}", status, seconds, design_status=design["status"], geometry=design.get("geometry"), artifact_count=len(design.get("artifacts", [])))
    assert design["status"] == "ready", "实体建模未通过"
    for artifact in design["artifacts"]:
        path = artifact["url"]
        status, headers, raw, seconds = call(path)
        emit(path, status, seconds, bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest(), mime=headers.get("Content-Type", ""))
        assert status == 200 and raw, "文件无法打开"
    assert reports, "没有既有报告可验证"
    record = reports[0]
    record = record.get("report") if isinstance(record.get("report"), dict) else record
    identifier = record["report_id"]
    path = f"/api/reports/{identifier}/pdf"
    status, _, _, seconds = call(path, {})
    emit(path, status, seconds, operation="generate")
    assert status == 200, "报告PDF生成失败"
    for suffix in ["", "?download=1"]:
        status, headers, raw, seconds = call(path + suffix)
        emit(path + suffix, status, seconds, bytes=len(raw), disposition=headers.get("Content-Disposition", ""))
        assert status == 200 and raw.startswith(b"%PDF"), "PDF无法打开或下载"
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
