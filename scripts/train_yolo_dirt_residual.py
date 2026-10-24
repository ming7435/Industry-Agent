"""Choose a conservative dirt readout correction using training-group CV only."""
from datetime import datetime,timezone
from pathlib import Path
import sys
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.train_yolo_dirt_readout import OUT as PARENT,group_balanced_weights,ACTIVE
from scripts.train_yolo_fine_defects import read,save,digest

OUT=ROOT/'output/gear-yolo-dirt-residual-v10'


def main():
    from scripts.evaluate_yolo import configure_inference_runtime
    torch=configure_inference_runtime(ACTIVE/'best.pt')
    from ultralytics import YOLO
    from sklearn.model_selection import StratifiedGroupKFold
    from sklearn.preprocessing import StandardScaler
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import roc_auc_score
    from threadpoolctl import threadpool_limits
    OUT.mkdir(exist_ok=False)
    protocol=read(PARENT/'protocol.json');alphas=[0.,.05,.1,.2,.4,.6]
    protocol.update(experiment='dirt_residual_readout_v10',created_at=datetime.now(timezone.utc).isoformat(),
        rationale='Preserve the original background suppression; choose per-scale interpolation of original and refitted dirt logits using training-group CV.',
        residual_alpha_grid=alphas,parent_training_results_sha256=digest(PARENT/'training-results.json'),
        stopping_policy='One training-CV-selected correction; fixed43 real calibration triage before full188. Frozen test118 only after all calibration gates pass.')
    save(OUT/'protocol.json',protocol);save(OUT/'baseline-deployment.json',read(PARENT/'baseline-deployment.json'))
    cache=read(PARENT/'training-cache.json');previous=read(PARENT/'training-results.json')
    model=YOLO(str(ACTIVE/'best.pt'));net=model.model.float().eval()
    fitted=YOLO(str(PARENT/'weights/best.pt')).model.float().eval()
    before={k:v.clone() for k,v in net.state_dict().items()};results=[];ci=5
    cv=protocol['cross_validation']
    with threadpool_limits(limits=4):
        for si,item in enumerate(cache['files']):
            layer=net.model[-1].cv3[si][-1]
            if 'selected_C' not in previous['scales'][si]:
                results.append({'scale':si,'alpha':0.,'reason':'Insufficient positive source groups'});continue
            path=PARENT/item['path'];assert digest(path)==item['sha256']
            data=np.load(path);x=data['x'];y=data['y'];groups=data['groups']
            original_w=layer.weight[ci,:,0,0].detach().numpy().copy();original_b=layer.bias[ci].item()
            scores={a:[] for a in alphas}
            folds=StratifiedGroupKFold(cv['folds'],shuffle=True,random_state=cv['seed']).split(x,y,groups)
            for train,val in folds:
                assert set(groups[train]).isdisjoint(set(groups[val]))
                weights=group_balanced_weights(y[train],groups[train])*len(train)
                scaler=StandardScaler().fit(x[train],sample_weight=weights)
                estimator=LogisticRegression(C=previous['scales'][si]['selected_C'],max_iter=1000,tol=1e-4,solver='lbfgs')
                estimator.fit(scaler.transform(x[train]),y[train],sample_weight=weights)
                assert estimator.n_iter_.max()<1000
                old=x[val]@original_w+original_b
                new=estimator.decision_function(scaler.transform(x[val]))
                for a in alphas:
                    scores[a].append(float(roc_auc_score(y[val],old*(1-a)+new*a,
                        sample_weight=group_balanced_weights(y[val],groups[val]),max_fpr=.01)))
            alpha=max(alphas,key=lambda a:(np.mean(scores[a]),-a))
            with torch.no_grad():
                target=fitted.model[-1].cv3[si][-1]
                layer.weight[ci].lerp_(target.weight[ci],alpha)
                layer.bias[ci].lerp_(target.bias[ci],alpha)
            result={'scale':si,'alpha':alpha,'C':previous['scales'][si]['selected_C'],
                    'cv':[{'alpha':a,'fold_scores':scores[a],'mean':float(np.mean(scores[a]))} for a in alphas]}
            results.append(result);print(result,flush=True)
    allowed={f'model.23.cv3.{si}.2.{kind}' for si in range(3) for kind in ('weight','bias')}
    changed=[]
    for key,value in net.state_dict().items():
        if torch.equal(value,before[key]):continue
        assert key in allowed
        mask=torch.arange(len(value))!=ci
        assert torch.equal(value[mask],before[key][mask]);changed.append(key)
    (OUT/'weights').mkdir();model.save(str(OUT/'weights/best.pt'))
    loaded=YOLO(str(OUT/'weights/best.pt')).model.float().eval()
    for key,value in loaded.state_dict().items():
        if key not in allowed:assert torch.equal(value,before[key]),key
        else:
            mask=torch.arange(len(value))!=ci
            assert torch.equal(value[mask],before[key][mask]),key
    # Direct forward parity, beyond parameter comparison, on a fixed input.
    baseline=YOLO(str(ACTIVE/'best.pt')).model.float().eval()
    torch.manual_seed(20261023);image=torch.rand(1,3,640,640)
    with torch.inference_mode():
        old=baseline(image)[0];new=loaded(image)[0]
    keep=[i for i in range(old.shape[1]) if i!=4+ci]
    torch.testing.assert_close(old[:,keep],new[:,keep],atol=0,rtol=0)
    assert digest(ACTIVE/'best.pt')==protocol['initial_weights_sha256']
    save(OUT/'training-results.json',{'scales':results,'changed_tensors':changed,
        'all_other_outputs_weights_identical':True,'non_dirt_and_box_forward_exactly_equal':True,
        'weights_sha256':digest(OUT/'weights/best.pt'),'test_used':False,
        'calibration_used_for_training':False,'deployment_allowed':False})
    save(OUT/'training-cache.json',{**cache,'parent':str(PARENT),'source_protocol_sha256':cache['protocol_sha256']})
    print({'checkpoint':str(OUT/'weights/best.pt'),'changed_tensors':changed},flush=True)


if __name__=='__main__':main()
