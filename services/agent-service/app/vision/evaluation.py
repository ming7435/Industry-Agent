"""Reproducible PatchCore evaluation inputs and finite image-level metrics.

Synthetic fixtures exercise failure modes; they are not industrial accuracy data.
Manifest rows are data only. Splits are supplied explicitly, never randomized here.
"""
from __future__ import annotations

import csv
from contextlib import closing
import hashlib
import json
import math
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps


SCENARIOS = (
    "obvious_scratch", "fine_scratch", "pinhole", "low_contrast",
    "edge_damage", "blurred_fine_scratch", "low_light_defect",
    "glare_defect", "logical_position",
)
DOMAINS = ("ambient", "blur", "low_light", "glare")


def file_sha256(path: str | Path) -> str:
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_rgb(path: str | Path) -> Image.Image:
    with closing(Image.open(path)) as source:
        if source.width * source.height > 16_000_000 or getattr(source, "n_frames", 1) != 1:
            raise ValueError("evaluation image must be one still frame of at most 16 million pixels")
        source.load()
        if source.mode in {"F", "I", "I;16"} and not np.isfinite(np.asarray(source)).all():
            raise ValueError("image contains nonfinite pixels")
        with closing(ImageOps.exif_transpose(source)) as oriented:
            return oriented.convert("RGB")


def pixel_sha256(image: Image.Image) -> str:
    return hashlib.sha256(f"RGB:{image.width}:{image.height}:".encode() + image.tobytes()).hexdigest()


def _required_text(row: dict, field: str, index: int) -> str:
    value = row.get(field)
    if not isinstance(value, str) or not value.strip() or value.strip().lower() in {"nan", "none", "null"}:
        raise ValueError(f"manifest row {index}: {field} must be nonempty text")
    return value.strip()


def load_manifest(path: str | Path) -> list[dict]:
    """Validate explicit split/label/path rows and reject cross-split content leakage.

    CSV or JSON list (or JSON {"samples": [...]}) is accepted. Relative paths are
    resolved from the manifest directory. Optional group_id prevents the same
    physical object/batch appearing in different splits when supplied by users.
    """
    path = Path(path).resolve(strict=True)
    if path.suffix.lower() == ".csv":
        with path.open(encoding="utf-8-sig", newline="") as stream:
            rows = list(csv.DictReader(stream))
    elif path.suffix.lower() == ".json":
        rows = json.loads(path.read_text(encoding="utf-8-sig"), parse_constant=lambda x: (_ for _ in ()).throw(ValueError(f"nonfinite JSON: {x}")))
        if isinstance(rows, dict):
            rows = rows.get("samples")
    else:
        raise ValueError("manifest must be CSV or JSON")
    if not isinstance(rows, list) or not rows:
        raise ValueError("manifest must contain a nonempty list of samples")
    samples, seen_files, seen_pixels, seen_groups = [], {}, {}, {}
    ids = set()
    for index, row in enumerate(rows, start=1):
        if not isinstance(row, dict):
            raise ValueError(f"manifest row {index} must be an object")
        split = _required_text(row, "split", index)
        label = _required_text(row, "label", index)
        scenario = _required_text(row, "scenario", index)
        raw_path = _required_text(row, "path", index)
        if split not in {"train", "calibration", "test"}:
            raise ValueError(f"manifest row {index}: unknown split")
        if label not in {"normal", "defect"}:
            raise ValueError(f"manifest row {index}: unknown label")
        if split == "train" and label != "normal":
            raise ValueError("training samples must all be normal")
        image_path = (path.parent / raw_path).resolve(strict=True)
        if not image_path.is_file():
            raise ValueError(f"manifest row {index}: image path is not a file")
        image = load_rgb(image_path)
        file_hash, pixel_hash = file_sha256(image_path), pixel_sha256(image)
        for seen, digest in ((seen_files, file_hash), (seen_pixels, pixel_hash)):
            if digest in seen:
                if seen[digest] != split:
                    raise ValueError("image content overlap between train/calibration/test splits")
                raise ValueError("duplicate image content within split would double-count evaluation samples")
            seen[digest] = split
        group_id = row.get("group_id")
        if group_id not in (None, ""):
            group_id = _required_text(row, "group_id", index)
            if group_id in seen_groups and seen_groups[group_id] != split:
                raise ValueError("group_id overlap between splits; keep each object/batch in one split")
            seen_groups[group_id] = split
        sample_id = row.get("sample_id") or f"sample-{index:06d}"
        if not isinstance(sample_id, str) or sample_id in ids:
            raise ValueError("sample_id must be unique text")
        ids.add(sample_id)
        mask_path = row.get("mask_path")
        if mask_path not in (None, ""):
            mask_path = (path.parent / _required_text(row, "mask_path", index)).resolve(strict=True)
            with closing(Image.open(mask_path)) as source_mask:
                if source_mask.mode in {"F", "I", "I;16"} and not np.isfinite(np.asarray(source_mask)).all():
                    raise ValueError("mask contains nonfinite pixels")
                with closing(ImageOps.exif_transpose(source_mask)) as oriented_mask:
                    with closing(oriented_mask.convert("L")) as grayscale_mask:
                        mask = np.asarray(grayscale_mask).copy()
                if mask.shape != (image.height, image.width):
                    raise ValueError("mask size must match the EXIF-normalized image size")
                if label == "normal" and np.any(mask):
                    raise ValueError("normal sample mask must be empty")
                if label == "defect" and not np.any(mask):
                    raise ValueError("defect sample mask must be nonempty")
        samples.append({
            "sample_id": sample_id, "split": split, "label": label,
            "scenario": scenario, "domain": row.get("domain", "unspecified"),
            "path": str(image_path), "mask_path": str(mask_path) if mask_path else "",
            "group_id": group_id, "file_sha256": file_hash, "pixel_sha256": pixel_hash,
            "width": image.width, "height": image.height,
        })
    for split in ("calibration", "test"):
        if {r["label"] for r in samples if r["split"] == split} != {"normal", "defect"}:
            raise ValueError(f"{split} split requires both normal and defect samples")
    train_count = sum(r["split"] == "train" for r in samples)
    if not 1 <= train_count <= 24:
        raise ValueError("train split requires 1 to 24 normal images")
    return samples


