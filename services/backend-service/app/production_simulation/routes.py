"""Internal-only operations; account authority is always resolved from the directory."""
import os
from hashlib import sha256
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from ..team.routes import internal_auth
from shared.virtual_turning import VirtualProductionError
from .service import VirtualProductionService


class Strict(BaseModel):
    model_config = ConfigDict(extra='forbid', strict=True)


class Actor(Strict):
    actor_id: str = Field(min_length=1, max_length=128)


class Prepare(Actor):
    command_id: str = Field(min_length=1, max_length=128)
    run: dict
    setup: dict
    material: str = Field(min_length=1, max_length=200)
    batch_id: str = Field(default='', max_length=128)


class Get(Actor):
    job_id: str


class ByCommand(Actor):
    command_id: str


class Jobs(Actor):
    design_run_id: str = ''
    batch_id: str = ''
    cursor: str = ''
    limit: int = Field(default=50, ge=1, le=50)


class Receipt(Strict):
    job_id: str
    expected_revision: int = Field(ge=1)
    receipt: dict


class ActorReceipt(Receipt, Actor): pass


class SyncError(Strict):
    job_id: str
    expected_revision: int = Field(ge=1)
    code: str = Field(min_length=1, max_length=128)


class ActorError(SyncError, Actor):
    outcome_unknown: bool = False


class Output(Actor):
    part_id: str


class Inspect(Output):
    expected_output_digest: str


class Quality(Actor):
    design_run_id: str
    batch_id: str
    owner_job_id: str = ''


class Pending(Strict):
    now: float = Field(ge=0, allow_inf_nan=False)
    cursor: str = ''
    limit: int = Field(default=50, ge=1, le=50)


class RunFacts(Actor):
    job_ids: list[str] = Field(max_length=200)


class SessionActor(Strict):
    token: str = Field(min_length=1, max_length=1024)


MODELS = {'prepare': Prepare, 'get': Get, 'by_command': ByCommand, 'list_jobs': Jobs,
          'record_receipt': ActorReceipt, 'record_sync_error': ActorError, 'output': Output,
          'inspect': Inspect, 'quality': Quality, 'pending': Pending, 'sync_receipt': Receipt, 'sync_error': SyncError,
          'session_actor': SessionActor, 'run_facts': RunFacts}
RUNTIME = {'pending', 'sync_receipt', 'sync_error'}


def create_router(get_service):
    router = APIRouter(prefix='/internal/production/virtual')

    @router.post('/{operation}')
    def call(operation: str, body: dict, request: Request):
        internal_auth(request)
        if operation not in MODELS: raise HTTPException(404, '生产操作不存在')
        # Runtime authority must never rely on the isolated-development auth exemption.
        if operation in RUNTIME and not os.getenv('BACKEND_INTERNAL_TOKEN', '').strip():
            raise HTTPException(503, '后台对账需要配置共享内部认证')
        try:
            arguments = MODELS[operation].model_validate(body).model_dump()
        except ValidationError as error:
            raise HTTPException(422, error.errors(include_context=False)) from None
        try:
            backend = get_service()
            service = VirtualProductionService(backend.repository)
            if operation == 'session_actor':
                directory = backend.team.repository
                identity = directory.session_user(sha256(arguments['token'].encode()).hexdigest())
                if identity is None: return {'result': None}
                with directory.transaction() as db:
                    row = db.execute("SELECT user_id,username,role,enabled FROM team_accounts WHERE user_id=? AND enabled=1 AND role IN ('technician','supervisor')", (identity,)).fetchone()
                return {'result': dict(row) if row is not None else None}
            if operation in RUNTIME:
                return {'result': getattr(service, operation)(**arguments)}
            identity = arguments.pop('actor_id')
            with backend.team.repository.transaction() as db:
                row = db.execute('SELECT user_id,username,role,enabled FROM team_accounts WHERE user_id=? AND enabled=1', (identity,)).fetchone()
            if row is None: raise HTTPException(401, '生产操作人员不存在或已停用')
            actor = dict(row)
            return {'result': getattr(service, operation)(actor=actor, **arguments)}
        except VirtualProductionError as error:
            raise HTTPException(error.status, {'code': error.code, 'message': error.message}) from None
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(503, {'code': 'production_store_unavailable', 'message': '生产存储暂不可用，请核对原任务'}) from None

    return router
