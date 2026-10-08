"""真实 HTTP 与方案存储，外部 Backend 仅替换传输边界。"""
from copy import deepcopy
from types import SimpleNamespace
import pytest
from fastapi.testclient import TestClient
from app.api.server import create_app
from app.clients.backend import BackendServiceError
from app.runtime.durable_store import DurableJsonStore


@pytest.fixture
def deletion(tmp_path, monkeypatch):
    monkeypatch.setenv('EVENT_STORE_PATH', str(tmp_path/'events.db'))
    monkeypatch.setenv('BACKEND_SERVICE_BASE_URL', 'http://isolated-backend.invalid')
    store = DurableJsonStore(str(tmp_path/'events.db'))
    store.set('agent_event','E1',{'event':{'event_id':'E1','device_id':'M1'},'maintenance_plan':{'plan_id':'P1','device_id':'M1'},
        'workorder':{'workorder_id':'W1','assignee':'U1','device_id':'M1','plan_id':'P1'}})
    order={'workorder_id':'W1','assignee':'U1','device_id':'M1','event_id':'E1','plan_id':'P1','status':'in_progress'}
    deleted, calls, fault = [], [], {}
    class Backend:
        def resolve_session(self, token):
            return {'user_id':token,'role':'technician'} if token in {'U1','U2'} else None
        def call(self, tool, arguments):
            calls.append((tool,deepcopy(arguments)))
            if tool=='get_workorder': return {'workorder':deepcopy(order) if not deleted else {}}
            if tool=='list_workorders': return {'success':True,'items':[deepcopy(order)] if not deleted else []}
            if tool=='delete_workorder':
                if arguments['actor_id'] != 'U1': raise BackendServiceError('isolated forbidden',status_code=403)
                if fault.get('delete'): raise BackendServiceError('isolated conflict',status_code=409)
                assert arguments['actor_id']=='U1'
                deleted[:]=['P1']
                return {'success':True,'deleted':True,'workorder_id':'W1','deleted_plan_ids':['P1'],'mode':'permanent-delete'}
            if tool=='list_deleted_maintenance_plan_ids':
                if fault.get('read'): raise BackendServiceError('isolated unreadable')
                return {'deleted_plan_ids':list(deleted)}
            raise AssertionError('Unexpected operation: '+tool)
    backend=Backend()
    monkeypatch.setattr('app.api.server.BackendServiceClient',lambda:backend)
    monkeypatch.setattr('app.api.team_auth.BackendServiceClient',lambda:backend)
    monkeypatch.setattr('app.api.maintenance_plans.BackendServiceClient',lambda:backend,raising=False)
    with TestClient(create_app(SimpleNamespace(container=SimpleNamespace()))) as client:
        client.cookies.set('maintenance_session','U1')
        yield SimpleNamespace(client=client,order=order,deleted=deleted,calls=calls,fault=fault,store=store)


def test_delete_removes_saved_order_and_related_plan_contents(deletion):
    r=deletion
    assert r.client.get('/api/maintenance/plans').json()['count']==1
    response=r.client.delete('/api/workorders/W1')
    assert response.status_code==200,response.text
    assert response.json()['deleted_plan_ids']==['P1']
    assert r.order['status']=='in_progress'
    assert r.client.get('/api/workorders').json()['items']==[]
    assert r.client.get('/api/workorders?include_deleted=true').json()['items']==[]
    assert 'maintenance_plan' not in r.store.get('agent_event','E1')
    assert 'workorder' not in r.store.get('agent_event','E1')
    assert r.store.get('agent_event','E1')['event']['event_id']=='E1'
    assert r.client.delete('/api/workorders/W1').status_code==200
    plans=r.client.get('/api/maintenance/plans').json()
    assert plans['items']==[] and plans['deleted_plan_ids']==['P1']


def test_other_account_cannot_delete_and_conflict_has_a_useful_status(deletion):
    r=deletion
    r.client.cookies.set('maintenance_session','U2')
    assert r.client.delete('/api/workorders/W1').status_code==403
    assert r.deleted==[]
    r.client.cookies.set('maintenance_session','U1');r.fault['delete']=True
    assert r.client.delete('/api/workorders/W1').status_code==409
    assert r.client.get('/api/maintenance/plans').json()['count']==1


def test_backend_plan_tombstone_remains_authoritative_if_event_projection_lags(deletion):
    r=deletion;r.deleted[:]=['P1']
    assert r.client.get('/api/maintenance/plans').json()['items']==[]
    r.fault['read']=True
    assert r.client.get('/api/maintenance/plans').status_code==503
