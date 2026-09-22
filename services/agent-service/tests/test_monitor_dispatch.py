def test_event_result_store_reuses_original_result():
    from app.runtime.event_store import EventResultStore

    store = EventResultStore(max_items=4)
    first = store.get_or_create(
        "EVT-1",
        lambda: {"task_id": "TASK-1", "status": "waiting_repair"},
    )
    second = store.get_or_create("EVT-1", lambda: {"task_id": "TASK-2"})

    assert first == second
    assert second["task_id"] == "TASK-1"


def test_event_result_store_does_not_cache_blank_event_id():
    from app.runtime.event_store import EventResultStore

    store = EventResultStore()
    first = store.get_or_create("", lambda: {"task_id": "TASK-1"})
    second = store.get_or_create("", lambda: {"task_id": "TASK-2"})

    assert first["task_id"] == "TASK-1"
    assert second["task_id"] == "TASK-2"
