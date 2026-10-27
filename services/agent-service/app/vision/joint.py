"""Join saved dimension and image evidence by batch AND sample, for validation only."""
from collections import Counter
from hashlib import sha256
import json
import re
from threading import Lock

from app.clients.backend import BackendServiceError
from app.agents.quality.assessment import classify_inspection
from app.vision.service import VisionServiceError
from app.vision.statistics import _compact
from shared import simulated_part_design_quality as sim
from app.vision.measured import SCOPE, compare_measurements

_LOCK = Lock()


def saved_batch(backend, owner, request_id):
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,128}', request_id):
        raise VisionServiceError(422, '尺寸检测请求编号无效')
    try:
        batch = backend.request('/internal/quality/simulation/request',
                                {'actor_id': owner, 'request_id': request_id})['result']
    except BackendServiceError as error:
        raise VisionServiceError(503, '尺寸记录暂不可读取，请刷新联合质检结果') from error
    if batch is None:
        raise VisionServiceError(404, '未找到当前账号的尺寸检测批次')
    if (batch.get('actor_id') != owner or batch.get('request_id') != request_id
            or batch.get('simulation') is not True or batch.get('synthetic') is not True
            or batch.get('status') == 'review' or not batch.get('samples') or not batch.get('basis')):
        raise VisionServiceError(409, '尺寸记录待复核，暂不能生成联合结论')
    return batch


def sample_identity(batch, sample_id):
    if not any(row['part_id'] == sample_id for row in batch['samples']):
        raise VisionServiceError(409, '该样本不属于所选尺寸批次')
    return dict(scope=SCOPE if batch.get('scope') == SCOPE else 'simulation_validation', batch_id=batch['batch_id'],
                request_id=batch['request_id'], design_run_id=batch['design_run_id'],
                basis_digest=batch['basis']['digest'], sample_id=sample_id)


def dimension_issue(row):
    if 'lower' in row:
        bounds = f"{row['lower'] if row['lower'] is not None else '无下限'} ～ {row['upper'] if row['upper'] is not None else '无上限'}"
        return dict(type='dimension', label='尺寸超差', source='dimensions', location=row['name'],
                    evidence=f"验收范围 {bounds} {row['unit']} · 实测值 {row['actual']} {row['actual_unit']}",
                    action='remeasure', action_label='复测超差项，评估返工；不可修复时评估报废重造')
    key, label = ('quantity', '数量不一致') if row['kind'] == 'count' else (
        ('direction', '方向不一致') if row['kind'] == 'choice' else
        ('position', '位置偏差') if any(s in row['key'] for s in ('position', 'center', 'offset')) else ('dimension', '尺寸偏差'))
    return dict(type=key, label=label, source='dimensions', location=row['name'],
                evidence=f"设计值 {row['expected']} {row['unit']} · 测量值 {row['actual']} {row['unit']}",
                action='remeasure', action_label='复测后判定返工或重造')


