"""测试用本地工厂适配器，避免依赖开发机上的绝对路径。"""

BARFEED_DEVICE_ID = "BARFEED-BF01"


class _Device:
    def __init__(self, device_id: str):
        self.device_id = device_id
        self.status = "running"
        self.health_score = 100
        self.alarm_code = ""
        self.alarm_codes = []
        self.fault_evidence = {}
        self.control_state = "running"
        self.control_reason = ""

    def snapshot(self):
        return {"device_id": self.device_id, "status": self.status, "control_state": self.control_state, "control_reason": self.control_reason, "health_score": self.health_score, "alarm_code": self.alarm_code, "alarm_codes": list(self.alarm_codes), "fault_evidence": dict(self.fault_evidence)}


class VirtualFactory:
    def __init__(self):
        self.devices = {device_id: _Device(device_id) for device_id in (BARFEED_DEVICE_ID, "MACHINE-02", "MACHINE-03", "MACHINE-04")}
        self._active = set()

    def start_scenario(self, name: str):
        if name == "barfeed_bf01":
            self._active.add(BARFEED_DEVICE_ID)

    def tick(self):
        for device_id in self._active:
            device = self.devices[device_id]
            device.status = "alarm"
            device.control_state = "alarm"
            device.health_score = 35
            device.alarm_code = "BF01"
            device.alarm_codes = ["BF01"]
            device.fault_evidence = {"evidence_status": "captured", "alarm_code": "BF01"}

    def stop_scenario(self, device_id: str):
        self._active.discard(device_id)

    def control_device(self, device_id: str, action: str, reason: str = ""):
        device = self.devices[device_id]
        if action == "emergency_stop":
            if device.alarm_code:
                device.fault_evidence = {**device.fault_evidence, "evidence_status": "captured", "status_before_stop": device.fault_evidence.get("status_before_stop") or device.status, "alarm_code": device.alarm_code}
            else:
                device.health_score = None
                device.fault_evidence = {"evidence_status": "unavailable", "control_reason": reason}
            device.status = "emergency_stop"
            device.control_state = "emergency_stop"
            device.control_reason = reason
        elif action == "start":
            device.status = "running"
            device.control_state = "running"
            device.health_score = None
            device.alarm_code = ""
            device.alarm_codes = []
            device.fault_evidence = {}
        return {"ok": True, "device": device.snapshot()}

    def get_summary(self):
        values = [device.snapshot() for device in self.devices.values()]
        health = [item["health_score"] for item in values if item["health_score"] is not None]
        return {"device_count": len(values), "running_count": sum(item["status"] == "running" for item in values), "avg_health_score": sum(health) / len(health) if health else None}
