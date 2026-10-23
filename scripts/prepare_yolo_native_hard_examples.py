"""Expand training-only native-resolution fine defects and mine gear hard negatives."""
import argparse
from collections import Counter
from copy import deepcopy
from datetime import datetime, timezone
from hashlib import sha256
import math
from pathlib import Path
import random
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / 'services/agent-service')]
from scripts.train_yolo_fine_defects import SOURCE, crop_truth, digest, read, save

OUT = ROOT / 'output/gear-yolo-fine-defects-v3'
DATA = OUT / 'dataset'
FULL = SOURCE.parent
ACTIVE = ROOT / '.runtime/quality-models/yolo11-gear-fine-defects-v2'
SEED = 20261025


def transform_truth(truth, width, height, flip, turns):
    """Match Pillow horizontal flip followed by clockwise quarter turns exactly."""
    result = deepcopy(truth)
    for item in result:
        x1, y1, x2, y2 = item['bbox']
        if flip:
            x1, x2 = width-x2, width-x1
        w, h = width, height
        for _ in range(turns % 4):
            x1, y1, x2, y2 = h-y2, x1, h-y1, x2
            w, h = h, w
        item['bbox'] = [x1, y1, x2, y2]
    return result


def native(row, index):
    from PIL import Image, ImageOps
    item = index[row['sample_id']]
    path = FULL / item['image_path']
    assert digest(path) == row['original_image_sha256'] == item['image_sha256']
    with Image.open(path) as source:
        image = ImageOps.exif_transpose(source).convert('RGB')
    with Image.open(SOURCE / row['path']) as source:
        sx, sy = image.width/source.width, image.height/source.height
    truth = [{'label': g['label'], 'bbox': [v*(sx if i%2==0 else sy) for i,v in enumerate(g['bbox'])]}
             for g in row['ground_truth']]
    return image, truth


