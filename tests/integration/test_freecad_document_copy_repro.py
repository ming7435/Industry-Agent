"""Real native engineering-drawing copy regression, without reusing old commands."""
import os
from uuid import uuid4
import pytest
from shared.freecad_documents import canonical_digest
from tests.integration.freecad_document_stack import isolated_mysql_config,start_isolated_document_stack
from tests.integration.test_freecad_document_live import wait_command,workbench_specs
pytestmark=pytest.mark.skipif(os.getenv('RUN_FREECAD_COPY_REPRO')!='1',reason='requires managed native runtime and isolated MySQL')

def test_real_workbench_copy_reopens_complete_native_tree(tmp_path):
    with start_isolated_document_stack(tmp_path,isolated_mysql_config()) as stack:
        client=stack['client'];head=client.post('/api/cad/freecad/documents',json=dict(request_id=uuid4().hex,part_name='工程图复制回归',part_number='')).json();doc=head['document_id']
        cid='CMD-'+uuid4().hex
        response=client.post(f'/api/cad/freecad/documents/{doc}/commands',json=dict(command_id=cid,document_id=doc,expected_revision=0,command_type='replace_from_spec',parameters={'spec':workbench_specs()['drawing']}))
        assert response.status_code==202,response.text
        wait_command(client,doc,cid)
        cid='CMD-'+uuid4().hex
        assert client.post(f'/api/cad/freecad/documents/{doc}/publish',json=dict(command_id=cid,expected_revision=1)).status_code==202
        wait_command(client,doc,cid)
        run=next(r for r in client.get('/api/cad/freecad/designs').json()['items'] if r['document_id']==doc)
        request_id=uuid4().hex
        response=client.post('/api/cad/freecad/documents',json=dict(request_id=request_id,part_name='工程图副本',part_number='',source_run_id=run['run_id']))
        assert response.status_code==202,response.text
        copied_doc=response.json()['document_id']
        wait_command(client,copied_doc,'CMD-import-'+canonical_digest(request_id)[:32])
        response=client.get(f'/api/cad/freecad/documents/{copied_doc}/snapshots/1');assert response.status_code==200,response.text
        copied=response.json();assert {'drawing.svg','drawing.pdf'}.issubset({a['name'] for a in copied['artifacts']})
        assert any(o['type_id']=='TechDraw::DrawPage' for o in copied['objects'])
