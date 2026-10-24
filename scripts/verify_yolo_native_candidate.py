"""Freeze a calibration-rejected candidate for diagnosis, or stage verified weights.

No command in this file modifies the active environment or deploys a model.
A failed calibration remains a deployment veto even if regression improves.
"""
import argparse
from copy import deepcopy
from datetime import datetime,timezone
from pathlib import Path
import shutil
import sys
from time import perf_counter

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.prepare_yolo_native_hard_examples import OUT,SOURCE,ACTIVE
from scripts.train_yolo_fine_defects import read,save,digest
from scripts.evaluate_yolo_fine_defects import raw_config,merge_variant,select,score


def freeze_rejected(name,preview=False):
    folder=OUT/'evaluation'/name
    selected=read(folder/'selection.json')
    assert not selected['eligible']
    raw=read(folder/'calibration-raw.json')
    assert raw['weights_sha256']==selected['weights_sha256']==digest(Path(selected['weights']))
    assert raw['manifest_sha256']==selected['manifest_sha256']==digest(SOURCE/'manifest.json')
    assert len(raw['samples'])==188 and all(r['split']=='calibration' for r in raw['samples'])
    protocol=read(OUT/'protocol.json');diagnostic=deepcopy(protocol)
    # Research-only ranking relaxes recall requirements, never deployment gates.
    gates=diagnostic['calibration_gates']
    gates.update(dirt_tp_min=0,hair_tp_min=0,overall_tp_min=0,overall_f1_min=0)
    classes=read(SOURCE/'manifest.json')['classes'];variants=[]
    for labels in ([],['hair'],['dirt'],['dirt','hair']):
        for aspect in (1.,1.5):
            config={**raw_config(classes),'detail_grid_size':3 if labels else 0,'detail_labels':labels,
                    'hair_min_aspect_ratio':aspect,'hair_suppress_contained':True}
            result=select(merge_variant(raw['samples'],config),classes,diagnostic)
            if result['eligible']:
                config['class_confidences']=result['thresholds']
                variants.append({**result,'inference':config})
    assert variants,'No diagnostic configuration met the original false-box limits'
    best=max(variants,key=lambda s:(s['target_tp'],s['metrics']['class_and_position']['f1']))
    record={'created_at':datetime.now(timezone.utc).isoformat(),'weights':selected['weights'],
        'weights_sha256':selected['weights_sha256'],'manifest_sha256':digest(SOURCE/'manifest.json'),
        'protocol_sha256':digest(OUT/'protocol.json'),'calibration_selection_sha256':digest(folder/'selection.json'),
        'inference':best['inference'],'recommended_confidence':min(best['thresholds'].values()),'recommended_iou':.45,
        'calibration_metrics':best['metrics'],'selection_split':'calibration','eligible':False,
        'promotion_allowed':False,'calibration_gate_passed':False,
        'reason':'All candidates failed the unchanged calibration gates. Frozen solely to document real regression and actual API behavior.',
        'test_labels_used_for_threshold_selection':False,'test_previously_seen':True}
    if not preview:
        assert not (OUT/'diagnostic-freeze.json').exists()
        save(OUT/'diagnostic-freeze.json',record)
    print({'name':name,'preview':preview,**record},flush=True)
    return record


