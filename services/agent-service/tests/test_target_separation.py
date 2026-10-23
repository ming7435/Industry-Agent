import pytest
from scripts.train_yolo_target_separation import training_schedule


def test_training_schedule_replays_whole_targets_without_promoting_background_or_using_calibration():
    kinds=[('whole','real_whole',['dirt']),('crop','native_target_crop',['hair']),
           ('negative','mined_texture_edge_negative',[]),('other','real_whole',['darkspot'])]
    rows={name:{'split':'train','source_split':'train','kind':kind,
                'ground_truth':[{'label':label} for label in labels]} for name,kind,labels in kinds}
    samples=[{'sample_id':name,'source_split':'train'} for name,_,_ in kinds]
    schedule=training_schedule(samples,rows)
    assert [s['sample_id'] for s in schedule].count('whole')==6
    assert len(schedule)==9 and set(s['sample_id'] for s in schedule)==set(rows)
    rows['whole']['source_split']='calibration'
    with pytest.raises(AssertionError):training_schedule(samples,rows)
