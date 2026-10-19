"""Server-owned model programs; persisted JSON carries parameters, never executable input."""
import json
from pathlib import Path
from shared.freecad_documents import CadDocumentError, NativeJob, PRIMITIVE_MODELS, DIMENSIONS, parse_command, primitive_type, identifier, single_line, Placement


def validate_object_command(command, snapshot):
    params = command.parameters
    if command.command_type == 'replace_from_spec':
        from app.tools.cad.text_to_cad import validate_spec
        validate_spec(params.spec)
    elif command.command_type == 'create_primitive':
        if len(snapshot.product_root_ids) >= 24:
            raise CadDocumentError('resource_limit', '独立基础形体最多24个', 422)
    else:
        target = next((o for o in snapshot.objects if o.object_id == params.object_id), None)
        if target is None:
            raise CadDocumentError('object_stale', '对象已不存在，请读取当前修订', 409)
        if command.command_type not in target.editable_commands:
            raise CadDocumentError('object_read_only', target.read_only_reason or '该对象不支持此修改', 422)
        if command.command_type == 'set_primitive_dimensions':
            primitive = primitive_type(target.type_id)
            values = {p.name:p.value for p in target.properties if p.name in DIMENSIONS.get(primitive, ())}
            if not set(params.dimensions).issubset(DIMENSIONS.get(primitive, ())):
                raise CadDocumentError('dimensions_invalid', '该类型不支持此尺寸字段', 422)
            PRIMITIVE_MODELS[primitive].model_validate(dict(primitive_type=primitive, **{**values, **params.dimensions}))


def _source_state(job, source_path):
    previous = job.source.get('snapshot') or {}
    if source_path is not None and source_path.suffix.lower() == '.json':
        if source_path.is_symlink() or not 0<source_path.stat().st_size<=100*1024*1024:
            raise CadDocumentError('source_invalid','CAD 模型数据文件无效',422)
        state = json.loads(source_path.read_text(encoding='utf-8'))
        if (not isinstance(state, dict) or state.get('schema_version') != 'text_to_cad_model_v1'
                or not isinstance(state.get('objects'), list) or len(state['objects']) > 500):
            raise CadDocumentError('source_invalid', 'CAD 模型数据格式无效', 422)
        ids=set()
        for item in state['objects']:
            if not isinstance(item,dict):raise CadDocumentError('source_invalid','CAD 对象数据无效',422)
            oid=identifier(item.get('object_id'),'OBJ-')
            if oid in ids:raise CadDocumentError('source_invalid','CAD 对象身份重复',422)
            ids.add(oid)
            item['name']=single_line(item.get('name'));item['label']=single_line(item.get('label'))
            if type(item.get('visible')) is not bool:raise CadDocumentError('source_invalid','CAD 可见性无效',422)
            placement=Placement.model_validate(dict(object_id=oid,position=item.get('position'),rotation=item.get('rotation')))
            item.update(position=list(placement.position),rotation=placement.rotation.model_dump(mode='json'))
            if item.get('primitive'):
                kind=item['primitive'].get('primitive_type')
                if kind not in PRIMITIVE_MODELS:raise CadDocumentError('source_invalid','CAD 基础形体无效',422)
                item['primitive']=PRIMITIVE_MODELS[kind].model_validate(item['primitive']).model_dump(mode='json')
            elif type(item.get('spec_index')) is not int or item['spec_index']<0 or not state.get('base_spec'):
                raise CadDocumentError('source_invalid','CAD 规格引用无效',422)
        return state
    spec = previous.get('source_spec') or job.source.get('spec')
    state = dict(schema_version='text_to_cad_model_v1', base_spec=spec, source_spec=spec, objects=[])
    roots = set(previous.get('product_root_ids', []))
    objects = [o for o in previous.get('objects', []) if o['object_id'] in roots]
    if spec:
        state['previous_products'] = objects
        return state
    for obj in objects:
        kind = primitive_type(obj['type_id'])
        properties = {p['name']:p['value'] for p in obj.get('properties', [])}
        if (not kind or not set(DIMENSIONS[kind]).issubset(properties)
                or not {'position','rotation'}.issubset(properties)
                or 'set_primitive_dimensions' not in obj.get('editable_commands', [])):
            raise CadDocumentError('migration_required', '历史 FCStd 文档缺少可重建规格，需要迁移后再编辑；原文件仍可下载', 422)
        if kind in ('cylinder','cone','sphere'):
            sweep=properties.get('sweep_angle',properties.get('native.Angle3' if kind=='sphere' else 'native.Angle'))
            full_sphere=(kind!='sphere' or (properties.get('latitude_min',properties.get('native.Angle1'))==-90
                        and properties.get('latitude_max',properties.get('native.Angle2'))==90))
            if sweep!=360 or not full_sphere:
                raise CadDocumentError('migration_required','历史曲面形体缺少完整角度证据，需要迁移后再编辑；原文件仍可下载',422)
        primitive = PRIMITIVE_MODELS[kind].model_validate(dict(primitive_type=kind, **{k:properties[k] for k in DIMENSIONS[kind]}))
        placement=Placement.model_validate(dict(object_id=obj['object_id'],position=properties['position'],rotation=properties['rotation']))
        state['objects'].append(dict(object_id=obj['object_id'], name=obj['name'], label=obj['label'], visible=obj['visible'],
            primitive=primitive.model_dump(),position=list(placement.position),rotation=placement.rotation.model_dump(mode='json')))
    if source_path is not None and not state['objects']:
        raise CadDocumentError('migration_required', '历史 FCStd 文档没有可重建的规格，需要迁移后再编辑；原文件仍可下载', 422)
    return state


