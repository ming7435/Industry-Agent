"""Actual gear YOLO + combined review API, isolated validation records only."""
from contextlib import ExitStack, contextmanager
from datetime import datetime
from pathlib import Path
import argparse
import json
import os
import secrets
import sys
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / 'services/agent-service'), str(ROOT / 'services/agent-service/tests')]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'output' / 'combined-quality' /
                        ('api-' + datetime.now().strftime('%Y%m%d-%H%M%S')))
    out = parser.parse_args().output.resolve()
    out.mkdir(parents=True, exist_ok=False)
    os.environ.update(APP_ENV='testing', PYTHON_DOTENV_DISABLED='1', ULTRALYTICS_SAFE_LOAD='1',
        YOLO_AUTOINSTALL='false', QUALITY_YOLO_WEIGHTS=str(ROOT / '.runtime/quality-models/yolo11-gear-v1/best.pt'),
        QUALITY_YOLO_METADATA=str(ROOT / '.runtime/quality-models/yolo11-gear-v1/model.json'),
        QUALITY_PATCHCORE_PRESET_DIR='', QUALITY_VISION_DATA_MODE='gear',
        QUALITY_VISION_DATASET_MANIFEST=str(ROOT / 'output/gear-dataset/prepared/manifest.json'))
    from scripts.evaluate_yolo import configure_inference_runtime
    configure_inference_runtime(Path(os.environ['QUALITY_YOLO_WEIGHTS']))
    import pytest
    from fastapi import FastAPI, Request, HTTPException
    from fastapi.testclient import TestClient
    from virtual_production_test_support import production_backend
    from app.api.quality_vision import build_quality_vision_router
    from app.vision.service import VisionService

    with ExitStack() as stack:
        mp = stack.enter_context(pytest.MonkeyPatch.context())
        backend_dir = out / 'backend'
        backend_dir.mkdir()
        backend = stack.enter_context(contextmanager(production_backend.__wrapped__)(backend_dir, mp))
        token = secrets.token_urlsafe(24)

        def auth(request: Request):
            if request.headers.get('authorization') != 'Bearer ' + token:
                raise HTTPException(401, 'write credential required')

        def app():
            application = FastAPI()
            application.include_router(build_quality_vision_router(
                auth, backend_factory=lambda: backend.client, service=VisionService(out / 'vision')))
            return application

        client = stack.enter_context(TestClient(app()))
        client.cookies.set('maintenance_session', 'owner-session')
        client.headers['authorization'] = 'Bearer ' + token
        prefix = '/api/quality/vision/combined/parts'

        def post(path, body):
            response = client.post(path, json=body)
            assert response.status_code == 200, response.text[:300]
            return response.json()

        registration = dict(scope='validation', batch_id='GEAR-API-VALIDATION',
                            serial_number='REFERENCE-001', design_version='RESEARCH-V1')
        part = post(prefix, registration)
        assert post(prefix, registration)['quality_part_id'] == part['quality_part_id']
        pending = post(prefix, {**registration, 'serial_number': 'PENDING-002'})
        caps = client.get('/api/quality/vision/capabilities').json()
        model = next(m for m in caps['models'] if m['model_id'] == 'yolo-default')
        sample_id = caps['dataset']['samples'][0]['sample_id']
        response = client.get('/api/quality/vision/dataset/samples/' + sample_id)
        assert response.status_code == 200
        sample = response.json()
        inspection = post('/api/quality/vision/detect', {
            'algorithm': 'yolo', 'model_id': model['model_id'], 'image': sample['image'],
            'image_source': 'public_gear_reference', 'quality_part_id': part['quality_part_id'],
            'filename': sample['filename'], 'confidence': model['recommended_confidence'],
            'iou': model['recommended_iou']})
        assert inspection['status'] == 'defect' and inspection['defects']
        assert inspection['quality_identity']['serial_number'] == part['serial_number']
        before = client.get(prefix).json()['summary']
        assert before['pending'] == 2 and before['rate_percent'] is None
        part = next(p for p in client.get(prefix).json()['items']
                    if p['quality_part_id'] == part['quality_part_id'])
        # Parameter confirmation below is explicitly a validation fixture, not a physical measurement.
        for kind, decision in [('parameters', 'pass'), ('visual', 'fail')]:
            body = dict(request_id=str(uuid4()), expected_revision=part['revision'], kind=kind,
                        decision=decision, all_required_checked=True,
                        evidence_reference='VALIDATION-REPORT-' + kind,
                        notes='仅验证综合状态与统计；参数通过为测试输入，不是实测。外观参照研究图标注复核。',
                        inspection_id=inspection['inspection_id'] if kind == 'visual' else '')
            path = prefix + '/' + part['quality_part_id'] + '/reviews'
            part = post(path, body)
            assert post(path, body)['revision'] == part['revision']
        final = client.get(prefix).json()
        assert final['summary'] == dict(total=2, qualified=0, unqualified=1, pending=1,
                                        determinate=1, rate_percent=0.0, coverage_percent=50.0)
        assert client.get(prefix, params={'scope': 'production'}).json()['summary']['total'] == 0
        mismatch_body = {**body, 'request_id': str(uuid4()), 'expected_revision': pending['revision']}
        assert client.post(prefix + '/' + pending['quality_part_id'] + '/reviews', json=mismatch_body).status_code == 409
        fresh = stack.enter_context(TestClient(app()))
        fresh.cookies.set('maintenance_session', 'owner-session')
        assert fresh.get(prefix).json()['summary'] == final['summary']
        fresh.cookies.set('maintenance_session', 'other-session')
        assert fresh.get(prefix).json()['items'] == []
        assert backend.repository.list_records('quality') == []
        summary = dict(scope='isolated validation only; actual YOLO inference, fixture parameter confirmation',
                       actual_model=model['name'], actual_inferences=1, sample_id=sample_id,
                       inspection_id=inspection['inspection_id'], model_status=inspection['status'],
                       summary=final['summary'], retry_deduplicated=True, wrong_part_rejected=True,
                       restart_readback=True, production_records_written=0, formal_quality_writes=0)
        (out / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps({'output': str(out), **summary}, ensure_ascii=False))


if __name__ == '__main__':
    main()
