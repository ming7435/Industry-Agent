"""Only server-owned templates run in the GUI thread; JSON supplies typed data."""
import json
from pathlib import Path
from shared.freecad_documents import NativeJob, PRIMITIVE_TYPES, DIMENSIONS, parse_command


def validate_object_command(command, snapshot):
    from shared.freecad_documents import CadDocumentError, PRIMITIVE_MODELS
    params=command.parameters
    if command.command_type=='replace_from_spec':
        from app.tools.cad.freecad_mcp import validate_spec
        validate_spec(params.spec)
    elif command.command_type=='create_primitive':
        if len(snapshot.product_root_ids)>=24:
            raise CadDocumentError('resource_limit','独立基础形体最多24个',422)
    else:
        target=next((o for o in snapshot.objects if o.object_id==params.object_id),None)
        if target is None:
            raise CadDocumentError('object_stale','对象已不存在，请读取当前修订',409)
        if command.command_type not in target.editable_commands:
            raise CadDocumentError('object_read_only',target.read_only_reason or '该对象不支持此修改',422)
        if command.command_type=='set_primitive_dimensions':
            primitive=next((k for k,v in PRIMITIVE_TYPES.items() if v==target.type_id),None)
            values={p.name:p.value for p in target.properties if p.name in DIMENSIONS.get(primitive,())}
            if not set(params.dimensions).issubset(DIMENSIONS.get(primitive,())):
                raise CadDocumentError('dimensions_invalid','该类型不支持此尺寸字段',422)
            PRIMITIVE_MODELS[primitive].model_validate(dict(primitive_type=primitive,**{**values,**params.dimensions}))


def render_document_program(job: NativeJob, directory: Path, source_path: Path | None):
    if job.envelope is not None:
        job=job.model_copy(update={'envelope':parse_command(job.envelope.model_dump(mode='json'))})
    spec=job.envelope.parameters.spec if job.envelope and job.envelope.command_type=='replace_from_spec' else None
    kernel=''
    if spec is not None:
        from app.tools.cad.freecad_mcp import validate_spec
        from app.tools.cad.freecad_spec_kernel import kernel_source
        spec=validate_spec(spec)
        kernel=kernel_source(spec)
    data=job.model_dump(mode='json')
    if spec is not None: data['envelope']['parameters']['spec']=spec
    return 'import FreeCAD as App\nimport Part, Mesh, json, math, os, hashlib, uuid\nfrom pathlib import Path\n'+kernel+'\n'+(
        'job=json.loads('+repr(json.dumps(data,ensure_ascii=False,allow_nan=False))+')\n'
        'out=Path('+repr(str(directory))+')\n'
        'source_path='+repr(str(source_path) if source_path else None)+'\n')+KERNEL_SOURCE


