"""PatchCore gates YOLO localization on the same image under one inference lock."""
from copy import deepcopy
from datetime import datetime, timezone
from uuid import uuid4

from app.vision.combined import CombinedQualityService
from app.vision.service import VisionServiceError


class VisionPipelineService:
    def __init__(self, vision):
        self.vision = vision

    def detect(self, owner, values, *, source_context=None):
        with self.vision._task():
            shared = {k: values[k] for k in ('image', 'filename', 'part_id', 'quality_part_id',
                       'image_source', 'threshold', 'confidence', 'iou') if k in values}
            pc = self.vision._detect_unlocked(owner, {**shared, 'algorithm': 'patchcore',
                'model_id': values['patchcore_model_id']}, source_context=source_context)
            yolo, error = None, None
            state, classification = 'skipped', 'clear'
            if pc['status'] == 'defect':
                try:
                    yolo = self.vision._detect_unlocked(owner, {**shared, 'algorithm': 'yolo',
                        'model_id': 'yolo-default'}, source_context=source_context)
                    state = 'completed'
                    classification = 'known_defect' if yolo['status'] == 'defect' else 'unknown_anomaly'
                except VisionServiceError as failure:
                    # A missing/failed localizer cannot erase the anomaly evidence.
                    state, classification = 'failed', 'localization_failed'
                    error = {'status_code': failure.status_code, 'detail': failure.detail}
            record = {k: deepcopy(pc[k]) for k in ('filename', 'part_id', 'quality_part_id',
                      'quality_identity', 'image', 'image_sha256', 'image_digest_format',
                      'image_source', 'source_context') if k in pc}
            inspection_id = 'VI-' + uuid4().hex
            localized = yolo if yolo and yolo['status'] == 'defect' else pc
            record.update(algorithm='patchcore_yolo_pipeline', pipeline_version=1,
                          inspection_id=inspection_id,
                          inspection_ids=[pc['inspection_id']] + ([yolo['inspection_id']] if yolo else []),
                          created_at=datetime.now(timezone.utc).isoformat(),
                          status=pc['status'], classification=classification,
                          patchcore=pc, yolo=yolo, yolo_state=state, localization_error=error,
                          score=pc['score'], threshold=pc['threshold'],
                          defects=deepcopy(localized['defects']), annotated_image=localized['annotated_image'],
                          heatmap_image=pc.get('heatmap_image'),
                          parameters={'threshold': values['threshold'], 'confidence': values['confidence'],
                                      'iou': values['iou']})
            path = self.vision._owner_root(owner) / 'inspections' / (inspection_id + '.json')
            publish = lambda: self.vision._atomic_json(path, record)
            if record.get('quality_part_id'):
                # Each stage invalidates stale approval; the final record is the review evidence.
                CombinedQualityService(self.vision).record_inspection(owner, record, publish=publish)
            else:
                publish()
            return record
