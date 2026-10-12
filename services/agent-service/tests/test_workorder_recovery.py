from types import SimpleNamespace
import pytest
from app.runtime.action import ActionModel
from app.runtime.workorder_recovery import resolver_factory


def test_verified_existing_order_is_reused_without_creating_an_order():
    calls=[]
    plan={'plan_id':'PLAN-1','repair_steps':['check pressure']}
    order={'workorder_id':'WO-1','idempotency_key':'fixed-key','device_id':'D','event_id':'E',
           'plan_id':'PLAN-1','maintenance_plan_snapshot':plan,'assignee':'owner','status':'open'}
    def query(tool,args,**kwargs):
        calls.append(tool)
        assert tool=='list_workorders'
        return {'items':[order]}
    action=ActionModel.agent('workorder',{'required_capability':'workorder_create'},side_effect=True,idempotency_key='fixed-key')
    result=resolver_factory(SimpleNamespace(execute=query))(action,{'event':{'device_id':'D','event_id':'E'},'maintenance_plan':plan})()
    assert result['workorder_id']=='WO-1'
    assert calls==['list_workorders']


@pytest.mark.parametrize('change',[{'idempotency_key':'other-key'},{'device_id':'OTHER'},
    {'maintenance_plan_snapshot':{'plan_id':'PLAN-1','repair_steps':['other repair']}},{'assignee':''}])
def test_wrong_identity_or_unfinished_dispatch_is_not_a_success_receipt(change):
    plan={'plan_id':'PLAN-1','repair_steps':['check pressure']}
    order={'workorder_id':'WO-1','idempotency_key':'fixed-key','device_id':'D','event_id':'E',
           'plan_id':'PLAN-1','maintenance_plan_snapshot':plan,'assignee':'owner','status':'open',**change}
    tools=SimpleNamespace(execute=lambda *args,**kwargs:{'items':[order]})
    action=ActionModel.agent('workorder',{'required_capability':'workorder_create'},side_effect=True,idempotency_key='fixed-key')
    assert resolver_factory(tools)(action,{'event':{'device_id':'D','event_id':'E'},'maintenance_plan':plan})() is None
