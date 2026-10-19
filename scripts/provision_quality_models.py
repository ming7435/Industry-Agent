"""Prepare local visual-inspection model artifacts without changing app settings.

Run from the repository root:
  .venv/Scripts/python scripts/provision_quality_models.py

If the pinned public weights or source notices are absent, add --download-source.
The PatchCore preset uses 12 normal procedural images and the separate labeled
calibration split. Test images are never loaded or used for parameter selection.
No environment file is edited and no service is started or restarted.
"""
from __future__ import annotations

import argparse
from contextlib import closing
import csv
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import time
import urllib.request

for variable in ("OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "OMP_NUM_THREADS"):
    os.environ.setdefault(variable, "1")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "agent-service"))

YOLO_SHA = "495ad53dbff99bcbf629ec67f90e1e627800ab8db78177de592648b6e00345b1"
BACKBONE_SHA = "f37072fd47e89c5e827621c5baffa7500819f7896bbacec160b1a16c560e07ec"
YOLO_REPO = "https://github.com/winthegame259/steel-surface-defect-detection"
YOLO_URL = YOLO_REPO + "/releases/download/v1.0.0/neu_det_yolov8n_best.onnx"
BACKBONE_URL = "https://download.pytorch.org/models/resnet18-f37072fd.pth"
CLASSES = ["crazing", "inclusion", "patches", "pitted_surface", "rolled-in_scale", "scratches"]


def digest(path):
    result = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            result.update(chunk)
    return result.hexdigest()


def write_json(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False), encoding="utf-8")


