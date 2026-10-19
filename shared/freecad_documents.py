"""Strict, transport-independent CAD document contracts. No native code or paths from users."""
from __future__ import annotations

from hashlib import sha256
import json
import math
import re
from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictInt, StrictStr, field_validator, model_validator

Number = Annotated[float, Field(strict=True, allow_inf_nan=False, ge=-10000, le=10000)]
Positive = Annotated[float, Field(strict=True, allow_inf_nan=False, gt=0, le=10000)]
Nonnegative = Annotated[float, Field(strict=True, allow_inf_nan=False, ge=0, le=10000)]
Revision = Annotated[StrictInt, Field(ge=0)]
State = Literal['accepted', 'running', 'completed', 'failed', 'outcome_unknown']


class CadDocumentError(ValueError):
    def __init__(self, code: str, message: str, status_code: int = 409):
        super().__init__(message)
        self.code, self.message, self.status_code = code, message, status_code


class Contract(BaseModel):
    model_config = ConfigDict(extra='forbid', validate_default=True)


def canonical_digest(value: Any) -> str:
    return sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, allow_nan=False,
                             separators=(',', ':')).encode('utf-8')).hexdigest()


def identifier(value: str, prefix: str) -> str:
    if not isinstance(value, str) or not re.fullmatch(re.escape(prefix) + r'[A-Za-z0-9_-]{1,128}', value):
        raise ValueError('无效身份编号')
    return value


def single_line(value: str) -> str:
    if not isinstance(value, str) or not value.strip() or len(value) > 128 or any(ord(c) < 32 or ord(c) == 127 for c in value):
        raise ValueError('名称必须为不超过128字符的单行文本')
    return value.strip()


class Box(Contract):
    primitive_type: Literal['box']
    length: Positive
    width: Positive
    height: Positive


class Cylinder(Contract):
    primitive_type: Literal['cylinder']
    diameter: Positive
    length: Positive


class Sphere(Contract):
    primitive_type: Literal['sphere']
    diameter: Positive


class Cone(Contract):
    primitive_type: Literal['cone']
    bottom_diameter: Positive
    top_diameter: Nonnegative
    height: Positive

    @model_validator(mode='after')
    def taper(self):
        if self.bottom_diameter <= self.top_diameter:
            raise ValueError('圆锥底径必须大于顶径')
        return self


Primitive = Annotated[Union[Box, Cylinder, Sphere, Cone], Field(discriminator='primitive_type')]
PRIMITIVE_MODELS = {'box': Box, 'cylinder': Cylinder, 'sphere': Sphere, 'cone': Cone}
PRIMITIVE_TYPES = {'box':'build123d::Box', 'cylinder':'build123d::Cylinder', 'sphere':'build123d::Sphere', 'cone':'build123d::Cone'}
LEGACY_PRIMITIVE_TYPES = {'box':'Part::Box', 'cylinder':'Part::Cylinder', 'sphere':'Part::Sphere', 'cone':'Part::Cone'}


def primitive_type(type_id):
    """Read historical snapshots without assigning them a different storage identity."""
    return next((kind for kind in PRIMITIVE_TYPES if type_id in (PRIMITIVE_TYPES[kind], LEGACY_PRIMITIVE_TYPES[kind])), None)
DIMENSIONS = {'box': ('length','width','height'), 'cylinder': ('diameter','length'),
              'sphere': ('diameter',), 'cone': ('bottom_diameter','top_diameter','height')}


class Target(Contract):
    object_id: StrictStr

    @field_validator('object_id')
    @classmethod
    def object_identity(cls, value):
        return identifier(value, 'OBJ-')


class Dimensions(Target):
    dimensions: dict[str, Number]

    @field_validator('dimensions')
    @classmethod
    def permitted_fields(cls, value):
        if not value or not set(value).issubset({'length','width','height','diameter','bottom_diameter','top_diameter'}):
            raise ValueError('只允许已适配的尺寸字段')
        if any(v < 0 or (v == 0 and k != 'top_diameter') for k, v in value.items()):
            raise ValueError('尺寸必须为正数')
        return value


class Rotation(Contract):
    axis: tuple[Number, Number, Number]
    angle: Number

    @field_validator('axis')
    @classmethod
    def normalize(cls, vector):
        length = math.sqrt(sum(x*x for x in vector))
        if length == 0:
            raise ValueError('旋转轴不能为零')
        return tuple(x / length for x in vector)


class Placement(Target):
    position: tuple[Number, Number, Number]
    rotation: Rotation


class Label(Target):
    label: StrictStr

    @field_validator('label')
    @classmethod
    def name(cls, value):
        return single_line(value)


class Visibility(Target):
    visible: StrictBool


class Replace(Contract):
    spec: dict[str, Any]


