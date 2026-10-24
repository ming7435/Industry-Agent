"""Pack complementary trained dirt features without lowering baseline dirt logits."""
from copy import deepcopy
from datetime import datetime,timezone
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1];sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.prepare_yolo_dirt_pairs import ACTIVE,read,save,digest
from scripts.yolo_dirt_augmentation import pack_max_classifier

PARENT=ROOT/'output/gear-yolo-dirt-scale-v12'
OUT=ROOT/'output/gear-yolo-dirt-preserve-v14'


def main():
    from scripts.evaluate_yolo import configure_inference_runtime
    torch=configure_inference_runtime(ACTIVE/'best.pt')
    from ultralytics import YOLO
    OUT.mkdir(exist_ok=False);(OUT/'training').mkdir()
    protocol=read(PARENT/'protocol.json')
    protocol.update(experiment='dirt_baseline_preservation_v14',created_at=datetime.now(timezone.utc).isoformat(),
        architecture='One shared backbone and box head. Only dirt logits use max(baseline,scale-matched epoch4); 15 other classes unchanged.',
        rationale='Fixed43 calibration shows complementary detections: baseline detects endface443/endface537, trained epoch4 detects endface110. Preserve previous logits rather than overwriting them. This rationale uses calibration, not final test.',
        candidate_epochs=[4],additional_training_epochs=0,training_parent=str(PARENT),
        training_parent_weights_sha256=digest(PARENT/'training/epoch4.pt'),
        selection='One fixed max-logit candidate; original fixed43/full188/test118 gates and consensus grid. No final test unless calibration passes.',
        stopping_policy='Evaluate fixed43 once; run full188 only if target gates pass. Freeze before118. Never deploy failed candidate.')
    save(OUT/'protocol.json',protocol);save(OUT/'baseline-deployment.json',read(PARENT/'baseline-deployment.json'))
    base=YOLO(str(ACTIVE/'best.pt'));base.model.float().eval();old=deepcopy(base.model)
    new=YOLO(str(PARENT/'training/epoch4.pt')).model.float().eval()
    for key,value in new.state_dict().items():
        if not key.startswith('model.23.cv3.'):
            assert torch.equal(value,old.state_dict()[key]),key
    for i,(a,b) in enumerate(zip(old.model[-1].cv3,new.model[-1].cv3)):
        base.model.model[-1].cv3[i]=pack_max_classifier(a,b,[5])
    for p in base.model.parameters():p.requires_grad_(False)
    torch.manual_seed(2026102304);x=torch.rand(1,3,544,640)
    keep=[i for i in range(20) if i!=9]
    with torch.inference_mode():a=old(x)[0];b=new(x)[0];c=base.model(x)[0]
    torch.testing.assert_close(c[:,keep],a[:,keep],atol=1e-5,rtol=1e-5)
    torch.testing.assert_close(c[:,9],torch.maximum(a[:,9],b[:,9]),atol=1e-5,rtol=1e-5)
    path=OUT/'training/packed-epoch4.pt';base.save(str(path))
    reloaded=YOLO(str(path)).model.float().eval()
    with torch.inference_mode():d=reloaded(x)[0]
    torch.testing.assert_close(d[:,keep],a[:,keep],atol=1e-5,rtol=1e-5)
    assert torch.all(d[:,9]>=a[:,9]-1e-6) and torch.isfinite(d).all()
    unfused=d;reloaded.fuse(verbose=False)
    with torch.inference_mode():fused=reloaded(x)[0]
    torch.testing.assert_close(fused,unfused,atol=2e-4,rtol=1e-4)
    save(path.with_suffix('.json'),{'weights_sha256':digest(path),'baseline_sha256':digest(ACTIVE/'best.pt'),
        'forward_maximum_verified':True,'reload_non_dirt_parity_verified':True,'shared_box_head_preserved':True,
        'baseline_dirt_not_reduced_after_serialization':True,'fused_parity_verified':True,
        'public_classes':16,'one_checkpoint':True,'standard_torch_and_yolo_modules':True,
        'source_weights':str(PARENT/'training/epoch4.pt'),'source_weights_sha256':digest(PARENT/'training/epoch4.pt')})
    print({'packed':str(path),'sha256':digest(path),'preserved_class_count':15,'public_classes':16},flush=True)


if __name__=='__main__':main()
