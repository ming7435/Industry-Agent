from copy import deepcopy
import pytest


def example():
    gates={'dirt_tp_min':2,'hair_tp_min':3,'overall_tp_min':151,'overall_class_fp_max':84,
           'overall_spatial_fp_max':74,'overall_f1_min':.5451263537906137,'target_fp_max':{'dirt':0,'hair':2}}
    metrics={'class_and_position':{'tp':151,'fp':84,'f1':.55,'by_class':{'dirt':{'tp':2,'fp':0},'hair':{'tp':3,'fp':2}}},
             'spatial':{'fp':74}}
    return metrics,gates


def test_promotion_requires_every_fixed_gate():
    from scripts.evaluate_yolo_dirt_pairs import passes_gates
    metrics,gates=example()
    assert passes_gates(metrics,gates)
    failures=[('dirt','tp',1),('hair','tp',2),('dirt','fp',1),('hair','fp',3),
              ('overall','tp',150),('overall','fp',85),('overall','f1',.54),('spatial','fp',75)]
    for group,key,value in failures:
        changed=deepcopy(metrics)
        if group=='overall':changed['class_and_position'][key]=value
        elif group=='spatial':changed['spatial'][key]=value
        else:changed['class_and_position']['by_class'][group][key]=value
        assert not passes_gates(changed,gates),(group,key)


@pytest.mark.parametrize('changed',['weights','selection','protocol'])
def test_frozen_test_rejects_changed_inputs(tmp_path,changed):
    from scripts.evaluate_yolo_dirt_pairs import validate_freeze
    from scripts.prepare_yolo_dirt_pairs import digest,save
    paths={key:tmp_path/(key+'.json') for key in ('weights','selection','protocol')}
    for path in paths.values():path.write_text('{}')
    snapshot={key+'_sha256':digest(path) for key,path in paths.items()}
    save(tmp_path/'test-freeze.json',snapshot)
    validate_freeze(tmp_path/'test-freeze.json',paths['weights'],paths['selection'],paths['protocol'])
    paths[changed].write_text('{"changed":true}')
    with pytest.raises(AssertionError):
        validate_freeze(tmp_path/'test-freeze.json',paths['weights'],paths['selection'],paths['protocol'])