def render_document_program(job: NativeJob, directory: Path, source_path: Path | None):
    if job.envelope is not None:
        job = job.model_copy(update={'envelope':parse_command(job.envelope.model_dump(mode='json'))})
    replacement = bool(job.envelope and job.envelope.command_type == 'replace_from_spec')
    state = (dict(schema_version='text_to_cad_model_v1',base_spec=job.envelope.parameters.spec,
                  source_spec=job.envelope.parameters.spec,objects=[])
             if replacement else _source_state(job, source_path))
    spec = state.get('base_spec'); kernel = ''
    if spec:
        from app.tools.cad.text_to_cad import validate_spec
        from app.tools.cad.freecad_spec_kernel import kernel_source
        state['base_spec'] = validate_spec(spec)
        if state.get('source_spec') is not None: state['source_spec'] = validate_spec(state['source_spec'])
        kernel = kernel_source(state['base_spec'])
    embedded_kernel = '\n'.join(line for line in kernel.splitlines() if not line.startswith('from __future__ import '))
    # cadgen 0.7.10 reads Python source using the host default encoding on Windows.
    model_source = (MODEL_IMPORTS + embedded_kernel + '\n' + MODEL_BODY).encode('ascii', 'backslashreplace').decode('ascii')
    return ('import json, os, math, uuid, hashlib, subprocess, sys, importlib.util\nfrom pathlib import Path\n'
            'job=json.loads('+repr(json.dumps(job.model_dump(mode='json'),ensure_ascii=False,allow_nan=False))+')\n'
            'state=json.loads('+repr(json.dumps(state,ensure_ascii=False,allow_nan=False))+')\n'
            'out=Path('+repr(str(directory))+')\nmodel_source='+repr(model_source)+'\nspec_kernel='+repr(kernel)+'\n'+DOCUMENT_RUNTIME)


MODEL_IMPORTS = '''from __future__ import annotations
import json, os
from pathlib import Path
os.environ.setdefault('CADGEN_CACHE_DIR', str(Path(__file__).resolve().parent / '.cadgen-cache'))
os.environ['CADGEN_DAEMON'] = '0'
os.environ.setdefault('CADGEN_COMPONENT_WORKERS', '1')
from cadgen import build123d as bd, step, stl
'''

