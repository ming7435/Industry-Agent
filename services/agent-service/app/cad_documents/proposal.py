"""Chinese input yields typed proposals, never executable Python or an implicit mutation."""
import json
import re
from uuid import uuid4
from shared.freecad_documents import parse_command,PRIMITIVE_MODELS,DIMENSIONS,DocumentHead,DocumentSnapshot
from .native_program import validate_object_command


def observed_cad_call(operation, *args, trace=None):
    """记录真实规格/提案的技能消费，不把设计解析当作实体或生产成功。"""
    from app.skills.registry import skill_observation_scope
    identity = 'CAD-PROPOSAL-' + uuid4().hex
    def observed(snapshot):
        if trace is not None:
            trace.record(type='agent', event='skill_observed', trace_id=identity,
                task_id=identity, agent_run_id=identity, run_type='cad_specification', **snapshot)
    with skill_observation_scope(observed):
        try:
            result = operation(*args)
        except Exception:
            if trace is not None:
                trace.record(type='agent', event='agent_error', agent='cad', trace_id=identity,
                    task_id=identity, agent_run_id=identity, error='CAD 模型或规格解析错误，结果未确认')
            raise
    if trace is not None:
        trace.record(type='agent', event='agent_completed', agent='cad', trace_id=identity,
            task_id=identity, agent_run_id=identity, run_type='cad_specification',
            output={**result, 'validation': {'valid': result.get('status') == 'ready'},
                    'validation_scope': 'specification_only'})
    return result


def resolve_freecad_spec(prompt,model,explicit_spec=None):
    from app.tools.cad.freecad_mcp import validate_spec
    from app.agents.cad.graph import (_explicit_advanced_spec,_explicit_tetrahedron_spec,
                                     _explicit_cylinder_spec,_explicit_box_spec,_dimensions_are_explicit)
    if explicit_spec is not None: return {'status':'ready','spec':validate_spec(explicit_spec)}
    spec=_explicit_advanced_spec(prompt) or _explicit_tetrahedron_spec(prompt) or _explicit_cylinder_spec(prompt)
    if spec is None and (model is None or not model.available): spec=_explicit_box_spec(prompt)
    if spec: return {'status':'ready','spec':validate_spec(spec)}
    if model is not None and model.available:
        from app.skills import get_skill_registry
        skill=get_skill_registry().select('cad',names=['production_modeling_skill'])[0]
        model.timeout=min(model.timeout,60)
        response=model.chat([{'role':'system','content':skill.document},{'role':'user','content':json.dumps({'prompt':prompt},ensure_ascii=False)}])
        value=json.loads(response['choices'][0]['message']['content'])
        if not isinstance(value,dict) or set(value)-{'status','spec','questions'}:
            from app.tools.cad.freecad_mcp import FreeCADModelError
            raise FreeCADModelError('模型只允许返回严格规格或补充问题，不接受代码或额外字段')
        if value.get('status')=='needs_input':
            questions=value.get('questions')
            if not isinstance(questions,list) or not 1<=len(questions)<=10 or any(not isinstance(q,str) or not q.strip() or len(q)>500 for q in questions):
                questions=['请提供明确的形状、单位和全部尺寸']
            return {'status':'needs_input','questions':questions}
        spec=validate_spec(value.get('spec'))
        if _dimensions_are_explicit(spec,prompt): return {'status':'ready','spec':spec}
    return {'status':'needs_input','questions':['请提供明确的形状、毫米单位、完整尺寸和特征位置；不会用示例尺寸补齐。']}


def propose_document_command(head,snapshot,prompt,model=None):
    head=DocumentHead.model_validate(head) if isinstance(head,dict) else head
    snapshot=DocumentSnapshot.model_validate(snapshot) if isinstance(snapshot,dict) else snapshot
    if head.document_id!=snapshot.document_id or head.revision!=snapshot.revision:
        return {'status':'needs_input','questions':['文档已更新，请重新读取当前修订']}
    if not isinstance(prompt,str) or not prompt.strip() or len(prompt)>4000:
        return {'status':'needs_input','questions':['请填写不超过4000字符的明确建模需求']}
    command=None
    edit=re.fullmatch(r'\s*(?:将|把)?(.+?)的(长度|宽度|高度|直径|底径|顶径)(?:改为|修改为|设为)\s*(\d+(?:\.\d+)?)\s*(?:mm|毫米)[。.]?\s*',prompt,re.IGNORECASE)
    if edit:
        name,field,number=edit.groups()
        targets=[o for o in snapshot.objects if o.object_id==name or o.label==name.strip(' “”—「」')]
        if len(targets)!=1: return {'status':'needs_input','questions':['对象名称不唯一或不存在，请使用模型树中的对象编号']}
        fields={'长度':'length','宽度':'width','高度':'height','直径':'diameter','底径':'bottom_diameter','顶径':'top_diameter'}
        command={'command_type':'set_primitive_dimensions','parameters':{'object_id':targets[0].object_id,'dimensions':{fields[field]:float(number)}}}
    else:
        value=resolve_freecad_spec(prompt,model)
        if value['status']!='ready': return value
        spec=value['spec'];operations=spec.get('operations',[])
        if len(operations)==1 and set(spec)=={'units','operations'} and operations[0]['type'] in PRIMITIVE_MODELS:
            op=operations[0]
            # Non-default placement/axis belongs to the explicit specification path, not a dropped attribute.
            if op.get('position',[0,0,0])==[0,0,0] and op.get('axis','z')=='z':
                kind=op['type']
                command={'command_type':'create_primitive','parameters':dict(primitive_type=kind,**{f:op[f] for f in DIMENSIONS[kind]})}
        if command is None: command={'command_type':'replace_from_spec','parameters':{'spec':spec}}
    envelope=parse_command(dict(command_id='CMD-'+uuid4().hex,document_id=head.document_id,expected_revision=head.revision,**command))
    validate_object_command(envelope,snapshot)
    return {'status':'ready','command':envelope.model_dump(mode='json'),'requires_confirmation':True}


def document_proposal_tool(head,snapshot,prompt):
    return propose_document_command(head,snapshot,prompt,None)
