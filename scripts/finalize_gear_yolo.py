"""Select on real-gear calibration only, freeze/test, package and verify API."""
from pathlib import Path
import json,hashlib,os,shutil,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
os.chdir(ROOT);sys.path.insert(0,str(ROOT/'services/agent-service'))
P=ROOT/'output/gear-dataset'
from app.vision.yolo_evaluation import rescore_report
def read(p):return json.loads(Path(p).read_text(encoding='utf-8'))
def save(p,v):Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def run(*args):subprocess.run([sys.executable,*map(str,args)],check=True)
def main():
    result=read(P/'training-result.json');weights=Path(result['best']);manifest=Path(result['manifest'])
    assert sha(weights)==result['sha256']
    common=['--weights',weights,'--manifest',manifest,'--input-size',640]
    run('scripts/evaluate_yolo.py','evaluate',*common,'--out',P/'calibration.json')
    calibration=read(P/'calibration.json');candidates=[]
    for threshold in [.01,.025,.05,.075,.1,.15,.2,.25,.3,.4,.5,.6,.7,.8]:
        report=rescore_report(calibration,threshold);m=report['metrics']['overall']
        f1=2*m['tp']/(2*m['tp']+m['fn']+m['fp']) if 2*m['tp']+m['fn']+m['fp'] else 0
        candidates.append({'confidence':threshold,'f1':f1,'metrics':report['metrics']})
    selected=max(candidates,key=lambda x:(x['f1'],x['metrics']['overall']['tp'],x['confidence']))
    if selected['metrics']['overall']['tp']==0:raise ValueError('No real gear defects localized on calibration; model not deployable')
    save(P/'selection.json',{'rule':'maximize label-agnostic spatial F1 on calibration only; no normal FPR available','selected':selected,'candidates':candidates})
    common+=['--confidence',selected['confidence']]
    run('scripts/evaluate_yolo.py','freeze',*common,'--out',P/'frozen.json')
    run('scripts/evaluate_yolo.py','evaluate',*common,'--split','test','--frozen',P/'frozen.json','--out',P/'test.json')
    test=read(P/'test.json');correct=0;per_class={}
    for row in test['samples']:
        for gt in row['ground_truth']:
            per_class.setdefault(gt['label'],{'gt':0,'spatial_tp':0,'correct_label_tp':0})['gt']+=1
        for match in row['matching']['matches']:
            gt=row['ground_truth'][match['gt_index']]
            pred=row['predictions'][match['prediction_index']]
            same=gt['label']==pred['label'];correct+=int(same)
            per_class[gt['label']]['spatial_tp']+=1;per_class[gt['label']]['correct_label_tp']+=int(same)
    save(P/'class-metrics.json',{'correct_label_and_position':correct,'gt_instances':test['metrics']['overall']['gt_instances'],'classes':per_class,
        'warning':'Missing classes/rare defects and object-ID independence limitations must be reported; no normal samples, no normal FPR.'})
    target=ROOT/'.runtime/quality-models/yolo11-gear-v1';target.mkdir(exist_ok=False)
    shutil.copy2(weights,target/'best.pt')
    metadata={'model_id':'yolo-default','algorithm':'yolo','architecture':'yolo11n',
        'name':'YOLO11n 塑料齿轮外观缺陷（研究验证）',
        'description':'基于240张真实塑料齿轮研究子集微调，16类原始缺陷标注。样本较少且无正常齿轮，未完成真实产线验收，不支持齿形尺寸测量。',
        'demo':True,'read_only':True,'classes':result['classes'],'weights_sha256':sha(target/'best.pt'),'weights_file':'best.pt',
        'source_url':'https://github.com/fangandyim/Plastic-Gear-Surface-Defect-Dataset',
        'recommended_confidence':selected['confidence'],'recommended_iou':.45,'input_size':640,
        'calibration_scope':'real_gear_defect_only_calibration','scope':'public_gear_research_subset',
        'manifest_sha256':sha(manifest),'normal_samples_available':False,
        'license_note':'Apache2 in platform/repo license; author README restricts noncommercial academic research; commercial rights unresolved.'}
    save(target/'model.json',metadata)
    for name in ['frozen.json','selection.json','test.json','class-metrics.json','training-provenance.json','training-result.json','README.md','LICENSE']:
        shutil.copy2(P/name,target/name)
    run('scripts/verify_gear_vision.py')
    save(P/'validated.json',{'weights':str(target/'best.pt'),'metadata':str(target/'model.json'),'test_metrics':test['metrics'],'api':'passed'})
    print('GEAR_YOLO_VALIDATED',flush=True)
if __name__=='__main__':main()
