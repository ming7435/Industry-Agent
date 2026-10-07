"""限范围本机工作台检查：默认只读，可显式验证 PDF；BuildCAD 只检查连接，不下发生产或控制。"""

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
    parser.add_argument("--artifacts", action="store_true", help="生成一份既有报告 PDF，不调用 BuildCAD 建模或控制产线")
    args = parser.parse_args()
    reports = []
    for path in ["/api/monitor/snapshot", "/api/maintenance/plans", "/api/reports", "/api/v1/quality/checks",
                 "/api/v1/runs?limit=5", "/api/cad/buildcad/status", "/api/team/devices", "/api/workorders"]:
        status, headers, raw, seconds = call(path)
        value = json.loads(raw) if raw else {}
        facts = {"count": len(value.get("items", []))} if "items" in value else {}
        if path == "/api/monitor/snapshot":
            facts = {"runner": value.get("runner"), "diagnosis_task_count": value.get("diagnosis_task_count"), "pending_diagnosis_count": value.get("pending_diagnosis_count")}
            facts["devices"] = len(value.get("devices", []))
        elif path == "/api/cad/buildcad/status":
            facts = {key: value.get(key) for key in ["connected", "endpoint", "error_code"]}
        elif path == "/api/maintenance/plans":
            facts["history"] = value.get("history") or value.get("history_load")
        if path == "/api/reports":
            reports = value.get("items", [])
        emit(path, status, seconds, **facts)
    if not args.artifacts:
        return 0
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
