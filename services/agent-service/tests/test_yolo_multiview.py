"""Coordinate and duplicate handling for crop-assisted defect localization."""
from types import SimpleNamespace

from PIL import Image
import pytest

from app.vision.yolo_multiview import (MultiViewYoloDetector, crop_windows, extract_views,
                                     merge_views, parse_yolo_inference)

CONFIG = {'mode': 'full_and_tiles_v1', 'tile_fraction': .6, 'tile_confidence': .4, 'border_margin': 2}


def box(coords, confidence=.9, label='darkspot'):
    return {'bbox': coords, 'confidence': confidence, 'label': label}


def test_crop_boxes_map_to_original_pixels_and_duplicates_keep_highest_confidence():
    views = [
        {'kind': 'full', 'window': [0, 0, 640, 480], 'defects': [box([260, 200, 300, 240], .6)]},
        {'kind': 'tile', 'window': [256, 192, 640, 480], 'defects': [
            box([4, 8, 44, 48], .9), box([80, 80, 100, 100], .3), box([0, 8, 20, 30], .95)]},
    ]
    assert merge_views(views, (640, 480), .25, .45, CONFIG) == [box([260, 200, 300, 240], .9)]


def test_real_image_edges_are_preserved_and_different_classes_are_not_suppressed():
    views = [{'kind': 'tile', 'window': [0, 0, 384, 288], 'defects': [
        box([0, 0, 12, 15], .8), box([0, 0, 12, 15], .7, 'missing'), box([380, 5, 384, 20], .9)]}]
    assert merge_views(views, (640, 480), .25, .45, CONFIG) == [box([0, 0, 12, 15], .8), box([0, 0, 12, 15], .7, 'missing')]


def test_user_confidence_remains_a_minimum_for_every_view():
    views = [{'kind': 'tile', 'window': [0, 0, 384, 288], 'defects': [box([5, 5, 12, 15], .6)]}]
    assert merge_views(views, (640, 480), .7, .45, CONFIG) == []


def test_all_windows_fit_original_frame_and_small_images_use_one_pass():
    assert crop_windows((640, 480), .6) == [(0, 0, 384, 288), (256, 0, 640, 288), (0, 192, 384, 480), (256, 192, 640, 480)]
    calls = []
    def predict(image, confidence, iou):
        calls.append((image.size, confidence, iou))
        return {'defects': []}
    with Image.new('RGB', (70, 50)) as image:
        views = extract_views(SimpleNamespace(predict=predict), image, .25, .45, CONFIG)
    assert len(views) == 1 and calls == [((70, 50), .25, .45)]


def test_crop_failure_cannot_return_partial_or_clear_result(tmp_path, monkeypatch):
    weights = tmp_path / 'fake.pt'
    weights.write_bytes(b'not loaded')
    detector = MultiViewYoloDetector(str(weights), config=CONFIG)
    calls = []
    def predict(image, confidence, iou):
        calls.append(image.size)
        if len(calls) == 2:
            raise RuntimeError('crop failure')
        return {'defects': []}
    monkeypatch.setattr(detector.detector, 'predict', predict)
    with Image.new('RGB', (640, 480)) as image, pytest.raises(RuntimeError, match='crop failure'):
        detector.predict(image)
    assert len(calls) == 2


@pytest.mark.parametrize('invalid', [False, {'mode': 'arbitrary'}, {**CONFIG, 'tile_fraction': 0},
    {**CONFIG, 'tile_confidence': float('nan')}, {**CONFIG, 'border_margin': True}, {**CONFIG, 'url': 'untrusted'}])
def test_invalid_inference_configuration_is_rejected(invalid):
    with pytest.raises(ValueError):
        parse_yolo_inference(invalid)


FINE = {**CONFIG, 'mode': 'fine_defects_v1', 'small_tile_fraction': .4, 'detail_grid_size': 3,
        'detail_labels': ['dirt', 'hair'],
        'tile_confidence': .03, 'class_confidences': {'dirt': .15, 'hair': .25, 'darkspot': .5}}


def test_detail_views_use_fixed_grid_and_only_target_classes():
    calls = []
    def predict(image, confidence, iou):
        calls.append(image.size)
        return {'defects': [box([5, 5, 10, 10], .9, label) for label in ('dirt', 'hair', 'darkspot')]}
    with Image.new('RGB', (640, 480)) as image:
        views = extract_views(SimpleNamespace(predict=predict), image, .03, .45, FINE)
    assert calls == [(640, 480)] + [(384, 288)]*4 + [(256, 192)]*9
    assert views[-1]['window'] == [384, 288, 640, 480]
    assert {d['label'] for d in views[-1]['defects']} == {'dirt', 'hair'}


def test_class_thresholds_and_global_minimum_control_detail_false_boxes():
    views = [{'kind': 'detail', 'window': [384, 288, 640, 480], 'defects': [
        box([8, 10, 20, 25], .2, 'dirt'), box([40, 40, 60, 60], .2, 'hair'),
        box([70, 70, 90, 90], .9, 'darkspot')]}]
    assert merge_views(views, (640, 480), .03, .45, FINE) == [box([392, 298, 404, 313], .2, 'dirt')]
    assert merge_views(views, (640, 480), .3, .45, FINE) == []


@pytest.mark.parametrize('changes', [{'small_tile_fraction': float('nan')}, {'small_tile_fraction': .1},
    {'class_confidences': {}}, {'class_confidences': {'dirt': True}}, {'class_confidences': {'hair': -.2}}])
def test_detail_settings_fail_closed(changes):
    with pytest.raises(ValueError):
        parse_yolo_inference({**FINE, **changes})


def test_hair_shape_filter_preserves_dirt_and_does_not_resurrect_suppressed_fragments():
    config = parse_yolo_inference({**FINE, 'hair_min_aspect_ratio': 1.5})
    views = [{'kind': 'full', 'window': [0,0,640,480], 'defects': [
        box([10,10,30,30], .95, 'hair'), box([10,10,30,22], .8, 'hair'),
        box([50,10,56,40], .9, 'hair'), box([70,10,90,30], .7, 'dirt')]}]
    assert merge_views(views,(640,480),.03,.45,config) == [
        box([50,10,56,40],.9,'hair'), box([70,10,90,30],.7,'dirt')]


@pytest.mark.parametrize('aspect', [True, 0, 4, float('nan'), '1.5'])
def test_invalid_hair_shape_filter_fails_closed(aspect):
    with pytest.raises(ValueError,match='aspect'):
        parse_yolo_inference({**FINE, 'hair_min_aspect_ratio': aspect})


def test_hair_containment_dedup_keeps_partial_overlap_other_classes_and_stronger_fragments():
    config = parse_yolo_inference({**FINE, 'hair_suppress_contained': True})
    large = box([10,10,110,50],.8,'hair')
    weak_fragment = box([20,20,30,30],.5,'hair')
    strong_fragment = box([40,20,50,30],.9,'hair')
    partial = box([100,20,130,30],.6,'hair')
    dirt = box([20,20,30,30],.7,'dirt')
    views = [{'kind':'full','window':[0,0,640,480],
              'defects':[large,weak_fragment,strong_fragment,partial,dirt]}]
    assert merge_views(views,(640,480),.03,.45,config) == [strong_fragment,large,dirt,partial]
    assert weak_fragment in merge_views(views,(640,480),.03,.45,FINE)


def test_hair_containment_setting_requires_a_boolean():
    with pytest.raises(ValueError,match='containment'):
        parse_yolo_inference({**FINE, 'hair_suppress_contained': 1})
