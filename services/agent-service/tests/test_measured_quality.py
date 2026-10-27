"""Behavioral checks with controlled measurements/detectors, not production samples."""
from copy import deepcopy
import json

import pytest

from test_vision_pipeline import pipeline
from test_quality_vision_api import connected
from app.vision.measured import MeasuredBatchService

PREFIX = '/api/quality/vision'


def source():
    return dict(batch_id='BATCH-QA', design_version='DRAWING-A/03', part_name='齿轮',
        standard_reference='检验规范 A-03', measurement_reference='fixture.csv',
        measured_at='2026-10-25T09:30:00+08:00', plan_complete=True,
        parameters=[dict(key='diameter', name='轴孔直径', unit='mm', lower='19.98', upper='20.02'),
                    dict(key='width', name='齿宽', unit='mm', lower='9.95', upper='10.05')],
        samples=[dict(serial_number='GEAR-001', measurements={'diameter':dict(value='20.02',unit='mm'), 'width':dict(value='10',unit='mm')}),
                 dict(serial_number='GEAR-002', measurements={'diameter':dict(value='20.03',unit='mm'), 'width':dict(value='10',unit='mm')}),
                 dict(serial_number='GEAR-003', measurements={})])


def save(client, values=None):
    result=client.post(PREFIX+'/batches', json=values or source())
    assert result.status_code==200, result.text
    return result.json()


def report(client, batch):
    response=client.get(PREFIX+'/joint/'+batch['request_id'])
    assert response.status_code==200,response.text
    return response.json()


def detect(pipeline, batch, sample=0, **behavior):
    client,_,body,_,mode=pipeline
    mode.update(behavior)
    return client.post(PREFIX+'/pipeline/detect', json={**body, 'part_id':batch['design_run_id'],
        'dimension_request_id':batch['request_id'], 'dimension_sample_id':batch['samples'][sample]['part_id']})


def test_actual_limits_missing_data_and_idempotence(pipeline):
    client,vision,*_=pipeline
    batch=save(client)
    assert batch['counts']==dict(total=3,qualified=1,unqualified=1,pending=1,determinate=2)
    assert batch['simulation'] is False and batch['synthetic'] is False
    assert batch['samples'][0]['comparison']['status']=='qualified'  # boundary inclusive, not exact nominal
    before=report(client,batch)
    assert before['counts']==dict(total=3,qualified=0,unqualified=1,pending=2,determinate=1)
    assert before['types']==[dict(key='dimension',label='尺寸超差',sample_count=1)]
    assert before['items'][1]['issues'][0]['location']=='轴孔直径'
    assert save(client)['request_id']==batch['request_id']
    assert len(client.get(PREFIX+'/batches').json()['items'])==1
    assert MeasuredBatchService(vision).get('A',batch['request_id'])==batch


def test_joint_physical_identity_and_reinspection(pipeline):
    client,*_=pipeline; batch=save(client)
    assert detect(pipeline,batch,pc='clear').status_code==200
    r=report(client,batch)
    assert r['counts']['qualified']==1 and r['qualified_rate']==50
    assert r['items'][0]['serial_number']=='GEAR-001'
    assert r['items'][0]['handling'].startswith('合格流转')
    assert detect(pipeline,batch,pc='defect',yolo='clear').status_code==200
    r=report(client,batch)
    assert r['counts']['qualified']==0 and r['counts']['total']==3
    assert r['items'][0]['status']=='unqualified'  # localization miss never clears PatchCore alarm
    assert '隔离' in r['items'][0]['handling']
    assert detect(pipeline,batch,pc='clear').status_code==200
    updated=source();updated['samples'][0]['measurements']['width']['value']='10.01'
    new=save(client,updated)
    assert new['request_id']!=batch['request_id']
    assert report(client,new)['items'][0]['visual']=='pending'  # old image cannot approve new measurement revision
    assert len(client.get(PREFIX+'/batches').json()['items'])==1
    assert client.get(PREFIX+'/batches').json()['items'][0]['request_id']==new['request_id']


