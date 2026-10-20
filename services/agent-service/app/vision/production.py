"""Trace a synthetic image pipeline to an authorized completed simulated output.

The images are reproducible brushed panels, never renderings or photographs of
the linked part. Results do not enter formal QMS or change product release.
"""
from __future__ import annotations

import base64
from copy import deepcopy
from datetime import datetime, timezone
from hashlib import sha256
from io import BytesIO
import json
import os
import re
from threading import Lock

from app.vision.service import VisionServiceError


GENERATOR_VERSION = 'production-brushed-panel-v1'
SCENARIOS = ('normal', 'obvious_scratch', 'low_contrast')
JOB_PATTERN = r'SIM-JOB-[a-f0-9]{64}'
REQUEST_PATTERN = r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'
_RUN_PATTERN = r'PV-[a-f0-9]{32}'
_FLOW_LOCK = Lock()
_ACTIVE = set()
_MAX_RECORD_BYTES = 24 * 1024 * 1024


def _digest(value):
    return sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, allow_nan=False,
                             separators=(',', ':')).encode()).hexdigest()


def _matches(pattern, value):
    return isinstance(value, str) and re.fullmatch(pattern, value) is not None


def _metrics(scenarios):
    result = {algorithm: dict(tp=0, fn=0, tn=0, fp=0) for algorithm in ('patchcore', 'yolo')}
    for scenario in scenarios:
        for detected in scenario['results']:
            key = ('tp' if detected['status'] == 'defect' else 'fn') if scenario['label'] == 'defect' else (
                'fp' if detected['status'] == 'defect' else 'tn')
            result[detected['algorithm']][key] += 1
    return result


def _localization_totals(scenarios):
    result = {'method': 'label_agnostic_bbox_iou', 'iou_threshold': .5,
              **{algorithm: dict(tp=0, fn=0, fp=0, ground_truth_count=0) for algorithm in ('patchcore', 'yolo')}}
    for scenario in scenarios:
        for algorithm, counts in scenario['localization']['results'].items():
            for key in ('tp', 'fn', 'fp', 'ground_truth_count'):
                result[algorithm][key] += counts[key]
    return result


