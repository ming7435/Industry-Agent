"""Pack original and refined class channels into one standard YOLO classifier.

The model shares its original backbone, neck, and box head. Block-diagonal
convolutions preserve the original fourteen classes and use the trained dirt /
hair channels. No custom runtime module, second model, or routing lookup is used.
"""
import argparse
from copy import deepcopy
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from scripts.train_yolo_fine_defects import BASE, digest, save


def pack_branch(original, refined, targets):
    import torch
    from torch import nn
    result = deepcopy(original)

    def bn(a,b,interleave=False):
        output = nn.BatchNorm2d(a.num_features+b.num_features, eps=a.eps, momentum=a.momentum)
        with torch.no_grad():
            for name in ('weight','bias','running_mean','running_var'):
                av,bv = getattr(a,name),getattr(b,name)
                value = torch.stack((av,bv),1).flatten() if interleave else torch.cat((av,bv))
                getattr(output,name).copy_(value)
            output.num_batches_tracked.copy_(a.num_batches_tracked)
        return output

    def convolution(a,in_channels,out_channels,groups=1):
        return nn.Conv2d(in_channels,out_channels,a.kernel_size,a.stride,a.padding,a.dilation,
                         groups=groups,bias=a.bias is not None,padding_mode=a.padding_mode)

    with torch.no_grad():
        # Both first depthwise filters read the same input channel; group order
        # interleaves original/refined responses for each shared feature channel.
        a,b = original[0][0],refined[0][0]
        assert a.conv.groups == a.conv.in_channels == a.conv.out_channels
        c = a.conv.in_channels
        result[0][0].conv = convolution(a.conv,c,2*c,c)
        result[0][0].conv.weight.copy_(torch.stack((a.conv.weight,b.conv.weight),1).reshape_as(result[0][0].conv.weight))
        result[0][0].bn = bn(a.bn,b.bn,True)
        a,b = original[0][1],refined[0][1]
        width = a.conv.out_channels
        result[0][1].conv = convolution(a.conv,2*c,2*width)
        result[0][1].conv.weight.zero_()
        result[0][1].conv.weight[:width,0::2].copy_(a.conv.weight)
        result[0][1].conv.weight[width:,1::2].copy_(b.conv.weight)
        result[0][1].bn = bn(a.bn,b.bn)
        a,b = original[1][0],refined[1][0]
        assert a.conv.groups == width and a.conv.out_channels == width
        result[1][0].conv = convolution(a.conv,2*width,2*width,2*width)
        result[1][0].conv.weight.copy_(torch.cat((a.conv.weight,b.conv.weight)))
        result[1][0].bn = bn(a.bn,b.bn)
        a,b = original[1][1],refined[1][1]
        assert a.conv.in_channels == a.conv.out_channels == width
        result[1][1].conv = convolution(a.conv,2*width,2*width)
        result[1][1].conv.weight.zero_()
        result[1][1].conv.weight[:width,:width].copy_(a.conv.weight)
        result[1][1].conv.weight[width:,width:].copy_(b.conv.weight)
        result[1][1].bn = bn(a.bn,b.bn)
        a,b = original[2],refined[2]
        result[2] = convolution(a,2*width,a.out_channels)
        result[2].weight.zero_()
        for index in range(a.out_channels):
            src,offset = (b,width) if index in targets else (a,0)
            result[2].weight[index,offset:offset+width].copy_(src.weight[index])
            result[2].bias[index].copy_(src.bias[index])
    return result.eval()


def export(refined_path, output, classifier_transfer=False):
    os.environ.update(ULTRALYTICS_SAFE_LOAD='1',YOLO_AUTOINSTALL='false',YOLO_OFFLINE='true')
    import torch
    from ultralytics import YOLO
    torch.set_num_threads(2)
    assert not output.exists()
    baseline = YOLO(str(BASE / 'best.pt'),task='detect')
    refined = YOLO(str(refined_path),task='detect')
    assert baseline.names == refined.names
    targets = [k for k,v in baseline.names.items() if v in ('dirt','hair')]
    keep = [i for i in baseline.names if i not in targets]
    a,b = baseline.model.state_dict(), refined.model.state_dict()
    discarded = []
    for key,value in a.items():
        if not key.startswith('model.23.cv3.'):
            if not torch.equal(value,b[key]):
                assert classifier_transfer, f'Changed shared parameter: {key}'
                discarded.append(key)
                with torch.no_grad():
                    b[key].copy_(value)
    original = deepcopy(baseline.model).eval()
    refined.model.eval()
    baseline.model.eval()
    for index,(a,b) in enumerate(zip(original.model[-1].cv3,refined.model.model[-1].cv3)):
        baseline.model.model[-1].cv3[index] = pack_branch(a,b,targets)
    # Check real forward tensors before saving, including shared box coordinates.
    torch.manual_seed(20261023)
    with torch.no_grad():
        inputs = torch.rand(1,3,320,320)
        old = original(inputs)[0]
        fine = refined.model(inputs)[0]
        combined = baseline.model(inputs)[0]
        assert torch.allclose(combined[:,:4],old[:,:4],atol=1e-5,rtol=1e-6)
        assert torch.allclose(combined[:,[i+4 for i in keep]],old[:,[i+4 for i in keep]],atol=1e-5,rtol=1e-5)
        assert torch.allclose(combined[:,[i+4 for i in targets]],fine[:,[i+4 for i in targets]],atol=1e-5,rtol=1e-5)
    baseline.save(str(output))
    reloaded = YOLO(str(output),task='detect').model.eval()
    with torch.no_grad():
        result = reloaded(inputs)[0]
        assert torch.allclose(result,combined,atol=1e-5,rtol=1e-5)
    report = {'weights_sha256':digest(output),'baseline_sha256':digest(BASE / 'best.pt'),
              'refined_sha256':digest(refined_path),'one_shared_backbone':True,'custom_runtime_modules':False,
              'preserved_classes':[baseline.names[i] for i in keep],
              'refined_classes':[baseline.names[i] for i in targets],
              'forward_parity_verified':True,'reload_parity_verified':True,
              'all_non_classifier_parameters_unchanged':True,
              'classifier_transfer':classifier_transfer,
              'discarded_training_checkpoint_shared_tensors':discarded}
    save(output.with_suffix('.json'),report)
    print(report,flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--weights',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--classifier-transfer',action='store_true',
                        help='Transfer only classifier tensors; explicitly discard trained shared features and box head.')
    args = parser.parse_args()
    export(args.weights,args.output,args.classifier_transfer)
