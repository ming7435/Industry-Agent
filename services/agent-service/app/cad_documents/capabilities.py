from hashlib import sha256
import json
from pathlib import Path
import os

from . import documents_enabled

ADAPTED={'create_primitive','set_primitive_dimensions','set_placement','set_label','set_visibility','replace_from_spec','publish'}


def adapter_digest():
    root=Path(__file__).resolve().parent
    sources=[root/'native_program.py',root.parent/'tools/cad/freecad_spec_kernel.py',root.parent/'tools/cad/freecad_mcp.py']
    return sha256(b''.join(p.read_bytes() for p in sources)).hexdigest()


def local_inventory():
    root=Path(__file__).resolve().parents[4]
    runtime=root/'.runtime/freecad'
    modules=[p.name for p in (runtime/'Mod').iterdir() if p.is_dir()] if (runtime/'Mod').exists() else []
    ready=root/'.runtime/freecad/rpc-ready.json'
    version='unknown'
    if ready.is_file():
        try: version=json.loads(ready.read_text(encoding='utf-8')).get('version_fingerprint','unknown')
        except (ValueError,OSError): pass
    return {'modules':modules,'commands':[],'version_fingerprint':version,'adapter_digest':adapter_digest()}


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
        items.append(dict(capability_id=capability,module='Part',installed='Part' in installed,
                          discovered=bool(inventory.get('commands')),dependency_ready=verified,web_adapter=True,
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
