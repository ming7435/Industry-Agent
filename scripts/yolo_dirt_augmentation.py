"""Auditable train-only stain synthesis and isolated classifier packing."""
def apply_stain(image, stamp, position, strength=1.):
    import numpy as np
    from PIL import Image
    x,y=position;stamp=np.asarray(stamp,dtype=np.float32)
    if stamp.ndim!=2 or not np.isfinite(stamp).all() or np.any(stamp<0) or not 0<strength<=3:
        raise ValueError('Expected finite nonnegative stain opacity')
    h,w=stamp.shape
    if x<0 or y<0 or x+w>image.width or y+h>image.height:
        raise ValueError('Stain must fit entirely inside the image')
    before=np.asarray(image.convert('RGB')).copy();after=before.copy()
    after[y:y+h,x:x+w]=np.clip(before[y:y+h,x:x+w].astype(np.float32)-stamp[:,:,None]*strength,0,255).round().astype(np.uint8)
    changed=np.any(before!=after,axis=2);ys,xs=np.where(changed)
    if not len(xs):raise ValueError('Stain has no visible support')
    return Image.fromarray(after),[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]


def pack_classifier(original, refined, target_indices):
    from copy import deepcopy
    import torch
    from torch import nn
    result=deepcopy(original)
    a,b=original[0][0],refined[0][0];channels=a.conv.in_channels
    assert b.conv.in_channels==channels and a.conv.groups==b.conv.groups==channels
    ma,mb=a.conv.out_channels//channels,b.conv.out_channels//channels
    order_a=torch.arange(channels*(ma+mb)).reshape(channels,ma+mb)[:,:ma].flatten()
    order_b=torch.arange(channels*(ma+mb)).reshape(channels,ma+mb)[:,ma:].flatten()

    def conv(source,cin,cout,groups=1):
        return nn.Conv2d(cin,cout,source.kernel_size,source.stride,source.padding,source.dilation,
            groups=groups,bias=source.bias is not None,padding_mode=source.padding_mode)

    def bn(a,b,indices=None):
        out=nn.BatchNorm2d(a.num_features+b.num_features,eps=a.eps,momentum=a.momentum)
        for key in ('weight','bias','running_mean','running_var'):
            target=getattr(out,key)
            if indices is None:target.copy_(torch.cat((getattr(a,key),getattr(b,key))))
            else:
                target[indices[0]]=getattr(a,key);target[indices[1]]=getattr(b,key)
        out.num_batches_tracked.copy_(a.num_batches_tracked)
        return out

    with torch.no_grad():
        result[0][0].conv=conv(a.conv,channels,channels*(ma+mb),channels)
        result[0][0].conv.weight[order_a]=a.conv.weight
        result[0][0].conv.weight[order_b]=b.conv.weight
        result[0][0].bn=bn(a.bn,b.bn,(order_a,order_b))
        a,b=original[0][1],refined[0][1];wa,wb=a.conv.out_channels,b.conv.out_channels
        result[0][1].conv=conv(a.conv,channels*(ma+mb),wa+wb)
        result[0][1].conv.weight.zero_()
        result[0][1].conv.weight[:wa,order_a]=a.conv.weight
        result[0][1].conv.weight[wa:,order_b]=b.conv.weight
        result[0][1].bn=bn(a.bn,b.bn)
        a,b=original[1][0],refined[1][0]
        assert a.conv.groups==a.conv.in_channels==a.conv.out_channels==wa
        assert b.conv.groups==b.conv.in_channels==b.conv.out_channels==wb
        result[1][0].conv=conv(a.conv,wa+wb,wa+wb,wa+wb)
        result[1][0].conv.weight.copy_(torch.cat((a.conv.weight,b.conv.weight)))
        result[1][0].bn=bn(a.bn,b.bn)
        a,b=original[1][1],refined[1][1]
        result[1][1].conv=conv(a.conv,wa+wb,wa+wb);result[1][1].conv.weight.zero_()
        result[1][1].conv.weight[:wa,:wa].copy_(a.conv.weight)
        result[1][1].conv.weight[wa:,wa:].copy_(b.conv.weight)
        result[1][1].bn=bn(a.bn,b.bn)
        a,b=original[2],refined[2];assert a.out_channels==b.out_channels
        result[2]=conv(a,wa+wb,a.out_channels);result[2].weight.zero_()
        for ci in range(a.out_channels):
            source,offset,width=(b,wa,wb) if ci in target_indices else (a,0,wa)
            result[2].weight[ci,offset:offset+width].copy_(source.weight[ci])
            result[2].bias[ci].copy_(source.bias[ci])
    return result.eval()


def pack_max_classifier(original,refined,target_indices):
    """Keep old class logits and take max(old,new) only for selected classes.

    max(a,b)=a+ReLU(b-a), expressed with ordinary Conv2d/PReLU modules so
    inference still uses one standard checkpoint with its original class count.
    """
    import torch
    from torch import nn
    packed=pack_classifier(original,refined,[])
    a,b=original[2],refined[2];count=a.out_channels
    assert len(set(target_indices))==len(target_indices)
    assert all(0<=ci<count for ci in target_indices)
    hidden=count+len(target_indices)
    difference=nn.Conv2d(a.in_channels+b.in_channels,hidden,1)
    gate=nn.PReLU(hidden,init=1.)
    combine=nn.Conv2d(hidden,count,1)
    with torch.no_grad():
        difference.weight.zero_();difference.bias.zero_()
        difference.weight[:count].copy_(packed[2].weight)
        difference.bias[:count].copy_(a.bias)
        combine.weight.zero_();combine.bias.zero_()
        for ci in range(count):combine.weight[ci,ci,0,0]=1.
        for j,ci in enumerate(target_indices):
            channel=count+j
            difference.weight[channel,:a.in_channels].copy_(-a.weight[ci])
            difference.weight[channel,a.in_channels:].copy_(b.weight[ci])
            difference.bias[channel].copy_(b.bias[ci]-a.bias[ci])
            gate.weight[channel]=0.
            combine.weight[ci,channel,0,0]=1.
    packed[2]=nn.Sequential(difference,gate,combine)
    return packed.eval()
