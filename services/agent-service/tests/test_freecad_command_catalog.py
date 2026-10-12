"""Native command retention is independent of web execution readiness."""
import importlib
from types import SimpleNamespace,ModuleType
import json
import pytest


def catalog_module():
    assert importlib.util.find_spec('app.cad_documents.catalog'), 'full native command catalog missing'
    return importlib.import_module('app.cad_documents.catalog')


def test_catalog_keeps_every_native_command_and_installed_workbench():
    catalog=catalog_module()
    commands=['Part_Box','Sketcher_NewSketch','PartDesign_Pad','FEM_SolverCalculix','MyAddon_Custom']
    report={'commands':commands,'version_fingerprint':'v','runtime_pid':123,
            'workbenches':[{'id':'PartWorkbench','label':'Part'},{'id':'SketcherWorkbench','label':'Sketcher'},
                          {'id':'FemWorkbench','label':'FEM'},{'id':'RobotWorkbench','label':'Robot'}]}
    result=catalog.build_catalog({'ready':True,'version_fingerprint':'v','pid':123},report)
    assert {c['id'] for c in result['commands']}==set(commands)
    assert {'PartWorkbench','SketcherWorkbench','FemWorkbench','RobotWorkbench'}<=set(w['id'] for w in result['workbenches'])
    pad=next(c for c in result['commands'] if c['id']=='PartDesign_Pad')
    assert pad['execution']=='not_adapted' and pad['action'] is None
    cube=next(c for c in result['commands'] if c['id']=='Part_Box')
    assert cube['action']=={'type':'create_primitive','primitive_type':'box'}
    assert result['transport']=='mcp' and result['current'] is True


@pytest.mark.parametrize('runtime',[{'ready':False},{'ready':True,'version_fingerprint':'other','pid':123},
                                    {'ready':True,'version_fingerprint':'v','pid':456}])
def test_stale_discovery_remains_visible_but_does_not_authorize_execution(runtime):
    result=catalog_module().build_catalog(runtime,{'commands':['Part_Box'],'version_fingerprint':'v','runtime_pid':123})
    assert result['current'] is False
    assert result['commands'][0]['id']=='Part_Box'
    assert result['commands'][0]['execution']=='discovery_stale'
    assert result['commands'][0]['action'] is None


def test_metadata_is_bounded_unique_and_never_promotes_a_python_macro():
    report={'commands':['Part_Box','Part_Box','Std_MacroStartRecord'],
            'command_info':{'Part_Box':{'menuText':'<b>Cube</b>','toolTip':'cube'}},
            'version_fingerprint':'v','runtime_pid':123}
    result=catalog_module().build_catalog({'ready':True,'version_fingerprint':'v','pid':123},report)
    assert len(result['commands'])==2
    assert next(c for c in result['commands'] if c['id']=='Part_Box')['label']=='<b>Cube</b>'
    assert next(c for c in result['commands'] if c['id'].startswith('Std_Macro'))['action'] is None
    with pytest.raises(ValueError):catalog_module().build_catalog({}, {'commands':['x'*300]})


def test_reused_process_id_cannot_make_an_old_discovery_current():
    report={'commands':['Part_Box'],'version_fingerprint':'v','runtime_pid':123,'discovered_at':100}
    runtime={'ready':True,'version_fingerprint':'v','pid':123,'created_at':200}
    value=catalog_module().build_catalog(runtime,report)
    assert value['current'] is False and value['commands'][0]['action'] is None


def test_fillets_and_chamfers_prepare_typed_spec_tasks_not_unrestricted_gui_execution():
    report={'commands':['Part_Fillet','Part_Chamfer','PartDesign_Pad'],'version_fingerprint':'v','runtime_pid':123}
    value=catalog_module().build_catalog({'ready':True,'version_fingerprint':'v','pid':123},report)
    rows={row['id']:row for row in value['commands']}
    assert rows['Part_Fillet']['action']=={'type':'prepare_spec_task','task_id':'fillet'}
    assert rows['Part_Chamfer']['action']=={'type':'prepare_spec_task','task_id':'chamfer'}
    assert rows['PartDesign_Pad']['action'] is None
    assert rows['Part_Fillet']['adapter_scope']=='受控规格重建：全部边圆角，确认参数后执行；不是直接运行 GUI 命令'
    stale=catalog_module().build_catalog({'ready':False},report)
    assert all(row['action'] is None for row in stale['commands'])


