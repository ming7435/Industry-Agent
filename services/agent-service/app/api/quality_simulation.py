"""Read CAD and virtual station; do not execute machine control or formal QMS."""
import json
import os
from urllib.request import Request as UrlRequest, urlopen
from urllib.parse import urlparse
from hashlib import sha256

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from app.clients.backend import BackendServiceClient, BackendServiceError
from app.api.team_auth import team_actor
from app.agents.cad.modeling_api import get_freecad_run_record
from shared import simulated_part_design_quality as sim


class DetectRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    design_run_id: str = Field(pattern=r'^FC-[a-f0-9]{64}$', max_length=67)
    request_id: str = Field(min_length=1, max_length=128, pattern=r'^[A-Za-z0-9_-]+$')


def read_factory_snapshot():
    base = os.getenv('FACTORY_API_BASE_URL', 'http://127.0.0.1:4529').rstrip('/')
    request = UrlRequest(base + '/api/snapshot?device_id=' + sim.DEVICE_ID, headers={'Accept': 'application/json'})
    with urlopen(request, timeout=5) as response:
        payload = response.read(2 * 1024 * 1024 + 1)
    if len(payload) > 2 * 1024 * 1024: raise ValueError('模拟工厂快照超出响应上限')
    result = json.loads(payload)
    if not isinstance(result, dict): raise ValueError('模拟工厂快照不是有效对象')
    return result


def build_simulation_router(require_write_auth, *, backend_factory=BackendServiceClient,
                            cad_reader=get_freecad_run_record, factory_reader=read_factory_snapshot,recovery=None):
    router = APIRouter(prefix='/api/quality/simulation')

    def context(request):
        backend = backend_factory()
        actor = team_actor(request, backend)
        return backend, actor['user_id']

    def stored(backend, actor, operation, **body):
        try:
            return backend.request('/internal/quality/simulation/' + operation, {'actor_id': actor, **body})['result']
        except BackendServiceError as error:
            code = error.status_code if error.status_code in {401, 403, 409, 422} else 503
            message = str(error) if code == 409 else '模拟检测后端暂不可用；提交结果需按原请求编号核对'
            from app.runtime.service_exceptions import _text
            failure=HTTPException(code,message)
            failure.service_error=_text(error)
            raise failure from None

    def standard(request, run_id, saved):
        try:
            basis = sim.build_basis(cad_reader(request, run_id))
        except HTTPException as error:
            if error.status_code != 404 or not saved.get('basis'): raise
            basis = sim.verify_basis(saved['basis'])
        if saved.get('basis') and saved['basis']['digest'] != basis['digest']:
            raise ValueError('同一完整设计版本的已保存标准发生变化，请复核')
        if basis['run_id'] != run_id: raise ValueError('建模返回了其他设计版本')
        return basis

    @router.get('/capabilities')
    def capabilities(request: Request):
        backend, actor = context(request)
        result = stored(backend, actor, 'capabilities')
        return {**result, 'enabled': result.get('enabled') is True and sim.enabled(),
                'reason': '' if result.get('enabled') is True and sim.enabled() else '模拟检测未启用，或当前不是虚拟工厂开发环境'}

    @router.get('/designs')
    def designs(request: Request):
        backend, actor = context(request)
        return {'items': stored(backend, actor, 'designs')}

    @router.get('/designs/{design_run_id}')
    def design(design_run_id: str, request: Request):
        backend, actor = context(request)
        saved = stored(backend, actor, 'design', design_run_id=design_run_id)
        try:
            return {'basis': standard(request, design_run_id, saved), 'latest': saved.get('latest')}
        except HTTPException as error:
            if not saved.get('latest') or error.status_code not in {404, 409, 502, 503}: raise
            return {'basis': None, 'latest': saved['latest'], 'standard_error': str(error.detail), 'source_status': error.status_code}
        except ValueError as error:
            if saved.get('latest'):
                return {'basis': None, 'latest': saved['latest'], 'standard_error': str(error), 'source_status': 409}
            raise HTTPException(409, str(error)) from None

    @router.get('/requests/{request_id}')
    def reconcile(request_id: str, request: Request):
        backend, actor = context(request)
        result = stored(backend, actor, 'request', request_id=request_id)
        if result is None: raise HTTPException(404, '尚未查到本次模拟检测结果；这不表示提交已取消')
        return result

    @router.post('/detect', dependencies=[Depends(require_write_auth)])
    def detect(body: DetectRequest, request: Request):
        origin = request.headers.get('origin')
        if origin and urlparse(origin).netloc != request.headers.get('host'):
            raise HTTPException(403, '仅允许同源模拟检测请求')
        backend, actor = context(request)
        identity=sha256(json.dumps([actor,body.request_id,body.design_run_id]).encode()).hexdigest()[:24]
        state={'task_id':'TASK-SIM-'+identity,'trace_id':'TRACE-SIM-'+identity,
               'recovery_actor_id':actor,'subject_summary':'图纸参数检测服务异常'}
        case_recovery=recovery or getattr(request.app.state,'service_exception_recovery',None)
        failure_status='failed'
        failure_error=''
        from app.runtime.service_exceptions import record_service_failure
        def execute():
            nonlocal failure_status,failure_error
            existing = stored(backend, actor, 'request', request_id=body.request_id)
            if existing is not None:
                if existing.get('design_run_id') != body.design_run_id: raise HTTPException(409, '同一请求不能更换设计版本')
                return existing
            try:
                sim.require_enabled()
                saved = stored(backend, actor, 'design', design_run_id=body.design_run_id)
                basis = standard(request, body.design_run_id, saved)
                state.update(part_id=basis.get('part_number') or '',subject_summary=(basis.get('part_name') or '零件')+' 图纸参数检测服务异常')
                try:
                    snapshot = factory_reader()
                except Exception as error:
                    failure_error=str(error)
                    raise HTTPException(503, {'message': '模拟工厂或比对仪连接不可用，未生成检测样本', 'execution_started': False}) from None
                sim.validate_station(snapshot)
            except ValueError as error:
                raise HTTPException(409, str(error)) from None
            try:
                return stored(backend, actor, 'detect', request_id=body.request_id, run=basis, snapshot=snapshot)
            except HTTPException as error:
                if error.status_code>=500:
                    failure_status='outcome_unknown'
                raise
        try:
            return execute()
        except HTTPException as error:
            if error.status_code>=500:
                record_service_failure(case_recovery,'quality',state,
                    failure_error or getattr(error,'service_error','') or error.detail,status=failure_status)
            raise

    return router
