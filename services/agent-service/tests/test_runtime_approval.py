from app.runtime.approval import ApprovalManager, PendingTaskStore


def _pending(store):
    return store.create(
        action={
            "action_id": "ACT-PENDING-1",
            "action_type": "AGENT",
            "target": "workorder",
            "payload": {"required_capability": "workorder_create"},
            "side_effect": True,
            "idempotency_key": "monitor:EVT-PENDING-1",
        },
        state={"task_id": "TASK-PENDING-1", "trace_id": "TRACE-PENDING-1"},
        plan={"goal": "repair", "actions": []},
        next_index=2,
        policy={"status": "require_approval", "reason": "approval_required"},
    )


def test_pending_task_survives_a_new_store_instance(tmp_path):
    path = tmp_path / "pending.sqlite3"
    first = PendingTaskStore(str(path))
    record = _pending(first)

    restored = PendingTaskStore(str(path)).get(record["pending_id"])

    assert restored["status"] == "pending_approval"
    assert restored["action"]["idempotency_key"] == "monitor:EVT-PENDING-1"
    assert restored["state"]["task_id"] == "TASK-PENDING-1"
    assert restored["next_index"] == 2


def test_approve_resumes_once_and_finalizes_completed_result(tmp_path):
    store = PendingTaskStore(str(tmp_path / "pending.sqlite3"))
    calls = []
    manager = ApprovalManager(
        store,
        resume_callback=lambda record: calls.append(record["pending_id"]) or {
            "status": "waiting_repair",
            "runtime_result": {"status": "completed", "stop_reason": "evidence_ready"},
        },
    )
    pending = _pending(store)

    approved = manager.approve(pending["pending_id"], approved_by="operator-1", note="confirmed")
    replay = manager.approve(pending["pending_id"], approved_by="operator-2")

    assert approved["status"] == "completed"
    assert approved["approved_by"] == "operator-1"
    assert approved["result"]["runtime_result"]["status"] == "completed"
    assert replay["status"] == "completed"
    assert calls == [pending["pending_id"]]


def test_reject_finalizes_blocked_without_resume_callback(tmp_path):
    store = PendingTaskStore(str(tmp_path / "pending.sqlite3"))
    calls = []
    manager = ApprovalManager(store, resume_callback=lambda _record: calls.append(True))
    pending = _pending(store)

    rejected = manager.reject(pending["pending_id"], rejected_by="operator-1", reason="unsafe access")
    replay = manager.reject(pending["pending_id"], rejected_by="operator-2", reason="duplicate")

    assert rejected["status"] == "rejected"
    assert rejected["final_status"] == "blocked"
    assert rejected["result"]["runtime_result"]["stop_reason"] == "approval_rejected"
    assert replay["status"] == "rejected"
    assert calls == []
