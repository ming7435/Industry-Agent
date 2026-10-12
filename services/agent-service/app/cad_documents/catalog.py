"""Retain the whole discovered command surface, without granting raw GUI execution."""
import json
import os
import math
from pathlib import Path

from .capabilities import local_inventory

PRIMITIVES={'Part_Box':'box','Part_Cylinder':'cylinder','Part_Sphere':'sphere','Part_Cone':'cone'}
SPEC_TASKS={'Part_Fillet':('fillet','全部边圆角'),'Part_Chamfer':('chamfer','全部边倒角')}
PREFIXES={'Arch':'BIM','Fem':'Fem','FEM':'Fem','Path':'CAM','SheetMetal':'SM','MeshPart':'Mesh','Std':'General','Gui':'General'}


def build_catalog(runtime,report):
    commands=report.get('commands',[])
    if not isinstance(commands,list) or len(commands)>20000 or any(not isinstance(c,str) or not 0<len(c)<256 for c in commands):
        raise ValueError('Invalid native command inventory')
    metadata=report.get('command_info',{})
    if not isinstance(metadata,dict):raise ValueError('Invalid command metadata')
    workbenches=report.get('workbenches',[])
    if not isinstance(workbenches,list) or len(workbenches)>200:raise ValueError('Invalid workbench inventory')
    directory={}
    for entry in workbenches:
        if not isinstance(entry,dict) or not isinstance(entry.get('id'),str) or not 0<len(entry['id'])<=128:raise ValueError('Invalid workbench identity')
        directory[entry['id']]={'id':entry['id'],'label':str(entry.get('label') or entry['id'])[:256],'installed':True}
    discovered_at=report.get('discovered_at')
    fresh_time=(runtime.get('created_at') is None or type(discovered_at) in (int,float)
                and math.isfinite(discovered_at) and discovered_at>=runtime['created_at'])
    current=bool(runtime.get('ready') and runtime.get('version_fingerprint')==report.get('version_fingerprint')
                 and runtime.get('pid')==report.get('runtime_pid') and fresh_time)
    rows=[]
    for name in sorted(set(commands)):
        info=metadata.get(name,{})
        if not isinstance(info,dict):raise ValueError('Invalid native command resource')
        prefix=name.split('_')[0];family=PREFIXES.get(prefix,prefix)
        workbench=family+'Workbench'
        if workbench not in directory:
            directory[workbench]={'id':workbench,'label':'通用命令' if family=='General' else family,'installed':False}
        action={'type':'create_primitive','primitive_type':PRIMITIVES[name]} if current and name in PRIMITIVES else None
        scope=''
        if current and name in SPEC_TASKS:
            task,label=SPEC_TASKS[name]
            action={'type':'prepare_spec_task','task_id':task}
            scope=f'受控规格重建：{label}，确认参数后执行；不是直接运行 GUI 命令'
        rows.append({'id':name,'label':str(info.get('menuText') or name).replace('&','')[:256],
                     'description':str(info.get('toolTip') or '')[:2048], 'shortcut':str(info.get('shortcut') or '')[:128],
                     'workbench_id':workbench,'execution':'discovery_stale' if not current else 'adapted' if action else 'not_adapted',
                     'action':action,'adapter_scope':scope,'disabled_reason':'' if action else '需要通过 MCP 重新读取当前内核目录' if not current else '尚未接通此命令的网页参数、选取和交互流程'})
    for workbench in directory.values():workbench['command_count']=sum(c['workbench_id']==workbench['id'] for c in rows)
    return {'transport':'mcp','current':current,'version_fingerprint':report.get('version_fingerprint','unknown'),
            'workbenches':sorted(directory.values(),key=lambda w:w['id']),'commands':rows,'command_count':len(rows),
            'note':'目录保留全部已发现命令；目录数量不是网页已实现功能的数量。'}


def current_catalog():
    root=Path(__file__).resolve().parents[4]
    path=Path(os.getenv('FREECAD_DISCOVERY_REPORT',str(root/'.runtime/verification/freecad-discovery.json')))
    try:
        if path.is_symlink() or not path.is_file() or path.stat().st_size>8*1024*1024:report={}
        else:report=json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(report,dict):raise ValueError()
        return build_catalog(local_inventory(),report)
    except (ValueError,OSError,UnicodeError):return build_catalog({}, {})
