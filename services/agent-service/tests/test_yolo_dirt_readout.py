import numpy as np
import torch
from scripts.train_yolo_dirt_readout import apply_linear_readout,group_balanced_weights


def test_standardized_linear_classifier_exports_to_one_convolution_row():
    layer=torch.nn.Conv2d(3,4,1)
    before_weight=layer.weight.detach().clone();before_bias=layer.bias.detach().clone()
    coefficient=np.array([2.,-1.,.5]);mean=np.array([1.,2.,3.]);scale=np.array([2.,4.,.5]);intercept=.7
    apply_linear_readout(layer,1,coefficient,intercept,mean,scale)
    x=torch.tensor([[[[2.]],[[4.]],[[5.]]]])
    actual=layer(x)[0,1,0,0].item()
    expected=float(((x.flatten().numpy()-mean)/scale@coefficient)+intercept)
    assert np.isclose(actual,expected,atol=1e-6)
    assert torch.equal(layer.weight[[0,2,3]],before_weight[[0,2,3]])
    assert torch.equal(layer.bias[[0,2,3]],before_bias[[0,2,3]])


def test_repeated_crops_do_not_increase_one_source_groups_total_training_weight():
    y=np.array([1,1,1,0,0,0,0]);groups=np.array(['a','a','b','a','c','c','d'])
    weights=group_balanced_weights(y,groups)
    assert np.isclose(weights[y==1].sum(),.5) and np.isclose(weights[y==0].sum(),.5)
    assert np.isclose(weights[(y==1)&(groups=='a')].sum(),weights[(y==1)&(groups=='b')].sum())
    assert np.isclose(weights[(y==0)&(groups=='c')].sum(),weights[(y==0)&(groups=='d')].sum())
