from app.cad_documents.capabilities import read_capabilities


def test_discovery_does_not_claim_manual_or_ai_verification():
    value=read_capabilities({'provider':'text-to-cad','ready':True,'version_fingerprint':'v','modules':['cadgen','build123d','OCP'],
        'commands':['build123d.Box','build123d.Cylinder','build123d.Sphere','build123d.Cone']},{})
    box=next(c for c in value['items'] if c['capability_id']=='create_primitive')
    assert box['installed'] is True and box['dependency_ready'] is True
    assert box['manual_verified'] is False and box['ai_verified'] is False
    assert not any(c['module']=='Sketcher' for c in value['items'])


def test_wrong_engine_evidence_cannot_verify_new_runtime():
    value=read_capabilities({'provider':'text-to-cad','ready':True,'version_fingerprint':'v','adapter_digest':'a','modules':['build123d'],'commands':[]},
        {'provider':'freecad','version_fingerprint':'v','adapter_digest':'a','native_checks':{'passed':True},
         'api_checks':{'passed':True},'browser_checks':{'passed':True},'command_coverage':['publish']})
    assert not any(c['manual_verified'] or c['ai_verified'] for c in value['items'])


def test_incomplete_primitive_probe_cannot_enable_creation():
    value=read_capabilities({'provider':'text-to-cad','ready':True,'version_fingerprint':'v','modules':['build123d'],'commands':['build123d.Box']},{})
    primitive=next(c for c in value['items'] if c['capability_id']=='create_primitive')
    assert primitive['discovered'] is False and primitive['dependency_ready'] is False
