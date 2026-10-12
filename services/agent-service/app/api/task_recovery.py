"""Authenticated recovery of server-owned checkpoints; request bodies carry no execution state."""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from urllib.parse import urlsplit

from app.api.team_auth import team_actor
from app.runtime.recovery import RecoveryConflict


class ResumeRequest(BaseModel):
    model_config = ConfigDict(extra='forbid', strict=True)
    request_id: str = Field(min_length=1, max_length=128, pattern=r'^[A-Za-z0-9_.:-]+$')


def build_task_recovery_router(runtime, require_write_auth, *, actor_lookup=team_actor):
    router = APIRouter(prefix='/api/runtime/recovery')

    def manager():
        value = getattr(runtime.container, 'recovery', None)
        if value is None:
            raise HTTPException(503, '任务恢复服务不可用')
        return value

    def permitted(record, actor):
        state = record.get('state') or record
        owner = state.get('recovery_actor_id') or state.get('actor_id')
        if record.get('kind') == 'production':
            return bool(owner and owner == actor.get('user_id'))
        device_id = (state.get('event') or {}).get('device_id') or state.get('device_id')
        responsible = actor.get('role') == 'technician' and device_id and device_id in actor.get('responsible_device_ids', [])
        return actor.get('role') == 'supervisor' or bool(owner and owner == actor.get('user_id')) or bool(responsible)

    @router.get('')
    def listing(request: Request):
        actor = actor_lookup(request)
        try:
            items = [item for item in manager().list() if permitted(item, actor)]
            return {'items': items}
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(503, '恢复记录暂不可读取，请稍后刷新') from None

    @router.post('/{recovery_id}/resume', dependencies=[Depends(require_write_auth)])
    def resume(recovery_id: str, body: ResumeRequest, request: Request):
        origin = request.headers.get('origin')
        if origin and urlsplit(origin).netloc != request.headers.get('host'):
            raise HTTPException(403, '仅允许同源任务恢复请求')
        actor = actor_lookup(request)
        recovery = manager()
        try:
            record = recovery.get(recovery_id)
            if record is None:
                raise HTTPException(404, '该记录没有可靠恢复断点，请核对原任务')
            if not permitted(record, actor):
                raise HTTPException(403, '无权恢复其他人员的任务')
            if record['kind'] == 'production':
                production = getattr(runtime.container, 'virtual_production', None)
                if production is None:
                    raise HTTPException(503, '模拟生产服务不可用')
                callback = lambda saved: production.resume_failed(saved, actor)
            else:
                def callback(saved):
                    result = runtime.container.coordinator.resume_failed(saved)
                    events = getattr(runtime.container, 'event_results', None)
                    if events is not None and (result.get('event') or {}).get('event_id'):
                        events.replace_after_recovery(result['event'], result, checkpoint=saved)
                    return result
            return recovery.resume(recovery_id, body.request_id, callback)
        except RecoveryConflict as error:
            raise HTTPException(409, str(error)) from None
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(503, '恢复回执未确认，请刷新原任务状态；请勿重复创建业务任务') from None

    return router
