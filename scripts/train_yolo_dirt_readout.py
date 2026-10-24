"""Fit only the dirt output row on frozen original and refined features.

Training sources are grouped before cross-validation. Calibration/test photos
never supply fitting features, negatives, normalization, or regularization.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import sys
from time import monotonic
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.train_yolo_fine_defects import read,save,digest,SOURCE
from scripts.probe_yolo_class_competition import ACTIVE

OUT=ROOT/'output/gear-yolo-dirt-readout-v9'
FEATURES=ROOT/'output/gear-yolo-fine-defects-v3'
TARGETS=ROOT/'output/gear-yolo-fine-defects-v4'


def group_balanced_weights(y,groups):
    y=np.asarray(y);groups=np.asarray(groups)
    if y.shape!=groups.shape or y.ndim!=1 or set(np.unique(y))!={0,1}:
        raise ValueError('Expected matching 1D arrays with both binary classes')
    weights=np.zeros(len(y),dtype=np.float64)
    for label in (0,1):
        mask=y==label
        _,inverse,counts=np.unique(groups[mask],return_inverse=True,return_counts=True)
        weights[mask]=.5/(len(counts)*counts[inverse])
    return weights


def apply_linear_readout(layer,class_index,coefficient,intercept,mean,scale):
    import torch
    coefficient=np.asarray(coefficient,dtype=np.float64).reshape(-1)
    mean=np.asarray(mean,dtype=np.float64);scale=np.asarray(scale,dtype=np.float64)
    if layer.kernel_size!=(1,1) or coefficient.shape!=mean.shape or mean.shape!=scale.shape or len(mean)!=layer.in_channels:
        raise ValueError('Readout requires matching features and a 1x1 convolution')
    if not np.all(scale>0) or not all(np.isfinite(a).all() for a in (coefficient,mean,scale,np.asarray(intercept))):
        raise ValueError('Readout parameters must be finite with positive scales')
    weight=coefficient/scale
    bias=float(intercept-np.dot(weight,mean))
    with torch.no_grad():
        layer.weight[class_index,:,0,0].copy_(torch.as_tensor(weight,device=layer.weight.device,dtype=layer.weight.dtype))
        layer.bias[class_index].copy_(torch.as_tensor(bias,device=layer.bias.device,dtype=layer.bias.dtype))


def prepare():
    OUT.mkdir(exist_ok=False)
    protocol=read(ROOT/'output/gear-yolo-view-consensus-v7/protocol.json')
    for key in ('consensus_grid','training_used'):
        protocol.pop(key,None)
    protocol.update(experiment='dirt_linear_readout_v9',created_at=datetime.now(timezone.utc).isoformat(),
        rationale='Fit dirt to both original and refined frozen feature banks, with source-group balancing.',
        initial_weights_sha256=digest(ACTIVE/'best.pt'),
        feature_manifest_sha256=digest(FEATURES/'feature-manifest.json'),
        target_manifest_sha256=digest(TARGETS/'target-manifest.json'),
        dataset_manifest_sha256=digest(FEATURES/'dataset/manifest.json'),
        training_used=True,calibration_used_for_training=False,test_used_for_training=False,
        cross_validation={'folds':3,'seed':20261023,'C':[.01,.1,1.],
                          'selection':'source-group weighted standardized partial ROC AUC at FPR<=0.01',
                          'sample_weight_normalization':'sum equals number of sampled anchors'},
        negative_sampling={'per_scale_per_input':{'top_dirt':8,'top_other':8,'random':8}},
        excluded_kind='augmented_native_target',
        stopping_policy='Fit one checkpoint using training-group CV; check fixed43 calibration, then full188 only if both target gates pass. Freeze before test118. Never promote a failed target.')
    save(OUT/'protocol.json',protocol)
    save(OUT/'baseline-deployment.json',read(ROOT/'output/gear-yolo-fine-defects-v5/baseline-deployment.json'))


def cache():
    from scripts.evaluate_yolo import configure_inference_runtime
    torch=configure_inference_runtime(ACTIVE/'best.pt')
    from ultralytics import YOLO
    protocol=read(OUT/'protocol.json')
    assert digest(ACTIVE/'best.pt')==protocol['initial_weights_sha256']
    assert digest(FEATURES/'feature-manifest.json')==protocol['feature_manifest_sha256']
    assert digest(TARGETS/'target-manifest.json')==protocol['target_manifest_sha256']
    assert digest(FEATURES/'dataset/manifest.json')==protocol['dataset_manifest_sha256']
    manifest=read(FEATURES/'feature-manifest.json')
    assert manifest['initial_sha256']==protocol['initial_weights_sha256']
    target_manifest=read(TARGETS/'target-manifest.json');assert target_manifest['indices']==[5,8]
    target_map={r['sample_id']:r for r in target_manifest['samples']}
    dataset={r['sample_id']:r for r in read(FEATURES/'dataset/manifest.json')['samples']}
    rows=[r for r in manifest['samples'] if r['kind']!=protocol['excluded_kind']]
    source=read(SOURCE/'manifest.json');ci=source['classes'].index('dirt')
    train_groups={r['group_id'] for r in source['samples'] if r['split']=='train'}
    heldout_groups={r['group_id'] for r in source['samples'] if r['split']!='train'}
    assert train_groups.isdisjoint(heldout_groups)
    model=YOLO(str(ACTIVE/'best.pt')).model.float().eval();head=model.model[-1]
    rng=np.random.default_rng(protocol['cross_validation']['seed']);buffers=[[] for _ in range(3)]
    counts=Counter();started=monotonic()
    for index,row in enumerate(rows):
        item=dataset[row['sample_id']];group=item['source_group']
        assert row['source_split']=='train' and item['split']=='train' and group in train_groups
        path=FEATURES/'features'/row['path'];target_path=TARGETS/'targets'/target_map[row['sample_id']]['path']
        assert digest(path)==row['cache_sha256'] and digest(target_path)==target_map[row['sample_id']]['target_sha256']
        cached=torch.load(path,weights_only=True);target=torch.load(target_path,weights_only=True)
        offset=0
        with torch.inference_mode():
            for si,feature in enumerate(cached['features']):
                hidden=head.cv3[si][:-1](feature.unsqueeze(0).float())[0].flatten(1).T.numpy()
                length=len(hidden);end=offset+length
                truth=target['targets'][offset:end,0].numpy().astype(bool)
                valid=target['valid'][offset:end,0].numpy().astype(bool)
                positive=np.flatnonzero(truth);negative=np.flatnonzero(valid&~truth)
                scores=cached['teacher_scores'][:,offset:end].float().numpy()
                if len(negative):
                    other=np.max(np.delete(scores,ci,axis=0),axis=0)
                    selected=np.unique(np.concatenate((negative[np.argsort(scores[ci,negative])[-8:]],
                        negative[np.argsort(other[negative])[-8:]],rng.choice(negative,min(8,len(negative)),replace=False))))
                else:selected=negative
                indices=np.concatenate((positive,selected));labels=truth[indices].astype(np.int8)
                buffers[si].append((hidden[indices].copy(),labels,np.repeat(group,len(indices))))
                offset=end
        assert offset==len(target['targets'])
        counts[row['kind']]+=1
        if (index+1)%200==0 or index+1==len(rows):
            print({'cached':index+1,'inputs':len(rows),'seconds':round(monotonic()-started,1)},flush=True)
    files=[]
    for si,buffer in enumerate(buffers):
        x=np.concatenate([b[0] for b in buffer]);y=np.concatenate([b[1] for b in buffer]);groups=np.concatenate([b[2] for b in buffer])
        path=OUT/f'scale{si}.npz';np.savez_compressed(path,x=x,y=y,groups=groups)
        files.append({'path':path.name,'sha256':digest(path),'shape':list(x.shape),
                      'positive_anchors':int(y.sum()),'positive_groups':len(set(groups[y==1]))})
    save(OUT/'training-cache.json',{'files':files,'input_kinds':dict(counts),'inputs':len(rows),
        'source_photos':len({r['source_id'] for r in rows}),'source_groups':len({dataset[r['sample_id']]['source_group'] for r in rows}),
        'new_independent_photos':0,'calibration_used':False,'test_used':False,'protocol_sha256':digest(OUT/'protocol.json')})


def fit():
    from scripts.evaluate_yolo import configure_inference_runtime
    torch=configure_inference_runtime(ACTIVE/'best.pt')
    from ultralytics import YOLO
    from sklearn.model_selection import StratifiedGroupKFold
    from sklearn.preprocessing import StandardScaler
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import roc_auc_score
    from threadpoolctl import threadpool_limits
    protocol=read(OUT/'protocol.json');cache=read(OUT/'training-cache.json')
    assert cache['protocol_sha256']==digest(OUT/'protocol.json')
    assert digest(ACTIVE/'best.pt')==protocol['initial_weights_sha256']
    model=YOLO(str(ACTIVE/'best.pt'));net=model.model.float().eval()
    before={k:v.detach().clone() for k,v in net.state_dict().items()}
    head=net.model[-1];ci=5;results=[]
    cv=protocol['cross_validation']
    with threadpool_limits(limits=4):
        for si,item in enumerate(cache['files']):
            path=OUT/item['path'];assert digest(path)==item['sha256']
            data=np.load(path);x=data['x'];y=data['y'];groups=data['groups']
            if len(set(groups[y==1]))<cv['folds']:
                results.append({'scale':si,'skipped':'Insufficient positive source groups'});continue
            folds=list(StratifiedGroupKFold(cv['folds'],shuffle=True,random_state=cv['seed']).split(x,y,groups))
            scores=[]
            for c in cv['C']:
                fold_scores=[]
                for train,val in folds:
                    assert set(groups[train]).isdisjoint(set(groups[val]))
                    weights=group_balanced_weights(y[train],groups[train])*len(train)
                    scaler=StandardScaler().fit(x[train],sample_weight=weights)
                    estimator=LogisticRegression(C=c,max_iter=1000,tol=1e-4,solver='lbfgs')
                    estimator.fit(scaler.transform(x[train]),y[train],sample_weight=weights)
                    assert estimator.n_iter_.max()<1000,'CV failed to converge'
                    score=roc_auc_score(y[val],estimator.decision_function(scaler.transform(x[val])),
                        sample_weight=group_balanced_weights(y[val],groups[val]),max_fpr=.01)
                    fold_scores.append(float(score))
                scores.append({'C':c,'fold_scores':fold_scores,'mean':float(np.mean(fold_scores))})
            chosen=max(scores,key=lambda s:(s['mean'],-s['C']))
            weights=group_balanced_weights(y,groups)*len(y)
            scaler=StandardScaler().fit(x,sample_weight=weights)
            estimator=LogisticRegression(C=chosen['C'],max_iter=1000,tol=1e-4,solver='lbfgs')
            estimator.fit(scaler.transform(x),y,sample_weight=weights)
            assert estimator.n_iter_.max()<1000,'Final fit failed to converge'
            apply_linear_readout(head.cv3[si][-1],ci,estimator.coef_[0],estimator.intercept_[0],scaler.mean_,scaler.scale_)
            actual=head.cv3[si][-1](torch.tensor(x[:128]).T[None,:,:,None])[0,ci,:,0].detach().numpy()
            expected=estimator.decision_function(scaler.transform(x[:128]))
            np.testing.assert_allclose(actual,expected,atol=2e-4,rtol=1e-4)
            result={'scale':si,'selected_C':chosen['C'],'cv':scores,'final_iterations':int(estimator.n_iter_.max()),
                    'positive_groups':item['positive_groups'],'features':x.shape[1]}
            results.append(result);print(result,flush=True)
    allowed={f'model.{len(net.model)-1}.cv3.{si}.2.{kind}' for si in range(3) for kind in ('weight','bias')}
    changed=[]
    for name,value in net.state_dict().items():
        if torch.equal(value,before[name]):continue
        assert name in allowed,name
        mask=torch.arange(len(value))!=ci
        assert torch.equal(value[mask],before[name][mask]),name
        changed.append(name)
    assert changed,'No output row changed'
    destination=OUT/'weights';destination.mkdir(exist_ok=False)
    model.save(str(destination/'best.pt'))
    reloaded=YOLO(str(destination/'best.pt')).model.float().eval()
    # Serialization half-rounding of original checkpoint is exact for untouched parameters.
    for name,value in reloaded.state_dict().items():
        if name not in allowed:assert torch.equal(value,before[name]),name
        else:
            mask=torch.arange(len(value))!=ci
            assert torch.equal(value[mask],before[name][mask]),name
    save(OUT/'training-results.json',{'scales':results,'changed_tensors':changed,'all_other_outputs_weights_identical':True,
        'weights_sha256':digest(destination/'best.pt'),'test_used':False,'calibration_used_for_training':False,
        'deployment_allowed':False})
    print({'checkpoint':str(destination/'best.pt'),'sha256':digest(destination/'best.pt')},flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('command',choices=('prepare','cache','fit'))
    args=parser.parse_args();globals()[args.command]()
