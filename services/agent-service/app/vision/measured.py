"""Imported physical-part measurements. Never generate values from a CAD model."""
from collections import Counter
from datetime import datetime, timezone
from decimal import Decimal
from hashlib import sha256
import json
import re
from threading import RLock

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.vision.service import VisionServiceError

_LOCK = RLock()
SCOPE = 'measured_batch'


class InputModel(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True, allow_inf_nan=False)


def number(value):
    if value is None or value == '':
        return None
    if isinstance(value, bool) or not isinstance(value, (str, int, float, Decimal)):
        raise ValueError('测量值必须是有限数值')
    value = str(value).strip()
    if len(value) > 48:
        raise ValueError('数值过长')
    try:
        parsed = Decimal(value)
    except Exception:
        raise ValueError('数值格式无效') from None
    if not parsed.is_finite() or abs(parsed) > Decimal('1000000000') or parsed.as_tuple().exponent < -12:
        raise ValueError('数值超出范围或精度')
    return format(parsed, 'f')


class Parameter(InputModel):
    key: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=100)
    unit: str = Field(min_length=1, max_length=20)
    lower: str | None = None
    upper: str | None = None

    _numbers = field_validator('lower', 'upper', mode='before')(number)

    @model_validator(mode='after')
    def bounds(self):
        if self.lower is not None and self.upper is not None and Decimal(self.lower) > Decimal(self.upper):
            raise ValueError('下限不得大于上限')
        return self


class Observation(InputModel):
    value: str | None = None
    unit: str = Field(min_length=1, max_length=20)
    _number = field_validator('value', mode='before')(number)


class Sample(InputModel):
    serial_number: str = Field(min_length=1, max_length=100)
    measurements: dict[str, Observation] = Field(default_factory=dict, max_length=200)


class MeasuredBatchRequest(InputModel):
    batch_id: str = Field(min_length=1, max_length=100)
    design_version: str = Field(min_length=1, max_length=128)
    part_name: str = Field(default='', max_length=100)
    standard_reference: str = Field(min_length=1, max_length=500)
    measurement_reference: str = Field(min_length=1, max_length=500)
    measured_at: str = Field(min_length=1, max_length=64)
    plan_complete: bool = Field(default=False, strict=True)
    parameters: list[Parameter] = Field(min_length=1, max_length=200)
    samples: list[Sample] = Field(min_length=1, max_length=2000)

    @model_validator(mode='after')
    def identity(self):
        if self.batch_id.upper().startswith('SIM-') or any(s.serial_number.upper().startswith('SIM-') for s in self.samples):
            raise ValueError('模拟批次不能导入实物质检')
        try:
            stamp = datetime.fromisoformat(self.measured_at.replace('Z', '+00:00'))
            if stamp.tzinfo is None or stamp > datetime.now(timezone.utc):
                raise ValueError()
        except ValueError:
            raise ValueError('测量时间需含时区，且不能晚于当前时间') from None
        keys = {p.key for p in self.parameters}
        if len(keys) != len(self.parameters) or len({s.serial_number for s in self.samples}) != len(self.samples):
            raise ValueError('检验项目或零件编号重复')
        if sum(len(s.measurements) for s in self.samples) > 50000:
            raise ValueError('单次导入最多 50000 条测量记录')
        if any(set(s.measurements) - keys for s in self.samples):
            raise ValueError('测量项目未包含在检验清单中')
        return self


def digest(value):
    return sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()


def compare_measurements(batch, observations):
    items, issues = [], []
    for parameter in batch['basis']['parameters']:
        p = dict(parameter)
        actual = observations.get(p['key'])
        value = actual.get('value') if actual else None
        reason, status = '', 'pending'
        if value is None:
            reason = '缺少实测值'
        elif actual['unit'] != p['unit']:
            reason = '实测单位与验收单位不一致，需核对后转换'
        elif p['lower'] is None and p['upper'] is None:
            reason = '缺少验收上下限'
        else:
            measured = Decimal(value)
            failed = ((p['lower'] is not None and measured < Decimal(p['lower']))
                      or (p['upper'] is not None and measured > Decimal(p['upper'])))
            status = 'unqualified' if failed else 'qualified'
        row = dict(p, actual=value, actual_unit=actual['unit'] if actual else p['unit'], status=status, reason=reason)
        items.append(row)
        if status == 'unqualified':
            issues.append(row)
    complete = batch['plan_complete'] and all(i['status'] == 'qualified' for i in items)
    return dict(status='unqualified' if issues else 'qualified' if complete else 'pending',
                items=items, issues=issues, plan_complete=batch['plan_complete'])