class JointQualityService:
    def __init__(self, vision):
        self.vision = vision

    def _path(self, owner, batch_id):
        return self.vision._owner_root(owner) / 'joint-quality' / (sha256(batch_id.encode()).hexdigest() + '.json')

    def _index(self, owner, batch_id):
        path = self._path(owner, batch_id)
        if not path.exists():
            return {'version': 1, 'batch_id': batch_id, 'latest': {}}
        try:
            value = json.loads(path.read_text(encoding='utf8'))
            if value['version'] != 1 or value['batch_id'] != batch_id or not isinstance(value['latest'], dict):
                raise ValueError('identity')
            if any(not isinstance(k, str) or not isinstance(v, str) or not re.fullmatch(r'VI-[a-f0-9]{32}', v)
                   for k, v in value['latest'].items()):
                raise ValueError('record')
            return value
        except (OSError, ValueError, KeyError, TypeError):
            raise VisionServiceError(503, '联合质检关联记录待复核') from None

    def record_inspection(self, owner, record):
        identity = record['joint_identity']
        with _LOCK:
            index = self._index(owner, identity['batch_id'])
            index['latest'][identity['sample_id']] = record['inspection_id']
            self.vision._atomic_json(self._path(owner, identity['batch_id']), index)

    def report(self, owner, batch):
        with _LOCK:
            index = self._index(owner, batch['batch_id'])
        rows, counts, type_counts, type_labels = [], Counter(), Counter(), {}
        for sample in batch['samples']:
            identity = sample_identity(batch, sample['part_id'])
            comparison = (compare_measurements(batch, sample['observations']) if batch.get('scope') == SCOPE
                          else sim.compare_sample(batch['basis'], sample['observations']))
            issues = [dimension_issue(row) for row in comparison['issues']]
            # A known failing item prevents passage even when other items are missing.
            dimensions = 'fail' if issues else 'pass' if comparison['status'] == 'qualified' else 'pending'
            visual, inspection_id, evidence_error = 'pending', index['latest'].get(sample['part_id'], ''), ''
            if inspection_id:
                try:
                    record = self.vision.get_inspection(owner, inspection_id)
                    path = self.vision._owner_root(owner) / 'inspections' / (inspection_id + '.json')
                    stat = path.stat()
                    facts = _compact(str(path), stat.st_mtime_ns, stat.st_size)
                    if (not facts or record.get('joint_identity') != identity
                            or record.get('image_source') != 'upload' or record.get('part_id') != batch['design_run_id']
                            or record.get('quality_part_id') or record.get('source_context') is not None):
                        raise ValueError('unmatched evidence')
                    visual = 'pass' if facts['status'] == 'clear' else 'fail'
                    for issue in classify_inspection(record, kind='vision')['issues']:
                        issues.append(dict(type='vision:' + issue['category_label'], label=issue['category_label'],
                            source='vision', location=issue['location'], evidence=issue['evidence'],
                            action=issue['disposition']['code'], action_label=issue['disposition']['label']))
                except (VisionServiceError, OSError, ValueError, TypeError, KeyError, AttributeError):
                    evidence_error = '视觉证据无法核验，需重新检测或复核关联'
                    visual = 'pending'
            status = 'unqualified' if 'fail' in (dimensions, visual) else (
                'qualified' if dimensions == visual == 'pass' else 'pending')
            counts[status] += 1
            for issue in {i['type']: i for i in issues}.values():
                type_counts[issue['type']] += 1
                type_labels[issue['type']] = issue['label']
            actions = list(dict.fromkeys(i['action_label'] for i in issues))
            if status == 'qualified':
                handling = '合格流转：保存记录，进入下一工序或入库'
            elif status == 'unqualified':
                handling = '隔离不合格品；' + '；'.join(actions) + '；处理后复检相关项目，再核对尺寸与视觉均通过'
            else:
                handling = '暂缓流转，补齐尺寸／视觉检测后重新判定'
            rows.append(dict(sample_id=sample['part_id'], serial_number=sample.get('serial_number', sample['part_id']), dimensions=dimensions, visual=visual, status=status,
                inspection_id=inspection_id, evidence_error=evidence_error, issues=issues, handling=handling,
                dimensions_incomplete=comparison.get('plan_complete') is False or any(i['status'] in {'pending', 'review'} for i in comparison['items'])))
        total, determinate = len(rows), counts['qualified'] + counts['unqualified']
        return dict(version=1, scope=SCOPE if batch.get('scope') == SCOPE else 'simulation_validation', batch_id=batch['batch_id'],
            request_id=batch['request_id'], design_run_id=batch['design_run_id'],
            counts={**{k: counts[k] for k in ('qualified', 'unqualified', 'pending')}, 'total': total, 'determinate': determinate},
            qualified_rate=round(100 * counts['qualified'] / determinate, 2) if determinate else None,
            types=[dict(key=k, label=type_labels[k], sample_count=v) for k, v in type_counts.items()],
            items=rows, execution='not_executed', release_allowed=False)