def wilson_interval(successes: int, total: int, z: float = 1.959963984540054) -> list[float] | None:
    if total == 0:
        return None
    rate, factor = successes / total, z * z / total
    center = (rate + factor / 2) / (1 + factor)
    radius = z * math.sqrt(rate * (1 - rate) / total + z * z / (4 * total * total)) / (1 + factor)
    return [max(0.0, center - radius), min(1.0, center + radius)]


def validate_scores(rows: Iterable[dict]) -> list[dict]:
    rows = list(rows)
    if not rows:
        raise ValueError("scores must contain at least one sample")
    for row in rows:
        if row.get("label") not in {"normal", "defect"}:
            raise ValueError("score label must be normal or defect")
        if isinstance(row.get("score"), bool):
            raise ValueError("scores must be finite nonnegative numbers")
        try:
            score = float(row["score"])
        except (KeyError, ValueError, TypeError) as exc:
            raise ValueError("scores must be finite nonnegative numbers") from exc
        if not math.isfinite(score) or score < 0:
            raise ValueError("scores must be finite nonnegative numbers")
    return rows


def metrics_from_scores(rows: Iterable[dict], threshold: float) -> dict:
    rows = validate_scores(rows)
    if isinstance(threshold, bool) or not math.isfinite(threshold) or threshold < 0:
        raise ValueError("threshold must be finite and nonnegative")
    tp = sum(r["label"] == "defect" and float(r["score"]) >= threshold for r in rows)
    fn = sum(r["label"] == "defect" and float(r["score"]) < threshold for r in rows)
    fp = sum(r["label"] == "normal" and float(r["score"]) >= threshold for r in rows)
    tn = sum(r["label"] == "normal" and float(r["score"]) < threshold for r in rows)
    defects, normals = tp + fn, fp + tn
    return {
        "threshold": float(threshold), "decision_rule": "score >= threshold",
        "n": len(rows), "defect_n": defects, "normal_n": normals,
        "tp": tp, "fn": fn, "fp": fp, "tn": tn,
        "recall": tp / defects if defects else None,
        "fnr": fn / defects if defects else None,
        "fpr": fp / normals if normals else None,
        "precision": tp / (tp + fp) if tp + fp else None,
        "fnr_wilson95": wilson_interval(fn, defects),
        "fpr_wilson95": wilson_interval(fp, normals),
    }


def threshold_sweep(rows: Iterable[dict]) -> list[dict]:
    rows = validate_scores(rows)
    values = sorted({float(row["score"]) for row in rows})
    # Every possible image-level decision boundary, including all-clear.
    thresholds = sorted(set([0.0] + values + [math.nextafter(values[-1], math.inf)]))
    return [metrics_from_scores(rows, value) for value in thresholds]


