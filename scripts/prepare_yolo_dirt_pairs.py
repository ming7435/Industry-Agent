"""Supplement dirt training with paired synthetic stains and real gear backgrounds."""
from collections import Counter
from datetime import datetime,timezone
from pathlib import Path
import sys
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.train_yolo_fine_defects import SOURCE,read,save,digest,crop_truth
from scripts.prepare_yolo_native_hard_examples import native,FULL,ACTIVE
from scripts.yolo_dirt_augmentation import apply_stain

OUT=ROOT/'output/gear-yolo-dirt-pairs-v11'
DATA=OUT/'dataset'
SEED=2026102301


def main():
    import cv2
    from PIL import Image,ImageDraw,ImageFont
    OUT.mkdir(exist_ok=False);(DATA/'images').mkdir(parents=True)
    source=read(SOURCE/'manifest.json');rows=[r for r in source['samples'] if r['split']=='train']
    originals={r['sample_id']:r for r in rows};index={r['sample_id']:r for r in read(FULL/'annotation-index.json')}
    groups={r['group_id'] for r in rows}
    assert groups.isdisjoint({r['group_id'] for r in source['samples'] if r['split']!='train'})
    protocol=read(ROOT/'output/gear-yolo-dirt-residual-v10/protocol.json')
    for key in ('residual_alpha_grid','cross_validation','parent_training_results_sha256','excluded_kind','negative_sampling',
                'feature_manifest_sha256','target_manifest_sha256','dataset_manifest_sha256'):
        protocol.pop(key,None)
    hair=read(ROOT/'output/gear-yolo-dirt-residual-v10/verification.json')['hair_parameters']
    protocol.update(experiment='dirt_pairs_v11',created_at=datetime.now(timezone.utc).isoformat(),
        rationale='Learn new stain appearance against paired clean real gear textures; train an isolated dirt branch while preserving hair and other channels.',
        seed=SEED,training_policy='Train sources only; real crops, paired clean/synthetic stains, retained annotated confusers.',
        synthetic_pairs=600,real_dirt_crop_variants=8,candidate_epochs=[2,4],maximum_epochs=4,
        fixed_hair_consensus=hair,initial_weights_sha256=digest(ACTIVE/'best.pt'),
        training_objective='Top3 geometric positives, top128 negative BCE per image, original background-score preservation; no equal positive/negative class mass.',
        stopping_policy='Evaluate epochs2 and4 on fixed43 calibration; full188 only if dirt and frozen hair criteria pass; freeze before test118. Preserve deployment on any failed gate.')
    save(OUT/'protocol.json',protocol)
    save(OUT/'baseline-deployment.json',read(ROOT/'output/gear-yolo-dirt-residual-v10/baseline-deployment.json'))
    rng=np.random.default_rng(SEED);samples=[];donors=[];seen=set()
    previous=read(ROOT/'output/gear-yolo-fine-defects-v3/dataset/manifest.json')
    # Keep original training frames, true dirt crops, and annotated confusers.
    for row in previous['samples']:
        if row['split']!='train':continue
        if row['kind']=='real_whole' or row['kind']=='native_confusable_defect' or (row['kind']=='native_target_crop' and any(g['label']=='dirt' for g in row['ground_truth'])):
            samples.append({**row,'path':str((ROOT/'output/gear-yolo-fine-defects-v3/dataset'/row['path']).resolve()),'existing':True})

    def add(image,truth,row,kind,**extra):
        from hashlib import sha256
        pixels=sha256(image.tobytes()+str(image.size).encode()).hexdigest()
        if pixels in seen:return None
        seen.add(pixels);sid=f'{kind}-{len(samples):05d}'
        path=DATA/'images'/(sid+'.png');image.save(path)
        for gt in truth:
            x1,y1,x2,y2=gt['bbox'];assert 0<=x1<x2<=image.width and 0<=y1<y2<=image.height
        item={'sample_id':sid,'source_id':row['sample_id'],'source_split':'train','split':'train',
            'source_group':row['group_id'],'source_file_sha256':row['file_sha256'],'kind':kind,
            'path':str(path),'width':image.width,'height':image.height,'ground_truth':truth,
            'file_sha256':digest(path),'pixel_sha256':pixels,'existing':False,**extra}
        samples.append(item);return item

    for row in rows:
        if not any(g['label']=='dirt' for g in row['ground_truth']):continue
        image,truth=native(row,index)
        with image:
            rgb=np.asarray(image);gray=cv2.cvtColor(rgb,cv2.COLOR_RGB2GRAY)
            for gi,gt in enumerate(truth):
                if gt['label']!='dirt':continue
                x1,y1,x2,y2=gt['bbox'];l,t,r,b=int(x1),int(y1),int(np.ceil(x2)),int(np.ceil(y2))
                # Inpaint only the annotated box to estimate its local clean appearance.
                pad=12;ll,tt,rr,bb=max(0,l-pad),max(0,t-pad),min(image.width,r+pad),min(image.height,b+pad)
                patch=gray[tt:bb,ll:rr];mask=np.zeros_like(patch);mask[t-tt:b-tt,l-ll:r-ll]=255
                clean=cv2.inpaint(patch,mask,3,cv2.INPAINT_TELEA)
                residual=np.maximum(clean.astype(np.float32)-patch.astype(np.float32),0)[t-tt:b-tt,l-ll:r-ll]
                if residual.max()>=3:
                    residual=np.minimum(residual,55);residual[residual<2]=0
                    donors.append({'stamp':residual,'source_id':row['sample_id'],'source_group':row['group_id'],'target_index':gi})
                for variant in range(8):
                    size=min(max((256,384,512,640)[variant%4],int(max(x2-x1,y2-y1)*1.5)),min(image.size))
                    for _ in range(50):
                        left=int(np.clip((x1+x2-size)/2+rng.uniform(-.2,.2)*size,0,image.width-size))
                        top=int(np.clip((y1+y2-size)/2+rng.uniform(-.2,.2)*size,0,image.height-size))
                        window=[left,top,left+size,top+size];labels=crop_truth(truth,window)
                        if labels is None or not (left<=x1<x2<=left+size and top<=y1<y2<=top+size):continue
                        with image.crop(window) as crop:
                            add(crop,labels,row,'new_real_dirt_crop',window=window,target_index=gi)
                        break
    assert len(donors)>=12
    donor_metadata=[{k:v for k,v in d.items() if k!='stamp'} for d in donors]
    save(OUT/'donors.json',donor_metadata)
    # Search new crop coordinates, including subtle interior texture and edges.
    backgrounds=[];shuffled=list(rows);rng.shuffle(shuffled)
    old_windows={(r['source_id'],tuple(r['window'])) for r in previous['samples'] if r.get('window')}
    for row in shuffled:
        if len(backgrounds)>=600:break
        image,truth=native(row,index)
        with image:
            expanded=[{'label':g['label'],'bbox':[g['bbox'][0]-10,g['bbox'][1]-10,g['bbox'][2]+10,g['bbox'][3]+10]} for g in truth]
            candidates=[]
            for _ in range(64):
                size=int(rng.choice([256,384,512]));left=int(rng.integers(image.width-size+1));top=int(rng.integers(image.height-size+1))
                window=[left,top,left+size,top+size]
                if (row['sample_id'],tuple(window)) in old_windows or crop_truth(expanded,window)!=[]:continue
                with image.crop(window) as crop:
                    a=np.asarray(crop.convert('L'),dtype=np.float32)
                    foreground=float((a>70).mean());gradient=float(np.abs(np.diff(a,axis=0)).mean()+np.abs(np.diff(a,axis=1)).mean())
                    if foreground<.35 or gradient<.3:continue
                    candidates.append((gradient,window,foreground))
            if not candidates:continue
            candidates.sort(key=lambda v:v[0])
            selection=candidates[-1] if len(backgrounds)%2 else candidates[len(candidates)//4]
            with image.crop(selection[1]) as crop:
                item=add(crop,[],row,'new_clean_gear_background',window=selection[1],texture_gradient=selection[0],
                    background_type='edge' if len(backgrounds)%2 else 'interior_texture')
            if item:backgrounds.append(item)
        if len(backgrounds)%100==0:print({'backgrounds':len(backgrounds),'donors':len(donors)},flush=True)
    assert len(backgrounds)==600,len(backgrounds)
    for i,background in enumerate(backgrounds):
        row=originals[background['source_id']]
        with Image.open(background['path']) as image:
            image=image.convert('RGB');gray=np.asarray(image.convert('L'))
            donor=None
            if i%2==0:
                donor=donors[int(rng.integers(len(donors)))];stamp=donor['stamp']
                side=int(rng.integers(7,38));ratio=side/max(stamp.shape)
                stamp=cv2.resize(stamp,(max(3,round(stamp.shape[1]*ratio)),max(3,round(stamp.shape[0]*ratio))),interpolation=cv2.INTER_LINEAR)
                stamp=np.rot90(stamp,int(rng.integers(4))).copy()
                stamp*=rng.uniform(.6,1.4)
            else:
                # Irregular low-contrast smudges; no sharp artificial rectangular edges.
                w,h=int(rng.integers(9,40)),int(rng.integers(7,30));yy,xx=np.mgrid[:h,:w]
                stamp=np.zeros((h,w),dtype=np.float32)
                for _ in range(int(rng.integers(2,6))):
                    cx,cy=rng.uniform(.25,.75)*w,rng.uniform(.25,.75)*h
                    sx,sy=rng.uniform(.1,.22)*w,rng.uniform(.1,.25)*h
                    stamp+=rng.uniform(4,13)*np.exp(-.5*(((xx-cx)/sx)**2+((yy-cy)/sy)**2))
                stamp=np.minimum(stamp,30);stamp[stamp<1.5]=0
            for attempt in range(100):
                sh,sw=stamp.shape;x=int(rng.integers(10,image.width-sw-10));y=int(rng.integers(10,image.height-sh-10))
                region=gray[y:y+sh,x:x+sw]
                if region.min()<65 or region.std()>25:continue
                try:synthetic,box=apply_stain(image,stamp,(x,y))
                except ValueError:continue
                add(synthetic,[{'label':'dirt','bbox':box}],row,'synthetic_dirt_pair',
                    paired_clean_id=background['sample_id'],synthetic=True,
                    donor={k:v for k,v in donor.items() if k!='stamp'} if donor else None,
                    generator='real_residual_transfer' if donor else 'irregular_low_contrast_smudge')
                synthetic.close();break
            else:raise AssertionError(f'Could not place a stain: {background["sample_id"]}')
    for item in samples:
        assert item['source_split']==item['split']=='train' and item['source_id'] in originals
        if item.get('donor'):assert item['donor']['source_id'] in originals
    save(DATA/'manifest.json',{'samples':samples,'classes':source['classes'],'seed':SEED,
        'source_manifest_sha256':digest(SOURCE/'manifest.json'),'calibration_used':False,'test_used':False,
        'new_independent_photos':0,'annotation_policy':'Existing labels retained; synthetic box exactly bounds changed pixels; clean crops exclude all labels plus ten-pixel halo.'})
    summary={'training_inputs':len(samples),'source_photos':len({s['source_id'] for s in samples}),
        'new_inputs':sum(not s['existing'] for s in samples),'kinds':dict(Counter(s['kind'] for s in samples)),
        'new_independent_photos':0,'real_dirt_source_photos':len({d['source_id'] for d in donors}),
        'donor_boxes':len(donors),'synthetic_pairs':sum(s['kind']=='synthetic_dirt_pair' for s in samples)}
    save(OUT/'data-summary.json',summary)
    positives=[s for s in samples if s['kind']=='synthetic_dirt_pair'];rng.shuffle(positives)
    sheet=Image.new('RGB',(1200,960),'#edf1f5');draw=ImageDraw.Draw(sheet)
    for j,item in enumerate(positives[:16]):
        with Image.open(item['path']) as source_image:
            box=item['ground_truth'][0]['bbox'];cx=(box[0]+box[2])/2;cy=(box[1]+box[3])/2
            window=[int(cx-64),int(cy-64),int(cx+64),int(cy+64)]
            crop=source_image.crop(window).resize((224,224));paint=ImageDraw.Draw(crop)
            paint.rectangle([(v-window[k%2])*1.75 for k,v in enumerate(box)],outline='#d22e28',width=2)
            x,y=j%5*240,j//5*240;sheet.paste(crop,(x,y));draw.text((x+3,y+225),item['generator'][:27],fill='#152f42')
    sheet.save(OUT/'synthetic-audit.jpg',quality=93)
    print(summary,flush=True)


if __name__=='__main__':main()
