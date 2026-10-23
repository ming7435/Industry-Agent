"""Create a separate, explicitly synthetic training expansion for gear YOLO.

Only frozen real training images are transformed. Calibration and test pixels
are never used to generate synthetic samples, and the training YAML has no test
path. This does not increase the number of independent photographed gears.
"""

from __future__ import annotations

from collections import Counter
import hashlib
import json
import os
from pathlib import Path
import random

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "output/gear-full-dataset/prepared"
TARGET = ROOT / "output/gear-yolo-synthetic-v1"
VARIANTS_PER_TRAIN_IMAGE = 3
SEED = 20261022


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def image_hash(pixels: np.ndarray) -> str:
    height, width = pixels.shape[:2]
    return hashlib.sha256(f"RGB:{width}:{height}:".encode() + pixels.tobytes()).hexdigest()


def box_transform(box: list[float], matrix: np.ndarray, width: int, height: int) -> list[float]:
    x0, y0, x1, y1 = box
    corners = np.array([[x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1]], dtype=np.float64)
    transformed = corners @ matrix.T
    return [float(transformed[:, 0].min()), float(transformed[:, 1].min()),
            float(transformed[:, 0].max()), float(transformed[:, 1].max())]


def valid_boxes(boxes: list[list[float]], width: int, height: int) -> bool:
    return all(0 <= x0 < x1 <= width and 0 <= y0 < y1 <= height
               and x1 - x0 >= 1 and y1 - y0 >= 1 for x0, y0, x1, y1 in boxes)


def make_variant(image: np.ndarray, truths: list[dict], rng: random.Random):
    height, width = image.shape[:2]
    for _ in range(40):
        angle = rng.uniform(-12, 12)
        scale = rng.uniform(.97, 1.03)
        matrix = cv2.getRotationMatrix2D((width / 2, height / 2), angle, scale)
        matrix[0, 2] += rng.uniform(-4, 4)
        matrix[1, 2] += rng.uniform(-4, 4)
        boxes = [box_transform(row["bbox"], matrix, width, height) for row in truths]
        if valid_boxes(boxes, width, height):
            break
    else:
        # Edge defects are common. Keep their boxes exact and vary lighting/noise.
        angle, scale = 0., 1.
        matrix = cv2.getRotationMatrix2D((width / 2, height / 2), angle, scale)
        boxes = [list(row["bbox"]) for row in truths]

    border = tuple(int(value) for value in np.median(
        np.concatenate((image[0], image[-1], image[:, 0], image[:, -1])), axis=0))
    warped = cv2.warpAffine(image, matrix, (width, height), flags=cv2.INTER_LINEAR,
                            borderMode=cv2.BORDER_CONSTANT, borderValue=border)
    # Make each variant a distinct synthetic camera exposure without inventing
    # unlabeled defects on otherwise annotated source images.
    contrast = rng.uniform(.86, 1.14)
    brightness = rng.uniform(-16, 16)
    gamma = rng.uniform(.88, 1.12)
    adjusted = np.clip(warped.astype(np.float32) * contrast + brightness, 0, 255) / 255
    adjusted = np.power(adjusted, gamma) * 255
    noise_rng = np.random.default_rng(rng.randrange(2**32))
    adjusted += noise_rng.normal(0, rng.uniform(1, 3), adjusted.shape)
    output = np.clip(adjusted, 0, 255).astype(np.uint8)
    return output, boxes, {"angle_degrees": angle, "scale": scale,
                           "matrix": matrix.tolist(), "contrast": contrast,
                           "brightness": brightness, "gamma": gamma}


def link(source: Path, destination: Path):
    destination.parent.mkdir(parents=True, exist_ok=True)
    os.link(source, destination)


