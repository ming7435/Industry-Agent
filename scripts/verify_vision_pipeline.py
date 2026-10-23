"""Run configured local weights through the authenticated pipeline in isolated storage."""
import argparse
import base64
import json
import os
from pathlib import Path
import sys
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / 'services/agent-service')]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, default=ROOT / 'output/quality-pipeline')
    parser.add_argument('--yolo-deployment', type=Path)
    args = parser.parse_args()
    from dotenv import dotenv_values
    deployed = dotenv_values(ROOT / '.env')
    for key in ('QUALITY_PATCHCORE_BACKBONE_WEIGHTS', 'QUALITY_PATCHCORE_GEAR_PRESET_DIR',
                'QUALITY_YOLO_WEIGHTS', 'QUALITY_YOLO_METADATA'):
        assert deployed.get(key), f'Missing deployment setting: {key}'
        os.environ[key] = deployed[key]
    if args.yolo_deployment:
        stage = args.yolo_deployment.resolve(strict=True)
        os.environ['QUALITY_YOLO_WEIGHTS'] = str(stage / 'best.pt')
        os.environ['QUALITY_YOLO_METADATA'] = str(stage / 'model.json')
    os.environ.update(APP_ENV='testing', PYTHON_DOTENV_DISABLED='1',
        QUALITY_VISION_AUTO_INBOX_DIR='', QUALITY_PATCHCORE_PRESET_DIR='')
    from scripts.evaluate_yolo import configure_inference_runtime
    configure_inference_runtime(Path(os.environ['QUALITY_YOLO_WEIGHTS']))
    from fastapi import FastAPI, HTTPException, Request
    from fastapi.testclient import TestClient
    from app.api.quality_vision import build_quality_vision_router
    from app.vision.service import VisionService

    class Sessions:
        def resolve_session(self, token):
            return {'user_id': token, 'role': 'technician'} if token in {'verification', 'other'} else None

    def write_auth(request: Request):
        if request.headers.get('x-local-verification') != 'true':
            raise HTTPException(401)

    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=False)
    samples = json.loads((ROOT / '.runtime/quality-research/manta-gear-patchcore-full-v1/test_scores.json').read_text())
    summary = {'scope': 'actual local weights; isolated HTTP/storage; workflow verification, not production accuracy', 'samples': []}
    with TemporaryDirectory() as temporary:
        app = FastAPI()
        app.include_router(build_quality_vision_router(write_auth, backend_factory=Sessions, service=VisionService(temporary)))
        with TestClient(app) as client:
            client.cookies.set('maintenance_session', 'verification')
            client.headers['x-local-verification'] = 'true'
            models = client.get('/api/quality/vision/capabilities').json()['models']
            pc = next(m for m in models if m['model_id'] == 'patchcore-gear')
            yolo = next(m for m in models if m['model_id'] == 'yolo-default')
            for identity in ('mechanics_gear_02229', 'mechanics_gear_02076'):
                sample = next(s for s in samples if s['sample_id'] == identity)
                path = Path(sample['path'])
                body = {'patchcore_model_id': pc['model_id'], 'image': 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode(),
                        'filename': path.name, 'threshold': pc['suggested_threshold'],
                        'confidence': yolo['recommended_confidence'], 'iou': yolo['recommended_iou']}
                response = client.post('/api/quality/vision/pipeline/detect', json=body)
                assert response.status_code == 200, response.text[:300]
                record = response.json()
                expected = 'clear' if sample['label'] == 'normal' else 'defect'
                assert record['status'] == expected
                assert record['yolo_state'] == ('skipped' if expected == 'clear' else 'completed')
                assert client.get('/api/quality/vision/inspections/' + record['inspection_id']).json() == record
                client.cookies.set('maintenance_session', 'other')
                assert client.get('/api/quality/vision/inspections/' + record['inspection_id']).status_code == 404
                client.cookies.set('maintenance_session', 'verification')
                (out / (identity + '.json')).write_text(json.dumps({'expected': {k: v for k, v in body.items() if k != 'image'}, 'result': record}), encoding='utf-8')
                summary['samples'].append({'sample': identity, 'label': sample['label'], 'status': record['status'],
                    'classification': record['classification'], 'yolo_state': record['yolo_state'],
                    'patchcore_score': record['score'], 'threshold': record['threshold'],
                    'yolo_boxes': len(record['yolo']['defects']) if record['yolo'] else None,
                    'patchcore_weights': record['patchcore']['model_sha256'],
                    'yolo_weights': record['yolo']['model_sha256'] if record['yolo'] else None,
                    'readback': True, 'cross_account_denied': True})
    (out / 'real-model-verification.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
