import importlib


def test_discovery_not_equal_readiness():
    assert importlib.util.find_spec('app.cad_documents.capabilities'), 'capability directory missing'
    from app.cad_documents.capabilities import read_capabilities
    value=read_capabilities({'version_fingerprint':'1.1.4','modules':['Part','Sketcher'],'commands':['Part_Box']},{})
    box=next(c for c in value['items'] if c['capability_id']=='create_primitive')
    assert box['installed'] is True and box['manual_verified'] is False and box['ai_verified'] is False
    sketch=next(c for c in value['items'] if c['module']=='Sketcher')
    assert sketch['web_adapter'] is False


def test_directory_is_not_execution_and_wrong_evidence_is_ignored():
    assert importlib.util.find_spec('app.cad_documents.capabilities'), 'capability directory missing'
    from app.cad_documents.capabilities import read_capabilities
    value=read_capabilities({'version_fingerprint':'1.1.4','modules':['Part'],'commands':[]},
                            {'version_fingerprint':'old','native_checks':{'passed':True},'command_coverage':['create_primitive']})
    assert not any(c['manual_verified'] or c['ai_verified'] for c in value['items'])


def test_unrelated_gui_command_is_not_adapter_discovery():
    from app.cad_documents.capabilities import read_capabilities
    value=read_capabilities({'version_fingerprint':'v','modules':['Part'],'commands':['Help_About']},{})
    primitive=next(c for c in value['items'] if c['capability_id']=='create_primitive')
    assert primitive['discovered'] is False
    assert 'Part_Box' in primitive['native_commands']
    assert primitive['parameter_schema_version']=='freecad_document_commands_v1'
