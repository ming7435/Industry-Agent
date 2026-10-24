import importlib.util
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
import pytest

ROOT = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location('pc_foreground', ROOT / 'scripts/patchcore_foreground.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def test_roi_keeps_dark_surface_defects_and_edges_but_excludes_remote_glints():
    image = Image.new('RGB', (200, 200), 'black')
    draw = ImageDraw.Draw(image)
    draw.rectangle((40, 40, 160, 160), fill=(130, 160, 180))
    draw.rectangle((80, 80, 100, 100), fill=(0, 0, 0))
    draw.rectangle((185, 185, 190, 190), fill=(140, 170, 190))
    roi = module.foreground_mask(image)
    assert roi.shape == (200, 200)
    assert roi[90, 90]  # Do not delete the dark defect itself.
    assert roi[100, 38]  # Retain a narrow margin around the silhouette.
    assert not roi[188, 188]


def test_missing_object_is_an_error_not_a_normal_prediction():
    with pytest.raises(ValueError, match='foreground'):
        module.foreground_mask(Image.new('RGB', (200, 200), 'black'))