def main():
    if TARGET.exists():
        raise FileExistsError(f"frozen synthetic expansion already exists: {TARGET}")
    source_manifest = SOURCE / "manifest.json"
    manifest = json.loads(source_manifest.read_text(encoding="utf-8"))
    rows = manifest["samples"]
    train = sorted((row for row in rows if row["split"] == "train"), key=lambda row: row["sample_id"])
    calibration = [row for row in rows if row["split"] == "calibration"]
    test = [row for row in rows if row["split"] == "test"]
    classes = manifest["classes"]
    if len(train) != 779 or len(calibration) != 188 or len(test) != 118 or len(classes) != 16:
        raise ValueError("frozen source dataset changed; inspect before expansion")
    if VARIANTS_PER_TRAIN_IMAGE * len(train) <= 2000:
        raise ValueError("fewer than 2001 synthetic training images")

    dataset = TARGET / "dataset"
    dataset.mkdir(parents=True)
    synthetic = []
    used_hashes = {row["pixel_sha256"] for row in rows}
    rng = random.Random(SEED)
    for row in train + calibration:
        split = row["split"]
        source_image = SOURCE / row["path"]
        source_label = SOURCE / "labels" / split / (row["sample_id"] + ".txt")
        if digest(source_image) != row["file_sha256"]:
            raise ValueError(f"source image changed: {row['sample_id']}")
        link(source_image, dataset / "images" / split / source_image.name)
        link(source_label, dataset / "labels" / split / source_label.name)

    for row in train:
        source_image = SOURCE / row["path"]
        with Image.open(source_image) as loaded:
            pixels = np.asarray(loaded.convert("RGB"))
        height, width = pixels.shape[:2]
        for variant in range(VARIANTS_PER_TRAIN_IMAGE):
            for _ in range(8):
                transformed, boxes, parameters = make_variant(pixels, row["ground_truth"], rng)
                pixel_digest = image_hash(transformed)
                if pixel_digest not in used_hashes:
                    break
            else:
                raise ValueError("synthetic image collision")
            used_hashes.add(pixel_digest)
            sample_id = f"syn-{row['sample_id']}-{variant + 1:02d}"
            image_path = dataset / "images/train" / (sample_id + ".png")
            label_path = dataset / "labels/train" / (sample_id + ".txt")
            Image.fromarray(transformed).save(image_path)
            labels = []
            for truth, (x0, y0, x1, y1) in zip(row["ground_truth"], boxes):
                class_id = classes.index(truth["label"])
                labels.append(f"{class_id} {(x0+x1)/(2*width):.9f} {(y0+y1)/(2*height):.9f} "
                              f"{(x1-x0)/width:.9f} {(y1-y0)/height:.9f}")
            label_path.write_text("\n".join(labels) + "\n", encoding="utf-8")
            synthetic.append({"sample_id": sample_id, "source_sample_id": row["sample_id"],
                              "source_group_id": row["group_id"], "split": "train",
                              "synthetic": True, "image": image_path.relative_to(TARGET).as_posix(),
                              "label": label_path.relative_to(TARGET).as_posix(),
                              "pixel_sha256": pixel_digest, "file_sha256": digest(image_path),
                              "box_count": len(labels), "parameters": parameters})
    per_source = Counter(row["source_sample_id"] for row in synthetic)
    if set(per_source.values()) != {VARIANTS_PER_TRAIN_IMAGE}:
        raise ValueError("incomplete synthetic variants")
    assert not {row["source_group_id"] for row in synthetic} & {
        row["group_id"] for row in calibration + test}
    summary = {"source_manifest_sha256": digest(source_manifest), "source_real_train_images": len(train),
               "new_real_images": 0, "new_synthetic_images": len(synthetic),
               "expanded_train_images": len(train) + len(synthetic),
               "untouched_calibration_images": len(calibration), "untouched_test_images": len(test),
               "synthetic_method": "train-only affine camera angle/exposure/noise; original boxes transformed",
               "physical_part_independence": False, "seed": SEED, "classes": classes,
               "class_boxes_synthetic": dict(Counter(classes[int(line.split()[0])]
                                               for row in synthetic
                                               for line in (TARGET / row["label"]).read_text().splitlines()))}
    (TARGET / "synthetic-manifest.json").write_text(
        json.dumps({"summary": summary, "samples": synthetic}, ensure_ascii=False, indent=2), encoding="utf-8")
    (dataset / "data.yaml").write_text(json.dumps({"path": str(dataset.resolve()),
        "train": "images/train", "val": "images/calibration", "names": classes, "nc": len(classes)},
        ensure_ascii=False, indent=2), encoding="utf-8")
    (TARGET / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
