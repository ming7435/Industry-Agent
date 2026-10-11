"""Real FreeCAD GUI, MySQL and authenticated monitor proxy; opt-in, never a mock fallback."""
import math
import os
from pathlib import Path
import time
from uuid import uuid4

import pytest

from tests.integration.freecad_document_stack import isolated_mysql_config,start_isolated_document_stack

pytestmark=pytest.mark.skipif(os.getenv('RUN_FREECAD_DOCUMENT_LIVE')!='1',reason='requires the existing managed FreeCAD runtime and isolated MySQL')


def wait_command(client,doc,cid):
    deadline=time.monotonic()+100
    while time.monotonic()<deadline:
        response=client.get(f'/api/cad/freecad/documents/{doc}/commands/{cid}')
        assert response.status_code==200,response.text
        record=response.json()
        if record['state'] in ('completed','failed','outcome_unknown'):
            assert record['state']=='completed',record
            return record
        time.sleep(.2)
    pytest.fail('original native command did not finish; no replay attempted')


def test_real_native_documents_http_and_quality(tmp_path):
    with start_isolated_document_stack(tmp_path,isolated_mysql_config()) as stack:
        client=stack['client'];proofs=[];last=None
        for kind,dimensions,volume in [
            ('box',dict(length=40.,width=20.,height=10.),8000.),
            ('cylinder',dict(diameter=20.,length=30.),math.pi*100*30),
            ('sphere',dict(diameter=20.),4/3*math.pi*1000),
            ('cone',dict(bottom_diameter=30.,top_diameter=0.,height=40.),math.pi*225*40/3),
        ]:
            response=client.post('/api/cad/freecad/documents',json={'request_id':uuid4().hex,'part_name':'原生验证-'+kind,'part_number':''})
            assert response.status_code==202,response.text
            head=response.json();doc=head['document_id'];revision=0
            def submit(command_type,parameters):
                nonlocal revision
                cid='CMD-'+uuid4().hex
                body=dict(command_id=cid,document_id=doc,expected_revision=revision,command_type=command_type,parameters=parameters)
                response=client.post(f'/api/cad/freecad/documents/{doc}/commands',json=body)
                assert response.status_code==202,response.text
                first=response.json();record=wait_command(client,doc,cid)
                if kind=='box':
                    repeat=client.post(f'/api/cad/freecad/documents/{doc}/commands',json=body)
                    assert repeat.status_code==202 and repeat.json()['job_id']==first['job_id']
                revision+=1
                return client.get(f'/api/cad/freecad/documents/{doc}/snapshots/{revision}').json()
            snapshot=submit('create_primitive',dict(primitive_type=kind,**dimensions))
            assert snapshot['validation']['step_roundtrip'] is True
            assert math.isclose(snapshot['validation']['volume_mm3'],volume,rel_tol=1e-6)
            oid=snapshot['objects'][0]['object_id']
            field=next(iter(dimensions));new=dimensions[field]+5
            snapshot=submit('set_primitive_dimensions',{'object_id':oid,'dimensions':{field:new}})
            assert next(p['value'] for p in snapshot['objects'][0]['properties'] if p['name']==field)==new
            snapshot=submit('set_label',{'object_id':oid,'label':'原生零件-'+kind})
            snapshot=submit('set_placement',{'object_id':oid,'position':[50.,10.,0.],'rotation':{'axis':[0.,0.,1.],'angle':30.}})
            snapshot=submit('set_visibility',{'object_id':oid,'visible':False})
            assert snapshot['objects'][0]['object_id']==oid and not snapshot['objects'][0]['visible']
            assert snapshot['validation']['solid_count']==1 # Hidden products still publish.
            cid='CMD-'+uuid4().hex
            response=client.post(f'/api/cad/freecad/documents/{doc}/publish',json={'command_id':cid,'expected_revision':revision})
            assert response.status_code==202,response.text
            record=wait_command(client,doc,cid)
            designs=client.get('/api/cad/freecad/designs').json()['items']
            published=next(d for d in designs if d['document_id']==doc)
            run=client.get('/api/cad/freecad/runs/'+published['run_id'])
            assert run.status_code==200,run.text
            value=run.json();assert value['validation']['step_roundtrip'] is True
            basis=client.get('/api/quality/simulation/designs/'+published['run_id']).json()['basis']
            assert basis['document_id']==doc and basis['revision']==revision
            assert basis['standard_parameters']['digest']==value['standard_parameters']['digest']
            assert any(p['expected']==new for p in basis['parameters'])
            for entry in value['artifacts']:
                if entry['name'] not in ('model.FCStd','model.step','model.stl'):continue
                download=client.get(f'/api/cad/freecad/documents/{doc}/snapshots/{revision}/artifacts/'+entry['name'])
                assert download.status_code==200 and len(download.content)>0
                proofs.append(dict(name=entry['name'],sha256=entry['sha256'],verified=True))
            assert client.get(f'/api/cad/freecad/documents/{doc}/snapshots/1').json()['validation']['volume_mm3']==pytest.approx(volume)
            bad=client.post(f'/api/cad/freecad/documents/{doc}/commands',json=dict(command_id='CMD-'+uuid4().hex,document_id=doc,expected_revision=0,command_type='set_label',parameters={'object_id':oid,'label':'stale'}))
            assert bad.status_code==409
            foreign=client.post(f'/api/cad/freecad/documents/{doc}/publish',headers={'Origin':'http://evil.invalid'},json={'command_id':'CMD-'+uuid4().hex,'expected_revision':revision})
            assert foreign.status_code==403
            last=(doc,oid,published)
        # Native reopen/copy gives new IDs without changing the published source.
        doc,oid,published=last
        copied=client.post('/api/cad/freecad/documents',json={'request_id':uuid4().hex,'part_name':'复制原生验证','part_number':'','source_run_id':published['run_id']})
        assert copied.status_code==202,copied.text
        copy=copied.json();deadline=time.monotonic()+100
        while time.monotonic()<deadline:
            copy=client.get('/api/cad/freecad/documents/'+copy['document_id']).json()
            if copy['revision']==1:break
            time.sleep(.2)
        assert copy['revision']==1
        copied_snapshot=client.get(f"/api/cad/freecad/documents/{copy['document_id']}/snapshots/1").json()
        assert copied_snapshot['objects'][0]['object_id']!=oid
        assert client.get('/api/cad/freecad/runs/'+published['run_id']).json()['revision']==5
        # Existing workbenches must still use their real builder/evidence through the one worker.
        import httpx
        specs=workbench_specs()
        with httpx.Client(base_url=stack['backend_url'],headers={'Authorization':'Bearer '+stack['env']['BACKEND_INTERNAL_TOKEN']},trust_env=False,timeout=15) as internal:
            def system(kind,payload):
                value=internal.post('/internal/cad/documents/enqueue_system_job',json=dict(kind=kind,request_key=uuid4().hex,payload=payload))
                assert value.status_code==200,value.text
                job=value.json()['result'];deadline=time.monotonic()+150
                while time.monotonic()<deadline:
                    record=internal.post('/internal/cad/documents/job',json={'job_id':job['job_id']}).json()['result']
                    if record['state'] in ('failed','completed','outcome_unknown'):
                        assert record['state']=='completed',record
                        return record
                    time.sleep(.3)
                pytest.fail('original system command not terminal; not replayed')
            system('discover',{})
            for name,spec in specs.items():
                legacy_id='FC-'+uuid4().hex+uuid4().hex
                result=system('legacy_generate',{'run_id':legacy_id,'spec':spec})['result']
                assert result['validation']['step_roundtrip'] is True
                assert result['validation'][name]['verified'] is True
                assert all((tmp_path/'legacy'/legacy_id/a['name']).stat().st_size>0 for a in result['artifacts'])
            # Verify complex native tree, auxiliary export preservation and immutable publication.
            response=client.post('/api/cad/freecad/documents',json={'request_id':uuid4().hex,'part_name':'原生工程图','part_number':''})
            advanced=response.json()['document_id'];cid='CMD-'+uuid4().hex
            response=client.post(f'/api/cad/freecad/documents/{advanced}/commands',json=dict(command_id=cid,document_id=advanced,expected_revision=0,command_type='replace_from_spec',parameters={'spec':specs['drawing']}))
            assert response.status_code==202,response.text
            wait_command(client,advanced,cid)
            advanced_snapshot=client.get(f'/api/cad/freecad/documents/{advanced}/snapshots/1').json()
            assert any(o['type_id']=='TechDraw::DrawPage' for o in advanced_snapshot['objects'])
            assert {'drawing.svg','drawing.pdf'}.issubset({a['name'] for a in advanced_snapshot['artifacts']})
            cid='CMD-'+uuid4().hex
            assert client.post(f'/api/cad/freecad/documents/{advanced}/publish',json={'command_id':cid,'expected_revision':1}).status_code==202
            wait_command(client,advanced,cid)
            current=client.get('/api/cad/freecad/designs').json()['items']
            advanced_run=next(d for d in current if d['document_id']==advanced)
            response=client.post('/api/cad/freecad/documents',json={'request_id':uuid4().hex,'part_name':'复制工程图','part_number':'','source_run_id':advanced_run['run_id']})
            assert response.status_code==202,response.text
            advanced_copy=response.json()['document_id'];deadline=time.monotonic()+100
            while time.monotonic()<deadline:
                if client.get(f'/api/cad/freecad/documents/{advanced_copy}').json()['revision']==1:break
                time.sleep(.3)
            copied_advanced=client.get(f'/api/cad/freecad/documents/{advanced_copy}/snapshots/1').json()
            assert {'drawing.svg','drawing.pdf'}.issubset({a['name'] for a in copied_advanced['artifacts']})
            # Assembly finalization may establish visibility on creation, never undo a later edit.
            response=client.post('/api/cad/freecad/documents',json={'request_id':uuid4().hex,'part_name':'原生装配可见性','part_number':''})
            assembly_doc=response.json()['document_id'];cid='CMD-'+uuid4().hex
            response=client.post(f'/api/cad/freecad/documents/{assembly_doc}/commands',json=dict(command_id=cid,document_id=assembly_doc,expected_revision=0,command_type='replace_from_spec',parameters={'spec':specs['assembly']}))
            assert response.status_code==202,response.text
            wait_command(client,assembly_doc,cid)
            assembly_snapshot=client.get(f'/api/cad/freecad/documents/{assembly_doc}/snapshots/1').json()
            assembly_root=assembly_snapshot['product_root_ids'][0]
            initial=next(o['visible'] for o in assembly_snapshot['objects'] if o['object_id']==assembly_root)
            cid='CMD-'+uuid4().hex
            assert client.post(f'/api/cad/freecad/documents/{assembly_doc}/commands',json=dict(command_id=cid,document_id=assembly_doc,expected_revision=1,command_type='set_visibility',parameters={'object_id':assembly_root,'visible':not initial})).status_code==202
            wait_command(client,assembly_doc,cid)
            edited=client.get(f'/api/cad/freecad/documents/{assembly_doc}/snapshots/2').json()
            assert next(o['visible'] for o in edited['objects'] if o['object_id']==assembly_root) is not initial
            cid='CMD-'+uuid4().hex
            assert client.post(f'/api/cad/freecad/documents/{assembly_doc}/publish',json={'command_id':cid,'expected_revision':2}).status_code==202
            wait_command(client,assembly_doc,cid)
        stack['live_proofs']=proofs
        # A real built-app browser probe runs while these authenticated services are alive.
        from tests.integration.freecad_document_browser import browser_probe
        browser=browser_probe(stack,copy['document_id'])
        from app.cad_documents.capabilities import local_inventory
        from scripts.freecad_documents_smoke import verify
        inventory=local_inventory()
        report=dict(version_fingerprint=inventory['version_fingerprint'],adapter_digest=inventory['adapter_digest'],
                    command_coverage=['create_primitive','set_primitive_dimensions','set_placement','set_label','set_visibility','replace_from_spec','publish'],
                    native_checks={'passed':True,'primitive_types':4,'copy_reopened':True,'existing_workbenches':list(specs)},api_checks={'passed':True,'mysql':True,'origin_rejected':True,'idempotent':True},
                    browser_checks=browser,artifacts=proofs)
        report['verified_at']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
        verify(Path('.runtime/verification'),lambda _:report,None)


