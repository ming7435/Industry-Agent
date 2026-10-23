"""Human-reviewed, owner-scoped part qualification; never a release command."""
from copy import deepcopy
from datetime import datetime, timezone
from hashlib import sha256
import json
import re
from threading import Lock
from uuid import uuid4

from app.vision.service import VisionServiceError

_LOCK = Lock()
_ID = re.compile(r'CQ-[a-f0-9]{32}\Z')


def verdict(part):
    decisions = [part.get(kind, {}).get('decision', 'pending') for kind in ('parameters', 'visual')]
    if 'fail' in decisions:
        return 'unqualified'
    return 'qualified' if decisions == ['pass', 'pass'] else 'pending'


def summarize(parts):
    counts = dict(total=len(parts), qualified=0, unqualified=0, pending=0)
    for part in parts:
        counts[verdict(part)] += 1
    determinate = counts['qualified'] + counts['unqualified']
    return {**counts, 'determinate': determinate,
            'rate_percent': round(100 * counts['qualified'] / determinate, 2) if determinate else None,
            'coverage_percent': round(100 * determinate / counts['total'], 2) if parts else None}


class CombinedQualityService:
    def __init__(self, vision):
        self.vision = vision

    def _path(self, owner):
        return self.vision._owner_root(owner) / 'combined-quality.json'

    def _read(self, owner):
        path = self._path(owner)
        if not path.exists():
            return {'schema_version': 1, 'parts': {}}
        try:
            value = json.loads(path.read_text(encoding='utf-8'))
            if value.get('schema_version') != 1 or not isinstance(value.get('parts'), dict):
                raise ValueError('invalid registry')
            for key, part in value['parts'].items():
                if (not _ID.fullmatch(key) or part['quality_part_id'] != key
                        or part['scope'] not in {'production', 'validation'}
                        or type(part['revision']) is not int or part['revision'] < 0
                        or not all(isinstance(part[k], str) and part[k].strip()
                                   for k in ('batch_id', 'serial_number', 'design_version'))
                        or any(part.get(k, {}).get('decision', 'pending') not in {'pass', 'fail', 'pending'}
                               for k in ('parameters', 'visual'))):
                    raise ValueError('invalid part')
            return value
        except (OSError, ValueError, TypeError, KeyError, AttributeError):
            raise VisionServiceError(503, '综合质检记录暂不可读取，请检查存储') from None

    @staticmethod
    def _public(part):
        return {**deepcopy(part), 'history': deepcopy(part['history'][-20:]),
                'history_count': len(part['history']), 'status': verdict(part)}

    def _part(self, state, part_id):
        if not _ID.fullmatch(part_id) or part_id not in state['parts']:
            raise VisionServiceError(404, '未找到当前账号的综合质检零件')
        return state['parts'][part_id]

    def get_part(self, owner, part_id):
        with _LOCK:
            return self._public(self._part(self._read(owner), part_id))

    def list_parts(self, owner, scope, batch_id=''):
        with _LOCK:
            values = [p for p in self._read(owner)['parts'].values() if p['scope'] == scope]
            batches = sorted({p['batch_id'] for p in values})
            rows = [p for p in values if not batch_id or p['batch_id'] == batch_id]
            return {'scope': scope, 'batch_id': batch_id, 'batches': batches,
                    'summary': summarize(rows),
                    'items': [self._public(p) for p in sorted(rows, key=lambda p: p['created_at'], reverse=True)]}

    def register(self, owner, values):
        with _LOCK:
            state = self._read(owner)
            for part in state['parts'].values():
                if (part['scope'], part['batch_id'], part['serial_number']) == (
                        values['scope'], values['batch_id'], values['serial_number']):
                    if part['design_version'] != values['design_version']:
                        raise VisionServiceError(409, '该批次的同一实物已关联其他设计版本，请核对；不会重复计数')
                    return self._public(part)
            # One physical serial cannot silently enter another production batch or version.
            if values['scope'] == 'production' and any(
                    p['scope'] == 'production' and p['serial_number'] == values['serial_number']
                    for p in state['parts'].values()):
                raise VisionServiceError(409, '该实物编号已登记在其他生产批次，请使用唯一实物编号')
            if len(state['parts']) >= 10000:
                raise VisionServiceError(409, '当前账号质检登记已达上限，请先归档')
            now = datetime.now(timezone.utc).isoformat()
            part = {**values, 'quality_part_id': 'CQ-' + uuid4().hex, 'revision': 0,
                    'created_at': now, 'updated_at': now, 'parameters': {'decision': 'pending'},
                    'visual': {'decision': 'pending'}, 'history': []}
            state['parts'][part['quality_part_id']] = part
            self.vision._atomic_json(self._path(owner), state)
            return self._public(part)

    def record_inspection(self, owner, inspection, *, expected_latest=None, publish=None):
        """New visual evidence invalidates a previous pass, never clears a failure."""
        with _LOCK:
            state = self._read(owner)
            part = self._part(state, inspection['quality_part_id'])
            if expected_latest is not None:
                if part.get('latest_inspection_id') == inspection['inspection_id']:
                    return
                if part.get('latest_inspection_id') != expected_latest:
                    raise VisionServiceError(409, '该实物已出现更新的视觉证据，请重新检测后融合')
            # For fused evidence, publish while holding the part lock. A failed
            # registry write can safely retry from the same deterministic file.
            if publish is not None:
                publish()
            now = datetime.now(timezone.utc).isoformat()
            part['latest_inspection_id'] = inspection['inspection_id']
            if part['visual']['decision'] == 'pass':
                pending = dict(kind='visual', decision='pending', all_required_checked=False,
                    evidence_reference=inspection['inspection_id'], inspection_id=inspection['inspection_id'],
                    notes='该实物新增视觉检测证据，原外观通过结论需重新复核。',
                    source='inspection_pending_review', reviewed_at=now, reviewer='',
                    quality_part_id=part['quality_part_id'], request_id=inspection['inspection_id'],
                    request_digest='')
                part['visual'] = pending
                part['history'].append(deepcopy(pending))
            part['revision'] += 1
            part['updated_at'] = now
            self.vision._atomic_json(self._path(owner), state)

    def review(self, owner, part_id, values):
        with _LOCK:
            state = self._read(owner)
            part = self._part(state, part_id)
            digest = sha256(json.dumps(values, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
            previous = next((r for p in state['parts'].values() for r in p['history']
                             if r['request_id'] == values['request_id']), None)
            if previous:
                if previous['request_digest'] != digest or previous['quality_part_id'] != part_id:
                    raise VisionServiceError(409, '同一复核请求不能更换内容或零件')
                return self._public(part)
            if part['revision'] != values['expected_revision']:
                raise VisionServiceError(409, '该零件记录已更新，请刷新后复核，避免覆盖其他检测结果')
            if values['decision'] == 'pass' and not values['all_required_checked']:
                raise VisionServiceError(422, '确认合格前必须完成该项全部必检内容')
            if values['decision'] != 'pending' and not values['evidence_reference']:
                raise VisionServiceError(422, '请填写测量报告或外观复核记录依据')
            inspection_id = values['inspection_id']
            evidence = None
            if inspection_id:
                if values['kind'] != 'visual':
                    raise VisionServiceError(422, '视觉检测编号不能作为参数测量报告')
                if part.get('latest_inspection_id') != inspection_id:
                    raise VisionServiceError(409, '请引用该实物最新的视觉检测证据后复核')
                inspection = self.vision.get_inspection(owner, inspection_id)
                identity = {k: part[k] for k in ('scope', 'batch_id', 'serial_number', 'design_version')}
                if inspection.get('quality_part_id') != part_id or inspection.get('quality_identity') != identity:
                    raise VisionServiceError(409, '视觉证据未关联同一实物、批次和设计版本，请选择该零件重新检测')
                if part['scope'] == 'production' and (inspection.get('image_source') != 'upload'
                                                        or inspection.get('source_context') is not None):
                    raise VisionServiceError(409, '测试图片或模拟结果不能进入生产复核统计')
                evidence = {k: inspection.get(k) for k in (
                    'inspection_id', 'algorithm', 'model_id', 'model_sha256', 'image_sha256',
                    'image_source', 'status', 'score', 'threshold', 'created_at')}
                if inspection.get('algorithm') in {'patchcore_yolo', 'patchcore_yolo_pipeline'}:
                    evidence.update(classification=inspection['classification'],
                                    inspection_ids=deepcopy(inspection['inspection_ids']),
                                    yolo_state=inspection.get('yolo_state', 'completed'),
                                    localization_error=deepcopy(inspection.get('localization_error')),
                                    stages={name: {k: inspection[name].get(k) for k in (
                                        'inspection_id', 'algorithm', 'model_id', 'model_sha256',
                                        'memory_bank_sha256', 'image_sha256', 'image_digest_format',
                                        'status', 'score', 'threshold', 'created_at')}
                                        for name in ('patchcore', 'yolo') if inspection.get(name) is not None})
            if len(part['history']) >= 1000:
                raise VisionServiceError(409, '该零件复核记录已达上限')
            now = datetime.now(timezone.utc).isoformat()
            review = {**values, 'quality_part_id': part_id, 'request_digest': digest,
                      'reviewer': owner, 'reviewed_at': now, 'source': 'human_review',
                      'inspection_evidence': evidence}
            part[values['kind']] = deepcopy(review)
            part['history'].append(review)
            part['revision'] += 1
            part['updated_at'] = now
            self.vision._atomic_json(self._path(owner), state)
            return self._public(part)
