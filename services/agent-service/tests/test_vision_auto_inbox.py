"""A local capture folder drives the existing detector without browser uploads."""
import base64

from app.vision.auto_inbox import VisionAutoInbox
from app.vision.service import VisionServiceError


class FakeVision:
    def __init__(self):
        self.calls = []
        self.error = None

    def _model(self, owner, model_id):
        assert owner == 'local-auto-inbox'
        assert model_id == 'patchcore-gear'
        return {'suggested_threshold': 1.8823}, None

    def detect(self, owner, values):
        if self.error:
            raise self.error
        self.calls.append((owner, values))
        return {'inspection_id': f'VI-{len(self.calls):032x}', 'model_id': values['model_id'],
                'algorithm': 'patchcore', 'filename': values['filename'], 'image_source': values['image_source'],
                'status': 'clear', 'score': 1.2, 'threshold': values['threshold'],
                'annotated_image': values['image'], 'heatmap_image': values['image']}


def test_stable_new_image_is_detected_once_and_archived(tmp_path):
    vision = FakeVision()
    inbox = VisionAutoInbox(vision, tmp_path, settle_seconds=0)
    source = tmp_path / 'incoming' / 'gear.png'
    source.parent.mkdir()
    source.write_bytes(b'gear pixels')

    assert inbox.scan_once() == 0
    assert inbox.scan_once() == 1
    assert inbox.scan_once() == 0
    assert len(vision.calls) == 1
    owner, values = vision.calls[0]
    assert owner == 'local-auto-inbox'
    assert values['model_id'] == 'patchcore-gear'
    assert values['threshold'] == 1.8823
    assert values['image_source'] == 'local_inbox'
    assert base64.b64decode(values['image'].split(',', 1)[1]) == b'gear pixels'
    assert not source.exists()
    assert (tmp_path / 'processed' / 'gear.png').exists()
    assert inbox.status()['processed_count'] == 1
    assert inbox.latest()['filename'] == 'gear.png'


def test_invalid_image_is_quarantined_and_temporary_model_failure_is_retried(tmp_path):
    vision = FakeVision()
    inbox = VisionAutoInbox(vision, tmp_path, settle_seconds=0)
    source = tmp_path / 'incoming' / 'bad.jpg'
    source.parent.mkdir()
    source.write_bytes(b'bad image')
    inbox.scan_once()
    vision.error = VisionServiceError(503, 'model busy')
    assert inbox.scan_once() == 0
    assert source.exists() and inbox.status()['failed_count'] == 0
    vision.error = VisionServiceError(422, 'invalid image')
    assert inbox.scan_once() == 0
    assert not source.exists()
    assert (tmp_path / 'failed' / 'bad.jpg').exists()
    assert inbox.status()['failed_count'] == 1


def test_oversized_image_never_reaches_detector(tmp_path):
    vision = FakeVision()
    inbox = VisionAutoInbox(vision, tmp_path, settle_seconds=0)
    source = tmp_path / 'incoming' / 'large.png'
    source.parent.mkdir()
    source.write_bytes(b'x' * (4 * 1024 * 1024 + 1))
    inbox.scan_once()
    assert inbox.scan_once() == 0
    assert not vision.calls
    assert (tmp_path / 'failed' / 'large.png').exists()
