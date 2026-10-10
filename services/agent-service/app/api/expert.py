"""专家中心接口：身份来自 Backend 会话，不接受客户端声明审批或权限。"""

import os

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.api.team_auth import team_actor
from app.skills.registry import get_skill_registry
from app.skills.management import SkillEditError, SkillManager


def can_edit_skills(actor):
    """复用已认证小组身份；当前 Backend 实际支持维修人员登录。"""
    return actor.get("role") in {"technician", "supervisor"}


class SkillUpdate(BaseModel):
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


def build_expert_router(runtime, require_auth):
    container = runtime.container
    registry = getattr(container, "skill_registry", None) or get_skill_registry()
    tools = getattr(getattr(getattr(container, "registry", None), "mcp", None), "handlers", {})
    manager = SkillManager(registry, tools, trace=getattr(container, "trace", None))
    router = APIRouter(prefix="/api/expert", dependencies=[Depends(require_auth)])

    def run(action, *args):
        try:
            return action(*args)
        except SkillEditError as error:
            raise HTTPException(error.status, str(error)) from None
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

    @router.post("/skills/{agent}/{name}")
    def update(agent: str, name: str, values: SkillUpdate, request: Request):
        actor = team_actor(request)
        if not can_edit_skills(actor):
            raise HTTPException(403, "仅有效维修小组账号可以更新技能")
        port = os.getenv("MONITOR_WEB_PORT", "8001")
        origins = {str(request.base_url).rstrip("/"), f"http://127.0.0.1:{port}", f"http://localhost:{port}"}
        if request.headers.get("origin") not in origins:
            raise HTTPException(403, "技能更新需要同源 Origin")
        return {**run(manager.update, agent, name, values.model_dump(), actor), "can_edit": True}

    return router, manager
