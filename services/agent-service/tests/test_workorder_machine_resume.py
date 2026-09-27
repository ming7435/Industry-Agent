from app.runtime.operations import RuntimeOperations


class _Requests:
    def execute_workorder(self, state, action, workorder=None, from_agent=None):
        return {
            "workorder": {
                "workorder_id": "WO-1",
                "device_id": "MACHINE-1",
                "status": "completed",
                "repair_verification": {"passed": True},
            }
        }


class _Factory:
    def __init__(self):
        self.calls = []

    def control_device(self, device_id, action, reason=""):
        self.calls.append((device_id, action, reason))
        return {"ok": True, "action": action, "device": {"status": "running"}}


def test_verified_completion_requests_real_machine_start():
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

    assert factory.calls == [("MACHINE-1", "start", "维修验证通过，申请恢复运行")]
    assert result["machine_control"]["accepted"] is True

