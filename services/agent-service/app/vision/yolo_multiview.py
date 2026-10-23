"""Full-image YOLO plus overlapping crops for small-defect localization."""
from copy import deepcopy
import math

from app.vision.algorithms import YoloDetector, _annotated, _step, _validate_image

FINE_LABELS = frozenset({'dirt', 'hair'})


def parse_yolo_inference(value=None):
    if value is None:
        return {'mode': 'full'}
    if not isinstance(value, dict):
        raise ValueError('YOLO inference config must be an object')
    if value == {'mode': 'full'}:
        return dict(value)
    mode = value.get('mode')
    keys = {'mode', 'tile_fraction', 'tile_confidence', 'border_margin'}
    if mode == 'fine_defects_v1':
        keys |= {'small_tile_fraction', 'detail_grid_size', 'detail_labels', 'class_confidences'}
        if 'hair_min_aspect_ratio' in value:
            keys.add('hair_min_aspect_ratio')
        if 'hair_suppress_contained' in value:
            keys.add('hair_suppress_contained')
    if set(value) != keys or mode not in {'full_and_tiles_v1', 'fine_defects_v1'}:
        raise ValueError('unsupported YOLO inference config')
    for key, minimum, maximum in [('tile_fraction', .5, .8), ('tile_confidence', .01, 1), ('border_margin', 0, 8)]:
        candidate = value[key]
        if type(candidate) not in (int, float) or not math.isfinite(candidate) or not minimum <= candidate <= maximum:
            raise ValueError('invalid YOLO tile setting')
    if mode == 'fine_defects_v1':
        aspect = value.get('hair_min_aspect_ratio', 1)
        if type(aspect) not in (int, float) or not math.isfinite(aspect) or not 1 <= aspect <= 3:
            raise ValueError('invalid hair aspect ratio')
        if type(value.get('hair_suppress_contained', False)) is not bool:
            raise ValueError('invalid hair containment setting')
        if type(value['detail_grid_size']) is not int or value['detail_grid_size'] not in (0, 3):
            raise ValueError('invalid detail grid size')
        labels = value['detail_labels']
        if (not isinstance(labels, list) or any(not isinstance(label, str) or label not in FINE_LABELS for label in labels)
                or len(set(labels)) != len(labels) or bool(labels) != bool(value['detail_grid_size'])):
            raise ValueError('invalid detail classes')
        fraction = value['small_tile_fraction']
        floors = value['class_confidences']
        if type(fraction) not in (float, int) or not math.isfinite(fraction) or not .3 <= fraction <= .5:
            raise ValueError('invalid detail tile fraction')
        if (not isinstance(floors, dict) or not 1 <= len(floors) <= 64
                or any(not isinstance(label, str) or not label.strip() or len(label) > 64
                       or type(floor) not in (float, int) or not math.isfinite(floor) or not .01 <= floor <= 1
                       for label, floor in floors.items())):
            raise ValueError('invalid class confidence thresholds')
    return deepcopy(value)


def crop_windows(size, fraction, grid_size=2):
    width, height = size
    # Tiny inputs do not benefit from magnification; the whole-image pass remains available.
    if min(size) < 128:
        return []
    tile_width, tile_height = math.ceil(width * fraction), math.ceil(height * fraction)
    xs = [round(i * (width-tile_width) / (grid_size-1)) for i in range(grid_size)]
    ys = [round(i * (height-tile_height) / (grid_size-1)) for i in range(grid_size)]
    return [(x, y, x + tile_width, y + tile_height) for y in ys for x in xs]


def extract_views(detector, image, confidence, iou, config):
    whole = detector.predict(image, confidence, iou)
    views = [{'kind': 'full', 'window': [0, 0, image.width, image.height], 'defects': whole['defects']}]
    for window in crop_windows(image.size, config['tile_fraction']):
        with image.crop(window) as crop:
            result = detector.predict(crop, max(confidence, config['tile_confidence']), iou)
        views.append({'kind': 'tile', 'window': list(window), 'defects': result['defects']})
    if config['mode'] == 'fine_defects_v1' and config['detail_grid_size']:
        for window in crop_windows(image.size, config['small_tile_fraction'], grid_size=3):
            with image.crop(window) as crop:
                result = detector.predict(crop, max(confidence, config['tile_confidence']), iou)
            views.append({'kind': 'detail', 'window': list(window),
                          'defects': [d for d in result['defects'] if d['label'] in config['detail_labels']]})
    return views


