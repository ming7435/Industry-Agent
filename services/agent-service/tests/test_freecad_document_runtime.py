from app.cad_documents.capabilities import runtime_inventory


def test_runtime_probe_requires_installed_geometry_evidence():
    status={'provider':'text-to-cad','connected':True,'runtime':{'version':'0.7.10','build123d':'0.11.1','kernel':'OpenCascade'}}
    good=runtime_inventory(probe=lambda:status)
    assert good['ready'] is True and good['version_fingerprint']!='unknown'
    assert runtime_inventory(probe=lambda:{**status,'provider':'freecad'})['ready'] is False
    assert runtime_inventory(probe=lambda:{**status,'connected':False})['ready'] is False
    assert runtime_inventory(probe=lambda:{**status,'runtime':{'version':'0.7.10'}})['ready'] is False
