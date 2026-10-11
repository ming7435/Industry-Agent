"""Focused real built-app regression, never intercepts document HTTP requests."""
import os
from uuid import uuid4
import pytest
from tests.integration.freecad_document_stack import isolated_mysql_config,start_isolated_document_stack
from tests.integration.test_freecad_document_live import wait_command
from tests.integration.freecad_document_browser import browser_probe

pytestmark=pytest.mark.skipif(os.getenv('RUN_FREECAD_BROWSER_LIVE')!='1',reason='requires managed native runtime, MySQL and installed Chrome')


def test_real_built_app_reads_back_native_commands(tmp_path):
    with start_isolated_document_stack(tmp_path,isolated_mysql_config()) as stack:
        client=stack['client']
        head=client.post('/api/cad/freecad/documents',json=dict(request_id=uuid4().hex,part_name='浏览器原生回归',part_number='')).json()
        doc=head['document_id'];cid='CMD-'+uuid4().hex
        response=client.post(f'/api/cad/freecad/documents/{doc}/commands',json=dict(command_id=cid,document_id=doc,expected_revision=0,command_type='create_primitive',parameters=dict(primitive_type='cone',bottom_diameter=35,top_diameter=0,height=40)))
        assert response.status_code==202,response.text
        wait_command(client,doc,cid)
        assert browser_probe(stack,doc)['passed'] is True
