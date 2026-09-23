from app.agents.maintenance.agent import MaintenanceAgent
from app.contracts import DiagnosisView


def test_maintenance_evidence_ignores_malformed_provider_records():
    diagnosis = DiagnosisView(
        device_id="DEVICE-1",
        fault="主轴温度异常",
        cause="冷却不足",
        severity="high",
        evidence=["温度超过阈值"],
    )
    records = MaintenanceAgent._evidence(
        diagnosis,
        {"evidence": ["bad", {"document_id": "DOC-1"}]},
        {"evidence": [None, {"component_id": "COMP-1"}]},
        {"parts": [42, {"part_id": "TEMP-1", "name": "温度传感器"}]},
        {"kind": "thermal"},
        {"items": [[], {"experience_id": "EXP-1"}]},
    )

    assert [item["type"] for item in records] == [
        "diagnosis",
        "knowledge",
        "inventory",
        "cad",
        "historical_experience",
    ]
