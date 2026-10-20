"""Owner-scoped local model artifacts and visual inspection evidence.

Visual results never invoke the production-part release workflow. Weights are
trusted operator configuration; HTTP callers may supply images only.
"""
from __future__ import annotations

from contextlib import closing, contextmanager
from copy import deepcopy
from datetime import datetime, timezone
from hashlib import sha256
from io import BytesIO
import importlib
import importlib.util
import json
import math
import os
from pathlib import Path
import re
from threading import Lock
from urllib.parse import urlsplit
from uuid import uuid4

from app.vision.calibration import threshold_strategies
from app.vision.preprocessing import parse_patchcore_config


MAX_IMAGE_BYTES = 4 * 1024 * 1024
MAX_TRAINING_IMAGES = 24
_TASK_LOCK = Lock()
_MODEL_ID = re.compile(r'PC-[a-f0-9]{32}\Z')
_INSPECTION_ID = re.compile(r'VI-[a-f0-9]{32}\Z')


class VisionServiceError(RuntimeError):
    def __init__(self, status_code, detail):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


class VisionService:
    def __init__(self, root=None, *, algorithms=None, readiness=None):
        default = Path(__file__).resolve().parents[4] / '.runtime' / 'quality-vision'
        self.root = Path(root or os.getenv('QUALITY_VISION_ROOT') or default)
        self.algorithms = algorithms
        self.readiness = readiness or self._readiness
        self.task_lock = _TASK_LOCK

    @staticmethod
    def _weights(algorithm):
        key = 'QUALITY_PATCHCORE_BACKBONE_WEIGHTS' if algorithm == 'patchcore' else 'QUALITY_YOLO_WEIGHTS'
        return os.getenv(key, '').strip()

    @classmethod
    def _readiness(cls, algorithm):
        packages = ('numpy', 'PIL', 'torch', 'torchvision', 'cv2') if algorithm == 'patchcore' else ('numpy', 'PIL', 'torch', 'ultralytics')
        try:
            weights = cls._weights(algorithm)
            if algorithm == 'yolo' and Path(weights).suffix.lower() == '.onnx':
                packages += ('onnxruntime',)
            if any(importlib.util.find_spec(name) is None for name in packages):
                return False, '视觉运行依赖未安装；请按部署文档安装对应算法依赖'
            if not weights or not Path(weights).is_file():
                return False, '未配置本地可信权重；系统不会自动下载模型'
        except (ImportError, ValueError, OSError):
            return False, '视觉运行环境不可用'
        return True, ''

    def _module(self):
        if self.algorithms is not None:
            return self.algorithms
        try:
            return importlib.import_module('app.vision.algorithms')
        except (ImportError, OSError):
            raise VisionServiceError(503, '视觉运行依赖不可用，请检查部署配置') from None

    def _require_available(self, algorithm):
        available, reason = self.readiness(algorithm)
        if not available:
            raise VisionServiceError(503, reason)

    def _owner_root(self, actor):
        if not isinstance(actor, str) or not actor.strip():
            raise VisionServiceError(401, '请先登录')
        return self.root / sha256(actor.encode('utf-8')).hexdigest()

    @staticmethod
    def _public_model(record):
        fields = ('model_id', 'name', 'algorithm', 'sample_count', 'memory_size', 'suggested_threshold',
                  'calibration_required', 'threshold_method', 'preprocessing', 'pipeline_version', 'calibration',
                  'description', 'source_url', 'classes', 'read_only', 'demo',
                  'recommended_confidence', 'recommended_iou', 'calibration_scope', 'input_size')
        return {key: record[key] for key in fields if key in record}

    @staticmethod
    def _deployment_metadata(path):
        """Only administrator-configured files supply shared model metadata."""
        value = json.loads(Path(path).read_text(encoding='utf-8'))
        if not isinstance(value, dict) or not isinstance(value.get('name'), str) or not value['name'].strip():
            raise ValueError('invalid deployment metadata')
        for key in ('description', 'source_url'):
            if key in value and not isinstance(value[key], str):
                raise ValueError('invalid deployment text')
        if value.get('source_url'):
            url = urlsplit(value['source_url'])
            if url.scheme != 'https' or not url.hostname or url.username or url.password:
                raise ValueError('invalid source URL')
        if 'classes' in value and (not isinstance(value['classes'], list) or
                any(not isinstance(label, str) or not label.strip() for label in value['classes'])):
            raise ValueError('invalid classes')
        for key in ('demo', 'read_only'):
            if key in value and not isinstance(value[key], bool):
                raise ValueError('invalid model scope')
        return value

    @staticmethod
    def _validate_preset_calibration(value):
        calibration = value.get('calibration')
        if calibration is None:
            if value.get('calibration_required') is False:
                raise ValueError('missing calibration')
            return
        methods = {'independent_labeled_calibration', 'independent_labeled_synthetic_calibration'}
        if (value.get('threshold_method') not in methods or value.get('calibration_required') is not False
                or not isinstance(calibration, dict) or calibration.get('policy') not in {'recall_priority', 'balanced', 'zero_fp'}):
            raise ValueError('invalid calibration')
        normal, defect = calibration.get('normal_count'), calibration.get('defect_count')
        if type(normal) is not int or normal < 2 or type(defect) is not int or defect < 1:
            raise ValueError('invalid calibration counts')
        datetime.fromisoformat(calibration['created_at'])
        strategies = calibration['strategies']
        for policy in ('recall_priority', 'balanced', 'zero_fp'):
            strategy = strategies[policy]
            threshold, metrics = strategy['threshold'], strategy['metrics']
            if type(threshold) not in (float, int) or not math.isfinite(threshold) or threshold <= 0:
                raise ValueError('invalid calibration threshold')
            if any(type(metrics[key]) is not int or metrics[key] < 0 for key in ('tp', 'fn', 'tn', 'fp')):
                raise ValueError('invalid calibration metrics')
            if metrics['tp'] + metrics['fn'] != defect or metrics['tn'] + metrics['fp'] != normal:
                raise ValueError('invalid calibration denominators')
            for key, actual in (('fnr', metrics['fn'] / defect), ('fpr', metrics['fp'] / normal)):
                if type(metrics[key]) not in (float, int) or not math.isfinite(metrics[key]) or abs(metrics[key] - actual) > 1e-9:
                    raise ValueError('invalid calibration rate')
            if policy == 'zero_fp' and metrics['fp']:
                raise ValueError('invalid zero false-positive calibration')
        if value['suggested_threshold'] != strategies[calibration['policy']]['threshold']:
            raise ValueError('calibration threshold mismatch')

    def _yolo_model(self):
        path = os.getenv('QUALITY_YOLO_METADATA', '').strip()
        if not path:
            return {'model_id': 'yolo-default', 'name': '本地 YOLO 缺陷模型', 'algorithm': 'yolo',
                    'recommended_confidence': .25, 'recommended_iou': .45}
        try:
            value = self._deployment_metadata(path)
            if value.get('weights_sha256') != self._digest(self._weights('yolo')):
                raise ValueError('configured model metadata and weights differ')
            for key, default in (('recommended_confidence', .25), ('recommended_iou', .45)):
                candidate = value.get(key, default)
                if type(candidate) not in (int, float) or not math.isfinite(candidate) or not 0 < candidate <= 1:
                    raise ValueError('invalid recommended detector parameter')
                value[key] = candidate
            if 'calibration_scope' in value and (not isinstance(value['calibration_scope'], str)
                    or not value['calibration_scope'].strip() or len(value['calibration_scope']) > 200):
                raise ValueError('invalid calibration scope')
            if 'input_size' in value and (type(value['input_size']) is not int or value['input_size'] not in (320, 640)):
                raise ValueError('invalid YOLO input size')
            return {**value, 'model_id': 'yolo-default', 'algorithm': 'yolo', 'read_only': True}
        except (OSError, ValueError, TypeError):
            raise VisionServiceError(503, 'YOLO 模型说明与权重不匹配或损坏，请检查部署配置') from None

    def _preset_model(self):
        configured = os.getenv('QUALITY_PATCHCORE_PRESET_DIR', '').strip()
        if not configured:
            raise VisionServiceError(404, '尚未配置预置 PatchCore 记忆库')
        try:
            folder = Path(configured)
            value = self._deployment_metadata(folder / 'model.json')
            bank_path = folder / 'memory.npz'
            if (value.get('model_id') != 'patchcore-demo' or value.get('algorithm') != 'patchcore'
                    or value.get('weights_sha256') != self._digest(self._weights('patchcore'))
                    or value.get('memory_bank_sha256') != self._digest(bank_path)):
                raise ValueError('preset artifacts differ')
            threshold = value.get('suggested_threshold')
            if isinstance(threshold, bool) or not isinstance(threshold, (float, int)) or not math.isfinite(threshold) or threshold <= 0:
                raise ValueError('invalid preset threshold')
            for key, minimum in (('sample_count', 2), ('memory_size', 1)):
                if type(value.get(key)) is not int or value[key] < minimum:
                    raise ValueError('invalid preset dimensions')
            if 'pipeline_version' in value and (type(value['pipeline_version']) is not int or value['pipeline_version'] < 1):
                raise ValueError('invalid pipeline version')
            self._validate_preset_calibration(value)
            value['preprocessing'] = parse_patchcore_config(value.get('preprocessing'))
            value.update(read_only=True, demo=True)
            return value, bank_path
        except (OSError, ValueError, TypeError, KeyError):
            raise VisionServiceError(503, '预置 PatchCore 记忆库损坏或与当前骨干权重不匹配，请检查部署配置') from None

    def capabilities(self, actor):
        algorithms = []
        for key, label in [('patchcore', 'PatchCore 无监督缺陷检测'), ('yolo', 'YOLO 缺陷目标检测')]:
            available, reason = self.readiness(key)
            algorithms.append({'id': key, 'name': label, 'available': available,
                               'reason': reason, 'can_train': key == 'patchcore' and available})
        models = []
        for path in sorted((self._owner_root(actor) / 'models').glob('PC-*.json')):
            if not _MODEL_ID.fullmatch(path.stem):
                continue
            try:
                value = json.loads(path.read_text(encoding='utf-8'))
                if value.get('model_id') == path.stem and value.get('algorithm') == 'patchcore':
                    models.append(self._public_model(value))
            except (OSError, ValueError, TypeError, AttributeError):
                continue
        warnings = []
        if algorithms[0]['available'] and os.getenv('QUALITY_PATCHCORE_PRESET_DIR', '').strip():
            try:
                models.append(self._public_model(self._preset_model()[0]))
            except VisionServiceError as error:
                warnings.append(error.detail)
        if algorithms[1]['available']:
            try:
                models.append(self._public_model(self._yolo_model()))
            except VisionServiceError as error:
                algorithms[1].update(available=False, reason=error.detail)
        from app.vision.dataset import public_dataset
        dataset = public_dataset()
        if os.getenv('QUALITY_VISION_DATA_MODE') == 'gear' and not Path(os.getenv('QUALITY_YOLO_WEIGHTS', '')).is_file():
            algorithms[1].update(available=False, reason='齿轮版 YOLO11 尚在训练或未完成部署；完成后请刷新模型状态。')
        if os.getenv('QUALITY_VISION_DATA_MODE') == 'gear' and not os.getenv('QUALITY_PATCHCORE_PRESET_DIR', '').strip():
            warnings.append('当前齿轮数据没有已确认正常样本；PatchCore 需使用真实良品图片单独建立记忆库。')
        return {'algorithms': algorithms, 'models': models, 'dataset': dataset,
                'data_mode': 'gear' if os.getenv('QUALITY_VISION_DATA_MODE') == 'gear' else 'synthetic',
                'model_warnings': warnings,
                'limits': {'max_image_bytes': MAX_IMAGE_BYTES, 'max_training_images': MAX_TRAINING_IMAGES}}

    @contextmanager
    def _task(self):
        if not self.task_lock.acquire(blocking=False):
            raise VisionServiceError(409, '视觉任务正在执行，请稍后重试')
        try:
            yield
        finally:
            self.task_lock.release()

    def _decode(self, value):
        module = self._module()
        try:
            return module.decode_image(value)
        except module.VisionUnavailable:
            raise VisionServiceError(503, '图像解码依赖不可用') from None
        except (ValueError, TypeError, OSError):
            raise VisionServiceError(422, '图片无效；请上传不超过 4 MiB 的 PNG、JPEG 或 WebP 图片') from None

    @staticmethod
    def _atomic_json(path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        temp = path.with_name('.' + uuid4().hex + '.tmp')
        try:
            with temp.open('x', encoding='utf-8') as stream:
                json.dump(value, stream, ensure_ascii=False, allow_nan=False, separators=(',', ':'))
                stream.flush()
                os.fsync(stream.fileno())
            os.replace(temp, path)
        finally:
            temp.unlink(missing_ok=True)

    @staticmethod
    def _digest(path):
        digest = sha256()
        with Path(path).open('rb') as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                digest.update(chunk)
        return digest.hexdigest()

    @staticmethod
    def _image_digest(image):
        return sha256(('rgb-v1\0%dx%d\0' % image.size).encode('ascii') + image.tobytes()).hexdigest()

    @staticmethod
    def _load_bank(path):
        import numpy as np
        with np.load(path, allow_pickle=False) as saved:
            bank = saved['memory_bank']
        if bank.ndim != 2 or not bank.size or bank.shape[0] > 1024 or bank.dtype.kind != 'f' or not np.isfinite(bank).all():
            raise ValueError('invalid memory bank')
        return bank

    def train(self, actor, values):
        with self._task():
            self._require_available('patchcore')
            images = None
            bank_path = None
            try:
                module = self._module()
                try:
                    config = parse_patchcore_config(values.get('preprocessing'))
                except ValueError:
                    raise VisionServiceError(422, 'PatchCore 预处理参数无效') from None
                training_digests = []
                def decoded_images():
                    # Only one original frame is live; fit retains extracted features.
                    for value in values['images']:
                        with closing(self._decode(value)) as decoded:
                            training_digests.append(self._image_digest(decoded))
                            yield decoded
                images = decoded_images()
                import numpy as np
                weights = self._weights('patchcore')
                before = self._digest(weights)
                fitted = module.PatchCoreDetector(weights, config=config).fit(images, coreset_ratio=values['coreset_ratio'])
                if before != self._digest(weights):
                    raise VisionServiceError(409, '训练过程中权重发生变化，请重新训练')
                bank = np.asarray(fitted['memory_bank'])
                if bank.ndim != 2 or not bank.size or bank.dtype.kind != 'f' or not np.isfinite(bank).all():
                    raise ValueError('invalid memory bank')
                metadata = dict(fitted.get('metadata') or {key: value for key, value in fitted.items() if key != 'memory_bank'})
                model_id = 'PC-' + uuid4().hex
                record = {'model_id': model_id, 'name': values['name'], 'algorithm': 'patchcore',
                          'sample_count': len(training_digests), 'memory_size': int(bank.shape[0]), **metadata,
                          'weights_sha256': before, 'created_at': datetime.now(timezone.utc).isoformat()}
                # Only server-generated IDs and metadata control storage paths.
                record.update(model_id=model_id, name=values['name'], algorithm='patchcore',
                              sample_count=len(training_digests), preprocessing=config, pipeline_version=2,
                              training_image_sha256=training_digests)
                folder = self._owner_root(actor) / 'models'
                folder.mkdir(parents=True, exist_ok=True)
                bank_path = folder / (model_id + '.npz')
                temp = folder / ('.' + uuid4().hex + '.npz')
                try:
                    with temp.open('xb') as stream:
                        np.savez_compressed(stream, memory_bank=bank)
                        stream.flush()
                        os.fsync(stream.fileno())
                    os.replace(temp, bank_path)
                finally:
                    temp.unlink(missing_ok=True)
                self._atomic_json(folder / (model_id + '.json'), record)
                return self._public_model(record)
            except VisionServiceError:
                raise
            except Exception:
                if bank_path is not None:
                    bank_path.unlink(missing_ok=True)
                raise VisionServiceError(503, 'PatchCore 训练未完成，请检查依赖、本地权重和存储配置') from None
            finally:
                if images is not None:
                    images.close()

    def _model(self, actor, model_id):
        self._owner_root(actor)
        if model_id == 'patchcore-demo':
            return self._preset_model()
        if not _MODEL_ID.fullmatch(model_id):
            raise VisionServiceError(404, '未找到当前账号的模型')
        folder = self._owner_root(actor) / 'models'
        path = folder / (model_id + '.json')
        if not path.is_file() or not path.with_suffix('.npz').is_file():
            raise VisionServiceError(404, '未找到当前账号的模型')
        try:
            value = json.loads(path.read_text(encoding='utf-8'))
            if value.get('model_id') != model_id or value.get('algorithm') != 'patchcore':
                raise ValueError('model identity')
            return value, path.with_suffix('.npz')
        except (OSError, ValueError, TypeError, AttributeError):
            raise VisionServiceError(503, '模型记录损坏，请重新训练') from None

    def detect(self, actor, values, *, source_context=None):
        with self._task():
            quality_part = None
            if values.get('quality_part_id'):
                from app.vision.combined import CombinedQualityService
                quality_part = CombinedQualityService(self).get_part(actor, values['quality_part_id'])
                if quality_part['scope'] == 'production' and (
                        values.get('image_source', 'upload') != 'upload' or source_context is not None):
                    raise VisionServiceError(409, '公开测试图片或模拟结果不能关联生产实物，请切换到流程验证')
            algorithm = values['algorithm']
            model = self._model(actor, values['model_id']) if algorithm == 'patchcore' else None
            if algorithm == 'yolo' and values['model_id'] != 'yolo-default':
                raise VisionServiceError(404, '未找到 YOLO 模型')
            self._require_available(algorithm)
            image = self._decode(values['image'])
            try:
                module = self._module()
                weights = self._weights(algorithm)
                digest = self._digest(weights)
                if model is not None:
                    if model[0].get('weights_sha256') != digest:
                        raise VisionServiceError(409, 'PatchCore 特征权重已改变，请使用当前权重重新训练基准')
                    bank_bytes = model[1].read_bytes()
                    bank_digest = sha256(bank_bytes).hexdigest()
                    if model[0].get('memory_bank_sha256', bank_digest) != bank_digest:
                        raise VisionServiceError(409, 'PatchCore 记忆库发生变化，请刷新模型后重试')
                    bank = self._load_bank(BytesIO(bank_bytes))
                    config = parse_patchcore_config(model[0].get('preprocessing'))
                    result = module.PatchCoreDetector(weights, config=config).predict(image, bank, values['threshold'])
                else:
                    deployment = self._yolo_model()
                    detector = module.YoloDetector(weights, input_size=deployment['input_size']) if 'input_size' in deployment else module.YoloDetector(weights)
                    result = detector.predict(image, values['confidence'], values['iou'])
                if digest != self._digest(weights):
                    raise VisionServiceError(409, '检测过程中权重发生变化，请重新检测')
                if model is not None and bank_digest != self._digest(model[1]):
                    raise VisionServiceError(409, '检测过程中记忆库发生变化，请重新检测')
                self._validate_result(result, algorithm, image.size)
                inspection_id = 'VI-' + uuid4().hex
                record = {**result, 'algorithm': algorithm, 'inspection_id': inspection_id,
                          'model_id': values['model_id'], 'created_at': datetime.now(timezone.utc).isoformat(),
                          'part_id': values['part_id'], 'filename': values['filename'],
                          'model_sha256': digest,
                          'image_sha256': self._image_digest(image),
                          'image_digest_format': 'rgb-pixels-with-size-v1',
                          'image_source': values.get('image_source', 'upload'),
                          'parameters': {'threshold': result['threshold'], 'confidence': values['confidence'], 'iou': values['iou']}}
                if quality_part is not None:
                    record['quality_part_id'] = quality_part['quality_part_id']
                    record['quality_identity'] = {k: quality_part[k] for k in (
                        'scope', 'batch_id', 'serial_number', 'design_version')}
                if model is not None:
                    record['parameters']['preprocessing'] = config
                    record['memory_bank_sha256'] = bank_digest
                record['model'] = self._public_model(model[0] if model is not None else deployment)
                if algorithm == 'yolo':
                    record['parameters']['input_size'] = deployment.get('input_size', 640)
                # Linked workflow supplies this only after resolving server-owned facts.
                # The image-only HTTP schema deliberately has no source_context field.
                if source_context is not None:
                    record['source_context'] = deepcopy(source_context)
                if quality_part is not None:
                    # Invalidate a prior pass before publishing the new inspection file.
                    # A failed artifact write may leave pending review, never stale qualification.
                    CombinedQualityService(self).record_inspection(actor, record)
                self._atomic_json(self._owner_root(actor) / 'inspections' / (inspection_id + '.json'), record)
                return record
            except VisionServiceError:
                raise
            except Exception:
                raise VisionServiceError(503, '视觉检测未完成，请检查依赖、本地模型和存储配置') from None
            finally:
                image.close()

    def calibrate(self, actor, values):
        with self._task():
            record, bank_path = self._model(actor, values['model_id'])
            if record.get('read_only'):
                raise VisionServiceError(403, '预置演示记忆库为只读；请用本产品正常图片建立个人模型后校准')
            self._require_available('patchcore')
            training = record.get('training_image_sha256')
            if not isinstance(training, list) or not training:
                raise VisionServiceError(409, '旧特征库缺少建库图片摘要，请重新建库后校准，以检查数据重叠')
            weights = self._weights('patchcore')
            try:
                digest = self._digest(weights)
                if digest != record.get('weights_sha256'):
                    raise VisionServiceError(409, 'PatchCore 特征权重已改变，请重新建库后校准')
                config = parse_patchcore_config(record.get('preprocessing'))
                bank = self._load_bank(bank_path)
                detector = self._module().PatchCoreDetector(weights, config=config)
                evidence, seen = [], set(training)
                normal, defect = [], []
                for label, images, scores in [('normal', values['normal_images'], normal),
                                               ('defect', values['defect_images'], defect)]:
                    for encoded in images:
                        with closing(self._decode(encoded)) as image:
                            image_digest = self._image_digest(image)
                            if image_digest in seen:
                                raise VisionServiceError(422, '校准图片重复或与建库集重叠；请使用独立正常和缺陷样本')
                            seen.add(image_digest)
                            anomaly_map = detector.anomaly_map(image, bank)
                            import numpy as np
                            if anomaly_map.shape != (image.height, image.width) or not np.isfinite(anomaly_map).all() or (anomaly_map < 0).any():
                                raise ValueError('invalid anomaly map')
                            score = float(anomaly_map.max())
                            scores.append(score)
                            evidence.append({'image_sha256': image_digest, 'label': label, 'score': score})
                strategies = threshold_strategies(normal, defect)
                policy = values['policy']
                if digest != self._digest(weights):
                    raise VisionServiceError(409, '校准过程中权重发生变化，请重新校准')
                calibration = {'policy': policy, 'strategies': strategies,
                               'normal_count': len(normal), 'defect_count': len(defect),
                               'created_at': datetime.now(timezone.utc).isoformat(),
                               'scope': 'calibration_only', 'image_digest_format': 'rgb-pixels-with-size-v1'}
                record.update(suggested_threshold=strategies[policy]['threshold'], calibration=calibration,
                              calibration_image_scores=evidence, calibration_required=False,
                              threshold_method='independent_labeled_calibration')
                self._atomic_json(bank_path.with_suffix('.json'), record)
                return self._public_model(record)
            except VisionServiceError:
                raise
            except Exception:
                raise VisionServiceError(503, '阈值校准未完成，请检查模型、图片及存储配置') from None

    @staticmethod
    def _validate_result(result, algorithm, size):
        if not isinstance(result, dict) or result.get('algorithm') != algorithm or result.get('status') not in {'clear', 'defect'}:
            raise ValueError('invalid detector result')
        score, threshold = result.get('score'), result.get('threshold')
        if any(isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value)
               for value in (score, threshold)) or threshold <= 0 or score < 0:
            raise ValueError('invalid score')
        defects = result.get('defects')
        if not isinstance(defects, list) or (result['status'] == 'clear') != (score < threshold and not defects):
            raise ValueError('inconsistent result')
        if result['status'] == 'defect' and (score < threshold or not defects):
            raise ValueError('missing defect evidence')
        width, height = size
        if result.get('image') != {'width': width, 'height': height}:
            raise ValueError('image dimensions')
        for defect in defects:
            bbox = defect.get('bbox')
            if not isinstance(defect.get('label'), str) or not defect['label'] or not isinstance(bbox, list) or len(bbox) != 4:
                raise ValueError('invalid defect')
            if any(isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) for value in bbox):
                raise ValueError('invalid bbox')
            if not (0 <= bbox[0] < bbox[2] <= width and 0 <= bbox[1] < bbox[3] <= height):
                raise ValueError('out of bounds bbox')
            confidence = defect.get('confidence')
            if algorithm == 'yolo' or confidence is not None:
                if isinstance(confidence, bool) or not isinstance(confidence, (int, float)) or not math.isfinite(confidence) or not 0 <= confidence <= 1:
                    raise ValueError('invalid confidence')
                if algorithm == 'yolo' and confidence < threshold:
                    raise ValueError('confidence below threshold')
        steps = result.get('steps')
        if not isinstance(steps, list) or not steps or any(step.get('status') != 'completed' for step in steps):
            raise ValueError('incomplete algorithm steps')
        if not isinstance(result.get('annotated_image'), str) or not result['annotated_image'].startswith('data:image/'):
            raise ValueError('missing visual evidence')
        if 'heatmap_image' in result and (not isinstance(result['heatmap_image'], str) or not result['heatmap_image'].startswith('data:image/')):
            raise ValueError('invalid anomaly heatmap')

    def get_inspection(self, actor, inspection_id):
        if not _INSPECTION_ID.fullmatch(inspection_id):
            raise VisionServiceError(404, '未找到当前账号的检测记录')
        path = self._owner_root(actor) / 'inspections' / (inspection_id + '.json')
        if not path.is_file():
            raise VisionServiceError(404, '未找到当前账号的检测记录')
        try:
            result = json.loads(path.read_text(encoding='utf-8'))
            if result.get('inspection_id') != inspection_id:
                raise ValueError('inspection identity')
            return result
        except (OSError, ValueError, TypeError, AttributeError):
            raise VisionServiceError(503, '检测记录暂不可读取') from None