def overlap(left, right):
    area = max(0, min(left[2], right[2]) - max(left[0], right[0])) * max(0, min(left[3], right[3]) - max(left[1], right[1]))
    union = (left[2]-left[0])*(left[3]-left[1]) + (right[2]-right[0])*(right[3]-right[1]) - area
    return area / union if union else 0


def merge_views(views, size, confidence, iou, config):
    width, height = size
    candidates = []
    for view in views:
        left, top, right, bottom = view['window']
        floor = max(confidence, config['tile_confidence']) if view['kind'] != 'full' else confidence
        for detection in view['defects']:
            if view['kind'] == 'detail' and detection['label'] not in config.get('detail_labels', FINE_LABELS):
                continue
            if detection['confidence'] < max(floor, config.get('class_confidences', {}).get(detection['label'], 0)):
                continue
            x1, y1, x2, y2 = detection['bbox']
            if view['kind'] != 'full':
                margin = config['border_margin']
                # Interior crop edges can cut a large object; retain its full-image evidence instead.
                if ((left > 0 and x1 <= margin) or (top > 0 and y1 <= margin)
                        or (right < width and x2 >= right-left-margin)
                        or (bottom < height and y2 >= bottom-top-margin)):
                    continue
            item = deepcopy(detection)
            item['bbox'] = [x1+left, y1+top, x2+left, y2+top]
            candidates.append(item)
    retained = []
    for item in sorted(candidates, key=lambda candidate: -candidate['confidence']):
        if not any(item['label'] == old['label'] and overlap(item['bbox'], old['bbox']) > iou for old in retained):
            retained.append(item)
            if len(retained) >= 300:
                break
    # Apply the calibrated shape prior after NMS so a suppressed fragment cannot
    # replace the strongest box merely because its aspect ratio is different.
    aspect = config.get('hair_min_aspect_ratio', 1)
    if aspect > 1:
        retained = [item for item in retained if item['label'] != 'hair'
                    or max((item['bbox'][2]-item['bbox'][0])/(item['bbox'][3]-item['bbox'][1]),
                           (item['bbox'][3]-item['bbox'][1])/(item['bbox'][2]-item['bbox'][0])) >= aspect]
    if config.get('hair_suppress_contained', False):
        unique = []
        for item in retained:
            x1, y1, x2, y2 = item['bbox']
            # A low-confidence fragment wholly inside a retained hair box can
            # have tiny IoU despite describing the same filament. Require full
            # containment, the same class, and a strictly higher score; partial
            # overlaps and nested boxes of different classes remain untouched.
            if item['label'] == 'hair' and any(
                old['label'] == 'hair' and old['confidence'] > item['confidence']
                and old['bbox'][0] <= x1 and old['bbox'][1] <= y1
                and old['bbox'][2] >= x2 and old['bbox'][3] >= y2 for old in unique
            ):
                continue
            unique.append(item)
        retained = unique
    return retained


class MultiViewYoloDetector:
    def __init__(self, weights, input_size=640, *, config):
        self.config = parse_yolo_inference(config)
        if self.config['mode'] not in {'full_and_tiles_v1', 'fine_defects_v1'}:
            raise ValueError('multiview detector needs a crop configuration')
        self.detector = YoloDetector(weights, input_size=input_size)

    def predict(self, image, confidence=.25, iou=.45):
        image = _validate_image(image)
        views = extract_views(self.detector, image, confidence, iou, self.config)
        defects = merge_views(views, image.size, confidence, iou, self.config)
        return {'algorithm': 'yolo', 'status': 'defect' if defects else 'clear',
                'score': max((item['confidence'] for item in defects), default=0),
                'threshold': float(confidence), 'defects': defects,
                'image': {'width': image.width, 'height': image.height},
                'annotated_image': _annotated(image, defects),
                'steps': [_step('preprocess', 'Validated original RGB image; whole-image and overlapping crop inputs.'),
                          _step('detect', f'Executed the same local YOLO weights on {len(views)} views.'),
                          _step('filter', 'Mapped crop boxes to original pixels, rejected interior edge fragments, merged duplicates and applied configured class/shape thresholds.'),
                          _step('annotate', f'Annotated {len(defects)} defects on the original image.')]}
