from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from shared.freecad_documents import CadDocumentError
from app.team.routes import internal_auth


def create_router(get_service):
    router = APIRouter()

    @router.post('/internal/cad/documents/{operation}')
    def call(operation: str, body: dict, request: Request):
        internal_auth(request)
        try:
            return get_service().call(operation, body)
        except CadDocumentError as error:
            return JSONResponse(status_code=error.status_code, content={'code':error.code,'detail':error.message})
        except (ValidationError, ValueError):
            return JSONResponse(status_code=422, content={'code':'payload_invalid','detail':'CAD请求字段无效'})
        except Exception:
            return JSONResponse(status_code=503, content={'code':'storage_unavailable','detail':'CAD持久存储不可用'})

    return router
