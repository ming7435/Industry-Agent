from pathlib import Path
import sys

import pytest

ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT))
from scripts.prepare_yolo_native_hard_examples import transform_truth
from scripts.train_yolo_fine_defects import crop_truth


@pytest.mark.parametrize('flip',[False,True])
@pytest.mark.parametrize('turns',[0,1,2,3])
def test_dihedral_annotation_tracks_rectangular_image_pixels(flip,turns):
    import numpy as np
    from PIL import Image,ImageOps
    pixels=np.zeros((7,11),dtype=np.uint8)
    pixels[1:5,2:6]=255
    image=Image.fromarray(pixels)
    if flip:
        image=ImageOps.mirror(image)
    if turns:
        image=image.transpose({1:Image.Transpose.ROTATE_270,2:Image.Transpose.ROTATE_180,3:Image.Transpose.ROTATE_90}[turns])
    ys,xs=np.where(np.asarray(image)>0)
    actual=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]
    truth=[{'label':'hair','bbox':[2,1,6,5]}]
    transformed=transform_truth(truth,11,7,flip,turns)
    assert transformed==[{'label':'hair','bbox':actual}]
    assert truth==[{'label':'hair','bbox':[2,1,6,5]}]


def test_negative_crop_rejects_partial_defects_and_halo():
    truth=[{'label':'dirt','bbox':[20,30,40,50]}]
    assert crop_truth(truth,[0,0,25,60]) is None
    assert crop_truth(truth,[0,0,60,60])==truth
    expanded=[{'label':'dirt','bbox':[12,22,48,58]}]
    assert crop_truth(truth,[0,0,17,60])==[]
    assert crop_truth(expanded,[0,0,17,60]) is None


def test_preservation_excludes_targets_but_keeps_other_labels_and_negative_images():
    import torch
    from scripts.train_yolo_native_hard_examples import preservation_mask
    features=[torch.empty(3,1,n,n) for n in (80,40,20)]
    labels={'batch_idx':torch.tensor([0.,1.]),'cls':torch.tensor([[5.],[4.]]),
            'bboxes':torch.tensor([[.5,.5,.1,.1],[.5,.5,.1,.1]])}
    weights=preservation_mask(features,labels,[5,8],torch)
    # Annotation is [288,288,352,352]; P3 anchor (316,316) is inside.
    inside=39*80+39
    assert weights[0,0,inside]==0
    assert weights[0,0,0]==1
    assert torch.all(weights[1:]==1)
    assert 0<weights[0].sum()<weights.shape[-1]
