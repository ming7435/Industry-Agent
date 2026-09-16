import sys
import time
import unittest
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.harness import AgentExecutionError, AgentHarness


class FakeAgent:
    def __init__(self, failures=0):
        self.failures = failures
        self.calls = 0

    def run(self, event):
        self.calls += 1
        if self.calls <= self.failures:
            raise RuntimeError("temporary failure")
        return {"status": "completed", "event_id": event["event_id"]}


class SlowAgent:
    def run(self, event):
        time.sleep(0.2)
        return event


class AgentHarnessTests(unittest.TestCase):
    def test_harness_retries_agent_task(self):
        agent = FakeAgent(failures=1)
        result = AgentHarness(agent, timeout_seconds=1, max_retries=1).execute_agent(
            {"event_id": "EVT-001"}
        )

        self.assertEqual(result["event_id"], "EVT-001")
        self.assertEqual(agent.calls, 2)

    def test_harness_raises_after_timeout(self):
        with self.assertRaises(AgentExecutionError):
            AgentHarness(SlowAgent(), timeout_seconds=0.05, max_retries=0).execute_agent(
                {"event_id": "EVT-002"}
            )


if __name__ == "__main__":
    unittest.main()
