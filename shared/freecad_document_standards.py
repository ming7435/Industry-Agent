"""Nominal design parameters; never substitutes design values for observations."""
from shared.freecad_documents import StandardParameters, canonical_digest, verify_document_standard, DIMENSIONS, primitive_type

__all__ = ['StandardParameters', 'verify_document_standard']


def build_document_standard(snapshot, run_id):
    parameters,uncovered=[],[]
    def row(key,name,expected,unit,kind,object_id='',source_property='',frame='local'):
        return dict(key=key,name=name,object_id=object_id,expected=expected,unit=unit,kind=kind,
                    source_property=source_property or key,frame=frame,comparable=True)
    if snapshot.source_spec:
        from shared.simulated_part_design_quality import _parameters,_display_parameters
        try: values=_parameters(snapshot.source_spec)
        except ValueError: values=_display_parameters(snapshot.source_spec,snapshot.validation)
        for value in values:
            item=row(value['key'],value['name'],value['expected'],value['unit'],value['kind'],frame='spec')
            if value.get('comparable') is False:
                item['comparable']=False;uncovered.append(item)
            else:
                if item['kind']!='choice': item['expected']=float(item['expected'])
                parameters.append(item)
    else:
        for obj in snapshot.objects:
            if obj.object_id not in snapshot.product_root_ids: continue
            primitive=primitive_type(obj.type_id)
            if primitive is None:
                uncovered.append(dict(key=obj.object_id+'.features',name=obj.label+' · 未适配特征',object_id=obj.object_id,
                                      expected=None,unit='—',kind='unknown',source_property='Shape',frame='local',comparable=False))
                continue
            for prop in obj.properties:
                if prop.name in DIMENSIONS[primitive]:
                    parameters.append(row(obj.object_id+'.'+prop.name,obj.label+' · '+prop.name,prop.value,'mm','number',obj.object_id,prop.name))
                elif prop.name=='position':
                    for i,v in enumerate(prop.value): parameters.append(row(obj.object_id+'.position.'+str(i),obj.label+' · '+'XYZ'[i]+'位置',v,'mm','number',obj.object_id,'position.'+str(i),'world'))
                elif prop.name=='rotation':
                    parameters.append(row(obj.object_id+'.rotation.angle',obj.label+' · 旋转角度',prop.value['angle'],'deg','number',obj.object_id,'rotation.angle','world'))
                    for i,v in enumerate(prop.value['axis']): parameters.append(row(obj.object_id+'.rotation.axis.'+str(i),obj.label+' · 旋转轴'+'XYZ'[i],v,'—','number',obj.object_id,'rotation.axis.'+str(i),'world'))
    body=dict(schema_version='freecad_document_parameters_v1',document_id=snapshot.document_id,revision=snapshot.revision,
              run_id=run_id,extractor_version='text-to-cad-document-1',parameters=parameters,uncovered=uncovered)
    return verify_document_standard({**body,'digest':canonical_digest(body)})