class ProductionVisionService:
    def __init__(self, vision):
        self.vision = vision

    @staticmethod
    def _source(backend, actor, job_id):
        if not _matches(JOB_PATTERN, job_id):
            raise VisionServiceError(422, '模拟生产任务编号无效')
        job = backend.get(actor, job_id)
        output = job.get('output') if isinstance(job, dict) else None
        linked = ('job_id', 'part_id', 'design_run_id', 'design_digest', 'program_digest',
                  'factory_job_id', 'batch_id', 'actor_id')
        valid = (isinstance(output, dict) and job.get('job_id') == job_id
                 and job.get('status') == 'completed' and job.get('sync_status') == 'confirmed'
                 and job.get('source') == 'factory-simulation' and job.get('simulation_only') is True
                 and output.get('source') == 'factory-simulation' and output.get('simulation_only') is True
                 and output.get('synthetic') is True
                 and all(output.get(key) == job.get(key) for key in linked)
                 and output.get('part_id') == 'SIM-PART-' + job_id.removeprefix('SIM-JOB-')
                 and _matches(r'FC-[a-f0-9]{64}', output.get('design_run_id'))
                 and _matches(r'vprod-[a-f0-9]{32}', output.get('factory_job_id'))
                 and all(_matches(r'[a-f0-9]{64}', output.get(key))
                         for key in ('design_digest', 'program_digest', 'output_digest'))
                 and all(isinstance(job.get(key), str) and 0 < len(job[key]) <= 128
                         for key in ('actor_id', 'batch_id')))
        if not valid:
            raise VisionServiceError(409, '模拟产出尚未确认或来源身份不一致，不能进行视觉流程验证')
        return {**{key: output[key] for key in linked}, 'output_digest': output['output_digest'],
                'part_name': str(job.get('part_name') or ''), 'part_number': str(job.get('part_number') or ''),
                'simulation_only': True, 'synthetic': True}

    def _folder(self, owner):
        return self.vision._owner_root(owner) / 'production'

    def _pointer_path(self, owner, job_id):
        # Keep filenames bounded on Windows; the full identity is checked inside.
        return self._folder(owner) / 'latest' / (_digest(job_id)[:32] + '.json')

    @staticmethod
    def _run_id(owner, request_id):
        return 'PV-' + _digest([owner, request_id])[:32]

    def _active_key(self, owner, run_id):
        return (str(self._folder(owner).resolve()), run_id)

    @staticmethod
    def _load(path, maximum):
        try:
            with path.open('rb') as stream:
                data = stream.read(maximum + 1)
            if len(data) > maximum:
                raise ValueError('oversized record')
            return json.loads(data)
        except FileNotFoundError:
            return None
        except (OSError, ValueError, TypeError):
            raise VisionServiceError(503, '视觉验证记录暂不可读取，请保留原请求编号') from None

    def _save(self, owner, record):
        envelope = {'owner_id': owner, 'record': record, 'integrity': _digest(record)}
        if len(json.dumps(envelope, ensure_ascii=False, allow_nan=False).encode()) > _MAX_RECORD_BYTES:
            raise VisionServiceError(503, '视觉验证证据超过存储上限')
        self.vision._atomic_json(self._folder(owner) / 'runs' / (record['run_id'] + '.json'), envelope)

    def _read(self, owner, run_id, source):
        if not _matches(_RUN_PATTERN, run_id):
            raise VisionServiceError(503, '视觉验证记录索引无效')
        envelope = self._load(self._folder(owner) / 'runs' / (run_id + '.json'), _MAX_RECORD_BYTES)
        if envelope is None:
            return None
        try:
            record = envelope['record']
            valid = (envelope['owner_id'] == owner and envelope['integrity'] == _digest(record)
                     and record['run_id'] == run_id and _matches(REQUEST_PATTERN, record['request_id'])
                     and self._run_id(owner, record['request_id']) == run_id
                     and record['status'] in {'running', 'failed', 'completed'}
                     and isinstance(record['created_at'], str) and record['source'] == source
                     and record['generator']['version'] == GENERATOR_VERSION
                     and record['generator']['scope'] == 'synthetic_pipeline_only'
                     and record['generator']['seed'] == _digest([GENERATOR_VERSION, source])
                     and isinstance(record['scenarios'], list) and len(record['scenarios']) <= 3
                     and record['metrics'] == _metrics(record['scenarios']))
            datetime.fromisoformat(record['created_at'])
            if not valid:
                raise ValueError('invalid run')
            for index, scenario in enumerate(record['scenarios']):
                if (scenario['scenario'] != SCENARIOS[index]
                        or scenario['label'] != ('normal' if index == 0 else 'defect')
                        or not _matches(r'[a-f0-9]{64}', scenario['image_sha256'])
                        or not all(isinstance(scenario[key], str) and scenario[key].startswith('data:image/png;base64,')
                                   for key in ('input_image', 'mask_image'))
                        or len(scenario['results']) > 2):
                    raise ValueError('invalid scenario')
                for result_index, result in enumerate(scenario['results']):
                    if (result['algorithm'] != ('patchcore', 'yolo')[result_index]
                            or result['part_id'] != source['part_id'] or result['status'] not in {'clear', 'defect'}
                            or result['image_sha256'] != scenario['image_sha256']
                            or result['source_context'] != self._context(record, scenario)):
                        raise ValueError('invalid provenance')
            if record['status'] == 'completed' and (len(record['scenarios']) != 3
                    or any(len(row['results']) != 2 for row in record['scenarios'])
                    or not isinstance(record['parameter_inspection'], dict)):
                raise ValueError('incomplete evidence')
            # Historical evidence remains byte-for-byte unchanged and unassessed.
            # New records must match the saved mask and raw detector boxes exactly.
            if 'localization_metrics' in record or any('localization' in scene for scene in record['scenarios']):
                if any(scene.get('localization') != self._localization(scene) for scene in record['scenarios']):
                    raise ValueError('localization evidence differs')
                if record.get('localization_metrics') != _localization_totals(record['scenarios']):
                    raise ValueError('localization totals differ')
        except (KeyError, TypeError, ValueError, AttributeError, IndexError):
            raise VisionServiceError(409, '保存的视觉验证记录校验失败或来源已变化，请复核') from None
        if record['status'] == 'running' and self._active_key(owner, run_id) not in _ACTIVE:
            record.update(status='failed', error='验证执行已中断，已完成的部分结果已保留；请使用新请求重新验证')
            self._save(owner, record)
        return record

    @staticmethod
    def _context(record, scenario):
        return {'source': deepcopy(record['source']), 'generator': deepcopy(record['generator']),
                'scenario': scenario['scenario'], 'label': scenario['label']}

    def _latest_pointer(self, owner, job_id):
        pointer = self._load(self._pointer_path(owner, job_id), 1024)
        if pointer is None:
            return None
        if (not isinstance(pointer, dict) or pointer.get('owner_id') != owner
                or pointer.get('job_id') != job_id or not _matches(_RUN_PATTERN, pointer.get('run_id'))):
            raise VisionServiceError(503, '视觉验证记录索引无效')
        return pointer

    def _repair_latest_locked(self, owner, record):
        """Caller holds the flow lock, so a newer run cannot race this repair."""
        job_id = record['source']['job_id']
        pointer = self._latest_pointer(owner, job_id)
        if pointer is not None:
            if pointer['run_id'] == record['run_id']:
                return
            previous = self._read(owner, pointer['run_id'], record['source'])
            if previous is None:
                raise VisionServiceError(503, '视觉验证记录索引指向缺失记录，请核对存储')
            previous_time = datetime.fromisoformat(previous['created_at'])
            candidate_time = datetime.fromisoformat(record['created_at'])
            if previous_time.tzinfo is None or candidate_time.tzinfo is None:
                raise VisionServiceError(409, '视觉验证记录时间缺少时区，无法确认最新结果')
            if previous_time >= candidate_time:
                return
        self.vision._atomic_json(self._pointer_path(owner, job_id),
                                 {'owner_id': owner, 'job_id': job_id, 'run_id': record['run_id']})

    def _repair_latest(self, owner, record):
        # Replaying an active request must remain nonblocking. A later retry can
        # repair a crash gap after the current flow releases its writer lock.
        if _FLOW_LOCK.acquire(blocking=False):
            try:
                self._repair_latest_locked(owner, record)
            finally:
                _FLOW_LOCK.release()

    def latest(self, actor, backend, job_id):
        source = self._source(backend, actor, job_id)
        owner = actor['user_id']
        pointer = self._latest_pointer(owner, job_id)
        if pointer is None:
            return {'run': None}
        record = self._read(owner, pointer['run_id'], source)
        if record is None:
            raise VisionServiceError(503, '视觉验证记录尚不可读取，请保留原请求编号')
        return {'run': record}

    @staticmethod
    def _image_url(image):
        with BytesIO() as stream:
            image.save(stream, format='PNG')
            return 'data:image/png;base64,' + base64.b64encode(stream.getvalue()).decode('ascii')

    def _localization(self, scenario):
        # GT is used exclusively after inference, never to crop/filter predictions.
        from app.vision.yolo_evaluation import match_detections
        with self.vision._decode(scenario['mask_image']) as mask:
            bounds = mask.getbbox()
            size = mask.size
        if (bounds is None) != (scenario['label'] == 'normal'):
            raise ValueError('mask and known label disagree')
        ground_truth = [] if bounds is None else [{'bbox': list(bounds), 'label': scenario['scenario']}]
        evaluation = {'method': 'label_agnostic_bbox_iou', 'iou_threshold': .5,
                      'ground_truth_boxes': [item['bbox'] for item in ground_truth], 'results': {}}
        for detected in scenario['results']:
            if detected['image'] != {'width': size[0], 'height': size[1]}:
                raise ValueError('evaluation mask dimensions differ from inference')
            # PatchCore regions have no confidence; equal ranking preserves their
            # original ordering and never changes the stored inference evidence.
            predictions = [{**box, 'confidence': 1.0 if detected['algorithm'] == 'patchcore' else box['confidence']}
                           for box in detected['defects']]
            matched = match_detections(ground_truth, predictions, confidence=0, match_iou=.5)
            evaluation['results'][detected['algorithm']] = {
                **{key: matched[key] for key in ('tp', 'fn', 'fp', 'matches', 'unmatched_gt_indices', 'unmatched_prediction_indices')},
                'ground_truth_count': len(ground_truth)}
        return evaluation

    def _scenario(self, seed, name):
        import numpy as np
        from app.vision.evaluation import _synthetic_image
        # Same baseline and coordinates in all scenarios; only the injected defect differs.
        image, mask = _synthetic_image(np.random.default_rng(int(seed[:16], 16)), (512, 384), 'ambient', name)
        try:
            return {'scenario': name, 'label': 'normal' if name == 'normal' else 'defect',
                    'input_image': self._image_url(image), 'mask_image': self._image_url(mask),
                    'image_sha256': self.vision._image_digest(image), 'results': []}
        finally:
            image.close()
            mask.close()

    def verify(self, actor, backend, job_id, request_id):
        if os.getenv('QUALITY_VISION_DATA_MODE') == 'gear':
            raise VisionServiceError(409, '旧合成纹理流程已停用；请在视觉缺陷检测中使用真实齿轮图片。齿轮参数比对仍单独提供。')
        if not _matches(REQUEST_PATTERN, request_id):
            raise VisionServiceError(422, '视觉验证请求编号无效')
        source = self._source(backend, actor, job_id)
        owner = actor['user_id']
        run_id = self._run_id(owner, request_id)
        existing = self._read(owner, run_id, source)
        if existing is not None:
            self._repair_latest(owner, existing)
            return existing
        if not _FLOW_LOCK.acquire(blocking=False):
            raise VisionServiceError(409, '已有生产视觉验证正在执行，请稍后重试')
        active_key = self._active_key(owner, run_id)
        try:
            existing = self._read(owner, run_id, source)
            if existing is not None:
                self._repair_latest_locked(owner, existing)
                return existing
            _ACTIVE.add(active_key)
            record = {'run_id': run_id, 'request_id': request_id, 'status': 'running',
                      'created_at': datetime.now(timezone.utc).isoformat(), 'source': source,
                      'generator': {'version': GENERATOR_VERSION, 'seed': _digest([GENERATOR_VERSION, source]),
                                    'scope': 'synthetic_pipeline_only'},
                      'parameter_inspection': None, 'scenarios': [], 'metrics': _metrics([]),
                      'localization_metrics': _localization_totals([])}
            self._save(owner, record)
            self.vision._atomic_json(self._pointer_path(owner, job_id),
                                     {'owner_id': owner, 'job_id': job_id, 'run_id': run_id})
            try:
                inspection = backend.inspect(actor, source['part_id'], source['output_digest'])
                if (not isinstance(inspection, dict) or any(inspection.get(key) != source[key] for key in
                        ('job_id', 'part_id', 'design_run_id', 'design_digest', 'output_digest', 'actor_id', 'batch_id'))
                        or inspection.get('source') != 'factory-simulation'
                        or inspection.get('simulation_only') is not True
                        or inspection.get('status') not in {'pass', 'fail', 'insufficient_data', 'review'}):
                    raise VisionServiceError(409, '参数检查返回的产出身份不一致')
                record['parameter_inspection'] = inspection
                self._save(owner, record)
                model, _ = self.vision._model(owner, 'patchcore-demo')
                threshold = model['suggested_threshold']
                yolo_model = self.vision._yolo_model()
                for name in SCENARIOS:
                    scenario = self._scenario(record['generator']['seed'], name)
                    scenario['localization'] = self._localization(scenario)
                    record['scenarios'].append(scenario)
                    self._save(owner, record)
                    for algorithm in ('patchcore', 'yolo'):
                        values = {'algorithm': algorithm, 'model_id': 'patchcore-demo' if algorithm == 'patchcore' else 'yolo-default',
                                  'image': scenario['input_image'], 'filename': name + '.png', 'part_id': source['part_id'],
                                  'threshold': threshold if algorithm == 'patchcore' else None,
                                  'confidence': yolo_model['recommended_confidence'] if algorithm == 'yolo' else .25,
                                  'iou': yolo_model['recommended_iou'] if algorithm == 'yolo' else .45}
                        result = self.vision.detect(owner, values, source_context=self._context(record, scenario))
                        if result.get('image_sha256') != scenario['image_sha256']:
                            raise VisionServiceError(409, '视觉检测返回的图片身份不一致')
                        scenario['results'].append(result)
                        record['metrics'] = _metrics(record['scenarios'])
                        scenario['localization'] = self._localization(scenario)
                        record['localization_metrics'] = _localization_totals(record['scenarios'])
                        self._save(owner, record)
                record['status'] = 'completed'
            except Exception:
                record.update(status='failed', error='视觉验证未完成，已完成的部分结果已保留；请检查模型、生产来源和服务状态后使用新请求重试')
            self._save(owner, record)
            return record
        finally:
            _ACTIVE.discard(active_key)
            _FLOW_LOCK.release()
