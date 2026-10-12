from app.runtime.event_store import EventResultStore, scoped_event_key


def test_restart_recovery_can_publish_missing_original_event_receipt(tmp_path):
    from app.runtime.recovery import RecoveryManager
    from app.runtime.durable_store import DurableJsonStore
    event={'event_id':'CRASH','device_id':'D','event_revision':1}
    manager=RecoveryManager(DurableJsonStore(str(tmp_path/'recovery.sqlite3')))
    checkpoint=manager.checkpoint({'task_id':'TASK-CRASH','event':event},'resuming')
    store=EventResultStore(path=str(tmp_path/'events.sqlite3'))
    import pytest
    with pytest.raises(RuntimeError):
        store.get_or_create(scoped_event_key(event),lambda: (_ for _ in ()).throw(RuntimeError('process interrupted')),
                            fingerprint=manager.event_fingerprint(event))
    store.replace_after_recovery(event,{'task_id':'TASK-CRASH','event':event,'status':'completed'},checkpoint=checkpoint)
    assert store.get_result(scoped_event_key(event))['status']=='completed'


def test_late_original_event_producer_cannot_overwrite_recovery_receipt(tmp_path):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Event
    from app.runtime.recovery import RecoveryManager
    from app.runtime.durable_store import DurableJsonStore
    event={'event_id':'LATE','device_id':'D','event_revision':1};key=scoped_event_key(event)
    store=EventResultStore(path=str(tmp_path/'events.sqlite3'))
    manager=RecoveryManager(DurableJsonStore(str(tmp_path/'recovery.sqlite3')))
    checkpoint=manager.checkpoint({'task_id':'TASK-LATE','event':event},'resuming')
    entered,release=Event(),Event()
    def producer():
        entered.set();release.wait(2)
        return {'_event_result_store_version':2,'fingerprint':manager.event_fingerprint(event),
                'result':{'task_id':'TASK-LATE','event':event,'status':'blocked'}}
    with ThreadPoolExecutor(1) as pool:
        old=pool.submit(store._durable.get_or_create,'agent_event',key,producer)
        assert entered.wait(1)
        try:
            store.replace_after_recovery(event,{'task_id':'TASK-LATE','event':event,'status':'completed'},checkpoint=checkpoint)
        finally:
            release.set()
        assert old.result()['result']['status']=='completed'
    assert store.get_result(key)['status']=='completed'


def test_missing_event_receipt_cannot_be_published_by_a_different_task(tmp_path):
    import pytest
    from app.runtime.event_store import EventResultConflict
    event={'event_id':'CRASH','device_id':'D','event_revision':1}
    store=EventResultStore(path=str(tmp_path/'events.sqlite3'))
    with pytest.raises(EventResultConflict):
        store.replace_after_recovery(event,{'task_id':'OTHER','event':event},checkpoint={
            'status':'resuming','state':{'task_id':'ORIGINAL','event':event}})


def test_recovery_updates_cached_event_without_changing_request_fingerprint(tmp_path):
    event={'event_id':'E','device_id':'D','event_revision':1}
    key=scoped_event_key(event)
    store=EventResultStore(path=str(tmp_path/'events.sqlite3'))
    store.get_or_create(key,lambda:{'task_id':'TASK','status':'blocked'},fingerprint='fixed')
    store.replace_after_recovery(event,{'task_id':'TASK','status':'completed'})
    assert store.get_result(key)['status']=='completed'
    assert store.get_or_create(key,lambda: (_ for _ in ()).throw(AssertionError('event replayed')),fingerprint='fixed')['status']=='completed'