KERNEL_SOURCE = r'''
def digest_file(path):
    if path.is_symlink() or not path.is_file() or not 0 < path.stat().st_size <= 100*1024*1024:
        raise ValueError('invalid managed artifact')
    return {'job_id':job['job_id'],'name':path.name,'size':path.stat().st_size,
            'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}

def object_uuid(obj, allocate=False):
    if allocate or not getattr(obj,'IndustryObjectId',''):
        if 'IndustryObjectId' not in obj.PropertiesList:
            obj.addProperty('App::PropertyString','IndustryObjectId','Industry')
        obj.IndustryObjectId='OBJ-'+uuid.uuid4().hex
        obj.setEditorMode('IndustryObjectId',2)
    return obj.IndustryObjectId

def primitive_kind(obj):
    types={'Part::Box':'box','Part::Cylinder':'cylinder','Part::Sphere':'sphere','Part::Cone':'cone'}
    # Dependent features and expressions are not moved behind their constraints.
    return types.get(obj.TypeId) if not obj.InList and not getattr(obj,'ExpressionEngine',[]) else None

def dimensions(obj):
    mappings={'box':{'length':('Length',1),'width':('Width',1),'height':('Height',1)},
              'cylinder':{'diameter':('Radius',2),'length':('Height',1)},
              'sphere':{'diameter':('Radius',2)},
              'cone':{'bottom_diameter':('Radius1',2),'top_diameter':('Radius2',2),'height':('Height',1)}}
    return mappings.get(primitive_kind(obj),{})

def set_dimensions(obj, values):
    fields=dimensions(obj)
    if not fields or not set(values).issubset(fields): raise ValueError('unsupported native dimensions')
    current={k:float(getattr(obj,p))*factor for k,(p,factor) in fields.items() if hasattr(obj,p)}
    current.update(values)
    for k,v in current.items():
        if isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v) or v>10000 or v<0 or (v==0 and k!='top_diameter'):
            raise ValueError('invalid native dimension')
    if primitive_kind(obj)=='cone' and current['bottom_diameter']<=current['top_diameter']:
        raise ValueError('invalid taper')
    for k,v in values.items():
        prop,factor=fields[k]
        setattr(obj,prop,v/factor)

def export_products(doc, roots, spec):
    objects=[o for o in doc.Objects if object_uuid(o) in roots]
    if len(objects)!=len(roots): raise ValueError('missing product root')
    shapes=[o.Shape for o in objects if hasattr(o,'Shape')]
    if len(shapes)!=len(objects) or any(s.isNull() or not s.isValid() or len(s.Solids)!=1 or s.Volume<=0 for s in shapes):
        raise ValueError('invalid product shape')
    if not shapes: return {'valid':True,'solid_count':0,'units':'mm','step_roundtrip':False}
    if spec and 'parts' in spec:
        for i,a in enumerate(shapes):
            for b in shapes[i+1:]:
                if a.common(b).Volume>max(1e-7,min(a.Volume,b.Volume)*1e-9): raise ValueError('assembly interference')
    total=shapes[0] if len(shapes)==1 else Part.makeCompound(shapes)
    Part.export(objects,str(out/'model.step'))
    restored=Part.read(str(out/'model.step'))
    if not restored.isValid() or len(restored.Solids)!=len(shapes) or abs(restored.Volume-total.Volume)>max(1e-6,total.Volume*1e-7):
        raise ValueError('STEP roundtrip failed')
    exact=total.optimalBoundingBox(False,False)
    other=restored.optimalBoundingBox(False,False)
    bounds=[exact.XLength,exact.YLength,exact.ZLength]
    if any(abs(a-b)>max(1e-6,abs(a)*1e-7) for a,b in zip(bounds,[other.XLength,other.YLength,other.ZLength])):
        raise ValueError('STEP dimensions failed')
    Mesh.export(objects,str(out/'model.stl'))
    return {'valid':True,'solid_count':len(shapes),'volume_mm3':total.Volume,'bounds_mm':bounds,
            'step_roundtrip':True,'units':'mm','freecad_version':App.Version()}

with (out/'.execution-claimed').open('x',encoding='utf-8') as claim:
    claim.write(job['input_digest'])
doc=None
receipt={'job_id':job['job_id'],'input_digest':job['input_digest'],'state':'failed','snapshot':None,
         'artifacts':[],'validation':{},'result':{},'error_code':None}
try:
    previous=job.get('source',{}).get('snapshot') or {}
    doc=App.openDocument(source_path) if source_path else App.newDocument('Industry_'+job['job_id'][4:20].replace('-',''))
    old_ids=[object_uuid(o) for o in doc.Objects]
    roots=list(previous.get('product_root_ids',[]))
    spec=previous.get('source_spec')
    extra={}
    envelope=job.get('envelope')
    if job['job_kind']=='import':
        for obj in doc.Objects: object_uuid(obj,True)
        wanted_names=job['source'].get('product_names',[])
        roots=[object_uuid(o) for o in doc.Objects if o.Name in wanted_names]
        if not roots: raise ValueError('trusted import requires explicit product roots')
        spec=job['source'].get('spec')
    elif job['job_kind']=='edit':
        kind=envelope['command_type']; params=envelope['parameters']
        if kind=='replace_from_spec':
            for obj in list(doc.Objects): doc.removeObject(obj.Name)
            spec=params['spec']
            objects,extra=build_spec_document(doc,spec,out)
            for obj in doc.Objects: object_uuid(obj,True)
            roots=[object_uuid(o) for o in objects]
        elif kind=='create_primitive':
            if len(roots)>=24: raise ValueError('primitive count limit')
            types={'box':'Part::Box','cylinder':'Part::Cylinder','sphere':'Part::Sphere','cone':'Part::Cone'}
            obj=doc.addObject(types[params['primitive_type']],'Primitive_'+uuid.uuid4().hex[:12])
            # Native default dimensions remain valid until all explicit fields are assigned.
            set_dimensions(obj,{k:v for k,v in params.items() if k!='primitive_type'})
            roots.append(object_uuid(obj)); spec=None
        else:
            obj=next((o for o in doc.Objects if object_uuid(o)==params['object_id']),None)
            if obj is None: raise ValueError('stale object identity')
            if kind=='set_primitive_dimensions': set_dimensions(obj,params['dimensions']); spec=None
            elif kind=='set_label': obj.Label=params['label']
            elif kind=='set_visibility': obj.ViewObject.Visibility=params['visible']
            elif kind=='set_placement':
                if not primitive_kind(obj): raise ValueError('dependent placement is read only')
                axis=params['rotation']['axis']; angle=params['rotation']['angle']
                doc_axis=App.Vector(*axis)
                obj.Placement=App.Placement(App.Vector(*params['position']),App.Rotation(doc_axis,angle)); spec=None
            else: raise ValueError('unsupported document command')
    doc.recompute()
    if len(doc.Objects)>500: raise ValueError('object resource limit')
    entries=[]; snapshots=[]
    for obj in doc.Objects:
        oid=object_uuid(obj)
        if any(s in ('Invalid','Error') for s in getattr(obj,'State',[])): raise ValueError('object recompute failed')
        fields=dimensions(obj)
        props=[{'name':k,'type':'length','value':float(getattr(obj,p))*factor,'unit':'mm','editable':True} for k,(p,factor) in fields.items()]
        if hasattr(obj,'Placement'):
            position=obj.Placement.Base; rot=obj.Placement.Rotation
            props.extend([{'name':'position','type':'vector','value':[position.x,position.y,position.z],'unit':'mm','editable':bool(fields)},
                          {'name':'rotation','type':'rotation','value':{'axis':[rot.Axis.x,rot.Axis.y,rot.Axis.z],'angle':math.degrees(rot.Angle)},'unit':'deg','editable':bool(fields)}])
        props.append({'name':'label','type':'string','value':obj.Label,'unit':'','editable':True})
        geometry={}
        shape=getattr(obj,'Shape',None)
        if shape is not None and not shape.isNull():
            if not shape.isValid(): raise ValueError('invalid native shape')
            if shape.Solids:
                mesh=out/(oid+'.stl'); Mesh.export([obj],str(mesh)); entries.append(digest_file(mesh))
                geometry={'mesh':mesh.name}
            elif getattr(shape,'Edges',[]):
                lines=[]
                for edge in shape.Edges:
                    points=edge.discretize(Deflection=0.1)
                    for a,b in zip(points,points[1:]): lines.extend([[a.x,a.y,a.z],[b.x,b.y,b.z]])
                curve=out/(oid+'.json'); curve.write_text(json.dumps({'lines':lines},allow_nan=False),encoding='utf-8')
                entries.append(digest_file(curve)); geometry={'curves':curve.name}
        edits=['set_label','set_visibility']+(['set_primitive_dimensions','set_placement'] if fields else [])
        snapshots.append({'object_id':oid,'name':obj.Name,'label':obj.Label,'type_id':obj.TypeId,
                          'parent_ids':[object_uuid(o) for o in obj.InList], 'dependency_ids':[object_uuid(o) for o in obj.OutList],
                          'visible':bool(obj.ViewObject.Visibility),'properties':props,'geometry':geometry,
                          'editable_commands':edits,'read_only_reason':'' if fields else '该对象由规格或工作台约束生成，尺寸需修改规格重新生成'})
    validation=export_products(doc,roots,spec)
    if job['job_kind']=='publish' and validation['solid_count']==0: raise ValueError('empty document cannot publish')
    if spec and 'drawing' in spec:
        from_objects=[o for o in doc.Objects if object_uuid(o) in roots]
        extra.update(make_drawing(doc,from_objects,spec['drawing'],out))
    for key in ('drawing','assembly','bim','sheet_metal'):
        if key in extra: validation[key]=extra[key]
        elif key in (previous.get('validation') or {}): validation[key]=previous['validation'][key]
    if spec and 'assembly' in spec: finalize_workbenches(doc,[o for o in doc.Objects if object_uuid(o) in roots],spec)
    doc.saveAs(str(out/'model.FCStd'))
    for name in ('model.FCStd','model.step','model.stl','drawing.svg','drawing.pdf','unfold.svg','unfold.dxf','motion.json'):
        path=out/name
        if path.is_file(): entries.append(digest_file(path))
    revision=job['expected_revision']+(0 if job['job_kind']=='publish' else 1)
    snapshot={'schema_version':'freecad_document_v1','document_id':job['document_id'],'revision':revision,'published_version':None,
              'objects':snapshots,'product_root_ids':roots,'source_spec':spec,'validation':validation,'artifacts':entries}
    receipt.update(state='completed',snapshot=snapshot,artifacts=entries,validation=validation)
except Exception as error:
    receipt.update(error_code='native_validation_failed',result={'message':'原生建模或导出验证失败；最后有效修订未改变','error_type':type(error).__name__})
finally:
    if doc is not None: App.closeDocument(doc.Name)
temporary=out/'receipt.tmp'
temporary.write_text(json.dumps(receipt,ensure_ascii=False,allow_nan=False),encoding='utf-8')
os.replace(str(temporary),str(out/'receipt.json'))
print('INDUSTRY_DOCUMENT_RESULT:'+json.dumps({'job_id':job['job_id'],'state':receipt['state']}))
'''
