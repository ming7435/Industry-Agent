"""仅内部 Agent 可写账本；浏览器只读经过过滤的状态。"""
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from ..team.routes import internal_auth
from .repository import LineControlRepository


def create_router(get_service):
    router = APIRouter()

    def sync_reports():
        try:
            get_service().sync_lifecycle_reports()
        except Exception:
            # The persisted pending report intent is retried by report reads.
            pass

    @router.post('/internal/line/{operation}')
    def call(operation: str, body: dict, request: Request, background_tasks: BackgroundTasks):
        internal_auth(request)
        allowed = {'status', 'claim_fault_event', 'claim_control', 'record_device_control', 'set_stop_result', 'begin_restart', 'finish_restart', 'list_open_faults'}
        if operation not in allowed:
            raise HTTPException(404, '未知账本操作')
        try:
            if operation == 'begin_restart' and body.get('manual_confirmation') is True:
                import os
                from shared.technician_confirmation import trusted_technician_confirmation
                order = get_service().repository.get(str(body.get('workorder_id') or '')) or {}
                if os.getenv('FACTORY_CONTROL_MODE', '').lower() != 'virtual' or not trusted_technician_confirmation(order):
                    raise ValueError('直接启动必须来自虚拟工厂中的维修人员确认')
            ledger = LineControlRepository(get_service().team.repository)
            result = getattr(ledger, operation)(**body)
            if operation == 'finish_restart' and result.get('state') == 'running' and result.get('generation') == body.get('generation'):
                # Send the committed control receipt before report work starts;
                # slow reports must not look like a failed restart to the Agent.
                background_tasks.add_task(sync_reports)
            return {'result': result}
        except ValueError as error:
            raise HTTPException(409, str(error))

    @router.get('/api/team/line')
    def status():
        line = LineControlRepository(get_service().team.repository).status()
        return {k: line.get(k) for k in ('state', 'generation', 'updated_at', 'devices', 'reason', 'rollback')}

    return router
