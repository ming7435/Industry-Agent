import importlib.util
from datetime import datetime
from pathlib import Path


FACTORY_MODULE_PATH = Path(r"C:\Users\12587\Desktop\Factory\simulator\factory.py")


def _load_factory_module():
    spec = importlib.util.spec_from_file_location("external_factory_for_test", FACTORY_MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_emergency_stop_without_active_alarm_exposes_unknown_health_and_evidence_state():
    factory_module = _load_factory_module()
    factory = factory_module.VirtualFactory()

    result = factory.control_device(
        factory_module.BARFEED_DEVICE_ID,
        "emergency_stop",
        reason="监控确认高级故障",
    )

    device = result["device"]
    assert device["status"] == "emergency_stop"
    assert device["control_reason"] == "监控确认高级故障"
    assert device["health_score"] is None
    assert device["alarm_code"] == ""
    assert device["alarm_codes"] == []
    assert device["fault_evidence"]["evidence_status"] == "unavailable"
    assert device["fault_evidence"]["control_reason"] == "监控确认高级故障"


def test_factory_snapshot_provider_keeps_control_and_fault_evidence_fields():
    from app.monitor.factory_api import FactorySnapshotProvider

    class FakeClient:
        def snapshot(self, device_id):
            return {
                "devices": [
                    {
                        "device_id": device_id,
                        "status": "emergency_stop",
                        "control_state": "emergency_stop",
                        "control_reason": "监控确认高级故障",
                        "health_score": 100,
                        "alarm_code": "",
                        "alarm_codes": [],
                        "metrics": {},
                    }
                ]
            }

    sample = FactorySnapshotProvider(FakeClient(), "MACHINE-1").read()

    assert sample.control_state == "emergency_stop"
    assert sample.control_reason == "监控确认高级故障"
    assert sample.health_score is None
    assert sample.fault_evidence["evidence_status"] == "unavailable"
    assert sample.to_dict()["fault_evidence"]["evidence_status"] == "unavailable"


def test_factory_summary_ignores_unknown_health_after_safety_stop():
    factory_module = _load_factory_module()
    factory = factory_module.VirtualFactory()
    factory.control_device(
        factory_module.BARFEED_DEVICE_ID,
        "emergency_stop",
        reason="监控确认高级故障",
    )

    summary = factory.get_summary()

    assert summary["device_count"] == 4
    assert summary["running_count"] == 3
    assert summary["avg_health_score"] == 100.0


def test_verified_start_clears_current_fault_evidence():
    factory_module = _load_factory_module()
    factory = factory_module.VirtualFactory()
    factory.control_device(
        factory_module.BARFEED_DEVICE_ID,
        "emergency_stop",
        reason="监控确认高级故障",
    )

    result = factory.control_device(
        factory_module.BARFEED_DEVICE_ID,
        "start",
        reason="维修验证通过，申请恢复运行",
    )

    assert result["device"]["status"] == "running"
    assert result["device"]["health_score"] is None
    assert result["device"]["fault_evidence"] == {}


def test_emergency_stop_preserves_real_alarm_evidence_when_fault_is_active():
    factory_module = _load_factory_module()
    factory = factory_module.VirtualFactory()
    factory.start_scenario("barfeed_bf01")
    factory.tick()

    result = factory.control_device(
        factory_module.BARFEED_DEVICE_ID,
        "emergency_stop",
        reason="监控确认高级故障",
    )

    device = result["device"]
    assert device["alarm_code"] == "BF01"
    assert device["alarm_codes"] == ["BF01"]
    assert device["health_score"] == 35
    assert device["fault_evidence"]["evidence_status"] == "captured"
    assert device["fault_evidence"]["alarm_code"] == "BF01"


def test_stopping_fault_scenario_does_not_erase_evidence_while_machine_is_stopped():
    factory_module = _load_factory_module()
    factory = factory_module.VirtualFactory()
    factory.start_scenario("barfeed_bf01")
    factory.tick()
    factory.control_device(
        factory_module.BARFEED_DEVICE_ID,
        "emergency_stop",
        reason="监控确认高级故障",
    )

    factory.stop_scenario(device_id=factory_module.BARFEED_DEVICE_ID)
    device = factory.devices[factory_module.BARFEED_DEVICE_ID].snapshot()

    assert device["status"] == "emergency_stop"
    assert device["health_score"] == 35
    assert device["fault_evidence"]["evidence_status"] == "captured"
    assert device["fault_evidence"]["alarm_code"] == "BF01"


def test_repeated_emergency_stop_does_not_replace_first_fault_snapshot():
    factory_module = _load_factory_module()
    factory = factory_module.VirtualFactory()
    factory.start_scenario("barfeed_bf01")
    factory.tick()

    factory.control_device(
        factory_module.BARFEED_DEVICE_ID,
        "emergency_stop",
        reason="监控确认高级故障",
    )
    factory.control_device(
        factory_module.BARFEED_DEVICE_ID,
        "emergency_stop",
        reason="监控确认高级故障",
    )

    evidence = factory.devices[factory_module.BARFEED_DEVICE_ID].fault_evidence
    assert evidence["evidence_status"] == "captured"
    assert evidence["status_before_stop"] == "alarm"
    assert evidence["alarm_code"] == "BF01"
