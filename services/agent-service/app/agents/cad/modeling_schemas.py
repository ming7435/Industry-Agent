"""生产建模输入契约：几何操作为数据，不接受可执行脚本。"""

from __future__ import annotations

from typing import Annotated, Literal, Union
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

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