MODEL_BODY = r'''
def model_parts():
    data=json.loads(Path(__file__).with_name('model.json').read_text(encoding='utf-8'))
    base,extra=build_spec(data['base_spec'],Path(__file__).parent) if data.get('base_spec') else ([],{})
    result=[]
    for item in data['objects']:
        primitive=item.get('primitive')
        if primitive:
            kind=primitive['primitive_type']
            if kind=='box': shape=bd.Box(primitive['length'],primitive['width'],primitive['height'],align=(bd.Align.MIN,bd.Align.MIN,bd.Align.MIN))
            elif kind=='cylinder': shape=bd.Cylinder(primitive['diameter']/2,primitive['length'],arc_size=360,align=(bd.Align.CENTER,bd.Align.CENTER,bd.Align.MIN))
            elif kind=='sphere': shape=bd.Sphere(primitive['diameter']/2,arc_size1=-90,arc_size2=90,arc_size3=360)
            elif kind=='cone': shape=bd.Cone(primitive['bottom_diameter']/2,primitive['top_diameter']/2,primitive['height'],arc_size=360,align=(bd.Align.CENTER,bd.Align.CENTER,bd.Align.MIN))
            else: raise ValueError('unsupported primitive')
        else: shape=base[item['spec_index']]
        rotation=item.get('rotation') or {'axis':[0,0,1],'angle':0}
        if rotation['angle']: shape=shape.rotate(bd.Axis((0,0,0),tuple(rotation['axis'])),rotation['angle'])
        position=item.get('position',[0,0,0])
        if any(position): shape=shape.translate(tuple(position))
        shape.label=item['name'];result.append(shape)
    return result,extra

@step(out=(Path(__file__).resolve().parent / 'model.step').as_posix())
@stl(out=(Path(__file__).resolve().parent / 'model.stl').as_posix())
def model():
    parts,_=model_parts()
    return bd.Compound(children=parts)

if __name__=='__main__': model()
'''

