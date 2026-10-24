import numpy as np
import pytest
import torch
from PIL import Image
from ultralytics.nn.modules import Conv
from scripts.yolo_dirt_augmentation import apply_stain,pack_classifier


def test_stain_pair_changes_only_annotated_region_and_reports_actual_support():
    clean=Image.fromarray(np.full((40,50,3),160,dtype=np.uint8))
    stamp=np.zeros((8,10),dtype=np.float32);stamp[2:6,3:8]=12
    altered,box=apply_stain(clean,stamp,(20,10))
    assert box==[23,12,28,16]
    delta=np.asarray(clean).astype(int)-np.asarray(altered).astype(int)
    assert np.all(delta[12:16,23:28]==12)
    delta[12:16,23:28]=0
    assert not delta.any()
    assert np.asarray(clean).min()==160


def test_stain_rejects_partial_out_of_frame_placement():
    with pytest.raises(ValueError):
        apply_stain(Image.new('RGB',(10,10)),np.ones((8,8))*20,(5,5))


def branch(channels,width,multiplier):
    return torch.nn.Sequential(
        torch.nn.Sequential(Conv(channels,channels*multiplier,3,g=channels),Conv(channels*multiplier,width,1)),
        torch.nn.Sequential(Conv(width,width,3,g=width),Conv(width,width,1)),
        torch.nn.Conv2d(width,4,1)).eval()


@pytest.mark.parametrize('old_multiplier,new_multiplier,old_width,new_width',[(1,1,12,12),(2,1,24,12)])
def test_packing_preserves_all_other_classes_and_uses_only_target_branch(old_multiplier,new_multiplier,old_width,new_width):
    torch.manual_seed(19)
    old=branch(8,old_width,old_multiplier);new=branch(8,new_width,new_multiplier)
    combined=pack_classifier(old,new,[1]);x=torch.rand(2,8,17,19)
    with torch.inference_mode():a,b,c=old(x),new(x),combined(x)
    torch.testing.assert_close(c[:,[0,2,3]],a[:,[0,2,3]],atol=1e-6,rtol=1e-5)
    torch.testing.assert_close(c[:,1],b[:,1],atol=1e-6,rtol=1e-5)


def test_training_pushes_dirt_up_and_background_down_without_penalizing_ignored_fragments():
    from scripts.train_yolo_dirt_pairs import dirt_loss
    logits=torch.tensor([[-3.,-2.,2.]],requires_grad=True)
    targets=torch.tensor([[1.,0.,0.]])
    valid=torch.tensor([[True,True,False]])
    loss=dirt_loss(logits,targets,valid,logits.detach())
    loss.backward()
    assert logits.grad[0,0]<0
    assert logits.grad[0,1]>0
    assert logits.grad[0,2]==0


def test_target_distillation_preserves_confident_dirt_that_is_not_a_top_three_anchor():
    from scripts.train_yolo_dirt_pairs import dirt_loss
    logits=torch.tensor([[-2.,-2.]],requires_grad=True)
    target=torch.zeros_like(logits);valid=torch.tensor([[False,True]])
    teacher=torch.tensor([[2.,-2.]])
    dirt_loss(logits,target,valid,teacher,positive_teacher_weight=.5).backward()
    assert logits.grad[0,0]<0
    assert logits.grad[0,1]>0


def test_maximum_packing_retains_old_dirt_and_other_classes_and_accepts_new_dirt():
    from scripts.yolo_dirt_augmentation import pack_max_classifier
    torch.manual_seed(27)
    old=branch(8,24,2);new=branch(8,12,1)
    combined=pack_max_classifier(old,new,[1]);x=torch.randn(2,8,17,19)
    with torch.inference_mode():a,b,c=old(x),new(x),combined(x)
    torch.testing.assert_close(c[:,[0,2,3]],a[:,[0,2,3]],atol=1e-6,rtol=1e-5)
    torch.testing.assert_close(c[:,1],torch.maximum(a[:,1],b[:,1]),atol=1e-6,rtol=1e-5)
    assert all(type(m).__module__.startswith(('torch.','ultralytics.')) for m in combined.modules())
