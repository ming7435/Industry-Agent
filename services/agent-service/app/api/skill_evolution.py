"""自动修改稿审核入口：身份、版本、验证和发布回执均来自服务端。"""
from fastapi import HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

from app.api.team_auth import team_actor
from app.clients.backend import BackendServiceClient
from app.skills.evolution import SkillEvolution
from app.skills.evolution_worker import EvolutionWorker
from shared.persistence import StorageUnavailable, PendingResultError


def include_evolution_routes(router, manager, write_actor, run, machine_model):
    manager.evolution = SkillEvolution(manager)
    manager.evolution_worker = EvolutionWorker(manager.evolution)

    class HashRequest(BaseModel):
        model_config = ConfigDict(extra='forbid')
        candidate_hash: str = Field(pattern=r'^[a-f0-9]{64}$')

    class ConfirmRequest(HashRequest):
        machine: machine_model

    def action(function, *args):
        try:
            return run(function, *args)
        except (StorageUnavailable, PendingResultError):
            raise HTTPException(503, '自动修改稿MySQL存储暂不可用，旧版未修改') from None

    class LoopControlRequest(BaseModel):
        model_config = ConfigDict(extra='forbid')
        paused: bool = Field(strict=True)

    @router.get('/skill-loop')
    def loop_status(request: Request, agent: str = '', name: str = ''):
        team_actor(request)
        return action(manager.evolution.loop.status, agent, name)

    @router.post('/skill-loop/control')
    def loop_control(values: LoopControlRequest, request: Request):
        actor = write_actor(request)
        result = action(manager.evolution.loop.set_paused, values.paused, actor)
        manager.evolution_worker.wake()
        return {key: result[key] for key in ('paused', 'revision')}

    @router.get('/evolution')
    def catalog(request: Request, agent: str = '', name: str = ''):
        team_actor(request)
        records = action(manager.evolution.list)
        selected = [r for r in records if (not agent or r['agent'] == agent) and (not name or r['name'] == name)]
        summaries = [{key: r.get(key) for key in ('proposal_id', 'agent', 'name', 'status', 'message',
                     'candidate_hash', 'created_at', 'updated_at', 'confirmed_by', 'test_id', 'edit_id')}
                     for r in selected]
        return {'items': summaries, 'worker': manager.evolution_worker.status()}

    @router.get('/evolution/{proposal_id}')
    def detail(proposal_id: str, request: Request):
        team_actor(request)
        record = action(manager.evolution.get, proposal_id)
        return {key: value for key, value in record.items() if key not in {'owner_instance', 'owner_process', 'lease_until'}}

    @router.post('/evolution/{proposal_id}/confirm')
    def confirm(proposal_id: str, values: ConfirmRequest, request: Request):
        actor = write_actor(request)
        token = request.cookies.get('maintenance_session', '')
        resolve_actor = lambda: BackendServiceClient().resolve_session(token)
        result = action(manager.evolution.confirm, proposal_id, values.candidate_hash,
                        values.machine.model_dump(), actor, resolve_actor)
        manager.evolution_worker.wake()
        return {key: result.get(key) for key in ('proposal_id', 'revision', 'status', 'message', 'confirmed_by', 'confirmation_id')}

    @router.post('/evolution/{proposal_id}/reject')
    def reject(proposal_id: str, values: HashRequest, request: Request):
        return action(manager.evolution.reject, proposal_id, values.candidate_hash, write_actor(request))

    @router.post('/evolution/{proposal_id}/publish')
    def publish(proposal_id: str, values: HashRequest, request: Request):
        actor = write_actor(request)
        token = request.cookies.get('maintenance_session', '')
        result = action(manager.evolution.publish, proposal_id, values.candidate_hash, actor,
                        lambda: BackendServiceClient().resolve_session(token))
        return {key: result.get(key) for key in ('proposal_id', 'status', 'message', 'published_by', 'edit_id')}
