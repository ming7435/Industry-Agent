"""Fine-tune v3 YOLO on the real plus synthetic training split only."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "output/gear-yolo-synthetic-v1"
RUN = DATA / "training"
SOURCE = ROOT / ".runtime/quality-models/yolo11-gear-v3"
sys.path.insert(0, str(ROOT / "services/agent-service"))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    summary = json.loads((DATA / "summary.json").read_text(encoding="utf-8"))
    metadata = json.loads((SOURCE / "model.json").read_text(encoding="utf-8"))
    weights = SOURCE / "best.pt"
    source_manifest = ROOT / "output/gear-full-dataset/prepared/manifest.json"
    yaml = DATA / "dataset/data.yaml"
    config = json.loads(yaml.read_text(encoding="utf-8"))
    if (summary["new_synthetic_images"] <= 2000 or summary["new_real_images"] != 0
            or summary["source_manifest_sha256"] != digest(source_manifest)
            or summary["source_real_train_images"] != 779
            or summary["expanded_train_images"] != 3116
            or summary["untouched_calibration_images"] != 188
            or summary["untouched_test_images"] != 118
            or config["names"] != metadata["classes"]
            or set(config) != {"path", "train", "val", "names", "nc"}
            or metadata["weights_sha256"] != digest(weights)):
        raise ValueError("synthetic data or frozen v3 baseline verification failed")
    images = list((DATA / "dataset/images/train").glob("*.png"))
    labels = list((DATA / "dataset/labels/train").glob("*.txt"))
    if len(images) != 3116 or len(labels) != 3116:
        raise ValueError("synthetic training split is incomplete")
    if RUN.exists():
        raise FileExistsError("training run already exists; preserve prior result")

    for variable in ("OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "OMP_NUM_THREADS"):
        os.environ[variable] = "2"
    os.environ.update(ULTRALYTICS_SAFE_LOAD="1", YOLO_AUTOINSTALL="false",
                      YOLO_OFFLINE="true", WANDB_MODE="disabled",
                      YOLO_CONFIG_DIR=str(DATA / "ultralytics-config"))
    import torch
    from ultralytics import YOLO
    from ultralytics.utils import SAFE_LOAD, SETTINGS, callbacks, torch_utils

    if SAFE_LOAD is not True:
        raise ValueError("safe-only checkpoint loading is required")
    callbacks.add_integration_callbacks = lambda instance: None
    SETTINGS.update({key: False for key in ("sync", "clearml", "comet", "dvc",
                                            "mlflow", "raytune", "tensorboard", "wandb")})
    torch_utils.NUM_THREADS = 2
    torch.set_num_threads(2)
    torch.set_num_interop_threads(2)
    model = YOLO(str(weights), task="detect")
    parameters = dict(data=str(yaml), epochs=2, patience=2, batch=4,
                      imgsz=640, freeze=0, device="cpu", workers=0, cache=False,
                      optimizer="AdamW", lr0=.0001, lrf=.1, resume=False,
                      mosaic=0.0, plots=False, deterministic=True, seed=20261022,
                      amp=False, project=str(DATA), name="training", exist_ok=False,
                      val=True, save=True)
    (DATA / "training-provenance.json").write_text(json.dumps({
        "source_model_sha256": digest(weights), "source_manifest_sha256": digest(source_manifest),
        "synthetic_manifest_sha256": digest(DATA / "synthetic-manifest.json"),
        "training_yaml_sha256": digest(yaml), "parameters": parameters,
        "train_real_images": 779, "train_synthetic_images": 2337,
        "calibration_images": 188, "test_used_in_training": False,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    model.train(**parameters)
    best = model.trainer.best.resolve(strict=True)
    (DATA / "training-result.json").write_text(json.dumps({
        "best": str(best), "sha256": digest(best),
        "source_model_sha256": digest(weights),
        "training_yaml_sha256": digest(yaml),
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"best": str(best), "sha256": digest(best)}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
