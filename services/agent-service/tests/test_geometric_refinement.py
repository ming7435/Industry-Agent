"""Training assignment must not erase faint targets or use other-class labels."""
import torch
from scripts.train_yolo_geometric_refinement import geometric_targets, balanced_focal_loss


def test_geometric_targets_keep_good_boxes_ignore_fragments_and_reject_background():
    boxes=torch.tensor([[0.,0.,10.,10.],[0.,0.,6.,6.],[30.,30.,40.,40.]])
    scores,valid=geometric_targets(boxes,[(5,[0,0,10,10]),(4,[30,30,40,40])],[5,8])
    assert scores.tolist()==[[1,0],[0,0],[0,0]]
    assert valid.tolist()==[[True,True],[False,True],[True,True]]


def test_multiple_same_class_annotations_do_not_erase_prior_positives():
    boxes=torch.tensor([[0.,0.,10.,10.],[5.,0.,15.,10.]])
    scores,valid=geometric_targets(boxes,[(5,[0,0,10,10]),(5,[5,0,15,10])],[5,8])
    assert scores[:,0].tolist()==[1,1]
    assert valid[:,0].all()


def test_focal_gradient_raises_positive_lowers_background_and_ignores_ambiguous():
    logits=torch.zeros((1,3,2),requires_grad=True)
    targets=torch.tensor([[[1.,0.],[0.,0.],[0.,0.]]])
    valid=torch.tensor([[[True,True],[False,True],[True,True]]])
    loss=balanced_focal_loss(logits,targets,valid)
    loss.backward()
    assert torch.isfinite(loss)
    assert logits.grad[0,0,0]<0 and logits.grad[0,2,0]>0
    assert logits.grad[0,1,0]==0


def test_empty_foreground_still_teaches_background():
    logits=torch.zeros((1,2,2),requires_grad=True)
    loss=balanced_focal_loss(logits,torch.zeros_like(logits),torch.ones_like(logits,dtype=torch.bool))
    loss.backward()
    assert torch.isfinite(loss) and (logits.grad>0).all()


def test_global_normalization_is_invariant_to_missing_classes_in_small_batches():
    logits=torch.full((2,3,2),.7)
    targets=torch.zeros_like(logits);targets[0,:,0]=1;targets[1,:,1]=1
    valid=torch.ones_like(logits,dtype=torch.bool)
    norms=[1.5,1.5]
    joint=balanced_focal_loss(logits,targets,valid,normalizers=norms)
    separate=sum(balanced_focal_loss(logits[i:i+1],targets[i:i+1],valid[i:i+1],normalizers=norms) for i in range(2))/2
    torch.testing.assert_close(joint,separate)
    legacy=sum(balanced_focal_loss(logits[i:i+1],targets[i:i+1],valid[i:i+1]) for i in range(2))/2
    assert not torch.isclose(joint,legacy)
