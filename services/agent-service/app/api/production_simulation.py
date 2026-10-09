"""Session-protected public actions using fixed server CAD and Backend facts."""
import os
from urllib.parse import urlsplit
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, Field

from app.api.team_auth import team_actor
from app.agents.cad.modeling_api import get_freecad_run_record
from shared.virtual_turning import VirtualProductionError
from app.production_simulation.factory import VirtualFactoryError


class Strict(BaseModel):
    model_config = ConfigDict(extra='forbid', strict=True)


class Plan(Strict):
    command_id: str = Field(min_length=1, max_length=128, pattern=r'^[A-Za-z0-9][A-Za-z0-9_.:-]*$')
    design_run_id: str = Field(min_length=67, max_length=67, pattern=r'^FC-[a-f0-9]{64}$')
    setup: dict
    material: str = Field(min_length=1, max_length=200)
    batch_id: str = Field(default='', max_length=128)


class ProgramIdentity(Strict):
    digest: str = Field(min_length=64, max_length=64, pattern=r'^[a-f0-9]{64}$')


class OutputIdentity(Strict):
    output_digest: str = Field(min_length=64, max_length=64, pattern=r'^[a-f0-9]{64}$')


async def write_boundary(request: Request):
    origin = request.headers.get('origin')
    if origin and (urlsplit(origin).netloc != request.headers.get('host') or urlsplit(origin).scheme not in {'http', 'https'}):
        raise HTTPException(403, '仅允许同源模拟生产请求')
    raw_length = request.headers.get('content-length', '')
    if raw_length and (not raw_length.isascii() or not raw_length.isdecimal()): raise HTTPException(400, '请求长度无效')
    if raw_length and int(raw_length) > 128 * 1024: raise HTTPException(413, '生产请求超过大小限制')
    if len(await request.body()) > 128 * 1024: raise HTTPException(413, '生产请求超过大小限制')


def build_virtual_production_router(coordinator, backend, require_write_auth, cad_reader=get_freecad_run_record):
    router = APIRouter(prefix='/api/production/virtual')
    writes = [Depends(write_boundary), Depends(require_write_auth)]

    def call(function):
        try: return function()
        except (VirtualProductionError, VirtualFactoryError) as error:
            raise HTTPException(error.status, {'code': error.code, 'message': str(error),
                'outcome_unknown': getattr(error, 'outcome_unknown', error.status >= 500)}) from None

    def actor(request):
        if not request.cookies.get('maintenance_session'): raise HTTPException(401, '请先登录账号')
        if backend is None or coordinator is None: raise HTTPException(503, '模拟生产服务尚未配置')
        return call(lambda: team_actor(request, backend))

    @router.get('/capabilities')
    def capabilities(request: Request):
        actor(request)
        if os.getenv('FACTORY_CONTROL_MODE', '').lower() != 'virtual':
            return {'enabled': False, 'simulation_only': True, 'reason': '未启用虚拟工厂模式'}
        return {**call(coordinator.factory.capabilities), 'enabled': True}

    @router.post('/plans', dependencies=writes)
    def prepare(body: Plan, request: Request):
        user = actor(request)
        existing = call(lambda: backend.by_command(user, body.command_id))
        if existing is not None:
            if existing['design_run_id'] != body.design_run_id: raise HTTPException(409, '同一指令不能更换设计版本')
            run = existing['design']
        else: run = cad_reader(request, body.design_run_id)
        if run.get('run_id') != body.design_run_id: raise HTTPException(409, 'CAD 返回了其他设计版本')
        return call(lambda: coordinator.prepare(user, {'command_id': body.command_id, 'run': run,
                    'setup': body.setup, 'material': body.material, 'batch_id': body.batch_id}))

    @router.get('/jobs')
    def jobs(request: Request, design_run_id: str = '', batch_id: str = '', cursor: str = '', limit: int = Query(default=50, ge=1, le=50)):
        user = actor(request)
        return call(lambda: backend.list_jobs(user, design_run_id=design_run_id, batch_id=batch_id, cursor=cursor, limit=limit))

    @router.get('/jobs/by-command/{command_id}')
    def by_command(command_id: str, request: Request):
        user = actor(request)
        value = call(lambda: backend.by_command(user, command_id))
        if value is None: raise HTTPException(404, '未找到原指令任务')
        return value

    @router.get('/jobs/{job_id}')
    def get(job_id: str, request: Request):
        user = actor(request)
        return call(lambda: backend.get(user, job_id))

    @router.post('/jobs/{job_id}/submit', dependencies=writes)
    def submit(job_id: str, body: ProgramIdentity, request: Request):
        user = actor(request)
        return call(lambda: coordinator.submit(user, job_id, body.digest))

    @router.post('/jobs/{job_id}/start', dependencies=writes)
    def start(job_id: str, body: ProgramIdentity, request: Request):
        user = actor(request)
        return call(lambda: coordinator.start(user, job_id, body.digest))

    @router.post('/jobs/{job_id}/sync', dependencies=writes)
    def sync(job_id: str, body: Strict, request: Request):
        user = actor(request)
        return call(lambda: coordinator.sync(user, job_id))

    @router.post('/parts/{part_id}/inspect', dependencies=writes)
    def inspect(part_id: str, body: OutputIdentity, request: Request):
        user = actor(request)
        return call(lambda: coordinator.inspect(user, part_id, body.output_digest))

    @router.get('/quality')
    def quality(request: Request, design_run_id: str, batch_id: str, owner_job_id: str = ''):
        user = actor(request)
        return call(lambda: backend.quality(user, design_run_id, batch_id, owner_job_id))

    return router
