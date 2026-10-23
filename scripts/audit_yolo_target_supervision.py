"""Audit actual TAL targets/score gradients on fixed training-only examples."""
from collections import Counter, defaultdict
import argparse
from pathlib import Path
import sys
from types import SimpleNamespace

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.train_yolo_fine_defects import read,save,digest
from scripts.train_yolo_geometric_refinement import runtime
from scripts.train_yolo_native_hard_examples import batch


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--candidate',type=Path)
    args=parser.parse_args()
    torch=runtime()
    from ultralytics import YOLO
    from ultralytics.utils.loss import v8DetectionLoss
    source=ROOT/'output/gear-yolo-fine-defects-v3'
    data=read(source/'dataset/manifest.json'); rows={s['sample_id']:s for s in data['samples']}
    chosen=[]; seen=Counter()
    for item in read(source/'feature-manifest.json')['samples']:
        row=rows[item['sample_id']]
        target=any(g['label'] in ('dirt','hair') for g in row['ground_truth'])
        if row['kind']=='real_whole' and target or row['kind']=='native_target_crop' and seen[row['source_id']]<2:
            chosen.append(item);seen[row['source_id']]+=1
    assert all(s['source_split']=='train' for s in chosen)
    records=[];baseline_anchors={}
    models=[('deployed',ROOT/'.runtime/quality-models/yolo11-gear-fine-defects-v2/best.pt'),
            ('v3_rejected',source/'masked-training/epoch4.pt')]
    if args.candidate:models.append(('v4_candidate',args.candidate.resolve(strict=True)))
    for name,path in models:
        model=YOLO(str(path)).model.float().eval();model.args=SimpleNamespace(box=7.5,cls=.5,dfl=1.5)
        head=model.model[-1];criterion=v8DetectionLoss(model);stats=defaultdict(list)
        for item in chosen:
            entry=torch.load(source/'features'/item['path'],weights_only=True)
            features,labels,_=batch([entry],torch)
            captured=[]
            hook=criterion.assigner.register_forward_hook(lambda module,args,result:captured.append(result))
            with torch.no_grad():
                preds=head.forward_head(features,box_head=head.cv2,cls_head=head.cv3)
                criterion(preds,labels)
            hook.remove()
            target_labels,boxes,scores,fg,indices=captured[0]
            for j,gt in enumerate(entry['truth']):
                label=model.names[int(gt[0])]
                if label not in ('dirt','hair'):continue
                assigned=fg[0]&(indices[0]==j)
                key=(item['sample_id'],j)
                if name=='deployed':baseline_anchors[key]=torch.where(assigned)[0].tolist()
                fixed=preds['scores'][0,int(gt[0])].sigmoid()[baseline_anchors[key]]
                quality=scores[0,:,int(gt[0])][assigned]
                prob=preds['scores'][0,int(gt[0])].sigmoid()[assigned]
                stats[(rows[item['sample_id']]['kind'],label)].append({
                    'sample_id':item['sample_id'],'anchors':int(assigned.sum()),
                    'max_quality':float(quality.max()) if len(quality) else 0,
                    'quality_mass':float(quality.sum()),'mean_score':float(prob.mean()) if len(prob) else 0,
                    'mean_score_at_fixed_baseline_anchors':float(fixed.mean()) if len(fixed) else 0,
                    'positive_class_logit_gradient':float((prob-quality).sum())})
        summaries=[]
        for (kind,label),items in stats.items():
            summary={'kind':kind,'label':label,'gt':len(items),
                     'no_positive_anchors':sum(i['anchors']==0 for i in items),
                     'max_quality_below_01':sum(i['max_quality']<.1 for i in items),
                     'max_quality_below_05':sum(i['max_quality']<.5 for i in items),
                     'mean_quality_mass':sum(i['quality_mass'] for i in items)/len(items),
                     'mean_score_at_fixed_baseline_anchors':sum(i['mean_score_at_fixed_baseline_anchors'] for i in items)/len(items),
                     'mean_positive_logit_gradient':sum(i['positive_class_logit_gradient'] for i in items)/len(items)}
            summaries.append({**summary,'items':items});print(name,summary,flush=True)
        records.append({'name':name,'weights_sha256':digest(path),'summaries':summaries})
    save(ROOT/'output/gear-yolo-fine-defects-v4'/('trained-supervision-audit.json' if args.candidate else 'supervision-audit.json'),
         {'train_only':True,'sample_count':len(chosen),'models':records})


if __name__=='__main__':main()
