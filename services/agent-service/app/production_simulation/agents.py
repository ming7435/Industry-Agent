"""Dedicated Graph node; private authority is never passed to Skill traces or tools."""
from app.agents.base import trace_skill_node
from app.skills import get_skill_registry
from .context import validate_virtual_context, virtual_tool_scope


def virtual_execution_node(agent_name):
    def node(state):
        request = state['request']
        action = request.get('production_action') if agent_name == 'cad' else 'inspect'
        arguments = request.get('production_arguments') if agent_name == 'cad' else {
            'part_id': request.get('part_id'), 'output_digest': request.get('output_digest')}
        context = validate_virtual_context(request.get('_virtual_context'), action, arguments)
        skill_name = 'virtual_production_skill' if agent_name == 'cad' else 'virtual_size_inspection_skill'
        skills = get_skill_registry().select(agent_name, names=[skill_name])
        if len(skills) != 1: raise ValueError('模拟生产技能未注册')
        skill = skills[0]
        def execute(clean):
            with virtual_tool_scope(context):
                return {'result': skill.execute_tool_step(action, clean['agent'].tools, arguments,
                    context={'run_type': 'production_simulation', 'actor_id': context.actor['user_id'], 'job_id': arguments.get('job_id', '')})}
        safe = {'agent': state['agent'], 'request': {'task_id': request.get('task_id', ''), 'trace_id': request.get('trace_id', ''),
                 'action': action}, 'active_skills': [skill_name]}
        return trace_skill_node(agent_name, 'virtual_' + action, execute, skill_step=action)(safe)
    return node
