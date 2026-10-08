"""同源公开账号接口与独立内部服务认证。"""
import hmac
import os
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict, Field


def internal_auth(request: Request):
    expected = os.getenv('BACKEND_INTERNAL_TOKEN', '').strip()
    supplied = request.headers.get('Authorization', '').removeprefix('Bearer ').strip()
    if not expected:
        if os.getenv('BACKEND_STORAGE') == 'sqlite' and os.getenv('APP_ENV', 'development') not in {'prod', 'production'}:
            return
        raise HTTPException(503, '内部服务认证未配置')
    if not hmac.compare_digest(supplied, expected):
        raise HTTPException(401, '内部服务认证失败')


def same_origin(request):
    origin = request.headers.get('origin')
    if origin and urlparse(origin).netloc != request.headers.get('host'):
        raise HTTPException(403, '仅允许同源请求')


class Credentials(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=8, max_length=256)


class Registration(Credentials):
    role: str
    primary_device_id: str = ''
    responsible_device_ids: list[str] | None = None


class Responsibilities(BaseModel):
    model_config = ConfigDict(extra='forbid')
    responsible_device_ids: list[str]


class WorkorderPlanReplacement(BaseModel):
    model_config = ConfigDict(extra='forbid')
    workorder_id: str = Field(min_length=1, max_length=128)
    actor_id: str = Field(min_length=1, max_length=128)
    expected_plan_id: str = Field(min_length=1, max_length=128)
    expected_updated_at: str = Field(min_length=1, max_length=128)
    request_id: str = Field(min_length=1, max_length=128, pattern=r'^[A-Za-z0-9_-]+$')
    maintenance_plan: dict


def create_router(get_service):
    router = APIRouter()
    def actor(request):
        value = get_service().team.resolve_session(request.cookies.get('maintenance_session', ''))
        if not value:
            raise HTTPException(401, '请先登录维修小组账号')
        return value

    @router.get('/api/team/devices')
    def catalog():
        try:
            return {'items': get_service().team.devices()}
        except Exception:
            raise HTTPException(503, '虚拟工厂设备目录不可用')

    @router.post('/api/team/register', status_code=201)
    def register(body: Registration, request: Request):
        same_origin(request)
        try:
            return {'user': get_service().team.register(**body.model_dump())}
        except ValueError as error:
            raise HTTPException(409, str(error))

    @router.post('/api/team/login')
    def login(body: Credentials, request: Request, response: Response):
        same_origin(request)
        try:
            user, token = get_service().team.login(body.username, body.password)
        except ValueError:
            raise HTTPException(401, '用户名或密码错误')
        response.set_cookie('maintenance_session', token, httponly=True, samesite='strict', secure=request.url.scheme == 'https' or os.getenv('APP_ENV') in {'prod', 'production'}, max_age=28800)
        return {'user': user}

    @router.post('/api/team/logout')
    def logout(request: Request, response: Response):
        same_origin(request)
        get_service().team.logout(request.cookies.get('maintenance_session', ''))
        response.delete_cookie('maintenance_session')
        return {'success': True}

    @router.get('/api/team/me')
    def me(request: Request):
        return {'user': actor(request)}

    @router.post('/api/team/responsibilities')
    def responsibilities(body: Responsibilities, request: Request):
        same_origin(request)
        user = actor(request)
        try:
            return {'user': get_service().update_team_responsibilities(user['user_id'], body.responsible_device_ids)}
        except PermissionError as error:
            raise HTTPException(403, str(error))
        except ValueError as error:
            raise HTTPException(409, str(error))

    @router.get('/api/team/workorders')
    def orders(request: Request):
        user = actor(request)
        items = get_service().list_workorders()['items']
        return {'items': [item for item in items if not item.get('deleted_at') and (user['role'] == 'supervisor' or item.get('assignee') == user['user_id'])]}

    @router.get('/api/team/reminders')
    def reminders(request: Request):
        return {'items': get_service().team.reminders(actor(request))}

    @router.post('/api/team/reminders')
    def remind(body: dict, request: Request):
        same_origin(request)
        try:
            return get_service().remind(str(body.get('workorder_id') or ''), actor(request), str(body.get('text') or '请及时处理维修任务'))
        except PermissionError as error:
            raise HTTPException(403, str(error))
        except (ValueError, KeyError) as error:
            raise HTTPException(409, str(error))

    @router.post('/internal/team/session/resolve')
    def resolve(body: dict, request: Request):
        internal_auth(request)
        return {'user': get_service().team.resolve_session(str(body.get('token') or ''))}

    @router.post('/api/team/reminders/{reminder_id}/read')
    def read(reminder_id: str, request: Request):
        same_origin(request)
        try:
            return get_service().team.read_reminder(reminder_id, actor(request))
        except PermissionError as error:
            raise HTTPException(403, str(error))

    @router.post('/internal/team/repair/confirm')
    def confirm(body: dict, request: Request):
        internal_auth(request)
        try:
            return get_service().confirm_team_repair(str(body.get('workorder_id') or ''), str(body.get('actor_id') or ''), str(body.get('feedback') or ''), body.get('snapshot') or {})
        except PermissionError as error:
            raise HTTPException(403, str(error))
        except (ValueError, KeyError) as error:
            raise HTTPException(409, str(error))

    @router.post('/internal/team/workorder/replace-plan')
    def replace_plan(body: WorkorderPlanReplacement, request: Request):
        internal_auth(request)
        try:
            return get_service().replace_team_workorder_plan(**body.model_dump())
        except PermissionError as error:
            raise HTTPException(403, str(error)) from error
        except (ValueError, KeyError) as error:
            raise HTTPException(409, str(error)) from error

    @router.post('/internal/team/inspection/record')
    def record_inspection(body: dict, request: Request):
        internal_auth(request)
        try:
            return get_service().record_team_inspection(
                str(body.get('workorder_id') or ''), str(body.get('actor_id') or ''),
                body.get('feedback'), body.get('snapshot'))
        except PermissionError as error:
            raise HTTPException(403, str(error))
        except (ValueError, KeyError) as error:
            raise HTTPException(409, str(error))

    @router.post('/internal/team/repair/poststart')
    def poststart(body: dict, request: Request):
        internal_auth(request)
        try:
            return get_service().finalize_team_repair(str(body.get('workorder_id') or ''), body.get('snapshot') or {})
        except (ValueError, KeyError) as error:
            raise HTTPException(409, str(error))

    return router
