"""Prepare real annotated gears, grouped splits, and a bounded YOLO11 research fine-tune."""
from pathlib import Path
import collections, hashlib, json, os, random, re, sys, time
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'services/agent-service'))
P=ROOT/'output/gear-dataset'
def save(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
def digest(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def main():
    from PIL import Image,ImageOps
    from app.vision.evaluation import pixel_sha256
    inventory=json.loads((P/'inventory.json').read_text(encoding='utf-8'))
    if inventory['images']!=240:raise ValueError('complete fixed subset required')
    rows=json.loads((P/'annotation-index.json').read_text(encoding='utf-8'))
    if any(not row['labels'] for row in rows):raise ValueError('unlabeled images require human normal/unknown review')
    classes=sorted({label for row in rows for label in row['labels']})
    if any(label in {'__ignore__','_background_'} for label in classes):raise ValueError('ignore/background labels require review')
    groups=collections.defaultdict(list)
    for row in rows:groups[re.search(r'\d+$',row['sample_id']).group()].append(row)
    keys=sorted(groups);random.Random(20261025).shuffle(keys)
    split={key:'train' if i<int(len(keys)*.6) else 'calibration' if i<int(len(keys)*.8) else 'test' for i,key in enumerate(keys)}
    # Guarantee at least one training group for every retained class. Rare classes
    # may remain absent in calibration/test and are disclosed in the manifest.
    for label in classes:
        if not any(split[k]=='train' and any(label in r['labels'] for r in groups[k]) for k in keys):
            target=next(k for k in keys if any(label in r['labels'] for r in groups[k]))
            split[target]='train'
    out=P/'prepared';out.mkdir(exist_ok=False)
    samples=[]
    for row in rows:
        source=P/row['image_path'];annotation=json.loads((P/row['annotation_path']).read_text(encoding='utf-8'))
        if digest(source)!=row['image_sha256']:raise ValueError('upstream image changed')
        group=re.search(r'\d+$',row['sample_id']).group();part=split[group]
        image_dir=out/'images'/part;label_dir=out/'labels'/part
        image_dir.mkdir(parents=True,exist_ok=True);label_dir.mkdir(parents=True,exist_ok=True)
        with Image.open(source) as im:
            rgb=ImageOps.exif_transpose(im).convert('RGB');original=rgb.size
            rgb.thumbnail((640,640),Image.Resampling.LANCZOS)
            width,height=rgb.size
            path=image_dir/(row['sample_id']+'.png');rgb.save(path)
            pixels=pixel_sha256(rgb);rgb.close()
        truth=[];labels=[]
        for shape in annotation['shapes']:
            if shape.get('shape_type')!='rectangle' or len(shape['points'])!=2:raise ValueError('non-rectangle annotation')
            points=shape['points'];x0,x1=sorted(p[0]*width/original[0] for p in points);y0,y1=sorted(p[1]*height/original[1] for p in points)
            box=[max(0,x0),max(0,y0),min(width,x1),min(height,y1)]
            if box[2]<=box[0] or box[3]<=box[1]:raise ValueError('invalid original GT box')
            label=shape['label'];truth.append({'label':label,'bbox':box})
            labels.append(f'{classes.index(label)} {(box[0]+box[2])/(2*width):.10f} {(box[1]+box[3])/(2*height):.10f} {(box[2]-box[0])/width:.10f} {(box[3]-box[1])/height:.10f}')
        (label_dir/(row['sample_id']+'.txt')).write_text('\n'.join(labels)+'\n',encoding='utf-8')
        samples.append({'sample_id':row['sample_id'],'split':part,'group_id':'source-numeric-id-'+group,
                        'scenario':'gear_surface_defects','domain':'endface' if row['sample_id'].startswith('endface') else 'toothface',
                        'label':'defect','path':str(path.relative_to(out)).replace('\\','/'),'file_sha256':digest(path),
                        'pixel_sha256':pixels,'ground_truth':truth,'original_image_sha256':row['image_sha256']})
    assert len({r['pixel_sha256'] for r in samples})==len(samples)
    manifest={'schema':'yolo-localization-v1','kind':'real_gear_dataset','name':'公开塑料齿轮外观缺陷（240张研究子集）',
              'normal_samples_available':False,'source_total_images':1165,'classes':classes,'samples':samples,
              'split_policy':'deterministic numeric-ID groups shared across views; source physical-part IDs unavailable; object independence not guaranteed',
              'preprocessing':'aspect preserving resize max640; original boxes scaled identically; PNG',
              'class_image_counts':{s:dict(collections.Counter(label for r in rows if split[re.search(r"\d+$",r['sample_id']).group()]==s for label in set(r['labels']))) for s in ['train','calibration','test']}}
    save(out/'manifest.json',manifest)
    save(out/'data.yaml',{'path':str(out),'train':'images/train','val':'images/calibration','names':classes,'nc':len(classes)})
    # No test path in the training YAML; evaluation is a separate frozen step.
    os.environ.update(ULTRALYTICS_SAFE_LOAD='1',YOLO_AUTOINSTALL='false',YOLO_OFFLINE='true',OMP_NUM_THREADS='2',MKL_NUM_THREADS='2',
                      YOLO_CONFIG_DIR=str(P/'ultralytics-config'),WANDB_MODE='disabled')
    import torch
    from ultralytics import YOLO
    from ultralytics.utils import callbacks,SETTINGS,torch_utils,SAFE_LOAD
    assert SAFE_LOAD
    torch_utils.NUM_THREADS=2;torch.set_num_threads(2);torch.set_num_interop_threads(2)
    callbacks.add_integration_callbacks=lambda instance:None
    SETTINGS.update({key:False for key in ['sync','clearml','comet','dvc','mlflow','raytune','tensorboard','wandb']})
    source=ROOT/'output/yolo11-migration/yolo11n.pt'
    if digest(source)!='0ebbc80d4a7680d14987a577cd21342b65ecfd94632bd9a8da63ae6417644ee1':raise ValueError('official YOLO11 initialization changed')
    model=YOLO(str(source),task='detect')
    assert any(type(module).__name__=='C3k2' for module in model.model.modules())
    parameters=dict(data=str(out/'data.yaml'),epochs=12,patience=5,batch=2,imgsz=640,freeze=10,device='cpu',workers=0,cache=False,
                    optimizer='AdamW',lr0=.001,resume=False,plots=False,deterministic=True,seed=20261025,amp=False,
                    project=str(P),name='training',exist_ok=False,val=True,save=True)
    save(P/'training-provenance.json',{'source_sha256':digest(source),'manifest_sha256':digest(out/'manifest.json'),'parameters':parameters,
         'classes':classes,'split_counts':dict(collections.Counter(r['split'] for r in samples)),
         'test_used_in_training':False,'scope':'bounded research baseline; no normal samples, no normal FPR claim'})
    start=time.monotonic()
    def progress(trainer):
        record={'epoch':min(trainer.epoch+1,trainer.epochs),'elapsed':time.monotonic()-start,'metrics':trainer.metrics}
        save(P/'training-progress.json',record);print(json.dumps(record),flush=True)
    model.add_callback('on_fit_epoch_end',progress)
    model.train(**parameters)
    best=model.trainer.best
    save(P/'training-result.json',{'best':str(best),'sha256':digest(best),'classes':classes,'manifest':str(out/'manifest.json'),'parameters':parameters})
if __name__=='__main__':main()
