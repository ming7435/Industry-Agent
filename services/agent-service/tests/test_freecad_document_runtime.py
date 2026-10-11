from app.cad_documents.capabilities import runtime_inventory
import pytest

def test_runtime_identity_mismatch_never_marks_native_ready(tmp_path):
    import json
    ready={'pid':42,'host':'127.0.0.1','port':9875,'freecad_version':['1','1','4']}
    state={'pid':42,'executable':str(tmp_path/'FreeCAD.exe'),'start_time_utc':'2026-10-11T00:00:00Z'}
    (tmp_path/'rpc-ready.json').write_text(json.dumps(ready));(tmp_path/'runtime-state.json').write_text(json.dumps(state))
    probe=lambda pid:{'executable':state['executable'],'created_at':1791676800.,'ports':[9875]}
    assert runtime_inventory(tmp_path,probe)['ready'] is True
    assert runtime_inventory(tmp_path,lambda pid:{**probe(pid),'ports':[9999]})['ready'] is False
    state['pid']=43;(tmp_path/'runtime-state.json').write_text(json.dumps(state))
    assert runtime_inventory(tmp_path,probe)['ready'] is False
