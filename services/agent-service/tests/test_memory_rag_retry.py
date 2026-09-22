class _Rag:
    def __init__(self):
        self.calls = 0

    def upsert(self, record, collection=""):
        self.calls += 1
        return {"success": self.calls > 1, "loaded": 1 if self.calls > 1 else 0}


def test_rag_failure_is_retryable_without_duplicate_memory_rows():
    from app.memory.store import LongMemoryStore, ShortMemoryStore
    from app.memory.writer import ExperienceWriter

    rag = _Rag()
    long_memory = LongMemoryStore()
    writer = ExperienceWriter(ShortMemoryStore(), long_memory, rag)
    experience = {"experience_id": "EXP-RETRY", "device_id": "D-1", "content": "fixed", "collection": "cases"}

    first = writer.write(experience)
    second = writer.write(experience)
    third = writer.write(experience)

    assert first == (True, False, False)
    assert second == (False, True, True)
    assert third == (False, True, True)
    assert rag.calls == 2
    assert len(long_memory.recent(10)) == 1
