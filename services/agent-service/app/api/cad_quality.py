"""FreeCAD 建模参数与人工测量的只读基准、确定性比对和实测留痕。"""
from __future__ import annotations

from datetime import datetime, timezone
import re
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

from app.api.team_auth import team_actor
from app.api.cad_quality_rules import comparison_rows, compare_dimensions, design_digest

_RUN_ID = re.compile(r'^FC-[a-f0-9]{64}$')


class StrictRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')


class ManualMeasurement(StrictRequest):
    actual: float = Field(allow_inf_nan=False)
    tolerance: float = Field(ge=0, le=10000, allow_inf_nan=False)


class CadComparisonRequest(StrictRequest):
    run_id: str = Field(pattern=r'^FC-[a-f0-9]{64}$')
    design_digest: str = Field(pattern=r'^[a-f0-9]{64}$')
    part_id: str = Field(min_length=1, max_length=100, pattern=r'^[A-Za-z0-9_.:-]+$')
    measurements: dict[str, ManualMeasurement] = Field(default_factory=dict, max_length=300)


def build_cad_quality_router(runtime: Any, require_write_auth: Any) -> APIRouter:
    router = APIRouter(prefix='/api/quality/cad', tags=['CAD Parameter Comparison'])

    def verified_design(request: Request, run_id: str) -> dict[str, Any]:
        if not _RUN_ID.fullmatch(run_id):
            raise HTTPException(404, '建模运行编号无效')
        storage = getattr(request.app.state, 'freecad_run_store', None)
        if storage is None:
            from app.agents.cad.modeling_api import FreeCADRunStore
            try:
                storage = FreeCADRunStore()
                request.app.state.freecad_run_store = storage
            except Exception:
                raise HTTPException(503, '建模记录存储不可用') from None
        try:
            record = storage.get(run_id)
        except Exception:
            raise HTTPException(503, '暂时无法读取 FreeCAD 建模记录') from None
        if record is None:
            raise HTTPException(404, '原始建模记录不存在或已超过 24 小时，请重新生成可信设计记录')
        proof = record.get('validation') or {}
        artifacts = record.get('artifacts') or []
        names = {part.get('name') for part in artifacts if isinstance(part, dict)}
        if (record.get('status') != 'completed' or proof.get('valid') is not True or
                proof.get('step_roundtrip') is not True or not {'model.step', 'model.stl'}.issubset(names)):
            raise HTTPException(409, 'FreeCAD 建模尚未完成可信实体与 STEP 校验，不能作实测基准')
        try:
            from app.tools.cad.freecad_mcp import validate_spec
            spec = validate_spec(record.get('spec'))
            parameters = comparison_rows(spec)
        except (ValueError, TypeError, KeyError):
            raise HTTPException(422, '当前设计参数不完整或包含不支持的特征，不能进行完整数值对照') from None
        return {'run_id': run_id, 'design_digest': design_digest(spec), 'parameters': parameters,
                'model_status': 'completed', 'source': 'verified-freecad', 'scope': 'numeric_geometry_only'}

    @router.get('/designs/{run_id}')
    def get_design_parameters(run_id: str, request: Request):
        team_actor(request)
        return verified_design(request, run_id)

    @router.post('/compare', dependencies=[Depends(require_write_auth)])
    def compare_design_parameters(body: CadComparisonRequest, request: Request):
        actor = team_actor(request)
        design = verified_design(request, body.run_id)
        if design['design_digest'] != body.design_digest:
            raise HTTPException(409, 'CAD 设计参数与本次读取的版本不一致，请重新读取建模参数')
        try:
            result = compare_dimensions(design['parameters'], {
                key: value.model_dump(mode='python') for key, value in body.measurements.items()
            })
        except ValueError as error:
            raise HTTPException(422, str(error)) from None
        checked_at = datetime.now(timezone.utc).isoformat()
        outcome = {**result, 'part_id': body.part_id, 'run_id': body.run_id,
                   'design_digest': design['design_digest'], 'operator': actor['user_id'],
                   'checked_at': checked_at, 'measurement_source': 'manual',
                   'persisted': False, 'message': '仅判定已录入数值参数的一致性，不代表正式质量放行'}
        if result['status'] == 'insufficient_data':
            return outcome
        part = {
            'part_id': body.part_id,
            'measurements': {key: value.actual for key, value in body.measurements.items()},
            'specifications': {row['key']: {
                'min': row['nominal'] - body.measurements[row['key']].tolerance,
                'max': row['nominal'] + body.measurements[row['key']].tolerance,
            } for row in design['parameters']},
            'design_run_id': body.run_id,
            'design_spec_digest': design['design_digest'],
            'comparison_status': result['status'],
            'comparison_items': result['items'],
            'comparison_checked_at': checked_at,
            'tolerance_source': 'manual',
        }
        trace_id = 'TRACE-CAD-QMS-' + uuid4().hex[:12].upper()
        try:
            saved = runtime.container.registry.execute('register_production_part',
                {'part': part, 'operator': actor['user_id']},
                context={'agent': 'quality', 'step': 'compare_cad_parameters',
                         'task_id': trace_id, 'trace_id': trace_id})
            if not saved.get('success'):
                raise ValueError('Backend 未确认实测数据保存成功')
        except Exception:
            raise HTTPException(502, '参数已经比对，但实测记录保存结果未知，请先查询记录，不要把本次检测视为已保存') from None
        return {**outcome, 'persisted': True, 'trace_id': trace_id,
                'recorded_at': (saved.get('part') or {}).get('recorded_at') or checked_at}

    return router