class MeasuredBatchService:
    def __init__(self, vision):
        self.vision = vision

    def _root(self, owner):
        path = self.vision._owner_root(owner) / 'measured-batches'
        path.mkdir(parents=True, exist_ok=True)
        return path

    def get(self, owner, request_id):
        if not re.fullmatch(r'MB-[a-f0-9]{32}', request_id):
            raise VisionServiceError(422, '实测批次编号无效')
        path = self._root(owner) / (request_id + '.json')
        if not path.exists():
            raise VisionServiceError(404, '未找到当前账号的实测批次')
        try:
            stored = json.loads(path.read_text(encoding='utf-8'))
            source = MeasuredBatchRequest.model_validate(stored['input']).model_dump(mode='json')
            if stored['owner'] != owner or 'MB-' + digest(source)[:32] != request_id:
                raise ValueError('identity mismatch')
            return self._result(source, request_id, stored['imported_at'])
        except (ValueError, KeyError, TypeError, OSError):
            raise VisionServiceError(409, '实测记录无法核验，请重新导入原始记录') from None

    def save(self, owner, values):
        source = MeasuredBatchRequest.model_validate(values).model_dump(mode='json')
        # Stable ordering makes repeated imports idempotent.
        source['parameters'].sort(key=lambda p: p['key'])
        source['samples'].sort(key=lambda s: s['serial_number'])
        request_id = 'MB-' + digest(source)[:32]
        with _LOCK:
            root = self._root(owner)
            path = root / (request_id + '.json')
            if path.exists():
                return self.get(owner, request_id)
            if sum(1 for _ in root.glob('MB-*.json')) >= 1000:
                raise VisionServiceError(409, '已达到实测记录容量，请先归档历史记录')
            self.vision._atomic_json(path, dict(owner=owner, input=source,
                imported_at=datetime.now(timezone.utc).isoformat()))
            return self.get(owner, request_id)

    def list_batches(self, owner):
        latest = {}
        for path in self._root(owner).glob('MB-*.json'):
            batch = self.get(owner, path.stem)
            key = batch['batch_id']
            if key not in latest or batch['imported_at'] > latest[key]['imported_at']:
                latest[key] = {k: batch[k] for k in ('request_id', 'batch_id', 'design_run_id', 'part_name', 'imported_at', 'counts')}
        return {'items': sorted(latest.values(), key=lambda b: b['imported_at'], reverse=True)}

    @staticmethod
    def _result(source, request_id, imported_at):
        batch = dict(version=1, scope=SCOPE, simulation=False, synthetic=False,
            source='measurement_import', request_id=request_id, batch_id=source['batch_id'],
            design_run_id=source['design_version'], part_name=source['part_name'],
            standard_reference=source['standard_reference'], measurement_reference=source['measurement_reference'],
            measured_at=source['measured_at'], plan_complete=source['plan_complete'], imported_at=imported_at,
            basis={'parameters': source['parameters'], 'digest': digest([source['design_version'], source['standard_reference'], source['parameters']])},
            samples=[], issues=[])
        counts = Counter()
        for sample in source['samples']:
            comparison = compare_measurements(batch, sample['measurements'])
            sample_id = 'MP-' + digest([source['batch_id'], source['design_version'], sample['serial_number']])[:32]
            batch['samples'].append(dict(part_id=sample_id, serial_number=sample['serial_number'],
                observations=sample['measurements'], comparison=comparison))
            batch['issues'].extend(dict(i, part_id=sample_id) for i in comparison['issues'])
            counts[comparison['status']] += 1
        batch['counts'] = {k: counts[k] for k in ('qualified', 'unqualified', 'pending')}
        batch['counts'].update(total=len(batch['samples']), determinate=counts['qualified'] + counts['unqualified'])
        batch['status'] = 'unqualified' if counts['unqualified'] else 'qualified' if not counts['pending'] else 'pending'
        return batch
