from hashlib import sha256
import json
from pathlib import Path
import os
from datetime import datetime
from shared.freecad_documents import canonical_digest

from . import documents_enabled

ADAPTED={'create_primitive','set_primitive_dimensions','set_placement','set_label','set_visibility','replace_from_spec','publish'}
NATIVE_COMMANDS={'create_primitive':['Part_Box','Part_Cylinder','Part_Sphere','Part_Cone']}
NATIVE_API={'create_primitive':['Document.addObject'],'set_primitive_dimensions':['DocumentObject.setProperty'],
            'set_placement':['DocumentObject.Placement'],'set_label':['DocumentObject.Label'],
            'set_visibility':['DocumentObject.ViewObject.Visibility'],'replace_from_spec':['Document.addObject','Part.Shape'],
            'publish':['Document.saveAs','Part.export','Part.read','Mesh.export']}


def adapter_digest():
    root=Path(__file__).resolve().parent
    sources=[root/'native_program.py',root/'coordinator.py',root/'service.py',root/'publishing.py',root/'artifacts.py',
             root.parent/'tools/cad/freecad_spec_kernel.py',root.parent/'tools/cad/freecad_mcp.py']
    return sha256(b''.join(p.read_bytes() for p in sources)).hexdigest()


def _process_inventory(pid):
    import psutil
    process=psutil.Process(pid)
    return {'executable':process.exe(),'created_at':process.create_time(),
            'ports':[c.laddr.port for c in process.connections(kind='tcp') if c.status==psutil.CONN_LISTEN]}


def runtime_inventory(runtime,probe=_process_inventory):
    try:
        ready=json.loads((runtime/'rpc-ready.json').read_text(encoding='utf-8'))
        state=json.loads((runtime/'runtime-state.json').read_text(encoding='utf-8-sig'))
        if type(ready.get('pid')) is not int or ready['pid']!=state.get('pid') or ready.get('host')!='127.0.0.1' or ready.get('port')!=9875:raise ValueError()
        process=probe(ready['pid']);created=datetime.fromisoformat(state['start_time_utc'].replace('Z','+00:00')).timestamp()
        if (Path(process['executable']).resolve()!=Path(state['executable']).resolve() or 9875 not in process['ports']
                or abs(created-process['created_at'])>1 or not ready.get('freecad_version')):raise ValueError()
        return {'ready':True,'version_fingerprint':canonical_digest(ready['freecad_version']),'freecad_version':ready['freecad_version'],'pid':ready['pid']}
    except Exception:return {'ready':False,'version_fingerprint':'unknown'}


def local_inventory():
    root=Path(__file__).resolve().parents[4]
    runtime=root/'.runtime/freecad'
    modules=[p.name for p in (runtime/'Mod').iterdir() if p.is_dir()] if (runtime/'Mod').exists() else []
    inventory=runtime_inventory(runtime)
    commands=[]
    discovered=Path(os.getenv('FREECAD_DISCOVERY_REPORT',str(root/'.runtime/verification/freecad-discovery.json')))
    if discovered.is_file():
        try:
            record=json.loads(discovered.read_text(encoding='utf-8'))
            if inventory['ready'] and record.get('version_fingerprint')==inventory['version_fingerprint']:commands=record.get('commands',[])
        except (ValueError,OSError):pass
    return {**inventory,'modules':modules,'commands':commands,'adapter_digest':adapter_digest()}


def read_capabilities(inventory,evidence):
    fingerprint=inventory.get('version_fingerprint','unknown')
    valid=(evidence.get('version_fingerprint')==fingerprint and fingerprint!='unknown'
           and evidence.get('adapter_digest')==inventory.get('adapter_digest')
           and evidence.get('native_checks',{}).get('passed') is True
           and evidence.get('api_checks',{}).get('passed') is True
           and evidence.get('browser_checks',{}).get('passed') is True)
    installed=set(inventory.get('modules',[]));items=[]
    for capability in sorted(ADAPTED):
        verified=bool(valid and capability in evidence.get('command_coverage',[]))
        commands=NATIVE_COMMANDS.get(capability,[])
        discovered=all(c in inventory.get('commands',[]) for c in commands) if commands else verified
        items.append(dict(capability_id=capability,module='Part',installed='Part' in installed,
                          native_commands=commands,native_api=NATIVE_API[capability],parameter_schema_version='freecad_document_commands_v1',
                          discovery_kind='registered_commands' if commands else 'verified_native_api',version_fingerprint=fingerprint,
                          discovered=discovered,dependency_ready=verified,web_adapter=True,
                          manual_verified=verified,ai_verified=False,disabled_reason='' if verified else '网页适配已接入，等待匹配版本的原生和页面验证',
                          evidence=evidence.get('verified_at') if verified else None))
    for module in sorted(installed-{'Part'}):
        items.append(dict(capability_id='workbench:'+module,module=module,installed=True,discovered=False,dependency_ready=False,
                          web_adapter=False,manual_verified=False,ai_verified=False,disabled_reason='此工作台尚未完成网页命令适配',evidence=None))
    return dict(enabled=documents_enabled(),version_fingerprint=fingerprint,adapter_digest=inventory.get('adapter_digest'),items=items)


def current_capabilities():
    root=Path(__file__).resolve().parents[4]
    report=Path(os.getenv('FREECAD_DOCUMENT_VERIFICATION_REPORT',str(root/'.runtime/verification/freecad-documents.json')))
    try: evidence=json.loads(report.read_text(encoding='utf-8')) if report.is_file() else {}
    except (ValueError,OSError): evidence={}
    return read_capabilities(local_inventory(),evidence)
