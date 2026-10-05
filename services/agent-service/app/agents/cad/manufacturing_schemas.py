"""虚拟车削的显式工艺参数与独立生产确认，不定义真实机床安全阈值。"""

from typing import Annotated, Literal
from pydantic import Field, StrictBool, field_validator

from .modeling_schemas import StrictModel

Positive = Annotated[float, Field(strict=True, gt=0, le=10000, allow_inf_nan=False)]
Command = Annotated[str, Field(min_length=1, max_length=128, pattern=r"^[A-Za-z0-9_.:-]+$")]
Digest = Annotated[str, Field(pattern=r"^[a-f0-9]{64}$")]
Tool = Annotated[int, Field(strict=True, ge=1, le=99)]


class ManufacturingRequest(StrictModel):
    command_id: Command
    design_digest: Digest
    device_id: Literal["TRAK-TC820LTYSI-001"]
    postprocessor: Literal["virtual-trak-turning-v1"]
    stock_diameter_mm: Positive
    stock_length_mm: Positive
    grip_length_mm: Positive
    clearance_mm: Positive
    pass_depth_mm: Positive
    spindle_rpm: Annotated[float, Field(strict=True, gt=0, le=100000, allow_inf_nan=False)]
    feed_mm_per_rev: Annotated[float, Field(strict=True, gt=0, le=1000, allow_inf_nan=False)]
    tolerance_mm: Annotated[float, Field(strict=True, gt=0, le=1000, allow_inf_nan=False)]
    tool_id: Tool
    drill_tool_id: Tool | None = None
    drill_diameter_mm: Positive | None = None


class DispatchRequest(StrictModel):
    command_id: Command
    digest: Digest
    acknowledge_simulation_only: StrictBool

    @field_validator("acknowledge_simulation_only")
    @classmethod
    def confirmed(cls, value):
        if value is not True:
            raise ValueError("必须单独确认：仅向虚拟工厂发送模拟加工程序")
        return value
