"""Compare synthetic fine-tuning against frozen v3 on identical real images."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
RUN = ROOT / "output/gear-yolo-synthetic-v1"
BASELINE = ROOT / "output/gear-yolo-full-v1"
sys.path.insert(0, str(ROOT / "services/agent-service"))

from app.vision.yolo_evaluation import class_aware_localization


def read(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def identity(report: dict):
    return [(row["sample_id"], row["pixel_sha256"], row["group_id"], row["ground_truth"])
            for row in sorted(report["samples"], key=lambda item: item["sample_id"])]


def scores(report: dict) -> dict:
    config = report["config"]
    category = class_aware_localization(report["samples"], config["confidence"], config["match_iou"])
    counts = report["metrics"]["overall"]
    denominator = 2 * counts["tp"] + counts["fn"] + counts["fp"]
    return {"class_and_position": category, "spatial": counts,
            "spatial_f1": 2 * counts["tp"] / denominator if denominator else 0.0}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--split", required=True, choices=("calibration", "test"))
    args = parser.parse_args()
    split = args.split
    old = read(BASELINE / f"candidate-{split}.json")
    new = read(RUN / f"candidate-{split}.json")
    frozen = read(RUN / "training-result.json")
    manifest = ROOT / "output/gear-full-dataset/prepared/manifest.json"
    baseline_weights = ROOT / ".runtime/quality-models/yolo11-gear-v3/best.pt"
    if (old["split"] != split or new["split"] != split
            or old["manifest_sha256"] != digest(manifest)
            or new["manifest_sha256"] != digest(manifest)
            or old["weights_sha256"] != digest(baseline_weights)
            or new["weights_sha256"] != frozen["sha256"]
            or frozen["sha256"] != digest(Path(frozen["best"]))
            or new["config"] != old["config"]
            or identity(old) != identity(new)):
        raise ValueError("paired real-image evaluation mismatch")
    before, after = scores(old), scores(new)
    accepted = (after["class_and_position"]["f1"] > before["class_and_position"]["f1"]
                and after["spatial_f1"] >= before["spatial_f1"])
    report = {"split": split, "images": len(old["samples"]),
              "rule": "class-and-position F1 must improve and spatial F1 must not decrease",
              "v3": before, "synthetic_finetuned": after,
              "accepted_for_research_model": accepted,
              "new_real_images": 0, "new_synthetic_training_images": 2337}
    path = RUN / f"{split}-comparison.json"
    with path.open("x", encoding="utf-8") as stream:
        json.dump(report, stream, ensure_ascii=False, indent=2)
    print(json.dumps({"split": split, "images": len(old["samples"]),
                      "v3_class_f1": before["class_and_position"]["f1"],
                      "candidate_class_f1": after["class_and_position"]["f1"],
                      "v3_spatial_f1": before["spatial_f1"],
                      "candidate_spatial_f1": after["spatial_f1"],
                      "accepted": accepted}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