def test_catalog_discovery_runs_the_existing_durable_mcp_worker_not_raw_rpc(tmp_path,monkeypatch):
    catalog_module()
    from app.cad_documents.coordinator import discovery_program
    job=SimpleNamespace(job_id='JOB-a',input_digest='digest',source={'workbench_id':'PartWorkbench'})
    code=discovery_program(job,tmp_path)
    # The external GUI is unavailable in offline tests. Execute the real generated
    # program against its narrow native dependency boundary and inspect its receipt.
    app=ModuleType('FreeCAD');app.Version=lambda:['1','1','4'];gui=ModuleType('FreeCADGui')
    state={'active':'SketcherWorkbench'}
    gui.activeWorkbench=lambda:SimpleNamespace(name=lambda:state['active'])
    gui.listWorkbenches=lambda:{'PartWorkbench':SimpleNamespace(MenuText='Part'),'SketcherWorkbench':SimpleNamespace(MenuText='Sketcher')}
    def activate(name):state.update(active=name);return True
    gui.activateWorkbench=activate
    gui.listCommands=lambda:['Part_Box'] if state['active']=='PartWorkbench' else ['Sketcher_NewSketch']
    gui.Command=SimpleNamespace(get=lambda name:SimpleNamespace(getInfo=lambda:{'menuText':'Native Cube','toolTip':'Native tooltip','shortcut':'B'}))
    import sys,os
    monkeypatch.setitem(sys.modules,'FreeCAD',app);monkeypatch.setitem(sys.modules,'FreeCADGui',gui)
    exec(compile(code,'<generated-native-discovery>','exec'),{})
    result=json.loads((tmp_path/'receipt.json').read_text())
    assert result['state']=='completed'
    assert result['result']['commands']==['Part_Box']
    assert result['result']['command_info']['Part_Box']['menuText']=='Native Cube'
    assert result['result']['runtime_pid']==os.getpid()
    assert state['active']=='SketcherWorkbench', 'discovery restores the GUI context'


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


@pytest.mark.parametrize('failure',['activate','restore'])
def test_native_activation_failure_never_writes_a_completed_catalog(tmp_path,monkeypatch,failure):
    from app.cad_documents.coordinator import discovery_program
    import sys
    app=ModuleType('FreeCAD');app.Version=lambda:['1','1','4'];gui=ModuleType('FreeCADGui')
    state={'active':'SketcherWorkbench'}
    gui.activeWorkbench=lambda:SimpleNamespace(name=lambda:state['active'])
    gui.listWorkbenches=lambda:{'PartWorkbench':SimpleNamespace(MenuText='Part'),'SketcherWorkbench':SimpleNamespace(MenuText='Sketcher')}
    def activate(name):
        if (failure=='activate' and name=='PartWorkbench') or (failure=='restore' and name=='SketcherWorkbench'):return False
        state['active']=name;return True
    gui.activateWorkbench=activate;gui.listCommands=lambda:['Part_Box']
    gui.Command=SimpleNamespace(get=lambda name:SimpleNamespace(getInfo=lambda:{}))
    monkeypatch.setitem(sys.modules,'FreeCAD',app);monkeypatch.setitem(sys.modules,'FreeCADGui',gui)
    job=SimpleNamespace(job_id='JOB-read',input_digest='d',source={'workbench_id':'PartWorkbench'})
    exec(compile(discovery_program(job,tmp_path),'<native-discovery>','exec'),{})
    receipt=json.loads((tmp_path/'receipt.json').read_text())
    assert receipt['state']=='failed'
