from __future__ import annotations

from pydantic import BaseModel, Field


class ExperienceSearchRequest(BaseModel):
    device_id: str = ""
    device_model: str = ""
    alarm_code: str = ""
    fault_type: str = ""
    component: str = ""
    part_no: str = ""
    query: str = ""
    limit: int = Field(default=20, ge=1, le=100)
