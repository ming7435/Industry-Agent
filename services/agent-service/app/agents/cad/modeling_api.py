"""只挂载 CAD 生产建模接口，不修改其他业务路由。"""

from __future__ import annotations

from threading import Lock
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse

from .agent import CADAgent
from .schemas import ConfirmRequest, DesignRequest, DispatchRequest, ImportRequest, ManufacturingRequest, RevisionRequest
from .modeling_service import CADDesignConflict
from .manufacturing_service import CADManufacturingService


def build_modeling_router(require_auth, trace=None):
    router = APIRouter(prefix="/api/cad/designs", tags=["CAD 生产建模"], dependencies=[Depends(require_auth)])
    service_lock = Lock()
    owned_services = set()
    owned_manufacturing = set()

    def service(request):
        with service_lock:
            if not getattr(request.app.state, "cad_modeling_service", None):
                agent = CADAgent()
                request.app.state.cad_modeling_service = agent.production_modeling(
                    root=getattr(request.app.state, "cad_modeling_root", None), trace=trace)
                owned_services.add(request.app.state.cad_modeling_service)
            return request.app.state.cad_modeling_service

    def shutdown():
        # 只关闭本路由创建的 CAD 队列；已有任务有界排空，其他服务不受影响。
        with service_lock:
            services = list(owned_services)
            manufacturers = list(owned_manufacturing)
        for instance in manufacturers:
            instance.close()
        for instance in services:
            instance.close()

    router.add_event_handler("shutdown", shutdown)

    def manufacturing(request):
        modeling = service(request)
        with service_lock:
            if not getattr(request.app.state, "cad_manufacturing_service", None):
                from app.config import get_settings
                request.app.state.cad_manufacturing_service = CADManufacturingService(
                    modeling, get_settings().factory_api_base_url)
                owned_manufacturing.add(request.app.state.cad_manufacturing_service)
            return request.app.state.cad_manufacturing_service

    def call(operation, *arguments):
        try:
            return operation(*arguments)
        except KeyError as error:
            raise HTTPException(404, detail="CAD 任务或文件不存在") from error
        except CADDesignConflict as error:
            raise HTTPException(409, detail=str(error)) from error
        except OverflowError as error:
            raise HTTPException(413, detail=str(error)) from error
        except ValueError as error:
            raise HTTPException(422, detail=str(error) or "CAD 请求或上传内容无效") from error

    @router.get("/status")
    def status(request: Request):
        value = service(request).kernel.health()
        return {**value, **manufacturing(request).capabilities(), "service": "cad-agent-modeling",
            "formats": ["step", "stp", "dxf", "pdf", "png", "jpg", "jpeg"]}

    @router.get("")
    def list_designs(request: Request):
        items = service(request).list()
        return {"items": items, "count": len(items)}

    @router.post("", status_code=202)
    def create(body: DesignRequest, request: Request):
        return call(service(request).submit, body, request.headers.get("Idempotency-Key") or body.command_id)

    @router.post("/import", status_code=202)
    def import_drawing(body: ImportRequest, request: Request):
        return call(service(request).submit, body, request.headers.get("Idempotency-Key") or body.command_id)

    @router.get("/{design_id}")
    def get_design(design_id: str, request: Request):
        return call(service(request).get, design_id)

    @router.post("/{design_id}/revisions", status_code=202)
    def revise(design_id: str, body: RevisionRequest, request: Request):
        return call(service(request).revise, design_id, body, request.headers.get("Idempotency-Key") or body.command_id)

    @router.post("/{design_id}/confirm")
    def confirm(design_id: str, body: ConfirmRequest, request: Request, actor: str = Depends(require_auth)):
        return call(service(request).confirm, design_id, body.digest, actor)

    @router.get("/{design_id}/artifacts/{artifact_id}")
    def artifact(design_id: str, artifact_id: str, request: Request, download: bool = False):
        path, record = call(service(request).artifact, design_id, artifact_id)
        return FileResponse(path, media_type=record["media_type"], filename=record["filename"],
            content_disposition_type="attachment" if download else "inline", headers={"X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-cache"})

    @router.get("/{design_id}/manufacturing")
    def list_manufacturing(design_id: str, request: Request):
        items = call(manufacturing(request).list, design_id)
        return {"items": items, "count": len(items)}

    @router.post("/{design_id}/manufacturing", status_code=201)
    def prepare_manufacturing(design_id: str, body: ManufacturingRequest, request: Request, actor: str = Depends(require_auth)):
        return call(manufacturing(request).prepare, design_id, body, actor)

    @router.get("/{design_id}/manufacturing/{program_id}")
    def get_manufacturing(design_id: str, program_id: str, request: Request):
        return call(manufacturing(request).get, design_id, program_id)

    @router.post("/{design_id}/manufacturing/{program_id}/dispatch")
    def dispatch_manufacturing(design_id: str, program_id: str, body: DispatchRequest, request: Request, actor: str = Depends(require_auth)):
        return call(manufacturing(request).dispatch, design_id, program_id, body, actor)

    @router.get("/{design_id}/manufacturing/{program_id}/production")
    def get_production(design_id: str, program_id: str, request: Request):
        return call(manufacturing(request).production, design_id, program_id)

    @router.get("/{design_id}/manufacturing/{program_id}/files/{kind}")
    def manufacturing_file(design_id: str, program_id: str, kind: str, request: Request, download: bool = False):
        path, record = call(manufacturing(request).file, design_id, program_id, kind)
        return FileResponse(path, media_type=record["media_type"], filename=record["filename"],
            content_disposition_type="attachment" if download else "inline", headers={"X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-cache"})

    return router