class CommandEnvelope(Contract):
    command_id: StrictStr
    document_id: StrictStr
    expected_revision: Revision
    command_type: Literal['create_primitive', 'set_primitive_dimensions', 'set_placement', 'set_label', 'set_visibility', 'replace_from_spec']
    parameters: Union[Box, Cylinder, Sphere, Cone, Dimensions, Placement, Label, Visibility, Replace]

    @field_validator('command_id')
    @classmethod
    def command_identity(cls, value):
        return identifier(value, 'CMD-')

    @field_validator('document_id')
    @classmethod
    def doc_identity(cls, value):
        return identifier(value, 'DOC-')

    @model_validator(mode='before')
    @classmethod
    def typed_parameters(cls, value):
        if not isinstance(value, dict):
            return value
        value = dict(value)
        kind, params = value.get('command_type'), value.get('parameters')
        if isinstance(params, BaseModel):
            params = params.model_dump(mode='json')
        models = {'set_primitive_dimensions': Dimensions, 'set_placement': Placement,
                  'set_label': Label, 'set_visibility': Visibility, 'replace_from_spec': Replace}
        model = PRIMITIVE_MODELS.get((params or {}).get('primitive_type')) if kind == 'create_primitive' else models.get(kind)
        if model is None:
            raise ValueError('不支持的CAD命令或形体')
        value['parameters'] = model.model_validate(params)
        return value


class DocumentHead(Contract):
    document_id: str
    owner_user_id: str
    part_name: str
    part_number: str
    revision: Revision
    published_version: int | None = None
    published_revision: int | None = None
    active_command_id: str | None = None
    created_at: float
    updated_at: float


class ObjectProperty(Contract):
    name: str
    type: str
    value: Any
    unit: str = ''
    editable: bool = False


class ObjectSnapshot(Contract):
    object_id: str
    name: str
    label: str
    type_id: str
    parent_ids: list[str] = Field(default_factory=list)
    dependency_ids: list[str] = Field(default_factory=list)
    visible: bool
    properties: list[ObjectProperty] = Field(default_factory=list)
    geometry: dict = Field(default_factory=dict)
    editable_commands: list[str] = Field(default_factory=list)
    read_only_reason: str = ''


class DocumentSnapshot(Contract):
    schema_version: Literal['freecad_document_v1'] = 'freecad_document_v1'
    document_id: str
    revision: Revision
    published_version: int | None = None
    objects: list[ObjectSnapshot]
    product_root_ids: list[str]
    source_spec: dict | None
    validation: dict
    artifacts: list[dict]

    @model_validator(mode='after')
    def unique_objects(self):
        ids = [o.object_id for o in self.objects]
        if len(set(ids)) != len(ids) or not set(self.product_root_ids).issubset(ids):
            raise ValueError('对象身份或产品根不一致')
        canonical_digest(self.model_dump(mode='json'))
        return self


class CommandRecord(Contract):
    envelope: CommandEnvelope | None
    input_digest: str
    owner_user_id: str
    state: State
    job_id: str
    result: dict | None = None
    error_code: str | None = None


class NativeJob(Contract):
    job_id: str
    input_digest: str
    job_kind: Literal['edit','import','publish','legacy_generate','discover']
    owner_user_id: str
    document_id: str | None
    expected_revision: int | None
    envelope: CommandEnvelope | None
    source: dict = Field(default_factory=dict)


class NativeReceipt(Contract):
    job_id: str
    input_digest: str
    state: Literal['completed','failed']
    snapshot: DocumentSnapshot | None
    artifacts: list[dict]
    validation: dict
    result: dict = Field(default_factory=dict)
    error_code: str | None = None


class StandardParameters(Contract):
    schema_version: Literal['freecad_document_parameters_v1']
    document_id: str
    revision: Revision
    run_id: str
    extractor_version: str
    parameters: list[dict]
    uncovered: list[dict]
    digest: str


def parse_command(payload: dict) -> CommandEnvelope:
    return CommandEnvelope.model_validate(payload)


def command_digest(actor_id: str, command: CommandEnvelope) -> str:
    return canonical_digest([actor_id, command.model_dump(mode='json')])


def validate_snapshot(payload: dict) -> DocumentSnapshot:
    return DocumentSnapshot.model_validate(payload)


def verify_document_standard(payload: dict) -> StandardParameters:
    standard = StandardParameters.model_validate(payload)
    body = standard.model_dump(mode='json', exclude={'digest'})
    if not re.fullmatch(r'FC-[a-f0-9]{64}', standard.run_id) or canonical_digest(body) != standard.digest:
        raise ValueError('建模标准身份或摘要校验失败')
    keys = set()
    for p in standard.parameters:
        required = {'key','name','object_id','expected','unit','kind','source_property','frame','comparable'}
        if set(p) != required or p['key'] in keys or p['comparable'] is not True:
            raise ValueError('建模标准参数结构不完整')
        keys.add(p['key'])
        if p['kind']=='choice':
            if p['expected'] not in {'x','y','z'}: raise ValueError('不支持的标准方向')
        elif isinstance(p['expected'], bool) or not isinstance(p['expected'], (float,int)) or not math.isfinite(p['expected']):
            raise ValueError('建模标准值必须为有限数值')
    for p in standard.uncovered:
        if p.get('comparable') is not False or not isinstance(p.get('key'),str) or p['key'] in keys:
            raise ValueError('未覆盖标准项无效或重复')
        keys.add(p['key'])
    return standard
