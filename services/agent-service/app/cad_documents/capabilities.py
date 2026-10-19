"""Version-bound probes of the installed cadgen engine; no GUI command discovery."""
from hashlib import sha256
import json
from pathlib import Path
import os

from shared.freecad_documents import canonical_digest
from . import documents_enabled

ADAPTED={'create_primitive','set_primitive_dimensions','set_placement','set_label','set_visibility','replace_from_spec','publish'}
NATIVE_COMMANDS={'create_primitive':['build123d.Box','build123d.Cylinder','build123d.Sphere','build123d.Cone']}
NATIVE_API={'create_primitive':['build123d.Shape'],'set_primitive_dimensions':['model.json'],
    'set_placement':['build123d.Shape.rotate','build123d.Shape.translate'],'set_label':['model.json'],
    'set_visibility':['model.json'],'replace_from_spec':['build123d.Shape'],
    'publish':['cadgen.step','cadgen.stl','cadgen.read_step']}


def adapter_digest():
    root=Path(__file__).resolve().parent
    sources=[root/name for name in ('native_program.py','coordinator.py','service.py','publishing.py','artifacts.py','capabilities.py','catalog.py')]
    tool_root=root.parent/'tools/cad'
    sources += sorted(set(tool_root.glob('text_to_cad*.py')) | set(tool_root.glob('cad_*.py')) | {tool_root/'freecad_spec_kernel.py'})
    return sha256(b''.join(p.read_bytes() for p in sources if p.is_file())).hexdigest()


def runtime_inventory(runtime=None,probe=None):
    """The optional probe is the same client status boundary used by the worker."""
    try:
        if probe is None:
            from app.clients.text_to_cad import TextToCadClient
            probe=TextToCadClient().status
        status=probe()
        versions=status.get('runtime') or {}
        ready=(status.get('connected') is True and status.get('provider')=='text-to-cad'
               and isinstance(versions.get('version'),str) and isinstance(versions.get('build123d'),str)
               and versions.get('kernel')=='OpenCascade')
        if not ready:return {'ready':False,'provider':'text-to-cad','version_fingerprint':'unknown'}
        return {'ready':True,'provider':'text-to-cad','runtime':versions,
                'version_fingerprint':canonical_digest(versions),'modules':['cadgen','build123d','OCP']}
    except Exception:return {'ready':False,'provider':'text-to-cad','version_fingerprint':'unknown'}


def local_inventory():
    root=Path(__file__).resolve().parents[4]
    inventory=runtime_inventory()
    path=Path(os.getenv('TEXT_TO_CAD_DISCOVERY_REPORT',str(root/'.runtime/verification/text-to-cad-discovery.json')))
    commands=[]
    if path.is_file() and not path.is_symlink() and path.stat().st_size<=8*1024*1024:
        try:
            report=json.loads(path.read_text(encoding='utf-8'))
            if (inventory['ready'] and report.get('provider')=='text-to-cad'
                    and report.get('version_fingerprint')==inventory['version_fingerprint']):
                commands=report.get('commands',[])
        except (ValueError,OSError):pass
    return {**inventory,'commands':commands,'adapter_digest':adapter_digest()}


def read_capabilities(inventory,evidence):
    fingerprint=inventory.get('version_fingerprint','unknown')
    current=inventory.get('provider')=='text-to-cad' and inventory.get('ready') is True
    valid=(current and evidence.get('provider')=='text-to-cad' and evidence.get('version_fingerprint')==fingerprint
           and fingerprint!='unknown' and evidence.get('adapter_digest')==inventory.get('adapter_digest')
           and all(evidence.get(key,{}).get('passed') is True for key in ('native_checks','api_checks','browser_checks')))
    installed=set(inventory.get('modules',[]));items=[]
    for capability in sorted(ADAPTED):
        verified=bool(valid and capability in evidence.get('command_coverage',[]))
        commands=NATIVE_COMMANDS.get(capability,[])
        discovered=current and (all(c in inventory.get('commands',[]) for c in commands) if commands else True)
        items.append(dict(capability_id=capability,module='build123d',installed='build123d' in installed,
            native_commands=commands,native_api=NATIVE_API[capability],parameter_schema_version='freecad_document_commands_v1',
            discovery_kind='runtime_geometry_probe',version_fingerprint=fingerprint,discovered=bool(discovered),
            dependency_ready=bool(discovered),web_adapter=True,manual_verified=verified,ai_verified=False,
            disabled_reason='' if discovered else 'text-to-cad 内核或能力探测尚未通过',
            evidence=evidence.get('verified_at') if verified else None))
    return dict(enabled=documents_enabled(),provider='text-to-cad',version_fingerprint=fingerprint,
                adapter_digest=inventory.get('adapter_digest'),items=items)


def current_capabilities():
    root=Path(__file__).resolve().parents[4]
    path=Path(os.getenv('TEXT_TO_CAD_DOCUMENT_VERIFICATION_REPORT',str(root/'.runtime/verification/text-to-cad-documents.json')))
    try:evidence=json.loads(path.read_text(encoding='utf-8')) if path.is_file() else {}
    except (ValueError,OSError):evidence={}
    return read_capabilities(local_inventory(),evidence)


DISCOVERY_SOURCE = r'''
out=Path(data['directory'])
with (out/'.execution-claimed').open('x',encoding='utf-8') as claim:claim.write(data['input_digest'])
receipt={'job_id':data['job_id'],'input_digest':data['input_digest'],'state':'failed','snapshot':None,
         'artifacts':[],'validation':{},'result':{},'error_code':'discovery_failed'}
try:
    from importlib.metadata import version
    from cadgen import build123d as bd, step, stl, read_step
    from cadgen._internal.node_runtime import cad_node_executable
    import math, subprocess
    requested=data.get('workbench_id','')
    if requested not in ('','Modeling','Export'):raise ValueError('text-to-cad does not provide that workbench')
    shapes={'build123d.Box':(bd.Box(2,3,4),24),
            'build123d.Cylinder':(bd.Cylinder(2,3),12*math.pi),
            'build123d.Sphere':(bd.Sphere(2),32*math.pi/3),
            'build123d.Cone':(bd.Cone(2,0,3),4*math.pi)}
    for shape,expected in shapes.values():
        if not shape.is_valid or len(shape.solids())!=1 or abs(shape.volume-expected)>1e-6:raise ValueError('primitive geometry probe failed')
    box=shapes['build123d.Box'][0]
    for result in (bd.fillet(box.edges(),0.1),bd.chamfer(box.edges(),0.1)):
        if not result.is_valid or result.volume<=0:raise ValueError('edge operation probe failed')
    node_version=subprocess.check_output([cad_node_executable(),'--version'],text=True,timeout=5).strip()
    versions={'version':version('cadgen'),'build123d':version('build123d'),'kernel':'OpenCascade','node_version':node_version}
    fingerprint=hashlib.sha256(json.dumps(versions,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode('utf-8')).hexdigest()
    commands=list(shapes)+['build123d.fillet','build123d.chamfer']
    receipt.update(state='completed',validation={'valid':True,'provider':'text-to-cad'},error_code=None,
        result={'provider':'text-to-cad','version_fingerprint':fingerprint,'runtime':versions,'discovered_at':time.time(),
                'commands':commands,'command_info':{},'workbenches':[{'id':'Modeling','label':'参数化建模'}]})
except Exception as error:
    receipt['result']={'error_type':type(error).__name__,'error_detail':str(error)[:300]}
temporary=out/'receipt.tmp';temporary.write_text(json.dumps(receipt,ensure_ascii=False),encoding='utf-8')
os.replace(str(temporary),str(out/'receipt.json'))
'''