DOCUMENT_RUNTIME = r'''
def _document_digest(path):
    if path.is_symlink() or not path.is_file() or not 0<path.stat().st_size<=100*1024*1024: raise ValueError('invalid managed artifact')
    content=path.read_bytes()
    return {'job_id':job['job_id'],'name':path.name,'size':len(content),'sha256':hashlib.sha256(content).hexdigest()}

def _document_source_write(name,content):
    path=out/name
    if path.exists() or path.is_symlink(): raise ValueError('candidate source already exists')
    path.write_text(content,encoding='utf-8');return path

with (out/'.execution-claimed').open('x',encoding='utf-8') as claim: claim.write(job['input_digest'])
receipt={'job_id':job['job_id'],'input_digest':job['input_digest'],'state':'failed','snapshot':None,
         'artifacts':[],'validation':{},'result':{},'error_code':None}
try:
    from cadgen import build123d as bd, read_step
    from importlib.metadata import version
    if spec_kernel: exec(compile(spec_kernel,'<trusted-text-to-cad-kernel>','exec'),globals())
    if state.get('base_spec') and not state['objects']:
        parts,_extra=build_spec(state['base_spec'],out)
        previous=state.pop('previous_products',[])
        for index,part in enumerate(parts):
            old=previous[index] if index<len(previous) else {}
            state['objects'].append(dict(object_id=old.get('object_id') or 'OBJ-'+uuid.uuid4().hex,
                name=getattr(part,'label','') or 'Component'+str(index+1),label=old.get('label') or getattr(part,'label','') or 'Model',
                visible=old.get('visible',True),spec_index=index,position=[0,0,0],rotation={'axis':[0,0,1],'angle':0}))
    if job['job_kind']=='import':
        for item in state['objects']: item['object_id']='OBJ-'+uuid.uuid4().hex
    envelope=job.get('envelope')
    if job['job_kind']=='edit' and envelope:
        kind=envelope['command_type'];params=envelope['parameters']
        if kind=='create_primitive':
            if len(state['objects'])>=24: raise ValueError('primitive count limit')
            oid='OBJ-'+uuid.uuid4().hex
            state['objects'].append(dict(object_id=oid,name='Primitive_'+oid[4:16],label=params['primitive_type'],visible=True,
                primitive=params,position=[0,0,0],rotation={'axis':[0,0,1],'angle':0}));state['source_spec']=None
        elif kind!='replace_from_spec':
            item=next((o for o in state['objects'] if o['object_id']==params['object_id']),None)
            if item is None: raise ValueError('stale object identity')
            if kind=='set_primitive_dimensions':
                if not item.get('primitive'): raise ValueError('dependent dimensions are read only')
                item['primitive'].update(params['dimensions']);state['source_spec']=None
            elif kind=='set_placement':
                if not item.get('primitive'): raise ValueError('dependent placement is read only')
                item.update(position=params['position'],rotation=params['rotation']);state['source_spec']=None
            elif kind=='set_label': item['label']=params['label']
            elif kind=='set_visibility': item['visible']=params['visible']
            else: raise ValueError('unsupported document command')
    if len(state['objects'])>500: raise ValueError('object resource limit')
    _document_source_write('model.json',json.dumps(state,ensure_ascii=False,allow_nan=False,indent=2))
    model_path=_document_source_write('model.py',model_source)
    module_name='_industry_model_'+job['job_id'].replace('-','_')
    module_spec=importlib.util.spec_from_file_location(module_name,str(model_path))
    module=importlib.util.module_from_spec(module_spec);sys.modules[module_name]=module
    try:
        module_spec.loader.exec_module(module);shapes,extra=module.model_parts()
    finally: sys.modules.pop(module_name,None)
    if len(shapes)!=len(state['objects']): raise ValueError('missing product roots')
    if any(not s.is_valid or len(s.solids())!=1 or s.volume<=0 for s in shapes): raise ValueError('invalid product shape')
    if state.get('source_spec') and 'parts' in state['source_spec']:
        for index,a in enumerate(shapes):
            for b in shapes[index+1:]:
                intersection=a.intersect(b)
                overlap=(sum(piece.volume for piece in intersection) if isinstance(intersection,(list,tuple,bd.ShapeList))
                         else intersection.volume if intersection is not None else 0)
                if overlap>max(1e-7,min(a.volume,b.volume)*1e-9): raise ValueError('assembly interference')
    validation={'valid':True,'solid_count':len(shapes),'units':'mm','step_roundtrip':False,
                'provider':'text-to-cad','cadgen_version':version('cadgen'),'build123d_version':version('build123d')}
    total=bd.Compound(children=shapes) if shapes else None
    same_geometry=job['job_kind'] in ('import','publish') or (envelope and envelope['command_type'] in ('set_label','set_visibility'))
    if same_geometry:
        source=job.get('source') or {}
        proof=(source.get('source_validation') if job['job_kind']=='import' else (source.get('snapshot') or {}).get('validation')) or {}
        if 'solid_count' in proof and proof['solid_count']!=len(shapes): raise ValueError('source geometry solid count changed')
        if total is not None:
            if 'volume_mm3' in proof and not math.isclose(total.volume,proof['volume_mm3'],rel_tol=1e-7,abs_tol=1e-6): raise ValueError('source geometry volume changed')
            if 'bounds_mm' in proof and (len(proof['bounds_mm'])!=3 or any(not math.isclose(a,b,rel_tol=1e-7,abs_tol=1e-6) for a,b in zip(total.bounding_box(optimal=True).size,proof['bounds_mm']))): raise ValueError('source geometry dimensions changed')
    if shapes:
        completed=subprocess.run([sys.executable,'-X','utf8',str(model_path)],cwd=str(out),capture_output=True,text=True,encoding='utf-8',errors='replace',
            creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
        if completed.returncode: raise ValueError('CAD model failed: '+completed.stderr[-1600:])
        restored=read_step(out/'model.step')
        if not restored.is_valid or len(restored.solids())!=len(shapes) or abs(restored.volume-total.volume)>max(1e-6,total.volume*1e-7): raise ValueError('STEP roundtrip failed')
        bounds=list(total.bounding_box(optimal=True).size);other=list(restored.bounding_box(optimal=True).size)
        if any(abs(a-b)>max(1e-6,abs(a)*1e-7) for a,b in zip(bounds,other)): raise ValueError('STEP dimensions failed')
        validation.update(volume_mm3=total.volume,bounds_mm=bounds,step_roundtrip=True,product_names=[o['name'] for o in state['objects']])
    if job['job_kind']=='publish' and not shapes: raise ValueError('empty document cannot publish')
    for key in ('drawing','assembly','bim','sheet_metal'):
        if key in extra: validation[key]=extra[key]
    entries=[];snapshots=[]
    for item,shape in zip(state['objects'],shapes):
        oid=item['object_id'];primitive=item.get('primitive')
        mesh=out/(oid+'.stl');bd.export_stl(shape,str(mesh));entries.append(_document_digest(mesh))
        properties=[dict(name=name,type='length',value=value,unit='mm',editable=True) for name,value in (primitive or {}).items() if name!='primitive_type']
        if primitive and primitive['primitive_type'] in ('cylinder','cone','sphere'):
            properties.append(dict(name='sweep_angle',type='angle',value=360,unit='deg',editable=False))
            if primitive['primitive_type']=='sphere':
                properties.extend([dict(name='latitude_min',type='angle',value=-90,unit='deg',editable=False),
                                   dict(name='latitude_max',type='angle',value=90,unit='deg',editable=False)])
        properties.extend([dict(name='position',type='vector',value=item['position'],unit='mm',editable=bool(primitive)),
            dict(name='rotation',type='rotation',value=item['rotation'],unit='deg',editable=bool(primitive)),
            dict(name='label',type='string',value=item['label'],unit='',editable=True)])
        edits=['set_label','set_visibility']+(['set_primitive_dimensions','set_placement'] if primitive else [])
        snapshots.append(dict(object_id=oid,name=item['name'],label=item['label'],type_id='build123d::'+primitive['primitive_type'].capitalize() if primitive else 'build123d::Shape',
            parent_ids=[],dependency_ids=[],visible=item['visible'],properties=properties,geometry={'mesh':mesh.name},
            editable_commands=edits,read_only_reason='' if primitive else '该对象由规格生成，尺寸需修改规格重新生成'))
    for name in ('model.py','model.json','model.step','model.stl','drawing.svg','drawing.pdf','unfold.svg','unfold.dxf','motion.json'):
        if (out/name).is_file(): entries.append(_document_digest(out/name))
    snapshot=dict(schema_version='freecad_document_v1',document_id=job['document_id'],revision=job['expected_revision']+(0 if job['job_kind']=='publish' else 1),
        published_version=None,objects=snapshots,product_root_ids=[o['object_id'] for o in snapshots],source_spec=state.get('source_spec'),validation=validation,artifacts=entries)
    receipt.update(state='completed',snapshot=snapshot,artifacts=entries,validation=validation)
except Exception as error:
    receipt.update(error_code='native_validation_failed',result={'message':'CAD建模或导出验证失败；最后有效修订未改变','error_type':type(error).__name__,'error_detail':str(error)[:2000]})
temporary=out/'receipt.tmp';temporary.write_text(json.dumps(receipt,ensure_ascii=False,allow_nan=False),encoding='utf-8')
os.replace(str(temporary),str(out/'receipt.json'))
print('INDUSTRY_DOCUMENT_RESULT:'+json.dumps({'job_id':job['job_id'],'state':receipt['state']}))
'''
