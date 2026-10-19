"""Bounded, authenticated image-only visual inspection API."""
from __future__ import annotations

import json
from typing import Literal
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator
from starlette.concurrency import run_in_threadpool

from app.api.team_auth import team_actor
from app.clients.backend import BackendServiceClient, BackendServiceError
from app.vision.service import VisionService, VisionServiceError
from app.vision.preprocessing import parse_patchcore_config


MAX_REQUEST_BYTES = 40 * 1024 * 1024
MAX_ENCODED_IMAGE = ((4 * 1024 * 1024 + 2) // 3) * 4 + 64


class TrainRequest(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)
    name: str = Field(min_length=1, max_length=100)
    images: list[str] = Field(min_length=2, max_length=24)
    coreset_ratio: float = Field(default=0.1, gt=0, le=1)
    preprocessing: dict | None = None

    @field_validator('preprocessing')
    @classmethod
    def preprocessing_config(cls, value):
        return parse_patchcore_config(value)

    @field_validator('name')
    @classmethod
    def name_nonblank(cls, value):
        if not value.strip():
            raise ValueError('name is required')
        return value.strip()

    @field_validator('images')
    @classmethod
    def bounded_images(cls, images):
        if any(len(value) > MAX_ENCODED_IMAGE for value in images):
            raise ValueError('image is too large')
        return images


class CalibrateRequest(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)
    model_id: str = Field(min_length=1, max_length=64)
    normal_images: list[str] = Field(min_length=2, max_length=23)
    defect_images: list[str] = Field(min_length=1, max_length=22)
    policy: Literal['recall_priority', 'balanced', 'zero_fp'] = 'recall_priority'

    @model_validator(mode='after')
    def bounded_images(self):
        images = self.normal_images + self.defect_images
        if len(images) > 24 or any(not value or len(value) > MAX_ENCODED_IMAGE for value in images):
            raise ValueError('calibration needs at most 24 bounded images')
        return self


class DetectRequest(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)
    algorithm: Literal['patchcore', 'yolo']
    model_id: str = Field(min_length=1, max_length=64)
    image: str = Field(min_length=1, max_length=MAX_ENCODED_IMAGE)
    filename: str = Field(default='', max_length=256)
    part_id: str = Field(default='', max_length=256)
    threshold: float | None = Field(default=None, gt=0)
    confidence: float = Field(default=0.25, gt=0, le=1)
    iou: float = Field(default=0.45, gt=0, le=1)

    @model_validator(mode='after')
    def patchcore_threshold(self):
        if self.algorithm == 'patchcore' and self.threshold is None:
            raise ValueError('PatchCore requires a calibrated positive threshold')
        return self


async def _body(request, schema):
    origin = request.headers.get('origin')
    if origin:
        parsed = urlsplit(origin)
        if parsed.scheme not in {'http', 'https'} or parsed.netloc != request.headers.get('host'):
            raise HTTPException(403, '仅允许同源视觉检测请求')
    content_type = request.headers.get('content-type', '').split(';', 1)[0].strip().lower()
    if content_type != 'application/json':
        raise HTTPException(415, '视觉检测接口仅接受 JSON 图片数据')
    try:
        declared = int(request.headers.get('content-length', '0'))
        if declared < 0:
            raise ValueError('negative length')
    except ValueError:
        raise HTTPException(400, '请求体长度无效') from None
    if declared > MAX_REQUEST_BYTES:
        raise HTTPException(413, '请求体不能超过 40 MiB')
    payload = bytearray()
    async for chunk in request.stream():
        if len(payload) + len(chunk) > MAX_REQUEST_BYTES:
            raise HTTPException(413, '请求体不能超过 40 MiB')
        payload.extend(chunk)
    try:
        return schema.model_validate(json.loads(payload)).model_dump(mode='json')
    except (ValidationError, ValueError, TypeError, UnicodeError):
        # Validation errors may contain submitted image bytes; never echo them.
        raise HTTPException(422, '请求参数无效，请检查图片、模型、训练数量和检测阈值') from None


def build_quality_vision_router(require_write_auth, *, backend_factory=BackendServiceClient, service=None):
    router = APIRouter(prefix='/api/quality/vision', tags=['quality-vision'])
    vision = service or VisionService()

    def actor(request):
        if not request.cookies.get('maintenance_session'):
            raise HTTPException(401, '请先登录维修小组账号')
        try:
            return team_actor(request, backend_factory())['user_id']
        except BackendServiceError:
            raise HTTPException(503, '维修身份服务不可用') from None

    def call(operation, *args):
        try:
            return operation(*args)
        except VisionServiceError as error:
            raise HTTPException(error.status_code, error.detail) from None
        except Exception:
            raise HTTPException(503, '视觉服务暂不可用，请检查运行配置') from None

    @router.get('/capabilities')
    def capabilities(request: Request):
        return call(vision.capabilities, actor(request))

    @router.post('/patchcore/train', dependencies=[Depends(require_write_auth)])
    async def train(request: Request):
        owner = await run_in_threadpool(actor, request)
        values = await _body(request, TrainRequest)
        return await run_in_threadpool(call, vision.train, owner, values)

    @router.post('/detect', dependencies=[Depends(require_write_auth)])
    async def detect(request: Request):
        owner = await run_in_threadpool(actor, request)
        values = await _body(request, DetectRequest)
        return await run_in_threadpool(call, vision.detect, owner, values)

    @router.post('/patchcore/calibrate', dependencies=[Depends(require_write_auth)])
    async def calibrate(request: Request):
        owner = await run_in_threadpool(actor, request)
        values = await _body(request, CalibrateRequest)
        return await run_in_threadpool(call, vision.calibrate, owner, values)

    @router.get('/inspections/{inspection_id}')
    def inspection(inspection_id: str, request: Request):
        return call(vision.get_inspection, actor(request), inspection_id)

    return router
