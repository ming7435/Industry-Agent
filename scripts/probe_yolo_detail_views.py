"""Calibration-only probe of orthogonal/contrast views for faint defects."""
import argparse
from pathlib import Path
import sys
from time import perf_counter
ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.train_yolo_fine_defects import read,save,digest


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--variant',choices=('rotate90','rotate180','clahe','native'),required=True)
    parser.add_argument('--all-calibration',action='store_true')
    parser.add_argument('--weights',type=Path)
    parser.add_argument('--name')
    parser.add_argument('--experiment-root',type=Path,default=ROOT/'output/gear-yolo-fine-defects-v2')
    args=parser.parse_args()
    out=args.experiment_root.resolve(strict=True)
    weights=args.weights.resolve(strict=True) if args.weights else ROOT/'.runtime/quality-models/yolo11-gear-fine-defects-v2/best.pt'
    baseline=read(ROOT/'output/gear-yolo-fine-defects-v1/evaluation/packed-classifier-epoch4-contained/calibration-raw.json')
    assert args.variant=='native' or digest(weights)==baseline['weights_sha256']
    prefix=args.name or args.variant
    assert prefix.replace('-','').isalnum()
    config=baseline['extraction_config']
    samples=baseline['samples'] if args.all_calibration else [r for r in baseline['samples'] if any(g['label'] in ('dirt','hair') for g in r['ground_truth'])]
    from scripts.evaluate_yolo import configure_inference_runtime
    configure_inference_runtime(weights)
    from app.vision.algorithms import YoloDetector
    from app.vision.yolo_multiview import crop_windows,merge_views,extract_views
    from app.vision.yolo_evaluation import class_aware_localization
    from PIL import Image
    import numpy as np
    import cv2
    detector=YoloDetector(str(weights),640)
    sources={r['sample_id']:r for r in read(ROOT/'output/gear-full-dataset/annotation-index.json')}
    rows=[];start=perf_counter()
    for i,row in enumerate(samples):
        image_path=ROOT/'output/gear-full-dataset/prepared'/row['path']
        assert digest(image_path)==row['file_sha256'] and row['split']=='calibration'
        image=Image.open(image_path).convert('RGB')
        if args.variant=='native':
            source=sources[row['sample_id']]
            native_path=ROOT/'output/gear-full-dataset'/source['image_path']
            assert digest(native_path)==row['original_image_sha256']==source['image_sha256']
            with Image.open(native_path) as original:
                native=original.convert('RGB')
                views=extract_views(detector,native,.01,.45,config)
                sx,sy=image.width/native.width,image.height/native.height
                for view in views:
                    view['window']=[v*(sx if j%2==0 else sy) for j,v in enumerate(view['window'])]
                    view['defects']=[{**p,'bbox':[v*(sx if j%2==0 else sy) for j,v in enumerate(p['bbox'])]} for p in view['defects']]
                native.close()
            predictions=merge_views(views,image.size,.01,.45,config)
            rows.append({**row,'views':views,'predictions':predictions,'native_image_path':str(native_path)})
            image.close()
            print({'variant':args.variant,'done':i+1,'total':len(samples),'seconds':round(perf_counter()-start,1)},flush=True)
            continue
        views=[v for v in row['views'] if v['kind']!='detail']
        for window in crop_windows(image.size,.4,3):
            crop=image.crop(window);w,h=crop.size
            if args.variant=='rotate90': transformed=crop.transpose(Image.Transpose.ROTATE_90)
            elif args.variant=='rotate180': transformed=crop.transpose(Image.Transpose.ROTATE_180)
            else:
                lab=cv2.cvtColor(np.asarray(crop),cv2.COLOR_RGB2LAB)
                lab[:,:,0]=cv2.createCLAHE(clipLimit=2.,tileGridSize=(8,8)).apply(lab[:,:,0])
                transformed=Image.fromarray(cv2.cvtColor(lab,cv2.COLOR_LAB2RGB))
            predictions=detector.predict(transformed,.01,.45)['defects']; mapped=[]
            for p in predictions:
                if p['label'] not in ('dirt','hair'): continue
                x1,y1,x2,y2=p['bbox']
                if args.variant=='rotate90': box=[w-y2,x1,w-y1,x2]
                elif args.variant=='rotate180': box=[w-x2,h-y2,w-x1,h-y1]
                else: box=p['bbox']
                mapped.append({**p,'bbox':box})
            views.append({'kind':'detail','window':list(window),'defects':mapped})
            transformed.close();crop.close()
        predictions=merge_views(views,image.size,.01,.45,config)
        rows.append({**row,'views':views,'predictions':predictions});image.close()
        print({'variant':args.variant,'done':i+1,'total':len(samples),'seconds':round(perf_counter()-start,1)},flush=True)
    suffix='full' if args.all_calibration else 'targets'
    save(out/f'{prefix}-{suffix}-raw.json',{'weights_sha256':digest(weights),'manifest_sha256':baseline['manifest_sha256'],
          'extraction_config':config,'detail_transform':args.variant,'samples':rows,'selection_split':'calibration'})
    results=[]
    for aspect in (1,1.5):
        merged=[{**r,'predictions':merge_views(r['views'],r['views'][0]['window'][2:],.01,.45,{**config,'hair_min_aspect_ratio':aspect,'hair_suppress_contained':True})} for r in rows]
        best={}
        for label in ('dirt','hair'):
            subset=[{'ground_truth':[g for g in r['ground_truth'] if g['label']==label],'predictions':[d for d in r['predictions'] if d['label']==label]} for r in merged]
            choices=[]
            for threshold in read(out/'protocol.json')['confidence_grid']:
                s=class_aware_localization(subset,threshold,.5)
                if s['fp']<=2:choices.append({'threshold':threshold,'tp':s['tp'],'fp':s['fp'],'fn':s['fn']})
            best[label]=max(choices,key=lambda s:(s['tp'],-s['fp'],s['threshold']))
        results.append({'aspect':aspect,'classes':best})
    save(out/f'{prefix}-{suffix}-summary.json',results)
    print(results,flush=True)


if __name__=='__main__':main()