def obtain(path, url, expected_hash, allow_download):
    path = Path(path)
    if not path.is_file():
        if not allow_download:
            raise FileNotFoundError(f"Missing {path}; use --download-source to retrieve the documented public source")
        path.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(url, timeout=90) as response, path.open("xb") as target:
            shutil.copyfileobj(response, target)
    if expected_hash and digest(path) != expected_hash:
        raise ValueError(f"Pinned source SHA256 mismatch: {path}")
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", type=Path, default=ROOT / "output/patchcore-evaluation/dataset")
    parser.add_argument("--output", type=Path, default=ROOT / ".runtime/quality-models")
    parser.add_argument("--yolo-source", type=Path, default=ROOT / "output/model-provisioning/neu-det-yolov8n-v1.0.0")
    parser.add_argument("--backbone", type=Path, default=ROOT / ".runtime/quality-vision-validation/resnet18-f37072fd.pth")
    parser.add_argument("--download-source", action="store_true")
    args = parser.parse_args()

    import numpy as np
    import torch
    from app.vision.algorithms import PatchCoreDetector, YoloDetector
    from app.vision.calibration import threshold_strategies
    from app.vision.evaluation import generate_synthetic_dataset, load_rgb
    from app.vision.service import VisionService

    torch.set_num_threads(4)
    created = datetime.now(timezone.utc).isoformat()
    output = args.output.resolve()
    yolo_dir = output / "neu-det-yolov8n-v1.0.0"
    patch_dir = output / "patchcore-synthetic-v1"
    yolo_dir.mkdir(parents=True, exist_ok=True)
    patch_dir.mkdir(parents=True, exist_ok=True)

    source_model = obtain(args.yolo_source / "neu_det_yolov8n_best.onnx", YOLO_URL, YOLO_SHA, args.download_source)
    yolo_path = yolo_dir / source_model.name
    shutil.copy2(source_model, yolo_path)
    for filename, upstream in (("LICENSE", "LICENSE"), ("UPSTREAM_README.md", "README.md")):
        source = obtain(args.yolo_source / filename,
                        "https://raw.githubusercontent.com/winthegame259/steel-surface-defect-detection/v1.0.0/" + upstream,
                        None, args.download_source)
        shutil.copy2(source, yolo_dir / filename)
    prior_probe = args.yolo_source / "provenance-and-smoke-test.json"
    if prior_probe.is_file():
        shutil.copy2(prior_probe, yolo_dir / "original-smoke-test.json")

    yolo_metadata = {
        "model_id": "yolo-default", "name": "YOLOv8n NEU-DET 钢材缺陷模型（研究验证）",
        "algorithm": "yolo", "description": "公开 NEU-DET 六类热轧钢材表面缺陷模型；仅供研究验证，尚未在当前生产现场标定。",
        "read_only": True, "demo": True, "scope": "public_industrial_dataset_research_validation",
        "weights_file": yolo_path.name, "weights_sha256": digest(yolo_path),
        "source_url": YOLO_REPO + "/releases/tag/v1.0.0", "download_url": YOLO_URL,
        "source_release": "v1.0.0", "license": "AGPL-3.0", "classes": CLASSES,
        "dataset_source_url": "https://faculty.neu.edu.cn/songkc/en/zdylm/263265/list/",
        "created_at": created,
        "limitations": [
            "适用范围是 NEU-DET 的热轧钢材灰度纹理；不覆盖全部产品、缺陷或拍摄条件。",
            "发布者报告的基准成绩未在本机独立复现；本地仅验证文件摘要、类别和推理链路。",
            "在本项目合成正常纹理上观察到误报，不能替代生产验收。",
            "上游代码和模型标注 AGPL-3.0；上游仓库将 NEU-DET 描述为学术研究用途，数据集主页未显示单独许可文本。",
        ],
    }
    write_json(yolo_dir / "model.json", yolo_metadata)

    backbone = obtain(args.backbone, BACKBONE_URL, BACKBONE_SHA, args.download_source)
    stable_backbone = patch_dir / "resnet18-f37072fd.pth"
    shutil.copy2(backbone, stable_backbone)
    dataset = args.dataset.resolve()
    manifest = dataset / "manifest.csv"
    if not manifest.is_file():
        generate_synthetic_dataset(dataset, seed=20261019)
    with manifest.open(encoding="utf-8", newline="") as stream:
        rows = [row for row in csv.DictReader(stream) if row["split"] in {"train", "calibration"}]
    train = [row for row in rows if row["split"] == "train"]
    calibration_rows = [row for row in rows if row["split"] == "calibration"]
    if len(train) != 12 or any(row["label"] != "normal" for row in train):
        raise ValueError("This synthetic preset requires exactly the existing 12 normal training samples")
    if len(calibration_rows) != 96 or sum(row["label"] == "normal" for row in calibration_rows) != 24:
        raise ValueError("This preset requires the existing independent 24 normal / 72 defect calibration split")
    config = {"input_size": 224, "resize_mode": "stretch", "contrast": "none", "blur_sigma": 4.0}
    detector = PatchCoreDetector(str(stable_backbone), config=config)
    images = [load_rgb(dataset / row["path"]) for row in train]
    train_digests = [VisionService._image_digest(image) for image in images]
    if len(set(train_digests)) != len(train_digests):
        raise ValueError("Duplicate training images")
    print("Fitting deterministic PatchCore baseline on 12 synthetic normal images", flush=True)
    started = time.perf_counter()
    try:
        fitted = detector.fit(images, coreset_ratio=0.1)
    finally:
        for image in images:
            image.close()
    bank = np.asarray(fitted["memory_bank"], dtype=np.float32)
    if bank.ndim != 2 or not 1 <= len(bank) <= 1024 or not np.isfinite(bank).all():
        raise ValueError("Invalid fitted memory bank")
    memory_path = patch_dir / "memory.npz"
    with memory_path.open("wb") as stream:
        np.savez_compressed(stream, memory_bank=bank)
    reloaded = VisionService._load_bank(memory_path)
    assert np.array_equal(bank, reloaded)
    print("Calibrating on the separate 96-image calibration split; test images remain unused", flush=True)
    seen, evidence, normal_scores, defect_scores = set(train_digests), [], [], []
    for row in calibration_rows:
        with closing(load_rgb(dataset / row["path"])) as image:
            image_sha = VisionService._image_digest(image)
            if image_sha in seen:
                raise ValueError("Calibration image duplicates training or another calibration image")
            seen.add(image_sha)
            score = float(detector.anomaly_map(image, reloaded).max())
        (normal_scores if row["label"] == "normal" else defect_scores).append(score)
        evidence.append({"sample_id": row["sample_id"], "image_sha256": image_sha, "label": row["label"], "score": score})
    strategies = threshold_strategies(normal_scores, defect_scores)
    threshold = strategies["recall_priority"]["threshold"]
    patch_metadata = {
        **fitted["metadata"], "model_id": "patchcore-demo", "name": "PatchCore 合成纹理演示",
        "algorithm": "patchcore", "description": "由程序生成纹理的 12 张正常图建立记忆库，阈值只使用独立合成校准集；不代表真实生产检测能力。",
        "read_only": True, "demo": True, "scope": "synthetic_texture_demonstration_only",
        "source": "Repository procedural dataset: app.vision.evaluation.generate_synthetic_dataset(seed=20261019)",
        "sample_count": len(train), "memory_size": len(bank), "pipeline_version": 2,
        "preprocessing": config, "weights_file": stable_backbone.name, "weights_sha256": digest(stable_backbone),
        "backbone_source_url": BACKBONE_URL, "memory_file": memory_path.name,
        "memory_bank_sha256": digest(memory_path), "memory_bank_values_sha256": hashlib.sha256(bank.tobytes()).hexdigest(),
        "training_image_sha256": train_digests, "image_digest_format": "rgb-pixels-with-size-v1",
        "training_manifest": str(manifest), "training_manifest_sha256": digest(manifest),
        "suggested_threshold": threshold, "calibration_required": False,
        "threshold_method": "independent_labeled_synthetic_calibration",
        "calibration_note": "阈值仅经独立合成图像校准；真实产线需要重新采样、建库和校准。",
        "calibration": {"policy": "recall_priority", "strategies": strategies, "normal_count": len(normal_scores),
                        "defect_count": len(defect_scores), "scope": "synthetic_calibration_only", "created_at": created,
                        "image_digest_format": "rgb-pixels-with-size-v1", "test_images_used": False},
        "calibration_image_scores": evidence, "created_at": created,
        "fit_and_calibration_seconds": round(time.perf_counter() - started, 4),
        "limitations": ["正常样本和缺陷样本均为程序生成纹理，不是真实工业产品。",
                        "校准集上的结果不能证明未知真实缺陷、产品或拍摄条件的准确率。",
                        "异常分数是特征距离，不是概率；演示阈值不能直接用于产线放行。",
                        "模型配置预先固定为 baseline224/stretch/sigma4；本次制品准备未加载测试图像或用测试集调参。"],
    }
    smoke = []
    for row in [next(row for row in calibration_rows if row["label"] == "normal"),
                next(row for row in calibration_rows if row["scenario"] == "obvious_scratch")]:
        with closing(load_rgb(dataset / row["path"])) as image:
            result = detector.predict(image, reloaded, threshold)
            VisionService._validate_result(result, "patchcore", image.size)
        smoke.append({"sample_id": row["sample_id"], "split": "calibration", "status": result["status"],
                      "score": result["score"], "defect_count": len(result["defects"])})
    patch_metadata["runtime_smoke_tests"] = smoke
    write_json(patch_dir / "model.json", patch_metadata)
    shutil.copy2(dataset / "dataset.json", patch_dir / "dataset-source.json")

    # Check the stable ONNX with the same adapter used by the application.
    with closing(load_rgb(dataset / train[0]["path"])) as image:
        yolo_result = YoloDetector(str(yolo_path)).predict(image, confidence=0.25, iou=0.45)
        VisionService._validate_result(yolo_result, "yolo", image.size)
    yolo_metadata["runtime_smoke_test"] = {"input_kind": "out_of_domain_synthetic_normal", "status": yolo_result["status"],
                                           "detected_classes": [value["label"] for value in yolo_result["defects"]],
                                           "scope": "runtime_only_not_accuracy"}
    write_json(yolo_dir / "model.json", yolo_metadata)
    write_json(yolo_dir / "provenance.json", {
        "source_url": yolo_metadata["source_url"], "download_url": YOLO_URL,
        "expected_sha256": YOLO_SHA, "verified_sha256": digest(yolo_path), "bytes": yolo_path.stat().st_size,
        "license": "AGPL-3.0", "classes": CLASSES, "created_at": created,
        "limitations": yolo_metadata["limitations"],
    })
    write_json(output / "manifest.json", {
        "created_at": created, "provisioning_script": str(Path(__file__).resolve()),
        "provisioning_script_sha256": digest(__file__),
        "models": [{"directory": str(yolo_dir), **yolo_metadata}, {"directory": str(patch_dir), **patch_metadata}],
        "files": {str(path.relative_to(output)): {"sha256": digest(path), "bytes": path.stat().st_size}
                  for folder in (yolo_dir, patch_dir) for path in sorted(folder.iterdir()) if path.is_file()},
        "settings_changed": False, "services_restarted": False,
    })
    print(json.dumps({"manifest": str(output / "manifest.json"), "yolo_weights": str(yolo_path),
                      "yolo_metadata": str(yolo_dir / "model.json"), "patchcore_preset_dir": str(patch_dir),
                      "patchcore_memory_size": len(bank), "patchcore_threshold": threshold,
                      "patchcore_memory_bank_sha256": digest(memory_path),
                      "patchcore_memory_bank_values_sha256": hashlib.sha256(bank.tobytes()).hexdigest(),
                      "patchcore_smoke_tests": smoke}, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    main()
