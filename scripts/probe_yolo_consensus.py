"""Calibration-only experiment: verify small defects across different crop views."""
from copy import deepcopy
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.train_yolo_fine_defects import read,save
from app.vision.yolo_multiview import overlap,merge_views
from app.vision.yolo_evaluation import class_aware_localization


def consensus(views,size,config,*,cluster_iou=.3,min_votes=2,view_floor=.05):
    candidates=[]
    width,height=size
    for view_index,view in enumerate(views):
        left,top,right,bottom=view['window']
        for d in view['defects']:
            if d['label'] not in ('dirt','hair') or d['confidence']<view_floor:
                continue
            x1,y1,x2,y2=d['bbox'];m=config['border_margin']
            if view['kind']!='full' and ((left>0 and x1<=m) or (top>0 and y1<=m)
                or (right<width and x2>=right-left-m) or (bottom<height and y2>=bottom-top-m)):
                continue
            candidates.append({**d,'bbox':[x1+left,y1+top,x2+left,y2+top],'view':view_index})
    clusters=[]
    for item in sorted(candidates,key=lambda d:-d['confidence']):
        compatible=[c for c in clusters if c[0]['label']==item['label'] and overlap(c[0]['bbox'],item['bbox'])>=cluster_iou]
        if compatible:
            chosen=max(compatible,key=lambda c:overlap(c[0]['bbox'],item['bbox']))
            if item['view'] not in {d['view'] for d in chosen}:
                chosen.append(item)
        else:
            clusters.append([item])
    retained=[]
    for cluster in clusters:
        if len(cluster)<min_votes:
            continue
        total=sum(d['confidence'] for d in cluster)
        retained.append({'label':cluster[0]['label'],'confidence':sum(d['confidence'] for d in cluster)/len(cluster),
            'bbox':[sum(d['confidence']*d['bbox'][j] for d in cluster)/total for j in range(4)]})
    return retained


def main():
    import argparse
    p=argparse.ArgumentParser();p.add_argument('--raw',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
    args=p.parse_args();document=read(args.raw)
    assert all(r['split']=='calibration' for r in document['samples'])
    cfg=document['extraction_config'];results=[]
    for iou in (.3,.5):
        for votes in (2,3):
            for floor in (.03,.075,.15):
                rows=[]
                for row in document['samples']:
                    size=row['views'][0]['window'][2:]
                    predictions=consensus(row['views'],size,cfg,cluster_iou=iou,min_votes=votes,view_floor=floor)
                    rows.append({'ground_truth':[g for g in row['ground_truth'] if g['label'] in ('dirt','hair')],'predictions':predictions})
                best={}
                for label in ('dirt','hair'):
                    subset=[{'ground_truth':[g for g in r['ground_truth'] if g['label']==label],
                             'predictions':[d for d in r['predictions'] if d['label']==label]} for r in rows]
                    choices=[]
                    for t in (.03,.05,.075,.1,.15,.2,.25,.3,.35,.4,.5,.6,.7,.8,.9,1.):
                        s=class_aware_localization(subset,t,.5)
                        if s['fp']<=2: choices.append({'threshold':t,'tp':s['tp'],'fp':s['fp'],'fn':s['fn']})
                    best[label]=max(choices,key=lambda s:(s['tp'],-s['fp'],s['threshold']))
                result={'iou':iou,'votes':votes,'view_floor':floor,'classes':best}
                results.append(result)
    results.sort(key=lambda r:(sum(s['tp'] for s in r['classes'].values()),-sum(s['fp'] for s in r['classes'].values())),reverse=True)
    save(args.out,results)
    for row in results[:5]:print(row)


if __name__=='__main__':main()
