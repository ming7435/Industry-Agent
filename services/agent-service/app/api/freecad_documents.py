import os
from pathlib import Path
from urllib.parse import urlsplit
from fastapi import APIRouter,Depends,HTTPException,Request
from fastapi.responses import FileResponse
from pydantic import Field,StrictStr

from shared.freecad_documents import CadDocumentError,CommandEnvelope,Contract,Revision
from app.api.team_auth import team_actor
from app.cad_documents import documents_enabled


class CreateDocument(Contract):
    request_id: StrictStr = Field(min_length=1,max_length=128,pattern=r'^[A-Za-z0-9_-]+$')
    part_name: StrictStr = Field(min_length=1,max_length=128)
    part_number: StrictStr = Field(pattern=r'^(?:[0-9]{5})?$')
    source_run_id: StrictStr | None = Field(default=None,pattern=r'^FC-[a-f0-9]{64}$')


class PublishDocument(Contract):
    command_id: StrictStr = Field(pattern=r'^CMD-[A-Za-z0-9_-]{1,128}$')
    expected_revision: Revision


class ProposeDocument(Contract):
    prompt: StrictStr=Field(min_length=1,max_length=4000)
    expected_revision: Revision


def same_origin(request):
    origin=request.headers.get('origin')
    if not origin: return  # Non-browser authenticated clients have no Origin.
    parsed=urlsplit(origin)
    if parsed.scheme not in {'http','https'} or parsed.path or parsed.query or parsed.fragment or parsed.username or parsed.password:
        raise HTTPException(403,'CAD只允许完整的同源请求')
    allowed={request.headers.get('host','')}
    monitor_port=os.getenv('MONITOR_WEB_PORT','8001')
    allowed.update({f'127.0.0.1:{monitor_port}',f'localhost:{monitor_port}',f'[::1]:{monitor_port}'})
    if parsed.netloc not in allowed or (parsed.netloc!=request.headers.get('host') and parsed.scheme!='http'):
        raise HTTPException(403,'CAD只允许同源请求')


def application_for_request(request):
    from app.cad_documents.artifacts import ArtifactStore
    from app.cad_documents.service import CadDocumentApplication
    from app.agents.cad.modeling_api import get_freecad_run_record
    root=Path(__file__).resolve().parents[4]
    artifacts=ArtifactStore(Path(os.getenv('FREECAD_DOCUMENT_ARTIFACT_ROOT',str(root/'output/freecad-documents'))))
    return CadDocumentApplication(artifacts=artifacts,source_reader=lambda run_id:get_freecad_run_record(request,run_id))


def build_document_router(require_write_auth,application_factory=application_for_request):
    router=APIRouter(prefix='/api/cad/freecad')

    def app_actor(request):
        if not request.cookies.get('maintenance_session'): raise HTTPException(401,'请先登录账号')
        try: application=application_factory(request)
        except Exception: raise HTTPException(503,'CAD持久存储连接尚未就绪') from None
        return application,team_actor(request,application.backend)['user_id']

    def call(operation,*args,**kwargs):
        try: return operation(*args,**kwargs)
        except CadDocumentError as error: raise HTTPException(error.status_code,error.message) from None
        except ValueError: raise HTTPException(422,'CAD参数或来源文件无效') from None

    def writing(request:Request):
        require_write_auth(request)
        same_origin(request)
        if not documents_enabled(): raise HTTPException(503,'原生文档编辑尚未启用')

    @router.get('/documents')
    def documents(request:Request,cursor:str='',limit:int=50):
        application,actor=app_actor(request)
        return call(application.documents,actor,cursor,limit)

    @router.get('/capabilities')
    def capabilities():
        from app.cad_documents.capabilities import current_capabilities
        return current_capabilities()

    @router.get('/designs')
    def designs(request:Request,cursor:str='',limit:int=50):
        from app.cad_documents.publishing import CadDocumentPublisher
        application,actor=app_actor(request)
        return call(CadDocumentPublisher(application).designs,actor,cursor,limit)

    @router.post('/documents',status_code=202,dependencies=[Depends(writing)])
    def create(body:CreateDocument,request:Request):
        application,actor=app_actor(request)
        return call(application.create,actor,body)

    @router.get('/documents/{document_id}')
    def head(document_id:str,request:Request):
        application,actor=app_actor(request)
        return call(application.head,actor,document_id)

    @router.get('/documents/{document_id}/snapshots/{revision}')
    def snapshot(document_id:str,revision:int,request:Request):
        application,actor=app_actor(request)
        return call(application.snapshot,actor,document_id,revision)

    @router.post('/documents/{document_id}/commands',status_code=202,dependencies=[Depends(writing)])
    def submit(document_id:str,body:CommandEnvelope,request:Request):
        application,actor=app_actor(request)
        if body.document_id!=document_id: raise HTTPException(422,'命令文档身份不一致')
        return call(application.submit,actor,body)

    @router.post('/documents/{document_id}/proposals',dependencies=[Depends(writing)])
    def propose(document_id:str,body:ProposeDocument,request:Request):
        from app.cad_documents.proposal import propose_document_command
        from app.clients.model import ModelServiceClient
        application,actor=app_actor(request)
        head=call(application.head,actor,document_id)
        if head.revision!=body.expected_revision: raise HTTPException(409,'文档已更新，请重新读取修订')
        snapshot=call(application.snapshot,actor,document_id,head.revision)
        return call(propose_document_command,head,snapshot,body.prompt,ModelServiceClient())

    @router.get('/documents/{document_id}/commands/{command_id}')
    def command(document_id:str,command_id:str,request:Request):
        application,actor=app_actor(request)
        return call(application.command,actor,document_id,command_id)

    @router.post('/documents/{document_id}/publish',status_code=202,dependencies=[Depends(writing)])
    def publish(document_id:str,body:PublishDocument,request:Request):
        from app.cad_documents.publishing import CadDocumentPublisher
        application,actor=app_actor(request)
        return call(CadDocumentPublisher(application).publish,actor,document_id,body.command_id,body.expected_revision)

    @router.get('/documents/{document_id}/snapshots/{revision}/artifacts/{name}')
    def artifact(document_id:str,revision:int,name:str,request:Request):
        application,actor=app_actor(request)
        snapshot=call(application.snapshot,actor,document_id,revision)
        entry=next((a for a in snapshot.artifacts if a['name']==name),None)
        if entry is None: raise HTTPException(404,'该修订没有此产物')
        path=call(application.artifacts.entry_path,entry)
        from app.tools.cad.freecad_mcp import ARTIFACT_TYPES
        media=ARTIFACT_TYPES.get(name,'application/json' if name.endswith('.json') else 'model/stl')
        return FileResponse(path,media_type=media,filename=name,headers={'X-Content-Type-Options':'nosniff',
                           'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; sandbox"})

    return router
