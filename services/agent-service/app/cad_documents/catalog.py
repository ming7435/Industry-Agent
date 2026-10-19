"""Only expose installed geometry operations that the runtime actually probed."""
import json
import os
from pathlib import Path
from .capabilities import local_inventory

PRIMITIVES={'build123d.Box':'box','build123d.Cylinder':'cylinder','build123d.Sphere':'sphere','build123d.Cone':'cone'}
SPEC_TASKS={'build123d.fillet':('fillet','全部边圆角'),'build123d.chamfer':('chamfer','全部边倒角')}


def build_catalog(runtime,report):
    commands=report.get('commands',[])
    if not isinstance(commands,list) or len(commands)>20000 or any(not isinstance(c,str) or not 0<len(c)<256 for c in commands):
        raise ValueError('Invalid CAD command inventory')
    current=(runtime.get('ready') is True and runtime.get('provider')=='text-to-cad'
             and report.get('provider')=='text-to-cad' and runtime.get('version_fingerprint')==report.get('version_fingerprint')
             and runtime.get('version_fingerprint') not in (None,'unknown'))
    rows=[]
    for name in sorted(set(commands)):
        action=None;scope=''
        if current and name in PRIMITIVES:action={'type':'create_primitive','primitive_type':PRIMITIVES[name]}
        elif current and name in SPEC_TASKS:
            task,label=SPEC_TASKS[name];action={'type':'prepare_spec_task','task_id':task}
            scope='受控规格重建：'+label
        rows.append(dict(id=name,label=name,description='',shortcut='',workbench_id='Modeling',
            execution='discovery_stale' if not current else 'adapted' if action else 'not_adapted',
            action=action,adapter_scope=scope,disabled_reason='' if action else '此操作未通过当前 text-to-cad 能力验证'))
    return dict(transport='local_process',provider='text-to-cad',current=bool(current),
        version_fingerprint=report.get('version_fingerprint','unknown'),
        workbenches=[dict(id='Modeling',label='参数化建模',installed=bool(current),command_count=len(rows))],
        commands=rows,command_count=len(rows),note='能力来自本机 cadgen/build123d 几何探测；不提供 FreeCAD 工作台。')


def current_catalog():
    root=Path(__file__).resolve().parents[4]
    path=Path(os.getenv('TEXT_TO_CAD_DISCOVERY_REPORT',str(root/'.runtime/verification/text-to-cad-discovery.json')))
    try:
        report=json.loads(path.read_text(encoding='utf-8')) if path.is_file() and not path.is_symlink() and path.stat().st_size<=8*1024*1024 else {}
        if not isinstance(report,dict):raise ValueError()
        return build_catalog(local_inventory(),report)
    except (ValueError,OSError,UnicodeError):return build_catalog({}, {})
