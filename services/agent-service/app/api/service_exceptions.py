"""服务异常核查记录与人工反馈；不提供失败续跑或设备操作。"""
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel,ConfigDict,Field,field_validator

from app.api.team_auth import team_actor
from app.runtime.service_exceptions import ServiceCaseConflict


class ManualFeedback(BaseModel):
    model_config=ConfigDict(extra='forbid',strict=True)
    request_id:str=Field(min_length=1,max_length=128,pattern=r'^[A-Za-z0-9_.:-]+$')
    feedback:str=Field(min_length=1,max_length=4000)

    @field_validator('feedback')
    @classmethod
    def nonempty(cls,value):
        if not value.strip() or any(ord(c)<32 and c not in '\n\r\t' for c in value):
            raise ValueError('请填写实际处理说明')
        return value


def optional_actor_id(request):
    """历史公开接口仅为异常记录绑定已验证身份，不改变原业务鉴权规则。"""
    if not request.cookies.get('maintenance_session'):
        return ''
    try:
        return str(team_actor(request).get('user_id') or '')
    except HTTPException:
        return ''


def build_service_exception_router(runtime,require_write_auth,*,actor_lookup=team_actor):
    router=APIRouter(prefix='/api/runtime/service-exceptions')

    def cases():
        value=getattr(getattr(runtime.container,'recovery',None),'cases',None)
        if value is None:
            raise HTTPException(503,'异常核查记录服务不可用')
        return value

    def authorized(case_id,request):
        actor=actor_lookup(request)
        try:
            item=cases().get(case_id)
        except KeyError:
            raise HTTPException(404,'异常核查记录不存在') from None
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(503,'异常核查记录暂不可读取') from None
        if not cases().permitted(item,actor):
            raise HTTPException(403,'无权读取其它人员的异常核查记录')
        return actor,item

    @router.get('')
    def listing(request:Request):
        actor=actor_lookup(request)
        try:
            return {'items':cases().list(actor),'scope':'service_exception_record',
                    'storage_warning':getattr(runtime.container.recovery,'case_storage_warning','')}
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(503,'异常核查记录暂不可读取，原失败任务保留') from None

    @router.post('/{case_id}/feedback',dependencies=[Depends(require_write_auth)])
    def feedback(case_id:str,body:ManualFeedback,request:Request):
        origin=request.headers.get('origin')
        if origin and urlsplit(origin).netloc!=request.headers.get('host'):
            raise HTTPException(403,'仅允许同源人工反馈')
        actor,_=authorized(case_id,request)
        try:
            item=cases().handle(case_id,body.feedback,actor,body.request_id)
            return {'success':True,'case':item,'status':item['status'],
                    'message':'已保存人工接管反馈；原业务结果、审批和设备状态保持不变'}
        except PermissionError:
            raise HTTPException(403,'监督人只查看；仅本人或负责设备的维修人员可填写反馈') from None
        except ServiceCaseConflict as error:
            raise HTTPException(409,str(error)) from None
        except ValueError:
            raise HTTPException(422,'处理反馈或请求编号无效') from None
        except Exception:
            raise HTTPException(503,'反馈保存结果未确认，请刷新原记录核对，不要重复处理原业务') from None

    @router.get('/{case_id}/report')
    def report(case_id:str,request:Request):
        authorized(case_id,request)
        try:
            return {'success':True,'report':cases().report(case_id)}
        except Exception:
            raise HTTPException(503,'异常报告暂不可读取，原记录保留') from None

    return router