def prepare():
    from PIL import Image, ImageEnhance, ImageOps, ImageDraw
    import numpy as np
    from scripts.train_yolo_geometric_refinement import runtime
    runtime()
    from ultralytics import YOLO
    OUT.mkdir(parents=True, exist_ok=False)
    for split in ('train', 'calibration'):
        for kind in ('images', 'labels'):
            (DATA / kind / split).mkdir(parents=True)
    manifest = read(SOURCE/'manifest.json')
    rows = [r for r in manifest['samples'] if r['split']=='train']
    calibration = [r for r in manifest['samples'] if r['split']=='calibration']
    index = {r['sample_id']:r for r in read(FULL/'annotation-index.json')}
    classes = manifest['classes']
    rng = random.Random(SEED)
    samples, seen = [], set()
    protocol = read(ROOT/'output/gear-yolo-fine-defects-v2/protocol.json')
    protocol.update(created_at=datetime.now(timezone.utc).isoformat(),
                    test_feedback_informed_implementation=True, candidate_epochs=[2,4,6,8],
                    training_policy='Native train-only crops; annotated confusers and mined texture/edge negatives; no test or calibration augmentation.')
    # Both target recalls must improve. Dirt has zero baseline false boxes,
    # so it must stay at zero; total false boxes must strictly decrease.
    protocol['calibration_gates']['target_fp_max']={'dirt':0,'hair':1}
    protocol['calibration_gates']['overall_class_fp_max']=86
    protocol['test_gates']['target_fp_max']={'dirt':0,'hair':2}
    protocol['test_gates']['overall_class_fp_max']=84
    protocol['test_gates']['overall_spatial_fp_max']=74
    save(OUT/'protocol.json',protocol)
    save(OUT/'baseline-deployment.json',{'weights_sha256':digest(ACTIVE/'best.pt'),
         'metadata_sha256':digest(ACTIVE/'model.json'),'env_sha256':digest(ROOT/'.env'),
         'patchcore':{p.name:digest(p) for p in (ROOT/'.runtime/quality-models/patchcore-gear-v1').iterdir() if p.name in ('model.json','memory.npz')}})

    def add(row,image,truth,kind,window=None,augmentation=None,extra=None):
        pixels=sha256(f'{image.size}:'.encode()+image.tobytes()).hexdigest()
        if pixels in seen:
            return False
        seen.add(pixels)
        split=row['split']
        identity=f'{row["sample_id"]}-{len(samples):05}'
        path=DATA/'images'/split/(identity+'.png')
        image.save(path)
        w,h=image.size
        lines=[]
        for g in truth:
            x1,y1,x2,y2=g['bbox']
            assert 0<=x1<x2<=w and 0<=y1<y2<=h,(identity,g,image.size)
            lines.append(f'{classes.index(g["label"])} {(x1+x2)/2/w:.10f} {(y1+y2)/2/h:.10f} {(x2-x1)/w:.10f} {(y2-y1)/h:.10f}')
        (DATA/'labels'/split/(identity+'.txt')).write_text('\n'.join(lines),encoding='utf-8')
        samples.append({'sample_id':identity,'source_id':row['sample_id'],'source_split':split,'split':split,
            'source_group':row['group_id'],'source_native_sha256':row['original_image_sha256'],
            'kind':kind,'window':window,'augmentation':augmentation,'path':path.relative_to(DATA).as_posix(),
            'width':w,'height':h,'ground_truth':truth,'file_sha256':digest(path),'pixel_sha256':pixels,**(extra or {})})
        return True

    # All train images replayed, including non-target images responsible for
    # most of the previous candidate's extra hair false positives.
    for row in rows+calibration:
        path=SOURCE/row['path']
        assert digest(path)==row['file_sha256']
        with Image.open(path) as source:
            add(row,source.convert('RGB'),row['ground_truth'],'real_whole')
    for ri,row in enumerate(rows):
        if not any(g['label'] in ('dirt','hair') for g in row['ground_truth']):
            continue
        with_native,truth=native(row,index)
        with with_native as image:
            for gi,g in enumerate(truth):
                if g['label'] not in ('dirt','hair'):
                    continue
                sizes=(192,320,512) if g['label']=='dirt' else (256,512)
                x1,y1,x2,y2=g['bbox']
                for size0 in sizes:
                    size=min(max(size0,math.ceil(max(x2-x1,y2-y1)*1.4)),min(image.size))
                    for jitter in range(2):
                        for attempt in range(50):
                            l=int(max(0,min(image.width-size,(x1+x2-size)/2+rng.uniform(-.2,.2)*size)))
                            t=int(max(0,min(image.height-size,(y1+y2-size)/2+rng.uniform(-.2,.2)*size)))
                            window=[l,t,l+size,t+size]
                            labels=crop_truth(truth,window)
                            if labels is None or not (l<=x1<x2<=l+size and t<=y1<y2<=t+size):
                                continue
                            with image.crop(window) as crop:
                                add(row,crop,labels,'native_target_crop',window,extra={'target_index':gi})
                                flip=rng.choice([False,True]); turns=rng.choice([1,2,3])
                                brightness=rng.uniform(.82,1.18);contrast=rng.uniform(.85,1.15)
                                derived=ImageOps.mirror(crop) if flip else crop.copy()
                                derived=derived.transpose({1:Image.Transpose.ROTATE_270,2:Image.Transpose.ROTATE_180,3:Image.Transpose.ROTATE_90}[turns])
                                derived=ImageEnhance.Brightness(derived).enhance(brightness)
                                derived=ImageEnhance.Contrast(derived).enhance(contrast)
                                add(row,derived,transform_truth(labels,size,size,flip,turns),'augmented_native_target',window,
                                    {'flip':flip,'clockwise_turns':turns,'brightness':brightness,'contrast':contrast}, {'target_index':gi})
                                derived.close()
                            break
        if ri%50==0:
            print({'stage':'targets','source_index':ri,'samples':len(samples)},flush=True)

    # Confusable annotated defects stay annotated as their actual classes.
    for label,quota in [('darkspot',80),('perforation',24),('overflow',40),('void',16)]:
        choices=[(r,i) for r in rows for i,g in enumerate(r['ground_truth']) if g['label']==label]
        rng.shuffle(choices); added=0
        for row,gi in choices:
            if added>=quota:
                break
            image,truth=native(row,index)
            with image:
                x1,y1,x2,y2=truth[gi]['bbox']
                for _ in range(25):
                    size=min(max(rng.choice([256,384,512]),math.ceil(max(x2-x1,y2-y1)*1.4)),min(image.size))
                    l=int(max(0,min(image.width-size,(x1+x2-size)/2+rng.uniform(-.1,.1)*size)))
                    t=int(max(0,min(image.height-size,(y1+y2-size)/2+rng.uniform(-.1,.1)*size)))
                    window=[l,t,l+size,t+size]; labels=crop_truth(truth,window)
                    if labels and any(g['label']==label for g in labels):
                        with image.crop(window) as crop:
                            added+=add(row,crop,labels,'native_confusable_defect',window)
                        break

    model=YOLO(str(ACTIVE/'best.pt'),task='detect')
    candidates=[]
    for ri,row in enumerate(rows):
        image,truth=native(row,index)
        with image:
            # Exclude an 8-pixel halo around all annotation boxes.
            expanded=[{'label':g['label'],'bbox':[g['bbox'][0]-8,g['bbox'][1]-8,g['bbox'][2]+8,g['bbox'][3]+8]} for g in truth]
            best=None
            for _ in range(28):
                size=rng.choice([256,384,512]);l=rng.randrange(image.width-size+1);t=rng.randrange(image.height-size+1)
                window=[l,t,l+size,t+size]
                if crop_truth(expanded,window)!=[]:
                    continue
                with image.crop(window) as crop:
                    gray=np.asarray(crop.convert('L'),dtype=np.float32)
                    gradient=float(np.abs(np.diff(gray,axis=0)).mean()+np.abs(np.diff(gray,axis=1)).mean())
                    # Real gear texture/edges, not blank dark backgrounds.
                    if gradient<3 or gray.std()<15:
                        continue
                if best is None or gradient>best[0]:
                    best=(gradient,window)
            if best:
                with image.crop(best[1]) as crop:
                    result=model.predict(crop,imgsz=640,conf=.01,iou=.45,device='cpu',verbose=False)[0]
                target_predictions=[{'label':model.names[int(c)],'confidence':float(p),'bbox':b.tolist()}
                    for c,p,b in zip(result.boxes.cls,result.boxes.conf,result.boxes.xyxy) if model.names[int(c)] in ('dirt','hair')]
                candidates.append({'source_id':row['sample_id'],'window':best[1],'gradient':best[0],
                    'hardness':max((p['confidence'] for p in target_predictions),default=0),'baseline_target_predictions':target_predictions})
        if (ri+1)%50==0:
            print({'stage':'mine_train_negatives','photos':ri+1,'candidates':len(candidates)},flush=True)
    candidates.sort(key=lambda x:(x['hardness'],x['gradient']),reverse=True)
    chosen=candidates[:512]
    row_index={r['sample_id']:r for r in rows}
    for candidate in chosen:
        row=row_index[candidate['source_id']];image,truth=native(row,index)
        with image, image.crop(candidate['window']) as crop:
            assert crop_truth(truth,candidate['window'])==[]
            add(row,crop,[],'mined_texture_edge_negative',candidate['window'],extra={'mining':candidate})
    save(OUT/'negative-mining.json',{'weights_sha256':digest(ACTIVE/'best.pt'),'train_only':True,
         'candidates':candidates,'selected':len(chosen),'annotation_exclusion_halo':8,
         'limitation':'Unannotated local backgrounds, not independently certified normal parts.'})
    document={'source_manifest_sha256':digest(SOURCE/'manifest.json'),'seed':SEED,'classes':classes,'samples':samples,
              'test_used':False,'calibration_used_for_training':False,'new_independent_photos':0,
              'crop_policy':'Native pixels; keep all complete intersecting annotations, reject partial defects.'}
    save(DATA/'manifest.json',document)
    save(DATA/'data.yaml',{'path':str(DATA),'train':'images/train','val':'images/calibration','names':classes,'nc':len(classes)})
    train=[s for s in samples if s['split']=='train']
    summary={'training_inputs':len(train),'kinds':dict(Counter(s['kind'] for s in train)),
             'boxes':dict(Counter(g['label'] for s in train for g in s['ground_truth'])),
             'source_photos':len({s['source_id'] for s in train}),'new_independent_photos':0,
             'calibration_images':len(calibration),'test_images_unchanged':118,
             'hard_negative_crops_with_baseline_target_detection':sum(c['hardness']>=.01 for c in chosen)}
    save(OUT/'data-summary.json',summary)
    for kind in ('native_target_crop','augmented_native_target','mined_texture_edge_negative'):
        selected=[s for s in train if s['kind']==kind]
        rng.shuffle(selected)
        sheet=Image.new('RGB',(960,720),'#18232c');draw=ImageDraw.Draw(sheet)
        for i,s in enumerate(selected[:12]):
            x,y=(i%4)*240,(i//4)*240
            with Image.open(DATA/s['path']) as source:
                pic=source.convert('RGB');ratio=min(228/pic.width,205/pic.height)
                pic=pic.resize((round(pic.width*ratio),round(pic.height*ratio)))
                paint=ImageDraw.Draw(pic)
                for g in s['ground_truth']:
                    paint.rectangle([v*ratio for v in g['bbox']],outline='#4bffb7',width=2)
                    paint.text((g['bbox'][0]*ratio,g['bbox'][1]*ratio),g['label'],fill='#4bffb7')
                sheet.paste(pic,(x+6,y+6))
            draw.text((x+6,y+216),s['source_id'],fill='white')
        sheet.save(OUT/(kind+'.jpg'))
    print(summary,flush=True)


if __name__=='__main__':
    prepare()
