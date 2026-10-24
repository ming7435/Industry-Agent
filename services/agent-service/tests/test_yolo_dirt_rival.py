import pytest
from scripts.yolo_consensus_experiment import target_rows


@pytest.mark.parametrize('rival,box,expected',[(.9,[10,10,30,30],0),(.5,[10,10,30,30],1),(.9,[60,60,80,80],1)])
def test_dirt_seed_competition_rejects_only_a_higher_overlapping_other_class(rival,box,expected):
    row={'sample_id':'example','ground_truth':[], 'views':[{'kind':'full','window':[0,0,100,100],
        'defects':[{'label':'dirt','confidence':.7,'bbox':[10,10,30,30]},
                   {'label':'darkspot','confidence':rival,'bbox':box}]}]}
    params={'min_views':1,'support_floor':.01,'single_floor':1.,'fuse':False,'aspect':1.,'rival_veto':True}
    assert len(target_rows([row],'dirt',params)[0]['predictions'])==expected
    # Existing configurations and the frozen hair policy keep their behavior.
    assert len(target_rows([row],'dirt',{**params,'rival_veto':False})[0]['predictions'])==1
