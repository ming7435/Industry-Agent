"""Persisted fusion of two server-owned inspections, never client-supplied verdicts."""
from copy import deepcopy
from datetime import datetime, timezone
from hashlib import sha256
import re

from app.vision.combined import CombinedQualityService
from app.vision.service import VisionServiceError


_INSPECTION = re.compile(r'VI-[a-f0-9]{32}\Z')
_DIGEST = re.compile(r'[a-f0-9]{64}\Z')
_PART = re.compile(r'CQ-[a-f0-9]{32}\Z')
_IMAGE_FORMAT = 'rgb-pixels-with-size-v1'
_IMAGE_FIELDS = ('filename', 'part_id', 'image_sha256', 'image_digest_format', 'image_source', 'image')
_OPTIONAL_FIELDS = ('quality_part_id', 'quality_identity', 'source_context')


class SequentialVisionService:
    def __init__(self, vision):
        self.vision = vision
        self.combined = CombinedQualityService(vision)

    @staticmethod
    def _invalid():
        raise VisionServiceError(409, '两阶段检测证据无效或不属于同一图片与实物，请重新执行顺序检测')

    def _validate_stage(self, record, algorithm):
        try:
            if not _INSPECTION.fullmatch(record['inspection_id']) or record['algorithm'] != algorithm:
                self._invalid()
            image = record['image']
            if (not isinstance(image, dict) or any(type(image.get(k)) is not int or image[k] <= 0
                    for k in ('width', 'height'))
                    or not isinstance(record.get('image_sha256'), str)
                    or not _DIGEST.fullmatch(record['image_sha256'])
                    or record.get('image_digest_format') != _IMAGE_FORMAT
                    or record.get('image_source') not in {'upload', 'public_gear_reference'}
                    or not all(isinstance(record.get(k), str) for k in ('filename', 'part_id'))
                    or not isinstance(record.get('model_id'), str) or not record['model_id'].strip()
                    or not isinstance(record.get('model_sha256'), str)
                    or not _DIGEST.fullmatch(record['model_sha256'])):
                self._invalid()
            self.vision._validate_result(record, algorithm, (image['width'], image['height']))
            if algorithm == 'yolo' and (
                    record['threshold'] > 1 or record['score'] != max(
                        (d['confidence'] for d in record['defects']), default=0)):
                self._invalid()
            part_id = record.get('quality_part_id')
            if part_id:
                identity = record.get('quality_identity')
                if (not isinstance(part_id, str) or not _PART.fullmatch(part_id)
                        or not isinstance(identity, dict)
                        or identity.get('scope') not in {'production', 'validation'}
                        or any(not isinstance(identity.get(k), str) or not identity[k].strip()
                               for k in ('batch_id', 'serial_number', 'design_version'))):
                    self._invalid()
            elif record.get('quality_identity') is not None:
                self._invalid()
            if record.get('source_context') is not None and not isinstance(record['source_context'], dict):
                self._invalid()
            created = datetime.fromisoformat(record['created_at'])
            if created.tzinfo is None:
                self._invalid()
            return created
        except (KeyError, ValueError, TypeError, AttributeError):
            self._invalid()

    def fuse(self, owner, values):
        pc_id, yolo_id = values['patchcore_inspection_id'], values['yolo_inspection_id']
        if pc_id == yolo_id or not all(isinstance(v, str) and _INSPECTION.fullmatch(v) for v in (pc_id, yolo_id)):
            raise VisionServiceError(422, '请提供两个不同的有效检测编号')
        # Share the detector lock so a successful fusion cannot interleave with
        # another detection publishing evidence for the same physical part.
        with self.vision._task():
            pc = self.vision.get_inspection(owner, pc_id)
            yolo = self.vision.get_inspection(owner, yolo_id)
            pc_time = self._validate_stage(pc, 'patchcore')
            yolo_time = self._validate_stage(yolo, 'yolo')
            if (pc_time > yolo_time or any(pc.get(k) != yolo.get(k)
                    for k in _IMAGE_FIELDS + _OPTIONAL_FIELDS)):
                self._invalid()
            classification = ('known_defect' if yolo['status'] == 'defect'
                              else 'unknown_anomaly' if pc['status'] == 'defect' else 'clear')
            inspection_id = 'VI-' + sha256(('patchcore_yolo:v1:' + pc_id + ':' + yolo_id).encode()).hexdigest()[:32]
            path = self.vision._owner_root(owner) / 'inspections' / (inspection_id + '.json')
            exists = path.is_file()
            if exists:
                record = self.vision.get_inspection(owner, inspection_id)
                if (record.get('algorithm') != 'patchcore_yolo' or record.get('patchcore') != pc
                        or record.get('yolo') != yolo or record.get('classification') != classification
                        or record.get('status') != ('clear' if classification == 'clear' else 'defect')
                        or record.get('inspection_ids') != [pc_id, yolo_id]
                        or any(record.get(k) != pc.get(k) for k in _IMAGE_FIELDS + _OPTIONAL_FIELDS)):
                    self._invalid()
            else:
                record = {k: deepcopy(pc[k]) for k in _IMAGE_FIELDS + _OPTIONAL_FIELDS if k in pc}
                record.update(algorithm='patchcore_yolo', inspection_id=inspection_id,
                              inspection_ids=[pc_id, yolo_id], patchcore=pc, yolo=yolo,
                              created_at=datetime.now(timezone.utc).isoformat(),
                              status='clear' if classification == 'clear' else 'defect',
                              classification=classification, score=None, threshold=None)
            publish = lambda: self.vision._atomic_json(path, record)
            if record.get('quality_part_id'):
                part = self.combined.get_part(owner, record['quality_part_id'])
                if record['quality_identity'] != {k: part[k] for k in (
                        'scope', 'batch_id', 'serial_number', 'design_version')}:
                    self._invalid()
                if part['scope'] == 'production' and (
                        record['image_source'] != 'upload' or record.get('source_context') is not None):
                    self._invalid()
                # An old, completed fusion may be read again after a newer
                # detection. It must never become the latest evidence again.
                if exists and part.get('latest_inspection_id') not in {yolo_id, inspection_id}:
                    return record
                self.combined.record_inspection(owner, record, expected_latest=yolo_id, publish=publish)
            elif not exists:
                publish()
            return record
