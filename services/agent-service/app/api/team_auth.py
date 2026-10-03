"""个人会话独立于内部 API 令牌，不信任调用方提供的姓名或角色。"""
from fastapi import HTTPException
from app.clients.backend import BackendServiceClient, BackendServiceError


def team_actor(request, backend=None):
    token = request.cookies.get('maintenance_session', '')
    if not token:
        raise HTTPException(401, '请先登录维修小组账号')
    try:
        actor = (backend or BackendServiceClient()).resolve_session(token)
    except BackendServiceError:
        raise HTTPException(503, '维修身份服务不可用')
    if not actor:
        raise HTTPException(401, '维修会话已失效，请重新登录')
    return actor


def require_assignee(workorder_id, actor, backend=None):
    if actor.get('role') != 'technician':
        raise HTTPException(403, '监督人仅可查看和催办')
    order = (backend or BackendServiceClient()).call('get_workorder', {'workorder_id': workorder_id}).get('workorder') or {}
    if order.get('assignee') != actor.get('user_id'):
        raise HTTPException(403, '只能处理本人被派工任务')
    return order


def human_action(workorder_id, action, payload, request, operations=None):
    actor = team_actor(request)
    backend = BackendServiceClient()
    require_assignee(workorder_id, actor, backend)
    from app.monitor.line_control import LineController
    from app.monitor.factory_api import FactoryApiClient
    import os
    if action == 'mark_repair_completed':
        if operations is not None:
            return operations.execute_workorder(action, {**payload, 'workorder_id': workorder_id}, actor_id=actor['user_id'])
        feedback = payload.get('repair_feedback') or payload.get('feedback') or ''
        if isinstance(feedback, dict):
            feedback = feedback.get('feedback') or feedback.get('result') or ''
        return LineController(FactoryApiClient(os.getenv('FACTORY_API_BASE_URL', 'http://127.0.0.1:4529')), backend).confirm_and_restart(workorder_id, actor['user_id'], feedback)
    if action == 'submit_feedback':
        feedback = payload.get('repair_feedback') or payload.get('feedback') or ''
        if isinstance(feedback, dict):
            feedback = feedback.get('feedback') or feedback.get('result') or ''
        return backend.call('submit_repair_feedback', {'workorder_id': workorder_id, 'feedback': {'feedback': str(feedback), 'operator': actor['user_id']}})
    if action == 'update' and payload.get('status') == 'in_progress':
        return backend.call('update_workorder', {'workorder_id': workorder_id, 'status': 'in_progress', 'accepted_by': actor['user_id']})
    if action == 'close':
        if operations is not None:
            return operations.execute_workorder('close', {'workorder_id': workorder_id}, from_agent='router')
        return backend.call('close_workorder', {'workorder_id': workorder_id})
    raise HTTPException(403, '人工入口不允许变更派工或绕过维修确认')
