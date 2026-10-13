"""只读失败任务记录；失败步骤续跑接口已移除。"""
from fastapi import APIRouter, HTTPException, Request

from app.api.team_auth import team_actor


def build_task_recovery_router(runtime, require_write_auth, *, actor_lookup=team_actor):
    router = APIRouter(prefix='/api/runtime/recovery')

    def manager():
        value = getattr(runtime.container, 'recovery', None)
        if value is None:
            raise HTTPException(503, '失败任务记录服务不可用')
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
            return {'items': [{**item,'can_resume':False} for item in items],
                    'readonly':True,'storage_warning':getattr(manager(),'case_storage_warning','')}
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(503, '失败记录暂不可读取，请稍后刷新') from None

    return router
