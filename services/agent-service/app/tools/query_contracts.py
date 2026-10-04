"""只读查询参数契约：同时生成模型声明和执行前校验，不改写业务参数。"""

from functools import wraps
from inspect import Parameter, signature
from typing import Any, Callable, Mapping

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator


class ReadArguments(BaseModel):
    """兼容旧调用附带的上下文；额外参数不参与工具授权。"""

    model_config = ConfigDict(extra='allow', strict=True)


class SearchArguments(ReadArguments):
    query: str = Field(min_length=1, description='知识检索问题')
    limit: int = Field(default=5, ge=1, le=50, description='最大返回数')
    filters: dict[str, Any] | None = Field(default=None, description='设备、机型、报警及知识类型过滤条件')

    @field_validator('query')
    @classmethod
    def nonblank_query(cls, value: str) -> str:
        if not value.strip():
            raise ValueError('检索问题不能为空')
        return value


class AlarmSearchArguments(SearchArguments):
    alarm_code: str = Field(default='', description='准确报警编号，优先于过滤条件中的编号')


class DocumentArguments(ReadArguments):
    document_id: str = Field(min_length=1, description='文档唯一编号')

    @field_validator('document_id')
    @classmethod
    def nonblank_identifier(cls, value: str) -> str:
        if not value.strip():
            raise ValueError('文档编号不能为空')
        return value


class ChunkArguments(DocumentArguments):
    chunk_id: str = Field(min_length=1, description='文档片段唯一编号')

    @field_validator('chunk_id')
    @classmethod
    def nonblank_chunk(cls, value: str) -> str:
        if not value.strip():
            raise ValueError('片段编号不能为空')
        return value


class EngineeringArguments(ReadArguments):
    request_id: str = Field(default='', description='工程查询请求编号')
    query: str = Field(default='', description='名称查询文本')
    device_id: str = Field(default='', description='指定设备编号，不能退化成全库查询')
    device_model: str = Field(default='', description='设备机型')
    component: str = Field(default='', description='部件名称')
    component_id: str = Field(default='', description='精确部件编号')
    part_no: str = Field(default='', description='精确零件号')


QUERY_ARGUMENT_MODELS: dict[str, type[BaseModel]] = {
    'search_knowledge': SearchArguments,
    'search_alarm_knowledge': AlarmSearchArguments,
    'search_sop': SearchArguments,
    'search_manual': SearchArguments,
    'search_fault_cases': SearchArguments,
    'search_semantic_memory': SearchArguments,
    'fetch_document': DocumentArguments,
    'fetch_chunk': ChunkArguments,
    **{name: EngineeringArguments for name in (
        'query_cad', 'query_part', 'query_bom', 'query_drawing', 'query_relation',
        'fetch_engineering_record', 'query_part_relation', 'query_assembly_relation',
        'get_component_location', 'get_drawing_metadata',
    )},
}


class QueryArgumentError(ValueError):
    """只读工具的安全参数错误，不携带输入值或内部配置。"""


def query_argument_error(name: str, arguments: Mapping[str, Any]) -> str:
    model = QUERY_ARGUMENT_MODELS.get(name)
    if model is not None:
        try:
            model.model_validate(dict(arguments))
        except ValidationError as error:
            fields = sorted({'.'.join(str(key) for key in item['loc']) for item in error.errors()})
            return 'invalid_tool_arguments:%s' % ','.join(fields)
    return ''


def validated_query(name: str) -> Callable:
    """Python 直接入口复用同一契约；保留签名、默认值和原始调用参数。"""
    def decorate(handler: Callable) -> Callable:
        call_signature = signature(handler)

        @wraps(handler)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            bound = call_signature.bind(*args, **kwargs)
            bound.apply_defaults()
            payload = {}
            for key, value in bound.arguments.items():
                if key == 'self':
                    continue
                if call_signature.parameters[key].kind == Parameter.VAR_KEYWORD:
                    payload.update(value)
                else:
                    payload[key] = value
            error = query_argument_error(name, payload)
            if error:
                raise QueryArgumentError(error)
            return handler(*args, **kwargs)

        return wrapped
    return decorate