def workbench_specs():
    box=dict(units='mm',operations=[dict(type='box',mode='add',length=60,width=40,height=20,position=[0,0,0])])
    return {
        'drawing':{**box,'drawing':dict(projection='third_angle',scale=1,section=dict(origin=[30,20,10],normal=[0,1,0]))},
        'sheet_metal':dict(units='mm',sheet_metal=dict(width=80,base_length=60,flange_length=30,thickness=2,bend_radius=3,bend_angle=90,k_factor=.4)),
        'bim':dict(units='mm',bim=dict(walls=[dict(name='Wall',start=[0,0,0],end=[6000,0,0],height=3000,thickness=200)],slabs=[dict(name='Slab',length=6000,width=4000,thickness=200,position=[0,-2000,0])],openings=[dict(name='DoorOpening',wall='Wall',offset=1000,sill=0,width=900,height=2100)])),
        'assembly':dict(units='mm',parts=[dict(name='Base',operations=[dict(type='cylinder',mode='add',diameter=20,length=20,axis='z',position=[0,0,0])]),dict(name='Arm',operations=[dict(type='box',mode='add',length=50,width=8,height=4,position=[0,-4,0])])],assembly=dict(grounded='Base',joints=[dict(name='Hinge',type='revolute',part1='Base',part2='Arm',connector1=dict(position=[0,0,20],axis=[0,0,1]),connector2=dict(position=[0,0,0],axis=[0,0,1]))],motion=dict(joint='Hinge',start=0,end=90,duration=2,frames=5))),
    }
