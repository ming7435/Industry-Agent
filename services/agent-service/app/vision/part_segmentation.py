"""Inference for the operator supplied endface/toothface segmentation model.

This model locates part surfaces. Its detections are never quality decisions.
"""
from __future__ import annotations

import base64
from io import BytesIO
import math
import os
from pathlib import Path
import threading
import time

from PIL import Image, ImageDraw


EXPECTED_CLASSES = {0: 'endface', 1: 'toothface'}


class PartSegmenter:
    def __init__(self, weights: str | Path):
        self.weights = Path(weights).resolve(strict=True)
        self._lock = threading.RLock()
        self._model = None

    def _load(self):
        if self._model is None:
            os.environ['YOLO_AUTOINSTALL'] = 'false'
            os.environ['ULTRALYTICS_SAFE_LOAD'] = '1'
            from ultralytics import YOLO

            model = YOLO(str(self.weights), task='segment')
            if model.task != 'segment' or model.names != EXPECTED_CLASSES:
                raise ValueError('expected endface/toothface segmentation weights')
            self._model = model
        return self._model

    def predict(self, image: Image.Image, confidence: float = .25) -> dict:
        if not math.isfinite(confidence) or not 0 < confidence <= 1:
            raise ValueError('invalid confidence')
        image = image.convert('RGB')
        with self._lock:
            started = time.perf_counter()
            result = self._load().predict(source=image, conf=confidence, imgsz=640,
                                          device='cpu', save=False, verbose=False)[0]
            inference_ms = round((time.perf_counter() - started) * 1000, 2)

        boxes = result.boxes
        masks = result.masks
        if boxes is None or (len(boxes) and (masks is None or len(masks.xy) != len(boxes))):
            raise ValueError('invalid segmentation output')
        overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
        drawing = ImageDraw.Draw(overlay)
        detections = []
        for index, box in enumerate(boxes):
            class_id = int(box.cls.item())
            if class_id not in EXPECTED_CLASSES:
                raise ValueError('unexpected segmentation class')
            score = float(box.conf.item())
            coordinates = [float(value) for value in box.xyxy[0].tolist()]
            if not math.isfinite(score) or not all(map(math.isfinite, coordinates)):
                raise ValueError('nonfinite segmentation output')
            x1, y1, x2, y2 = coordinates
            x1, x2 = max(0., min(x1, image.width)), max(0., min(x2, image.width))
            y1, y2 = max(0., min(y1, image.height)), max(0., min(y2, image.height))
            if x2 <= x1 or y2 <= y1:
                raise ValueError('invalid segmentation box')
            polygon = [(float(x), float(y)) for x, y in masks.xy[index]]
            if len(polygon) < 3 or not all(math.isfinite(v) for point in polygon for v in point):
                raise ValueError('invalid segmentation mask')
            color = (19, 167, 155) if class_id == 0 else (235, 148, 51)
            drawing.polygon(polygon, fill=(*color, 90), outline=(*color, 255), width=3)
            mask = Image.new('1', image.size)
            ImageDraw.Draw(mask).polygon(polygon, fill=1)
            detections.append({'class': EXPECTED_CLASSES[class_id], 'conf': round(score, 4),
                               'box': [round(v, 1) for v in (x1, y1, x2, y2)],
                               'mask_area': mask.histogram()[1]})
        detections.sort(key=lambda item: -item['conf'])
        annotated = Image.alpha_composite(image.convert('RGBA'), overlay).convert('RGB')
        buffer = BytesIO()
        annotated.save(buffer, format='PNG')
        return {'image': {'width': image.width, 'height': image.height},
                'detections': detections, 'annotated_image': 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode('ascii'),
                'inference_ms': inference_ms}
