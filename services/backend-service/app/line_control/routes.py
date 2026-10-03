"""仅内部 Agent 可写账本；浏览器只读经过过滤的状态。"""
from fastapi import APIRouter, HTTPException, Request
from ..team.routes import internal_auth
from .repository import LineControlRepository


def create_router(get_service):
    router = APIRouter()

    @router.post('/internal/line/{operation}')
    def call(operation: str, body: dict, request: Request):
        internal_auth(request)
        allowed = {'status', 'claim_fault_event', 'claim_control', 'record_device_control', 'set_stop_result', 'begin_restart', 'finish_restart', 'list_open_faults'}
        if operation not in allowed:
            raise HTTPException(404, '未知账本操作')
        try:
            ledger = LineControlRepository(get_service().team.repository)
            return {'result': getattr(ledger, operation)(**body)}
        except ValueError as error:
            raise HTTPException(409, str(error))

    @router.get('/api/team/line')
    def status():
        line = LineControlRepository(get_service().team.repository).status()
        return {k: line.get(k) for k in ('state', 'generation', 'updated_at', 'devices', 'reason', 'rollback')}

    return router
