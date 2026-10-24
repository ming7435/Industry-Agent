"""Distinct crop evidence must not be manufactured by duplicate proposals."""
from scripts.yolo_consensus_experiment import consensus_boxes


def view(window, boxes):
    return {'kind':'tile','window':window,'defects':[
        {'label':label,'confidence':score,'bbox':box} for label,score,box in boxes]}


def test_duplicates_from_one_view_cannot_vote_as_two_observations():
    data=[view([0,0,100,100],[('dirt',.2,[20,20,30,30]),('dirt',.19,[20,20,30,30])])]
    assert consensus_boxes(data,(200,200),'dirt',2,.05,1.,False)==[]


def test_matching_weak_boxes_in_distinct_crops_are_retained_in_original_coordinates():
    data=[view([0,0,100,100],[('dirt',.2,[20,20,30,30])]),
          view([10,10,110,110],[('dirt',.1,[10,10,20,20])])]
    result=consensus_boxes(data,(200,200),'dirt',2,.05,1.,False)
    assert result==[{'label':'dirt','confidence':.2,'bbox':[20,20,30,30]}]


def test_same_crop_repeated_in_input_does_not_add_support():
    data=[view([0,0,100,100],[('dirt',.2,[20,20,30,30])])]*2
    assert consensus_boxes(data,(200,200),'dirt',2,.05,1.,False)==[]


def test_different_class_or_distant_box_is_not_support():
    data=[view([0,0,100,100],[('dirt',.2,[20,20,30,30])]),
          view([10,10,110,110],[('hair',.9,[10,10,20,20]),('dirt',.9,[50,50,60,60])])]
    assert consensus_boxes(data,(200,200),'dirt',2,.05,1.,False)==[]


def test_interior_cut_fragment_does_not_vote_but_real_image_boundary_can():
    data=[view([0,0,100,100],[('dirt',.2,[10,20,20,30])]),
          view([10,10,110,110],[('dirt',.2,[0,10,10,20])])]
    assert consensus_boxes(data,(200,200),'dirt',2,.05,1.,False)==[]
    assert consensus_boxes([view([0,0,100,100],[('dirt',.9,[0,20,10,30])])],(200,200),'dirt',2,.05,.8,False)


def test_low_support_scores_and_single_high_scores_follow_explicit_limits():
    data=[view([0,0,100,100],[('dirt',.85,[20,20,30,30])]),
          view([10,10,110,110],[('dirt',.02,[10,10,20,20])])]
    assert consensus_boxes(data,(200,200),'dirt',2,.05,1.,False)==[]
    assert len(consensus_boxes(data,(200,200),'dirt',2,.05,.8,False))==1
