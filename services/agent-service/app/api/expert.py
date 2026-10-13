"""专家中心接口：身份来自 Backend 会话，不接受客户端声明审批或权限。"""

import os

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.api.team_auth import team_actor
from app.skills.registry import get_skill_registry
from app.skills.management import SkillEditError, SkillManager
from app.skills.machine_testing import MachineTrials
from app.clients.backend import BackendServiceError
from app.monitor.factory_api import FactoryApiError


def can_edit_skills(actor):
    """复用已认证小组身份；当前 Backend 实际支持维修人员登录。"""
    return actor.get("role") in {"technician", "supervisor"}


class SkillDraft(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expected_revision: str = Field(pattern=r"^[a-f0-9]{64}$")
    version: str = Field(max_length=48, pattern=r"^\d+(?:\.\d+){1,3}$")
    goal: str = Field(min_length=1, max_length=300)
    document: str = Field(min_length=1, max_length=24000)
    reason: str = Field(min_length=1, max_length=500)

    @field_validator("goal", "document", "reason")
    @classmethod
    def nonempty_text(cls, value):
        if not value.strip() or any(ord(c) < 32 and c not in "\n\r\t" for c in value):
            raise ValueError("内容不能为空或含控制字符")
        return value


class SkillUpdate(SkillDraft):
    test_id: str = Field(default='', max_length=32, pattern=r'^(?:[a-f0-9]{32})?$')
    human_confirmed: bool = Field(default=False, strict=True)


class FaultSample(BaseModel):
    model_config = ConfigDict(extra='forbid')
    alarm_code: str = Field(default='', max_length=48, pattern=r'^[a-zA-Z0-9_-]*$')
    alarm_definition: str = Field(default='', max_length=1000)
    scenario: str = Field(min_length=1, max_length=6000)
    expected: str = Field(min_length=1, max_length=2000)
    severity: str = Field(default='warning', pattern=r'^(warning|critical)$')
    occurrence_count: int = Field(default=1, ge=1, le=100)
    abnormal_metrics: list[dict] = Field(default_factory=list, max_length=20)
    history_metric: str = Field(default='', max_length=120)
    history_values: list[float] = Field(default_factory=list, max_length=60)

    @field_validator('history_values')
    @classmethod
    def finite_values(cls, values):
        from math import isfinite
        if any(not isfinite(value) for value in values):
            raise ValueError('历史指标样例必须是有限数值')
        return values

    @field_validator('scenario', 'expected')
    @classmethod
    def nonempty(cls, value):
        return SkillDraft.nonempty_text(value)


class SkillTrial(SkillDraft):
    sample: FaultSample


from app.skills.task_testing import TaskSample
from app.skills.review_testing import ReviewSample


class TaskTrial(SkillDraft):
    task: TaskSample | ReviewSample


class MachineSample(BaseModel):
    model_config = ConfigDict(extra='forbid')
    device_id: str = Field(min_length=1, max_length=120)
    scenario_id: str = Field(min_length=1, max_length=120)
    expected: str = Field(min_length=1, max_length=2000)

    @field_validator('expected')
    @classmethod
    def nonempty(cls, value):
        return SkillDraft.nonempty_text(value)


class MachineTrial(SkillDraft):
    machine: MachineSample


class MachineFinish(BaseModel):
    model_config = ConfigDict(extra='forbid')
    workorder_id: str = Field(min_length=1, max_length=120)
    feedback: str = Field(min_length=1, max_length=6000)

    @field_validator('feedback')
    @classmethod
    def nonempty(cls, value):
        return SkillDraft.nonempty_text(value)


def build_expert_router(runtime, require_auth):
    container = runtime.container
    registry = getattr(container, "skill_registry", None) or get_skill_registry()
    tools = getattr(getattr(getattr(container, "registry", None), "mcp", None), "handlers", {})
    manager = SkillManager(registry, tools, trace=getattr(container, "trace", None))
    manager.trials = MachineTrials(manager, runtime)
    if getattr(container, 'operations', None) is not None:
        container.operations.expert_trials = manager.trials
    router = APIRouter(prefix="/api/expert", dependencies=[Depends(require_auth)])

    def run(action, *args, **kwargs):
        try:
            return action(*args, **kwargs)
        except SkillEditError as error:
            raise HTTPException(error.status, str(error)) from None
        except (BackendServiceError, FactoryApiError):
            raise HTTPException(503, '模拟机器或业务服务暂不可用，请核对监控中心后重试') from None
        except (OSError, ValueError):
            # 不返回内部文件路径、供应商配置或异常堆栈。
            raise HTTPException(503, "技能文档暂不可读写，原有文件与备份保留，请检查服务日志") from None

    @router.get("/skills")
    def catalog(request: Request, loop_only: bool = True):
        actor = team_actor(request)
        return {**run(manager.catalog, loop_only), "can_edit": can_edit_skills(actor)}

    @router.get("/skills/{agent}/{name}")
    def detail(agent: str, name: str, request: Request):
        actor = team_actor(request)
        return {**run(manager.detail, agent, name), "can_edit": can_edit_skills(actor)}

    def write_actor(request):
        actor = team_actor(request)
        if not can_edit_skills(actor):
            raise HTTPException(403, "仅有效维修小组账号可以更新技能")
        port = os.getenv("MONITOR_WEB_PORT", "8001")
        origins = {str(request.base_url).rstrip("/"), f"http://127.0.0.1:{port}", f"http://localhost:{port}"}
        if request.headers.get("origin") not in origins:
            raise HTTPException(403, "技能更新需要同源 Origin")
        return actor

    @router.post('/skills/{agent}/{name}/test')
    def test(agent: str, name: str, values: SkillTrial, request: Request):
        return run(manager.trials.start, agent, name, values.model_dump(), write_actor(request))

    @router.get('/tests/{test_id}')
    def test_result(test_id: str, request: Request):
        return run(manager.trials.get, test_id, team_actor(request))

    @router.post('/skills/{agent}/{name}/task-test')
    def task_test(agent: str, name: str, values: TaskTrial, request: Request):
        return run(manager.trials.start_task, agent, name, values.model_dump(), write_actor(request))

    @router.get('/machines')
    def machines(request: Request):
        return run(manager.trials.catalog_machines, team_actor(request))

    @router.post('/skills/{agent}/{name}/machine-test')
    def machine_test(agent: str, name: str, values: MachineTrial, request: Request):
        return run(manager.trials.start_machine, agent, name, values.model_dump(), write_actor(request))

    @router.post('/tests/{test_id}/finish')
    def finish(test_id: str, values: MachineFinish, request: Request):
        from app.api.team_auth import require_assignee
        actor = write_actor(request)
        receipt = run(manager.trials.get, test_id, actor)
        if receipt.get('mode') != 'machine_flow' or values.workorder_id not in [o['workorder_id'] for o in receipt.get('workorders') or []]:
            raise HTTPException(409, '只能确认本次测试生成的工单')
        require_assignee(values.workorder_id, actor, manager.trials.backend)
        run(container.operations.execute_workorder, 'mark_repair_completed',
            {'workorder_id': values.workorder_id, 'repair_feedback': values.feedback}, 'router', actor_id=actor['user_id'])
        return run(manager.trials.get, test_id, actor)

    @router.post("/skills/{agent}/{name}")
    def update(agent: str, name: str, values: SkillUpdate, request: Request):
        return {**run(manager.publish, agent, name, values.model_dump(), write_actor(request)), "can_edit": True}

    from app.api.skill_evolution import include_evolution_routes
    include_evolution_routes(router, manager, write_actor, run, MachineSample)
    return router, manager
