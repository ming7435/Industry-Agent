import subprocess

from tests.integration.freecad_document_stack import stop_owned_processes


class Process:
    def __init__(self, stuck=False): self.stuck=stuck; self.alive=True; self.events=[]
    def poll(self): return None if self.alive else 0
    def terminate(self): self.events.append('terminate')
    def wait(self, timeout):
        self.events.append('wait')
        if self.stuck: raise subprocess.TimeoutExpired('test-owned', timeout)
        self.alive=False
    def kill(self): self.events.append('kill'); self.stuck=False


def test_cleanup_only_touches_explicitly_owned_processes():
    owned=Process(); stuck=Process(True); unrelated=Process()
    stop_owned_processes([owned,stuck])
    assert owned.events==['terminate','wait']
    assert stuck.events==['terminate','wait','kill','wait']
    assert unrelated.events==[] and unrelated.alive
