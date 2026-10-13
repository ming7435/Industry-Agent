from app.workorder.repository import SQLiteRepository


def test_workorder_directory_keeps_identity_and_version_without_task_bodies(tmp_path, monkeypatch):
    repository=SQLiteRepository(str(tmp_path/'queue.db'))
    order={'workorder_id':'WO-A','device_id':'D-A','assignee':'U-A','status':'in_progress',
           'title':'现场维修任务','alarm_code':'','updated_at':'2026-10-13','_revision':4,
           'diagnosis_snapshot':{'device_id':'D-A','raw':{'alarm_code':'700006'}},
           'maintenance_plan_snapshot':{'plan_id':'P-A','plan_kind':'inspection','raw_evidence':'x'*1000000}}
    repository.create(order)
    monkeypatch.setattr(repository,'list',lambda:(_ for _ in ()).throw(AssertionError('Read full task bodies')))
    items=repository.list_queue_index()
    assert len(items)==1
    assert items[0]['workorder_id']=='WO-A' and items[0]['assignee']=='U-A'
    assert items[0]['alarm_code']=='700006' and items[0]['plan_id']=='P-A'
    assert items[0]['plan_kind']=='inspection' and items[0]['_revision']==4
    assert items[0]['_summary_record'] is True
    assert 'maintenance_plan_snapshot' not in items[0]
    assert repository.get('WO-A')==order


def test_queue_does_not_copy_an_alarm_from_a_different_device(tmp_path):
    repository=SQLiteRepository(str(tmp_path/'scope.db'))
    repository.create({'workorder_id':'WO-A','device_id':'D-A','assignee':'U-A',
                       'diagnosis_snapshot':{'device_id':'D-OTHER','raw':{'alarm_code':'PRIVATE'}}})
    assert repository.list_queue_index()[0]['alarm_code'] in ('',None)
