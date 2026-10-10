"""Authenticated internal transport for isolated numerical inspection batches."""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from shared import simulated_part_design_quality as sim
from ..team.routes import internal_auth
from .service import SimulatedQualityService


class Envelope(BaseModel):
    model_config = ConfigDict(extra='forbid')
    actor_id: str = Field(min_length=1, max_length=128)
    request_id: str = Field(default='', max_length=128)
    design_run_id: str = Field(default='', max_length=67)
    run: dict | None = None
    snapshot: dict | None = None


def create_router(get_service):
    router = APIRouter(prefix='/internal/quality/simulation')

    @router.post('/{operation}')
    def call(operation: str, body: Envelope, request: Request):
        internal_auth(request)
        if operation not in {'capabilities', 'designs', 'design', 'request', 'detect'}:
            raise HTTPException(404, '模拟检测操作不存在')
        try:
            service = SimulatedQualityService(get_service().repository)
            if operation == 'capabilities':
                result = {'enabled': sim.enabled(), 'device_id': sim.DEVICE_ID, 'sample_count': sim.SAMPLE_COUNT,
                          'rule': sim.RULE, 'simulation': True, 'source': sim.SOURCE}
            elif operation == 'designs': result = service.designs(body.actor_id)
            elif operation == 'design': result = service.design(body.actor_id, body.design_run_id)
            elif operation == 'request': result = service.request(body.actor_id, body.request_id)
            else:
                if not body.run or not body.snapshot: raise ValueError('缺少服务端建模标准或工位快照')
                result = service.detect(body.actor_id, body.request_id, body.run, body.snapshot)
            return {'result': result}
        except ValueError as error:
            raise HTTPException(409, str(error)) from None
        except Exception:
            raise HTTPException(503, '模拟检测存储暂不可用，请先核对请求结果') from None

    return router
