"""Audit synthetic YOLO images, annotations, and frozen split isolation."""

from __future__ import annotations

from collections import Counter
import hashlib
import json
import math
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "output/gear-full-dataset/prepared"
DATA = ROOT / "output/gear-yolo-synthetic-v1"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    source_manifest = json.loads((SOURCE / "manifest.json").read_text(encoding="utf-8"))
    generated = json.loads((DATA / "synthetic-manifest.json").read_text(encoding="utf-8"))
    summary = generated["summary"]
    rows = generated["samples"]
    source = {row["sample_id"]: row for row in source_manifest["samples"]}
    config = json.loads((DATA / "dataset/data.yaml").read_text(encoding="utf-8"))
    assert summary["source_manifest_sha256"] == digest(SOURCE / "manifest.json")
    assert len(rows) == summary["new_synthetic_images"] == 2337
    assert summary["new_real_images"] == 0
    assert config["train"] == "images/train" and config["val"] == "images/calibration"
    assert "test" not in config and config["names"] == source_manifest["classes"]
    original_hashes = {row["pixel_sha256"] for row in source.values()}
    generated_hashes = set()
    sources = Counter()
    box_count = 0
    for row in rows:
        parent = source[row["source_sample_id"]]
        assert parent["split"] == "train" and parent["group_id"] == row["source_group_id"]
        assert row["split"] == "train" and row["synthetic"] is True
        image_path, label_path = DATA / row["image"], DATA / row["label"]
        assert digest(image_path) == row["file_sha256"]
        with Image.open(image_path) as loaded:
            image = loaded.convert("RGB")
            pixel_hash = hashlib.sha256(f"RGB:{image.width}:{image.height}:".encode() + image.tobytes()).hexdigest()
            image_width, image_height = image.size
        assert pixel_hash == row["pixel_sha256"]
        assert pixel_hash not in original_hashes and pixel_hash not in generated_hashes
        generated_hashes.add(pixel_hash)
        lines = label_path.read_text(encoding="utf-8").splitlines()
        assert len(lines) == row["box_count"] == len(parent["ground_truth"])
        for line, truth in zip(lines, parent["ground_truth"]):
            parts = line.split()
            assert len(parts) == 5 and int(parts[0]) == config["names"].index(truth["label"])
            x, y, width, height = map(float, parts[1:])
            assert 0 < width <= 1 and 0 < height <= 1
            assert -1e-6 <= x - width/2 < x + width/2 <= 1 + 1e-6
            assert -1e-6 <= y - height/2 < y + height/2 <= 1 + 1e-6
            matrix = row["parameters"]["matrix"]
            assert len(matrix) == 2 and all(len(axis) == 3 for axis in matrix)
            assert all(math.isfinite(value) for axis in matrix for value in axis)
            x0, y0, x1, y1 = truth["bbox"]
            corners = [(a, b) for a in (x0, x1) for b in (y0, y1)]
            projected_x = [matrix[0][0]*a + matrix[0][1]*b + matrix[0][2] for a, b in corners]
            projected_y = [matrix[1][0]*a + matrix[1][1]*b + matrix[1][2] for a, b in corners]
            expected = (min(projected_x), min(projected_y), max(projected_x), max(projected_y))
            actual = ((x-width/2)*image_width, (y-height/2)*image_height,
                      (x+width/2)*image_width, (y+height/2)*image_height)
            assert all(abs(a-b) < 1e-4 for a, b in zip(actual, expected)), row["sample_id"]
        sources[parent["sample_id"]] += 1
        box_count += len(lines)
    assert len(sources) == 779 and set(sources.values()) == {3}
    assert len(list((DATA / "dataset/images/train").glob("*.png"))) == 3116
    assert len(list((DATA / "dataset/labels/train").glob("*.txt"))) == 3116
    assert len(list((DATA / "dataset/images/calibration").glob("*.png"))) == 188
    assert len(list((DATA / "dataset/labels/calibration").glob("*.txt"))) == 188
    for row in source.values():
        if row["split"] not in ("train", "calibration"):
            continue
        split = row["split"]
        assert digest(DATA / "dataset/images" / split / (row["sample_id"] + ".png")) == row["file_sha256"]
        assert (DATA / "dataset/labels" / split / (row["sample_id"] + ".txt")).read_bytes() == (
            SOURCE / "labels" / split / (row["sample_id"] + ".txt")).read_bytes()
    report = {"status": "passed", "real_train_images": 779, "new_synthetic_images": len(rows),
              "expanded_train_images": 3116, "new_synthetic_boxes": box_count,
              "annotation_geometry_verified": True,
              "calibration_images_unchanged": 188, "test_images_unexposed": 118,
              "unique_synthetic_pixel_hashes": len(generated_hashes),
              "source_manifest_sha256": summary["source_manifest_sha256"],
              "synthetic_manifest_sha256": digest(DATA / "synthetic-manifest.json")}
    (DATA / "validation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