def scenario_metrics(rows: list[dict], threshold: float) -> dict:
    normals = [r for r in rows if r["label"] == "normal"]
    by_scenario = {
        scenario: metrics_from_scores([r for r in rows if r["label"] == "defect" and r["scenario"] == scenario], threshold)
        for scenario in sorted({r["scenario"] for r in rows if r["label"] == "defect"})
    }
    return {"overall": metrics_from_scores(rows, threshold),
            "normal": metrics_from_scores(normals, threshold), "scenarios": by_scenario}


def _synthetic_image(rng, size, domain, scenario):
    """A brushed panel with two position-specific registration marks."""
    width, height = size
    yy, xx = np.mgrid[:height, :width]
    shift_x, shift_y = int(rng.integers(-3, 4)), int(rng.integers(-3, 4))
    x0, y0, x1, y1 = 34 + shift_x, 28 + shift_y, width - 35 + shift_x, height - 29 + shift_y
    offset, tilt = rng.uniform(-9, 9), rng.uniform(-6, 6)
    grain = rng.normal(0, 1.8, (height, width))
    brush = 2.5 * np.sin(yy * rng.uniform(0.7, 1.05) + rng.uniform(0, 2 * np.pi))
    illumination = offset + tilt * (xx / width - 0.5) + 3 * np.cos(xx / width * np.pi)
    panel = (xx >= x0) & (xx <= x1) & (yy >= y0) & (yy <= y1)
    values = np.where(panel, 151 + brush + grain + illumination, 48 + grain * 0.45)
    rgb = np.stack([values * 1.015, values, values * 0.97], axis=-1)
    image = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
    draw = ImageDraw.Draw(image)
    draw.rectangle((x0, y0, x1, y1), outline=(108, 107, 103), width=2)
    for px, py in ((x0 + 18, y0 + 18), (x1 - 18, y0 + 18), (x0 + 18, y1 - 18), (x1 - 18, y1 - 18)):
        draw.ellipse((px - 5, py - 5, px + 5, py + 5), fill=(76, 77, 76), outline=(181, 181, 176), width=2)
    mark_x, mark_y = round(width * 0.26) + shift_x, round(height * 0.28) + shift_y
    mark2_x, mark2_y = round(width * 0.74) + shift_x, round(height * 0.72) + shift_y
    draw.rounded_rectangle((mark_x - 12, mark_y - 4, mark_x + 12, mark_y + 4), radius=3, fill=(105, 105, 100))
    draw.ellipse((mark2_x - 7, mark2_y - 7, mark2_x + 7, mark2_y + 7), outline=(104, 104, 100), width=3)
    mask = Image.new("L", size, 0)
    mask_draw = ImageDraw.Draw(mask)
    cx, cy = int(rng.uniform(0.36, 0.64) * width), int(rng.uniform(0.36, 0.64) * height)
    length = int(rng.integers(38, 69))
    line = (cx - length // 2, cy + 8, cx + length // 2, cy - 8)
    if scenario == "obvious_scratch":
        draw.line(line, fill=(231, 229, 219), width=6)
        mask_draw.line(line, fill=255, width=6)
    elif scenario in {"fine_scratch", "blurred_fine_scratch", "low_light_defect", "glare_defect"}:
        stroke = int(rng.integers(1, 3))
        draw.line(line, fill=(202, 201, 193), width=stroke)
        mask_draw.line(line, fill=255, width=stroke)
    elif scenario == "pinhole":
        radius = int(rng.integers(2, 4))
        box = (cx - radius, cy - radius, cx + radius, cy + radius)
        draw.ellipse(box, fill=(57, 57, 54))
        mask_draw.ellipse(box, fill=255)
    elif scenario == "low_contrast":
        box = (cx - 13, cy - 9, cx + 13, cy + 9)
        patch_mask = Image.new("L", size, 0)
        ImageDraw.Draw(patch_mask).ellipse(box, fill=255)
        alpha = np.asarray(patch_mask.filter(ImageFilter.GaussianBlur(2)), dtype=np.float32) / 255
        array = np.asarray(image, dtype=np.float32) - alpha[..., None] * 8
        image = Image.fromarray(np.clip(array, 0, 255).astype(np.uint8))
        mask_draw.ellipse(box, fill=255)
    elif scenario == "edge_damage":
        ey = cy
        points = ((x1 - 1, ey - 12), (x1 - 17, ey - 3), (x1 - 7, ey + 14), (x1 + 2, ey + 14))
        draw.polygon(points, fill=(48, 48, 46))
        mask_draw.polygon(points, fill=255)
    elif scenario == "logical_position":
        # Move a familiar mark: a patch-based spatially invariant memory may miss it.
        array = np.asarray(image).copy()
        source = array[mark_y - 9:mark_y + 10, mark_x - 17:mark_x + 18].copy()
        new_x, new_y = round(width * 0.60), round(height * 0.28) + shift_y
        array[mark_y - 9:mark_y + 10, mark_x - 17:mark_x + 18] = array[mark_y + 15:mark_y + 34, mark_x - 17:mark_x + 18]
        array[new_y - 9:new_y + 10, new_x - 17:new_x + 18] = source
        image = Image.fromarray(array)
        mask_draw.rectangle((mark_x - 17, mark_y - 9, mark_x + 17, mark_y + 9), fill=255)
        mask_draw.rectangle((new_x - 17, new_y - 9, new_x + 17, new_y + 9), fill=255)
    if domain == "blur":
        image = image.filter(ImageFilter.GaussianBlur(1.15))
    elif domain == "low_light":
        array = np.asarray(image, dtype=np.float32)
        image = Image.fromarray(np.clip(array * rng.uniform(0.56, 0.65) + rng.normal(0, 1.3, array.shape), 0, 255).astype(np.uint8))
    elif domain == "glare":
        array = np.asarray(image, dtype=np.float32)
        glare = 91 * np.exp(-0.5 * (((xx - width * 0.52) / (width * 0.13)) ** 2 + ((yy - height * 0.51) / (height * 0.45)) ** 2))
        image = Image.fromarray(np.clip(array + glare[..., None], 0, 255).astype(np.uint8))
    return image, mask


def generate_synthetic_dataset(output: str | Path, *, seed: int = 20261019,
                               train_normal: int = 12, calibration_normal: int = 24,
                               calibration_per_scenario: int = 8, test_normal: int = 40,
                               test_per_scenario: int = 20) -> Path:
    """Write independent deterministic split streams, full images, masks and manifest."""
    counts = (train_normal, calibration_normal, calibration_per_scenario, test_normal, test_per_scenario)
    if any(isinstance(n, bool) or not isinstance(n, int) or n <= 0 for n in counts) or train_normal > 24:
        raise ValueError("dataset counts must be positive integers; train_normal at most 24")
    output = Path(output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    rows = []
    split_seeds = np.random.SeedSequence(seed).spawn(3)
    for split, child_seed, normal_count, defect_count in (
        ("train", split_seeds[0], train_normal, 0),
        ("calibration", split_seeds[1], calibration_normal, calibration_per_scenario),
        ("test", split_seeds[2], test_normal, test_per_scenario),
    ):
        rng = np.random.default_rng(child_seed)
        for scenario in ("normal",) + SCENARIOS:
            count = normal_count if scenario == "normal" else defect_count
            for index in range(count):
                domain = {"blurred_fine_scratch": "blur", "low_light_defect": "low_light", "glare_defect": "glare"}.get(scenario, DOMAINS[index % len(DOMAINS)])
                # Size alternates independently of lighting domain; all domains see both shapes.
                size = ((512, 384), (768, 384))[(index // len(DOMAINS) + index) % 2]
                sample_id = f"{split}-{scenario}-{index:03d}"
                image, mask = _synthetic_image(rng, size, domain, scenario)
                image_path, mask_path = Path("images") / f"{sample_id}.png", Path("masks") / f"{sample_id}.png"
                (output / image_path.parent).mkdir(exist_ok=True)
                (output / mask_path.parent).mkdir(exist_ok=True)
                image.save(output / image_path)
                mask.save(output / mask_path)
                rows.append({"sample_id": sample_id, "split": split, "label": "normal" if scenario == "normal" else "defect",
                             "scenario": scenario, "domain": domain, "path": image_path.as_posix(),
                             "mask_path": mask_path.as_posix(), "group_id": sample_id})
    manifest = output / "manifest.csv"
    with manifest.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    metadata = {
        "kind": "SYNTHETIC STRESS TEST — NOT INDUSTRIAL ACCURACY", "seed": seed,
        "rng": "numpy.default_rng with SeedSequence.spawn(3), one stream per split",
        "counts": dict(zip(("train_normal", "calibration_normal", "calibration_per_scenario", "test_normal", "test_per_scenario"), counts)),
        "scenarios": list(SCENARIOS), "normal_domains": list(DOMAINS), "image_sizes": [[512, 384], [768, 384]],
        "limitations": ["Procedural panels are not real products or production line images.",
                        "Masks describe injected defects before optional optical blur, not exact perceived boundaries.",
                        "One seed and one simulated product family cannot establish generalization.",
                        "Real data must use independent object/batch splits; pixel checks cannot detect all near-duplicates."],
    }
    (output / "dataset.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest
