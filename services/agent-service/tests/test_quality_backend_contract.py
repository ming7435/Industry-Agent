from app.runtime.operations import RuntimeOperations


REQUIRED_CHECKS = {
    key: {"passed": True, "status": "pass", "sufficient_data": True, "items": [{"actual": True}], "defects": []}
    for key in ("dimensions", "appearance", "material", "function", "process")
}


class _Requests:
    def inspect_quality(self, state, from_agent, quality_payload):
        return {
            "part_id": "PART-AGENT-001",
            "part_no": "PN-AGENT-001",
            "passed": True,
            "qualified": True,
            "status": "pass",
            "findings": [],
            "inspection_items": [],
            "quality_validation": REQUIRED_CHECKS,
        }


class _Closure:
    def __init__(self):
        self.payload = None

    def record_part_quality(self, payload, operator=""):
        self.payload = dict(payload)
        return {"quality_check_id": "QC-AGENT-001", **self.payload}


def test_agent_quality_persistence_forwards_structured_validation_evidence():
    closure = _Closure()
    operations = RuntimeOperations(_Requests(), closure)

    result = operations.inspect_quality(
        {"context": {"part_id": "PART-AGENT-001"}},
        quality_payload={"part_id": "PART-AGENT-001"},
        persist=True,
    )

    assert result["quality_check_id"] == "QC-AGENT-001"
    assert closure.payload["quality_validation"] == REQUIRED_CHECKS