def evaluate():
    from scripts.evaluate_yolo import configure_inference_runtime
    frozen=read(OUT/'diagnostic-freeze.json');weights=Path(frozen['weights'])
    assert not frozen['eligible'] and not frozen['promotion_allowed']
    assert digest(weights)==frozen['weights_sha256']
    assert digest(SOURCE/'manifest.json')==frozen['manifest_sha256']
    assert digest(OUT/'protocol.json')==frozen['protocol_sha256']
    configure_inference_runtime(weights)
    from app.vision.yolo_multiview import MultiViewYoloDetector
    from app.vision.evaluation import load_rgb,pixel_sha256
    detector=MultiViewYoloDetector(str(weights),640,config=frozen['inference'])
    samples=[r for r in read(SOURCE/'manifest.json')['samples'] if r['split']=='test'];rows=[]
    for i,row in enumerate(samples):
        path=SOURCE/row['path'];assert digest(path)==row['file_sha256']
        with load_rgb(path) as image:
            assert pixel_sha256(image)==row['pixel_sha256']
            start=perf_counter();result=detector.predict(image,frozen['recommended_confidence'],.45)
        rows.append({**row,'predictions':result['defects'],'seconds':perf_counter()-start})
        if (i+1)%5==0 or i+1==len(samples):
            print({'done':i+1,'total':len(samples),'seconds':round(rows[-1]['seconds'],2)},flush=True)
    result={'created_at':datetime.now(timezone.utc).isoformat(),'metrics':score(rows),'samples':rows,'images':len(rows),
        'weights_sha256':digest(weights),'freeze_sha256':digest(OUT/'diagnostic-freeze.json'),
        'deployment_gate_passed':False,'calibration_gate_passed':False,'promotion_allowed':False,
        'test_previously_seen':True,'normal_gear_fpr_available':False}
    assert not (OUT/'diagnostic-test.json').exists()
    save(OUT/'diagnostic-test.json',result);print({k:v for k,v in result.items() if k!='samples'},flush=True)


def stage(selection_path,test_path):
    selection=read(selection_path);result=read(test_path)
    weights=Path(selection['weights'])
    assert digest(weights)==selection['weights_sha256']==result['weights_sha256']
    assert selection['manifest_sha256']==digest(SOURCE/'manifest.json')
    assert selection['protocol_sha256']==digest(OUT/'protocol.json')
    assert result.get('selection_sha256',result.get('freeze_sha256'))==digest(selection_path)
    directory=OUT/'staged-model';directory.mkdir(exist_ok=False)
    shutil.copyfile(weights,directory/'best.pt');assert digest(directory/'best.pt')==digest(weights)
    model=read(ACTIVE/'model.json');metrics=result['metrics'];m=metrics['class_and_position']
    data=read(OUT/'data-summary.json')
    training_images=data.get('unique_training_images',data.get('training_inputs'))
    assert isinstance(training_images,int) and training_images>0
    model.update(name='YOLO11n 齿轮缺陷定位（补样训练候选）',
        description=f'原图局部补样及纹理、边缘负样本训练候选。{result["images"]}张真实回归图：污渍{m["by_class"]["dirt"]["tp"]}/{m["by_class"]["dirt"]["gt"]}、细丝{m["by_class"]["hair"]["tp"]}/{m["by_class"]["hair"]["gt"]}，全类别定位{m["tp"]}/{m["gt_instances"]}、误框{m["fp"]}。研究验证结果。',
        weights_sha256=digest(weights),recommended_confidence=selection['recommended_confidence'],
        recommended_iou=selection['recommended_iou'],inference=selection['inference'],
        training_images=training_images,training_source_photos=data['source_photos'],
        new_independent_training_photos=data['new_independent_photos'],
        calibration_scope=OUT.name,evaluation_status='research_candidate_not_deployed',
        test_class_and_position_tp=m['tp'],test_class_and_position_fp=m['fp'],
        test_spatial_tp=metrics['spatial']['tp'],test_extra_boxes=metrics['spatial']['fp'],
        selection_report=selection_path.resolve().relative_to(ROOT).as_posix(),
        test_report=test_path.resolve().relative_to(ROOT).as_posix(),
        deployment_gate_passed=bool(selection['eligible'] and result['deployment_gate_passed']))
    model.pop('classifier_packing',None)
    model['training_method']=read(OUT/'protocol.json').get('rationale','Native crops and hard negatives; detection-head fine-tuning; standard YOLO modules')
    save(directory/'model.json',model);print({'staged_model':str(directory),'active_environment_changed':False,
                                             'deployment_gate_passed':model['deployment_gate_passed']},flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=('freeze-rejected','evaluate','stage'))
    parser.add_argument('--name');parser.add_argument('--selection',type=Path);parser.add_argument('--test',type=Path)
    parser.add_argument('--preview',action='store_true')
    parser.add_argument('--experiment-root',type=Path,default=OUT)
    args=parser.parse_args()
    OUT=args.experiment_root.resolve(strict=True)
    if args.command=='freeze-rejected':freeze_rejected(args.name,args.preview)
    elif args.command=='evaluate':evaluate()
    else:stage(args.selection,args.test)
