"""The catalog represents probed cadgen operations, never old GUI command inventories."""
import json
from types import SimpleNamespace
import pytest
from app.cad_documents.catalog import build_catalog


def report():
    return {'provider':'text-to-cad','version_fingerprint':'v',
        'commands':['build123d.Box','build123d.Cylinder','build123d.fillet','build123d.chamfer']}


def test_catalog_exposes_only_adapted_geometry_actions():
    result=build_catalog({'provider':'text-to-cad','ready':True,'version_fingerprint':'v'},report())
    rows={item['id']:item for item in result['commands']}
    assert result['current'] is True and result['transport']=='local_process'
    assert rows['build123d.Box']['action']=={'type':'create_primitive','primitive_type':'box'}
    assert rows['build123d.fillet']['action']=={'type':'prepare_spec_task','task_id':'fillet'}
    assert result['workbenches'][0]['id']=='Modeling'


@pytest.mark.parametrize('runtime',[{'ready':False},{'ready':True,'provider':'text-to-cad','version_fingerprint':'other'},
                                    {'ready':True,'provider':'freecad','version_fingerprint':'v'}])
def test_stale_discovery_never_authorizes_execution(runtime):
    result=build_catalog(runtime,report())
    assert result['current'] is False
    assert all(row['action'] is None for row in result['commands'])


def test_unknown_command_never_becomes_executable():
    source=report();source['commands']+=['Std_MacroStartRecord','build123d.Box']
    value=build_catalog({'provider':'text-to-cad','ready':True,'version_fingerprint':'v'},source)
    assert len(value['commands'])==5
    assert next(c for c in value['commands'] if c['id']=='Std_MacroStartRecord')['action'] is None
    with pytest.raises(ValueError):build_catalog({}, {'commands':['x'*300]})


def test_discovery_probes_real_shapes_and_rejects_gui_workbenches(tmp_path):
    from app.cad_documents.coordinator import discovery_program
    from text_to_cad_document_test_runtime import DocumentRuntime
    for name in ('Modeling','PartWorkbench'):
        directory=tmp_path/name;directory.mkdir()
        job=SimpleNamespace(job_id='JOB-'+name,input_digest='d',source={'workbench_id':name})
        DocumentRuntime().call_tool('execute_code',{'code':discovery_program(job,directory)})
        receipt=json.loads((directory/'receipt.json').read_text(encoding='utf-8'))
        assert receipt['state']==('completed' if name=='Modeling' else 'failed')
        if name=='Modeling':
            assert receipt['result']['provider']=='text-to-cad'
            assert set(receipt['result']['commands'])=={'build123d.Box','build123d.Cylinder','build123d.Sphere','build123d.Cone','build123d.fillet','build123d.chamfer'}


def test_catalog_api_rejects_foreign_origins_and_browser_python(monkeypatch):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.api.freecad_documents import build_document_router
    from test_freecad_document_api import Application
    monkeypatch.setenv('FREECAD_DOCUMENTS_ENABLED','true')
    app=FastAPI();application=Application()
    app.include_router(build_document_router(lambda request:None,lambda request:application))
    http=TestClient(app)
    assert http.post('/api/cad/freecad/catalog/discover',json={'request_id':'r'}).status_code==401
    http.cookies.set('maintenance_session','valid')
    assert http.post('/api/cad/freecad/catalog/discover',json={'request_id':'r'},headers={'Origin':'https://evil.example'}).status_code==403
    assert http.post('/api/cad/freecad/catalog/discover',json={'request_id':'r','code':'App.newDocument()'}).status_code==422
    assert http.post('/api/cad/freecad/catalog/discover',json={'request_id':'r','workbench_id':'../../private'}).status_code==422
