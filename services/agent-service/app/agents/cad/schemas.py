"""CAD 查询、三维建模及虚拟加工的统一请求契约。"""

from __future__ import annotations

from typing import Annotated, Any, Dict, Literal, Union
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, StrictBool, field_validator, model_validator


class CADQuery(BaseModel):
    """统一承接用户、Diagnosis 和 Maintenance 发来的工程查询。"""

    request_id: str = Field(default_factory=lambda: "CADR-" + uuid4().hex[:12].upper())
    device_id: str = ""
    device_model: str = ""
    component: str = ""
    part_no: str = ""
    query: str = ""
    max_steps: int = Field(default=5, ge=1, le=6)

    @classmethod
    def from_payload(cls, payload: Any) -> "CADQuery":
        if isinstance(payload, cls):
            return payload
        if isinstance(payload, str):
            return cls(query=payload)
        if hasattr(payload, "model_dump"):
            payload = payload.model_dump(mode="json")
        values: Dict[str, Any] = dict(payload or {})
        if not values.get("query"):
            values["query"] = values.get("fault") or values.get("summary") or "工程结构查询"
        return cls(**values)


# 建模输入只允许结构化几何，不接受可执行脚本。
Dimension = Annotated[float, Field(gt=0, le=10000, allow_inf_nan=False)]
Coordinate = Annotated[float, Field(ge=-10000, le=10000, allow_inf_nan=False)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Placement(StrictModel):
    position: tuple[Coordinate, Coordinate, Coordinate] = (0, 0, 0)
    mode: Literal["add", "cut"] = "add"


class Cylinder(Placement):
    type: Literal["cylinder"]
    diameter: Dimension
    length: Dimension
    axis: Literal["x", "y", "z"] = "z"


class Box(Placement):
    type: Literal["box"]
    length: Dimension
    width: Dimension
    height: Dimension


class Extrude(Placement):
    type: Literal["extrude"]
    points: list[tuple[Coordinate, Coordinate]] = Field(min_length=3, max_length=128)
    depth: Dimension


class Revolve(Placement):
    type: Literal["revolve"]
    points: list[tuple[Coordinate, Coordinate]] = Field(min_length=3, max_length=128)
    angle: float = Field(default=360, gt=0, le=360, allow_inf_nan=False)


class EdgeFeature(StrictModel):
    type: Literal["fillet", "chamfer"]
    size: Dimension
    edges: Literal["all", "|X", "|Y", "|Z", ">X", "<X", ">Y", "<Y", ">Z", "<Z", "%Circle"] = "all"


Operation = Annotated[Union[Cylinder, Box, Extrude, Revolve, EdgeFeature], Field(discriminator="type")]


class ModelSpec(StrictModel):
    units: Literal["mm", "cm", "inch"]
    operations: list[Operation] = Field(min_length=1, max_length=64)

    @model_validator(mode="after")
    def check_first_operation(self):
        first = self.operations[0]
        if isinstance(first, EdgeFeature) or first.mode != "add":
            raise ValueError("第一个操作必须建立实体，不能从倒角或切除开始")
        return self


class DesignRequest(StrictModel):
    command_id: str = Field(default="", max_length=128, pattern=r"^[A-Za-z0-9_.:-]*$")
    name: str = Field(default="自定义零件", min_length=1, max_length=100)
    prompt: str = Field(default="", max_length=10000)
    material: str = Field(default="", max_length=100)
    technical_requirements: str = Field(default="", max_length=4000)
    spec: ModelSpec | None = None


class ImportRequest(DesignRequest):
    filename: str = Field(min_length=1, max_length=160)
    content_base64: str = Field(max_length=12000000)
    dxf_depth: Dimension | None = None
    dxf_units: Literal["mm", "cm", "inch"] | None = None

    @field_validator("filename")
    @classmethod
    def safe_filename(cls, value):
        if any(char in value for char in ('/', '\\', ':', '\x00', '\r', '\n')) or value.startswith('.'):
            raise ValueError("上传文件名不能包含路径或控制字符")
        extension = value.rsplit('.', 1)[-1].lower()
        if extension not in {"step", "stp", "dxf", "pdf", "png", "jpg", "jpeg"}:
            raise ValueError("支持 STEP/STP、DXF、PDF、PNG/JPG；DWG 请先转换")
        return value


class ConfirmRequest(StrictModel):
    digest: str = Field(min_length=1, max_length=64)


class RevisionRequest(DesignRequest):
    dxf_depth: Dimension | None = None
    dxf_units: Literal["mm", "cm", "inch"] | None = None
    replace_source_geometry: bool = False

    @model_validator(mode="after")
    def explicit_replacement(self):
        if self.replace_source_geometry and self.spec is None:
            raise ValueError("替换原图几何必须提供完整结构化参数")
        return self


# 加工参数仍为严格类型，不能因合并契约而把布尔值转换成速度或刀具编号。
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
