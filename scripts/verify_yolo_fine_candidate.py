"""Frozen diagnostic real-image regression for a calibration-rejected candidate.

This command never deploys or relaxes acceptance rules. A failed calibration
gate stays failed regardless of the regression result.
"""
from pathlib import Path
import sys
from datetime import datetime,timezone
from time import perf_counter
ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.train_yolo_fine_defects import read,save,digest

OUT=ROOT/'output/gear-yolo-fine-defects-v2'
SOURCE=ROOT/'output/gear-full-dataset/prepared'


def freeze():
    from copy import deepcopy
    baseline=read(ROOT/'.runtime/quality-models/yolo11-gear-fine-defects-v2/model.json')
    weights=OUT/'packed-epoch3.pt'
    config=deepcopy(baseline['inference'])
    config['detail_labels']=['hair']
    config['class_confidences'].update(dirt=.3,hair=.35)
    record={'created_at':datetime.now(timezone.utc).isoformat(),'weights':str(weights),
            'weights_sha256':digest(weights),'manifest_sha256':digest(SOURCE/'manifest.json'),
            'protocol_sha256':digest(OUT/'protocol.json'),'inference':config,
            'confidence':min(config['class_confidences'].values()),'iou':.45,
            'selection_split':'calibration','test_used_for_selection_this_iteration':False,
            'calibration_target_gate_passed':False,'promotion_allowed':False,
            'rejection':'All 10 calibration dirt labels are in the 43-image triage subset; at the frozen false-box-constrained setting only 2 are detected, below the predeclared minimum 3.',
            'diagnostic_reason':'Complete real regression to document failure modes; no deployment even if a reused test improves.'}
    assert not (OUT/'diagnostic-freeze.json').exists()
    save(OUT/'diagnostic-freeze.json',record)
    print(record)


def evaluate():
    from scripts.evaluate_yolo import configure_inference_runtime
    frozen=read(OUT/'diagnostic-freeze.json')
    weights=Path(frozen['weights'])
    assert digest(weights)==frozen['weights_sha256']
    assert digest(SOURCE/'manifest.json')==frozen['manifest_sha256']
    assert digest(OUT/'protocol.json')==frozen['protocol_sha256']
    configure_inference_runtime(weights)
    from app.vision.yolo_multiview import MultiViewYoloDetector
    from app.vision.evaluation import load_rgb,pixel_sha256
    from scripts.evaluate_yolo_fine_defects import score
    detector=MultiViewYoloDetector(str(weights),640,config=frozen['inference'])
    samples=[r for r in read(SOURCE/'manifest.json')['samples'] if r['split']=='test']
    rows=[]
    for i,row in enumerate(samples):
        path=SOURCE/row['path'];assert digest(path)==row['file_sha256']
        with load_rgb(path) as image:
            assert pixel_sha256(image)==row['pixel_sha256']
            started=perf_counter();result=detector.predict(image,frozen['confidence'],frozen['iou'])
            seconds=perf_counter()-started
        rows.append({**row,'predictions':result['defects'],'seconds':seconds})
        if (i+1)%5==0 or i+1==len(samples):print({'done':i+1,'total':len(samples),'seconds':round(seconds,2)},flush=True)
    assert digest(weights)==frozen['weights_sha256']
    baseline_path=ROOT/'output/gear-yolo-fine-defects-v1/evaluation/packed-classifier-epoch4-contained/test-comparison.json'
    baseline=read(baseline_path)
    assert baseline['weights_sha256']==read(OUT/'baseline-deployment.json')['yolo_weights_sha256']
    result={'created_at':datetime.now(timezone.utc).isoformat(),'baseline':baseline['metrics'],
            'candidate':score(rows),'weights_sha256':frozen['weights_sha256'],
            'freeze_sha256':digest(OUT/'diagnostic-freeze.json'),'images':len(rows),'samples':rows,
            'deployment_gate_passed':False,'calibration_target_gate_passed':False,
            'baseline_report_sha256':digest(baseline_path),'test_previously_seen':True,
            'normal_gear_fpr_available':False}
    assert not (OUT/'diagnostic-test.json').exists()
    save(OUT/'diagnostic-test.json',result)
    print({k:v for k,v in result.items() if k!='samples'},flush=True)


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=('freeze','evaluate'))
    args=parser.parse_args()
    freeze() if args.command=='freeze' else evaluate()
