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


def test_repair_steps_exclude_raw_ocr_and_alarm_dictionary_text():
    raw_document_text = (
        "本地OCR识别结果（第43页，ql80s2_sop_reference.pdf）："
        "触发条件 编码器丢失原点 报警12；设备移动或断电后需要重新建立位置基准；"
        "POSITIONINGERROR ENCODERLOST reference point steps.action safety"
    )

    steps = MaintenanceAgent._repair_steps(
        {"kind": "thermal"},
        {},
        {"recommended_checks": [raw_document_text, "检查冷却液液位"]},
        [],
    )

    assert "检查冷却液液位" in steps
    assert all("本地OCR识别结果" not in step for step in steps)
    assert all("POSITIONINGERROR" not in step for step in steps)
    assert all(len(step) <= 120 for step in steps)
