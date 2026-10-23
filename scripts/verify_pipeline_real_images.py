"""Replay held-out real gear images through the deployed two-stage workflow."""
import argparse
import base64
from collections import Counter
from datetime import datetime, timezone
from hashlib import sha256
import html
import json
import os
from pathlib import Path
import random
import shutil
import sys
from time import perf_counter

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / 'services/agent-service')]


def save_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False), encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--per-domain', type=int, default=6)
    parser.add_argument('--seed', type=int, default=20261022)
    parser.add_argument('--yolo-deployment', type=Path, help='Validate a staged deployment without changing the active .env')
    parser.add_argument('--focus-labels', nargs='+', choices=('dirt', 'hair'), help='Replay all held-out images annotated with these labels')
    args = parser.parse_args()
    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=False)

    from dotenv import dotenv_values
    deployed = dotenv_values(ROOT / '.env')
    keys = ('QUALITY_PATCHCORE_BACKBONE_WEIGHTS', 'QUALITY_PATCHCORE_GEAR_PRESET_DIR',
            'QUALITY_YOLO_WEIGHTS', 'QUALITY_YOLO_METADATA')
    for key in keys:
        assert deployed.get(key), f'Missing deployed configuration: {key}'
        os.environ[key] = deployed[key]
    if args.yolo_deployment:
        stage = args.yolo_deployment.resolve(strict=True)
        os.environ['QUALITY_YOLO_WEIGHTS'] = str(stage / 'best.pt')
        os.environ['QUALITY_YOLO_METADATA'] = str(stage / 'model.json')
    os.environ.update(APP_ENV='testing', PYTHON_DOTENV_DISABLED='1', QUALITY_VISION_AUTO_INBOX_DIR='',
                      QUALITY_PATCHCORE_PRESET_DIR='')
    from scripts.evaluate_yolo import configure_inference_runtime
    configure_inference_runtime(Path(os.environ['QUALITY_YOLO_WEIGHTS']))
    from fastapi import FastAPI, HTTPException, Request
    from fastapi.testclient import TestClient
    from app.api.quality_vision import build_quality_vision_router
    from app.vision.service import VisionService
    from app.vision.evaluation import load_rgb, pixel_sha256
    from app.vision.yolo_evaluation import match_detections, class_aware_localization

    manifest_path = ROOT / 'output/gear-full-dataset/prepared/manifest.json'
    manifest_bytes = manifest_path.read_bytes()
    manifest = json.loads(manifest_bytes)
    metadata = json.loads(Path(os.environ['QUALITY_YOLO_METADATA']).read_text(encoding='utf-8'))
    assert sha256(manifest_bytes).hexdigest() == metadata['manifest_sha256']
    rng = random.Random(args.seed)
    chosen, groups = [], set()
    if args.focus_labels:
        chosen = sorted((r for r in manifest['samples'] if r['split'] == 'test'
                         and any(g['label'] in args.focus_labels for g in r['ground_truth'])), key=lambda r: r['sample_id'])
        policy = 'all test images containing requested annotated classes; labels only select/evaluate images, never enter inference'
    else:
        for domain in ('endface', 'toothface'):
            candidates = sorted((r for r in manifest['samples'] if r['split'] == 'test'
                                and r['domain'] == domain and r['group_id'] not in groups), key=lambda r: r['sample_id'])
            rows = rng.sample(candidates, args.per_domain)
            for row in sorted(rows, key=lambda r: r['sample_id']):
                chosen.append(row)
                groups.add(row['group_id'])
        policy = 'sample before inference; test split only; distinct numeric source groups'
    save_json(out / 'selection.json', {'seed': args.seed, 'policy': policy, 'focus_labels': args.focus_labels,
                                     'manifest_sha256': sha256(manifest_bytes).hexdigest(), 'samples': chosen})

    class Sessions:
        def resolve_session(self, token):
            return {'user_id': token, 'role': 'technician'} if token == 'real-image-verification' else None

    def auth(request: Request):
        if request.headers.get('x-local-verification') != 'true':
            raise HTTPException(401)

    app = FastAPI()
    service = VisionService(out / 'private-inspections')
    app.include_router(build_quality_vision_router(auth, backend_factory=Sessions, service=service))
    evaluated, settings = [], {}
    with TestClient(app) as client:
        client.cookies.set('maintenance_session', 'real-image-verification')
        client.headers['x-local-verification'] = 'true'
        capabilities = client.get('/api/quality/vision/capabilities').json()
        pc_model = next(m for m in capabilities['models'] if m['model_id'] == 'patchcore-gear')
        yolo_model = next(m for m in capabilities['models'] if m['model_id'] == 'yolo-default')
        settings = {'threshold': pc_model['suggested_threshold'], 'confidence': yolo_model['recommended_confidence'],
                    'iou': yolo_model['recommended_iou']}
        save_json(out / 'settings.json', {'models': [pc_model, yolo_model], 'parameters': settings})
        for index, source in enumerate(chosen):
            image_path = (manifest_path.parent / source['path']).resolve(strict=True)
            raw = image_path.read_bytes()
            assert sha256(raw).hexdigest() == source['file_sha256']
            with load_rgb(image_path) as pixels:
                assert pixel_sha256(pixels) == source['pixel_sha256']
                api_digest = sha256(f'rgb-v1\0{pixels.width}x{pixels.height}\0'.encode('ascii') + pixels.tobytes()).hexdigest()
            body = {'patchcore_model_id': 'patchcore-gear', 'image': 'data:image/png;base64,' + base64.b64encode(raw).decode(),
                    'filename': image_path.name, 'image_source': 'public_gear_reference', **settings}
            start = perf_counter()
            response = client.post('/api/quality/vision/pipeline/detect', json=body)
            elapsed = perf_counter() - start
            assert response.status_code == 200, response.text[:300]
            record = response.json()
            assert record['image_sha256'] == api_digest
            assert client.get('/api/quality/vision/inspections/' + record['inspection_id']).json() == record
            if record['yolo']:
                assert record['patchcore']['image_sha256'] == record['yolo']['image_sha256']
                assert record['patchcore']['created_at'] <= record['yolo']['created_at']
                assert record['yolo']['parameters']['inference'] == yolo_model.get('inference', {'mode': 'full'})
            predictions = record['yolo']['defects'] if record['yolo'] else []
            matching = match_detections(source['ground_truth'], predictions, settings['confidence'], .5)
            category = class_aware_localization([{'ground_truth': source['ground_truth'], 'predictions': predictions}], settings['confidence'], .5)
            folder = out / source['sample_id']
            folder.mkdir()
            shutil.copyfile(image_path, folder / 'original.png')
            for name, stage, key in [('patchcore.png', record['patchcore'], 'annotated_image'),
                                     ('heatmap.png', record['patchcore'], 'heatmap_image'),
                                     ('yolo.png', record['yolo'], 'annotated_image')]:
                if stage is not None:
                    (folder / name).write_bytes(base64.b64decode(stage[key].split(',', 1)[1]))
            row = {'sample_id': source['sample_id'], 'domain': source['domain'], 'group_id': source['group_id'],
                   'ground_truth': source['ground_truth'], 'predictions': predictions,
                   'patchcore_status': record['patchcore']['status'], 'patchcore_score': record['patchcore']['score'],
                   'yolo_state': record['yolo_state'], 'classification': record['classification'],
                   'status': record['status'], 'matching': matching, 'class_and_position': category,
                   'inference_seconds': round(elapsed, 3), 'inspection_id': record['inspection_id'],
                   'image_sha256': record['image_sha256'], 'patchcore_weights': record['patchcore']['model_sha256'],
                   'yolo_weights': record['yolo']['model_sha256'] if record['yolo'] else None}
            save_json(folder / 'result.json', row)
            evaluated.append(row)
            print(json.dumps({'progress': f'{index+1}/{len(chosen)}', 'image': row['sample_id'],
                              'pc': row['patchcore_status'], 'score': round(row['patchcore_score'], 4),
                              'yolo': row['yolo_state'], 'boxes': len(predictions),
                              'correct_location': matching['tp'], 'missed': matching['fn'], 'extra': matching['fp']}, ensure_ascii=False), flush=True)

    states = Counter(row['classification'] for row in evaluated)
    metrics = {'images': len(evaluated), 'gt_instances': sum(len(r['ground_truth']) for r in evaluated),
               'patchcore_anomaly_images': sum(r['patchcore_status'] == 'defect' for r in evaluated),
               'yolo_completed_images': sum(r['yolo_state'] == 'completed' for r in evaluated),
               'images_with_yolo_boxes': sum(bool(r['predictions']) for r in evaluated),
               'images_with_correct_location': sum(r['matching']['tp'] > 0 for r in evaluated),
               'predicted_boxes': sum(len(r['predictions']) for r in evaluated),
               'correct_location_boxes': sum(r['matching']['tp'] for r in evaluated),
               'missed_boxes': sum(r['matching']['fn'] for r in evaluated),
               'extra_boxes': sum(r['matching']['fp'] for r in evaluated),
               'class_and_position': class_aware_localization(evaluated, settings['confidence'], .5)}
    report = {'created_at': datetime.now(timezone.utc).isoformat(), 'parameters': settings,
              'selection_seed': args.seed, 'focus_labels': args.focus_labels,
              'scope': 'real held-out defect images, fixed deployed settings; no production records',
              'limitations': ['reused held-out test images; regression evidence, not a new independent test',
                             'no normal images in this batch; cannot measure normal false positives',
                             'PatchCore MANTA memory and YOLO plastic gear data are different domains',
                             'numeric source groups do not prove distinct physical parts'],
              'localization_match_iou': .5, 'classifications': dict(states), 'metrics': metrics, 'samples': evaluated}
    save_json(out / 'report.json', report)
    headings = {'known_defect': 'YOLO 已画框', 'unknown_anomaly': '异常，但 YOLO 未画框',
                'clear': 'PatchCore 未检出，YOLO 跳过', 'localization_failed': '异常，YOLO 失败'}
    cards = []
    for row in evaluated:
        identity = html.escape(row['sample_id'])
        frames = [('original.png', '原图'), ('patchcore.png', 'PatchCore 异常区域')]
        if row['yolo_state'] == 'completed':
            frames.append(('yolo.png', 'YOLO 实际输出'))
        figures = ''.join(f'<figure><img src="{identity}/{name}"><figcaption>{title}</figcaption></figure>' for name, title in frames)
        cards.append(f'<section><h2>{identity} · {headings[row["classification"]]}</h2><p>异常距离 {row["patchcore_score"]:.4f} / 阈值 {settings["threshold"]:.4f} · 标注 {len(row["ground_truth"])} 处 · 预测 {len(row["predictions"])} 框 · 正确定位 {row["matching"]["tp"]} · 漏检 {row["matching"]["fn"]} · 多余框 {row["matching"]["fp"]}</p><div>{figures}</div></section>')
    page = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>真实图片串联质检实测</title><style>body{font:15px/1.6 system-ui;background:#edf3f5;color:#173c45;margin:32px}h1{font-size:28px}section{background:white;border-radius:14px;padding:24px;margin:24px 0}section>div{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}figure{margin:0;background:#f6f8f9;padding:12px;border-radius:8px}img{width:100%;height:330px;object-fit:contain}figcaption{text-align:center;margin-top:10px}p{color:#506871}</style>'
    sample_note = '包含污渍/细丝的全部留出图片' if args.focus_labels else '固定随机抽样'
    page += f'<h1>真实图片 · PatchCore → YOLO</h1><p>{sample_note}，共 {len(evaluated)} 张真实缺陷测试图；阈值 {settings["threshold"]:.4f}，置信度 {settings["confidence"]}。原始推理输出，未调整参数。位置匹配标准为 IoU ≥ 0.5。</p>' + ''.join(cards)
    (out / 'index.html').write_text(page, encoding='utf-8')
    print(json.dumps({'output': str(out), 'metrics': metrics, 'classifications': dict(states)}, ensure_ascii=False, indent=2), flush=True)


if __name__ == '__main__':
    main()
