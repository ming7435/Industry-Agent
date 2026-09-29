from app.runtime.operations import RuntimeOperations


class _Requests:
    def execute_workorder(self, state, action, workorder=None, from_agent=None):
        return {
            "workorder": {
                "workorder_id": "WO-1",
                "device_id": "MACHINE-1",
                "assignee": "TECH-001",
                "status": "completed",
                "repair_feedback": {"feedback": "已复测", "operator": "TECH-001"},
                "repair_verification": {
                    "passed": True,
                    "source": "device_recovery",
                    "checks": {
                        "device_identity": True,
                        "operational": True,
                        "alarms_clear": True,
                        "metrics_available": True,
                    },
                    "device_recovery": {
                        "device_id": "MACHINE-1",
                        "status": "running",
                        "metrics": {"spindle_vibration_rms": 0.2},
                    },
                },
            }
        }


class _Factory:
    def __init__(self, error=None):
        self.calls = []
        self.error = error

    def control_device(self, device_id, action, reason=""):
        self.calls.append((device_id, action, reason))
        if self.error:
            raise self.error
        return {"ok": True, "action": action, "device": {"status": "running"}}


def test_verified_completion_does_not_automatically_start_machine():
    factory = _Factory()
    operations = RuntimeOperations(_Requests(), closure_service=None, factory_client=factory)

    result = operations.execute_workorder(
        "mark_repair_completed",
        {
            "workorder_id": "WO-1",
            "device_id": "MACHINE-1",
            "repair_feedback": {"feedback": "已复测"},
            "repair_verification": {"passed": True},
        },
    )

    assert factory.calls == []
    assert "machine_control" not in result


def test_repair_person_confirmation_does_not_automatically_restart_machine():
    factory = _Factory()
    operations = RuntimeOperations(_Requests(), closure_service=None, factory_client=factory)

    result = operations.execute_workorder(
        "mark_repair_completed",
        {
            "workorder_id": "WO-1",
            "device_id": "MACHINE-1",
            "maintenance_confirmed_by": "TECH-001",
            "repair_feedback": {"feedback": "已复测", "operator": "TECH-001"},
            "repair_verification": {"passed": True, "source": "device_recovery"},
        },
    )

    assert factory.calls == []
    assert "machine_control" not in result


def test_machine_controller_is_not_called_by_repair_completion():
    factory = _Factory(RuntimeError("device controller unavailable"))
    operations = RuntimeOperations(_Requests(), closure_service=None, factory_client=factory)

    result = operations.execute_workorder(
        "mark_repair_completed",
        {
            "workorder_id": "WO-1",
            "device_id": "MACHINE-1",
            "maintenance_confirmed_by": "TECH-001",
            "repair_feedback": {"feedback": "已复测", "operator": "TECH-001"},
            "repair_verification": {"passed": True, "source": "device_recovery"},
        },
    )

    assert factory.calls == []
    assert "machine_control" not in result
