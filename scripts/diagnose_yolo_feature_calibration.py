"""Compare fixed inference settings on exactly the same calibration images."""
import argparse
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.train_yolo_feature_separation import OUT,ACTIVE
from scripts.train_yolo_fine_defects import read,save,digest
from scripts.diagnose_yolo_target_regression import analyse


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--epoch',type=int,choices=(2,4),required=True)
    epoch=parser.parse_args().epoch
    folder=OUT/'evaluation'/f'features-epoch{epoch}'
    candidate_path=folder/'calibration-triage-raw.json'
    candidate=read(candidate_path)
    ids={r['sample_id'] for r in candidate['samples']}
    assert len(ids)==len(candidate['samples'])==43
    source=ROOT/'output/gear-yolo-fine-defects-v1/evaluation/packed-classifier-epoch4-contained/calibration-raw.json'
    baseline=read(source)
    baseline['samples']=[r for r in baseline['samples'] if r['sample_id'] in ids]
    assert len(baseline['samples'])==43
    assert all(r['split']=='calibration' for r in baseline['samples']+candidate['samples'])
    path=folder/'baseline-same-images-raw.json';save(path,baseline)
    config=read(ACTIVE/'model.json')['inference']
    models=[analyse('active_same_43',path,config),analyse(f'features_epoch{epoch}_same_43',candidate_path,config)]
    save(folder/'failure-diagnosis.json',{'test_used':False,'calibration_images':43,
        'source_baseline_sha256':digest(source),'same_inference_config':True,'models':models})
    for model in models:
        print({'name':model['name'],'failure_counts':model['failure_counts'],
               'targets':{k:model['final_metrics']['class_and_position']['by_class'][k] for k in ('dirt','hair')}},flush=True)


if __name__=='__main__':main()
