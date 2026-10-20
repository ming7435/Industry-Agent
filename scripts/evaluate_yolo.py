"""Evaluate actual YOLO boxes using fixed grouped data and a frozen test policy.

Generate once, train on train, select on calibration, freeze, then run test.
No command selects a configuration from held-out test results. Raw emitted
post-NMS boxes at --extraction-confidence are saved before evaluation filtering.

Examples (repository root):
  .venv/Scripts/python scripts/evaluate_yolo.py generate --out output/yolo-data
  .venv/Scripts/python scripts/evaluate_yolo.py evaluate --weights model.pt --manifest output/yolo-data/manifest.json --out calibration.json
  .venv/Scripts/python scripts/evaluate_yolo.py rescore --report calibration.json --confidence .4 --out calibration-04.json
  .venv/Scripts/python scripts/evaluate_yolo.py freeze --weights model.pt --manifest output/yolo-data/manifest.json --confidence .4 --out frozen.json
  .venv/Scripts/python scripts/evaluate_yolo.py evaluate --weights model.pt --manifest output/yolo-data/manifest.json --confidence .4 --split test --frozen frozen.json --out test.json
  .venv/Scripts/python scripts/evaluate_yolo.py compare --baseline before.json --candidate after.json --out comparison.json
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import importlib.metadata
import json
import os
from pathlib import Path
import sys
import time

for variable in ('OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS', 'OMP_NUM_THREADS'):
    os.environ[variable] = '2'
# Must precede every Ultralytics import: safe loading has no unsafe fallback.
os.environ.update(ULTRALYTICS_SAFE_LOAD='1', YOLO_AUTOINSTALL='false', YOLO_OFFLINE='true', WANDB_MODE='disabled')

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'services' / 'agent-service'))

from app.vision.evaluation import file_sha256
from app.vision.yolo_evaluation import (
    METRIC_NAME, PIXEL_DIGEST_FORMAT, build_evaluation_freeze, compare_evaluation_reports,
    evaluate_detector, generate_yolo_dataset, load_yolo_manifest, rescore_report,
    validate_evaluation_config, verify_evaluation_freeze,
)


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'), parse_constant=lambda value: (_ for _ in ()).throw(ValueError('nonfinite JSON')))


def write_json(path, value):
    path = Path(path).resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x', encoding='utf-8') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, allow_nan=False)
    return path


def config(args):
    return validate_evaluation_config({'confidence': args.confidence, 'extraction_confidence': args.extraction_confidence,
                                      'nms_iou': args.nms_iou, 'match_iou': args.match_iou, 'input_size': args.input_size})


def configure_inference_runtime(weights):
    """Bound CPU pools while keeping the configured service input size."""
    import torch
    from ultralytics.utils import SAFE_LOAD, callbacks, torch_utils
    if SAFE_LOAD is not True:
        raise ValueError('Ultralytics safe-only checkpoint loading is required; unsafe fallback is forbidden')
    callbacks.add_integration_callbacks = lambda instance: None
    # select_device() otherwise resets PyTorch to its package default of 8 threads.
    torch_utils.NUM_THREADS = 2
    torch.set_num_threads(2)
    torch.set_num_interop_threads(2)
    if Path(weights).suffix.lower() == '.onnx':
        import onnxruntime as ort
        from ultralytics.nn.backends.onnx import ONNXBackend
        original_init = ONNXBackend.__init__
        def bounded_onnx_init(self, weight, device, fp16=False, format='onnx', session_options=None):
            options = session_options or ort.SessionOptions()
            options.intra_op_num_threads = 2
            options.inter_op_num_threads = 2
            return original_init(self, weight, device, fp16=fp16, format=format, session_options=options)
        # This process-local resource setting does not replace inference or its boxes.
        ONNXBackend.__init__ = bounded_onnx_init
    return torch


def parser():
    result = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    commands = result.add_subparsers(dest='command', required=True)
    generate = commands.add_parser('generate', help='Write an immutable paired/grouped synthetic dataset; no inference')
    generate.add_argument('--out', required=True)
    generate.add_argument('--seed', type=int, default=20261022)
    generate.add_argument('--train-groups', type=int, default=48)
    generate.add_argument('--calibration-groups', type=int, default=16)
    generate.add_argument('--test-groups', type=int, default=24)
    for name in ('evaluate', 'freeze'):
        command = commands.add_parser(name)
        command.add_argument('--weights', required=True)
        command.add_argument('--manifest', required=True)
        command.add_argument('--confidence', type=float, default=.25)
        command.add_argument('--input-size', type=int, choices=(320, 640), default=640)
        command.add_argument('--extraction-confidence', type=float, default=.01)
        command.add_argument('--nms-iou', type=float, default=.45)
        command.add_argument('--match-iou', type=float, default=.5)
        command.add_argument('--out', required=True)
        if name == 'evaluate':
            command.add_argument('--split', choices=('calibration', 'test'), default='calibration')
            command.add_argument('--frozen', help='Required for test: weights/data/config freeze created before inference')
            command.add_argument('--max-images', type=int, default=1000)
    rescore = commands.add_parser('rescore', help='Filter saved calibration boxes; refuses held-out test reports')
    rescore.add_argument('--report', required=True)
    rescore.add_argument('--confidence', type=float, required=True)
    rescore.add_argument('--out', required=True)
    compare = commands.add_parser('compare', help='Compare paired image/GT identities with unchanged spatial match rule')
    compare.add_argument('--baseline', required=True)
    compare.add_argument('--candidate', required=True)
    compare.add_argument('--out', required=True)
    return result


def main(argv=None):
    args = parser().parse_args(argv)
    if args.command == 'generate':
        manifest = generate_yolo_dataset(args.out, seed=args.seed, train_groups=args.train_groups,
                                         calibration_groups=args.calibration_groups, test_groups=args.test_groups)
        rows = load_yolo_manifest(manifest)
        print(json.dumps({'manifest': str(manifest), 'sha256': file_sha256(manifest), 'images': len(rows)}))
        return 0
    if Path(args.out).exists():
        raise FileExistsError('output already exists; choose a new report to preserve evaluation evidence')
    if args.command == 'rescore':
        value = rescore_report(read_json(args.report), args.confidence)
    elif args.command == 'compare':
        value = compare_evaluation_reports(read_json(args.baseline), read_json(args.candidate))
    else:
        settings = config(args)
        weights, manifest = Path(args.weights).resolve(strict=True), Path(args.manifest).resolve(strict=True)
        if args.command == 'freeze':
            load_yolo_manifest(manifest)
            value = build_evaluation_freeze(weights, manifest, settings)
        else:
            # Check test gate before importing/loading any detector model.
            frozen = None
            if args.split == 'test':
                if not args.frozen:
                    raise ValueError('held-out test requires --frozen; finish calibration and freeze weights/config first')
                frozen = verify_evaluation_freeze(read_json(args.frozen), weights, manifest, settings)
            samples = load_yolo_manifest(manifest)
            count = sum(row['split'] == args.split for row in samples)
            if not 1 <= count <= args.max_images <= 10000:
                raise ValueError('evaluation split exceeds bounded --max-images')
            weights_hash, manifest_hash = file_sha256(weights), file_sha256(manifest)
            torch = configure_inference_runtime(weights)
            from app.vision.algorithms import YoloDetector
            started = time.monotonic()
            evaluated = evaluate_detector(YoloDetector(str(weights), input_size=settings['input_size']), samples, args.split, settings)
            if file_sha256(weights) != weights_hash or file_sha256(manifest) != manifest_hash:
                raise ValueError('weights or manifest changed during evaluation; no report saved')
            if torch.get_num_threads() != 2:
                raise ValueError('inference changed the required two-thread CPU limit')
            versions = {}
            for package in ('numpy', 'Pillow', 'torch', 'ultralytics', 'onnxruntime'):
                try:
                    versions[package] = importlib.metadata.version(package)
                except importlib.metadata.PackageNotFoundError:
                    pass
            value = {'schema': 'yolo-localization-report-v1', 'metric': METRIC_NAME,
                     'created_at': datetime.now(timezone.utc).isoformat(), 'split': args.split,
                     'manifest_path': str(manifest), 'manifest_sha256': manifest_hash,
                     'weights_path': str(weights), 'weights_sha256': weights_hash, 'config': settings,
                     'pixel_digest_format': PIXEL_DIGEST_FORMAT, 'elapsed_seconds': time.monotonic() - started,
                     'inference': {'device': 'cpu', 'image_size': settings['input_size'], 'max_detections': 300,
                                   'box_evidence': 'Actual emitted post-NMS boxes at extraction_confidence; not raw network priors.'},
                     'matching': {'algorithm': 'descending confidence, greedy highest IoU among unmatched GT',
                                  'category_policy': 'label agnostic; raw category labels retained, no category-accuracy claim'},
                     'environment': {'python': sys.version, 'packages': versions, 'torch_threads': torch.get_num_threads(),
                                     'torch_interop_threads': torch.get_num_interop_threads(), 'onnx_threads': 2 if weights.suffix.lower() == '.onnx' else None,
                                     'ultralytics_safe_load': True}, 'frozen': frozen, **evaluated}
    output = write_json(args.out, value)
    print(json.dumps({'output': str(output), 'metrics': value.get('metrics', {}).get('overall', value.get('overall_delta'))}, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (ValueError, OSError) as error:
        print(f'Evaluation stopped: {error}', file=sys.stderr)
        raise SystemExit(2)