def test_failed_reinspection_cannot_keep_an_old_pass(pipeline):
    client,*_=pipeline;batch=save(client)
    assert detect(pipeline,batch,pc='clear').status_code==200
    assert report(client,batch)['items'][0]['status']=='qualified'
    assert detect(pipeline,batch,pc='failed').status_code>=400
    row=report(client,batch)['items'][0]
    assert row['status']=='pending' and row['evidence_error']


@pytest.mark.parametrize('change', ['unit','no_bounds','missing','incomplete_plan'])
def test_incomplete_evidence_cannot_pass(pipeline,change):
    client,*_=pipeline;values=source();values['samples']=values['samples'][:1]
    if change=='unit': values['samples'][0]['measurements']['width']['unit']='cm'
    if change=='no_bounds': values['parameters'][0].update(lower=None,upper=None)
    if change=='missing': del values['samples'][0]['measurements']['width']
    if change=='incomplete_plan': values['plan_complete']=False
    batch=save(client,values)
    assert detect(pipeline,batch,pc='clear').status_code==200
    r=report(client,batch)
    assert r['items'][0]['status']=='pending' and r['qualified_rate'] is None
    assert r['items'][0]['dimensions_incomplete'] is True


@pytest.mark.parametrize('change', ['nan','bool','inverted','duplicate_part','duplicate_parameter','unknown_key','synthetic','sim_id','future','no_timezone'])
def test_invalid_imports_rejected_without_saved_batch(pipeline,change):
    client,*_=pipeline;v=source()
    if change=='nan':v['samples'][0]['measurements']['width']['value']='NaN'
    if change=='bool':v['samples'][0]['measurements']['width']['value']=True
    if change=='inverted':v['parameters'][0]['lower']='21'
    if change=='duplicate_part':v['samples'].append(deepcopy(v['samples'][0]))
    if change=='duplicate_parameter':v['parameters'].append(deepcopy(v['parameters'][0]))
    if change=='unknown_key':v['samples'][0]['measurements']['unlisted']={'value':'1','unit':'mm'}
    if change=='synthetic':v['synthetic']=True
    if change=='sim_id':v['batch_id']='SIM-BATCH-old'
    if change=='future':v['measured_at']='2099-01-01T00:00:00Z'
    if change=='no_timezone':v['measured_at']='2026-10-25T00:00:00'
    assert client.post(PREFIX+'/batches',json=v).status_code==422
    assert client.get(PREFIX+'/batches').json()['items']==[]


def test_owner_identity_and_corrupt_record_fail_closed(pipeline):
    client,vision,body,*_=pipeline;batch=save(client)
    endpoint=PREFIX+'/batches/'+batch['request_id']
    client.cookies.set('maintenance_session','B')
    assert client.get(endpoint).status_code==404
    assert client.get(PREFIX+'/batches').json()['items']==[]
    assert detect(pipeline,batch).status_code==404
    client.cookies.set('maintenance_session','A')
    for patch,status in [({'part_id':'another-drawing'},409),({'dimension_sample_id':'MP-'+'f'*32},409),({'image_source':'public_gear_reference'},422)]:
        values={**body,'part_id':batch['design_run_id'],'dimension_request_id':batch['request_id'],'dimension_sample_id':batch['samples'][0]['part_id'],**patch}
        assert client.post(PREFIX+'/pipeline/detect',json=values).status_code==status
    path=vision._owner_root('A')/'measured-batches'/(batch['request_id']+'.json')
    stored=json.loads(path.read_text(encoding='utf-8'));stored['input']['samples'][0]['measurements']['diameter']['value']='19'
    path.write_text(json.dumps(stored))
    assert client.get(endpoint).status_code==409
    assert client.get(PREFIX+'/joint/'+batch['request_id']).status_code==409
    client.cookies.clear()
    assert client.get(PREFIX+'/batches').status_code==401
    assert client.post(PREFIX+'/batches',json=source()).status_code==401
