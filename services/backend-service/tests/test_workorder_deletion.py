"""真正删除工单内容；失败回滚，旧提交与自动派工不能重新创建。"""
from copy import deepcopy
import sqlite3
import pytest
from test_online_device_dispatch import service, registered


def assigned(service):
    owner, _ = registered(service)
    order_id = service.create_workorder(device_id='M1', event_id='E1', plan_id='P1',
        idempotency_key='E1', maintenance_plan_snapshot={'plan_id': 'P1', 'repair_steps': ['核查刀塔']})['workorder_id']
    service.assign_workorder(order_id, owner['user_id'])
    service.submit_repair_feedback(order_id, '实际维修记录')
    return owner, service.repository.get(order_id)


def test_assigned_order_and_its_saved_contents_are_permanently_deleted(service):
    owner, before = assigned(service)
    result = service.delete_workorder(before['workorder_id'], actor_id=owner['user_id'])
    assert result['deleted'] is True
    assert result['deleted_plan_ids'] == ['P1']
    assert service.repository.get(before['workorder_id']) is None
    assert service.get_workorder(before['workorder_id'])['found'] is False
    assert result['mode'] == 'permanent-delete'
    assert service.list_deleted_maintenance_plan_ids()['deleted_plan_ids'] == ['P1']
    assert service.list_workorders()['items'] == []
    assert len(service.list_audit_logs(object_id=before['workorder_id'], action='workorder_deleted')['items']) == 1
    repeated = service.delete_workorder(before['workorder_id'], actor_id=owner['user_id'])
    assert repeated['deleted'] is True
    assert service.repository.get(before['workorder_id']) is None
    assert len(service.list_audit_logs(object_id=before['workorder_id'])['items']) == 1


def test_delete_cannot_be_used_to_hide_another_technicians_order(service):
    owner, before = assigned(service)
    other, _ = registered(service, 'other')
    with pytest.raises(PermissionError):
        service.delete_workorder(before['workorder_id'], actor_id=other['user_id'])
    assert service.repository.get(before['workorder_id']) == before
    assert service.list_deleted_maintenance_plan_ids()['deleted_plan_ids'] == []


def test_deleting_replaced_order_hides_all_linked_plan_versions(service):
    owner, order = assigned(service)
    order.update(plan_id='P2', maintenance_plan_snapshot={'plan_id': 'P2'},
                 plan_revisions=[{'previous_plan_id': 'P1', 'plan_id': 'P2'}])
    service.repository.update(order)
    result = service.delete_workorder(order['workorder_id'], actor_id=owner['user_id'])
    assert set(result['deleted_plan_ids']) == {'P1', 'P2'}
    assert service.list_deleted_maintenance_plan_ids()['deleted_plan_ids'] == ['P1', 'P2']


def test_plan_marker_failure_rolls_back_order_delete_and_audit(service):
    owner, before = assigned(service)
    with sqlite3.connect(str(service.repository.path)) as db:
        db.execute("CREATE TRIGGER reject_plan_delete BEFORE INSERT ON business_records "
                   "WHEN new.record_type='maintenance_plan_deleted' "
                   "BEGIN SELECT RAISE(ABORT,'isolated-delete-abort'); END")
    with pytest.raises(sqlite3.IntegrityError, match='isolated-delete-abort'):
        service.delete_workorder(before['workorder_id'], actor_id=owner['user_id'])
    assert service.repository.get(before['workorder_id']) == before
    assert service.list_deleted_maintenance_plan_ids()['deleted_plan_ids'] == []
    assert service.list_audit_logs(object_id=before['workorder_id'])['items'] == []


def test_stale_repair_response_cannot_overwrite_a_saved_deletion(service):
    owner, before = assigned(service)
    stale = deepcopy(before)
    service.delete_workorder(before['workorder_id'], actor_id=owner['user_id'])
    stale['repair_feedback'] = {'feedback': '晚到的旧提交'}
    with pytest.raises(ValueError, match='更新'):
        service.repository.update(stale)
    assert service.repository.get(before['workorder_id']) is None


def test_deleted_task_cannot_be_recreated_by_stale_dispatch_or_other_actor(service):
    owner, before = assigned(service)
    service.delete_workorder(before['workorder_id'], actor_id=owner['user_id'])
    with pytest.raises(ValueError, match='已删除'):
        service.repository.create({**before, 'workorder_id': 'WO-RETRY'})
    with pytest.raises(ValueError, match='已删除'):
        service.repository.create({**before, 'workorder_id': 'WO-RETRY', 'idempotency_key': 'different'})
    with pytest.raises(ValueError, match='已删除'):
        service.repository.create({**before, 'workorder_id': 'WO-RETRY', 'idempotency_key': 'different', 'plan_id':''})
    other, _ = registered(service, 'other')
    with pytest.raises(PermissionError):
        service.delete_workorder(before['workorder_id'], actor_id=other['user_id'])
    assert service.list_workorders()['items'] == []
