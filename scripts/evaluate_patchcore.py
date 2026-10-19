"""Run a pre-registered synthetic stress test or an explicitly split real manifest.

Example (repository root):
  .venv/Scripts/python scripts/evaluate_patchcore.py --synthetic
  .venv/Scripts/python scripts/evaluate_patchcore.py --manifest samples.csv --output output/real-eval

CSV/JSON rows: split, label, scenario, path, optional mask_path and group_id.
Training is normal only. Calibration chooses thresholds/configuration; test is
evaluated after the choice is locked. Image and object identities must not leak.
"""
from __future__ import annotations

import argparse
import csv
from datetime import datetime, timezone
import importlib.metadata
import json
import math
import os
from pathlib import Path
import platform
import shutil
import sys
import time

# Avoid large BLAS thread pools for bounded nearest-neighbor blocks on CPU.
for _variable in ("OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "OMP_NUM_THREADS"):
    os.environ.setdefault(_variable, "1")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "agent-service"))

import numpy as np
from PIL import Image, ImageDraw, ImageOps

from app.vision.evaluation import (
    SCENARIOS, file_sha256, generate_synthetic_dataset, load_manifest, load_rgb,
    metrics_from_scores, scenario_metrics, threshold_sweep,
)


CONFIGURATIONS = [
    {"id": "baseline_224_stretch_sigma4", "input_size": 224, "resize_mode": "stretch", "contrast": "none", "blur_sigma": 4.0, "coreset_ratio": 0.1},
    {"id": "224_stretch_sigma2", "input_size": 224, "resize_mode": "stretch", "contrast": "none", "blur_sigma": 2.0, "coreset_ratio": 0.1},
    {"id": "448_stretch_sigma2", "input_size": 448, "resize_mode": "stretch", "contrast": "none", "blur_sigma": 2.0, "coreset_ratio": 0.1},
    {"id": "448_letterbox_sigma2", "input_size": 448, "resize_mode": "letterbox", "contrast": "none", "blur_sigma": 2.0, "coreset_ratio": 0.1},
    {"id": "448_letterbox_clahe_sigma2", "input_size": 448, "resize_mode": "letterbox", "contrast": "clahe", "blur_sigma": 2.0, "coreset_ratio": 0.1},
]


def write_json(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False), encoding="utf-8")


def write_csv(path, rows):
    if not rows:
        return
    fields = list(dict.fromkeys(key for row in rows for key in row))
    with Path(path).open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: json.dumps(value, ensure_ascii=False) if isinstance(value, (dict, list)) else value for key, value in row.items()})


def choose_configuration(calibration_results):
    """Predeclared tie breaks: cost, FNR, FPR, then configuration order."""
    return min(calibration_results, key=lambda item: (
        5 * item["strategies"]["recall_priority"]["metrics"]["fnr"] + item["strategies"]["recall_priority"]["metrics"]["fpr"],
        item["strategies"]["recall_priority"]["metrics"]["fnr"],
        item["strategies"]["recall_priority"]["metrics"]["fpr"],
        item["preregistered_order"],
    ))["config"]["id"]


def _environment():
    versions = {}
    for package in ("numpy", "Pillow", "torch", "torchvision", "opencv-python-headless", "opencv-python", "matplotlib"):
        try:
            versions[package] = importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError:
            pass
    return {"python": sys.version, "platform": platform.platform(), "processor": platform.processor(),
            "packages": versions, "thread_environment": {key: os.environ.get(key) for key in ("OMP_NUM_THREADS", "MKL_NUM_THREADS", "OPENBLAS_NUM_THREADS")}}


def make_figures(output, summary, scored_rows, examples):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.ticker import PercentFormatter

    synthetic = summary["data_kind"] == "synthetic"
    banner = "SYNTHETIC STRESS TEST — NOT INDUSTRIAL ACCURACY" if synthetic else "USER MANIFEST — HELD-OUT TEST"
    baseline = summary["configurations"][0]
    selected = next(item for item in summary["configurations"] if item["config"]["id"] == summary["selection"]["config_id"])
    reference_label = "Baseline" if baseline["config"]["id"] == "baseline_224_stretch_sigma4" else f"{baseline['config']['coreset_ratio']:.0%} coreset"
    comparisons = [(f"{reference_label} / training heuristic", baseline, "training_heuristic"),
                   (f"{reference_label} / calibrated recall", baseline, "recall_priority"),
                   ("Selected / calibrated recall", selected, "recall_priority")]
    scenarios = sorted(baseline["test"]["training_heuristic"]["scenarios"])
    fig, ax = plt.subplots(figsize=(15, 6.5), layout="constrained")
    x = np.arange(len(scenarios))
    colors = ("#8d99ae", "#e69f00", "#0072b2")
    for index, (label, result, strategy) in enumerate(comparisons):
        metrics = result["test"][strategy]
        values = [metrics["scenarios"][scenario]["fnr"] for scenario in scenarios]
        ax.bar(x + (index - 1) * 0.25, values, 0.24, label=f"{label}; normal FPR {metrics['overall']['fpr']:.1%}", color=colors[index])
    ax.set_xticks(x, [f"{scenario.replace('_', ' ')}\nn={baseline['test']['training_heuristic']['scenarios'][scenario]['defect_n']}" for scenario in scenarios], rotation=22, ha="right", fontsize=9)
    ax.set_ylim(0, 1.12)
    ax.yaxis.set_major_formatter(PercentFormatter(1))
    ax.set_ylabel("Defect images missed / defect images (FNR)")
    ax.set_title(banner + "\nHeld-out test misses by predeclared scenario")
    ax.grid(axis="y", alpha=0.2)
    ax.legend(loc="upper left", fontsize=9)
    fig.savefig(output / "scenario_fnr.png", dpi=160)
    plt.close(fig)

    # Every predeclared configuration is shown, even when the selected baseline has no misses.
    all_results = summary["configurations"]
    matrix = np.array([[result["test"]["recall_priority"]["scenarios"][scenario]["fnr"]
                        for scenario in scenarios] for result in all_results])
    fig, (ax, fp_ax) = plt.subplots(1, 2, figsize=(16, 5.5), width_ratios=(5, 1), layout="constrained")
    im = ax.imshow(matrix, cmap="YlOrRd", vmin=0, vmax=1, aspect="auto")
    ax.set_xticks(np.arange(len(scenarios)), [scenario.replace("_", " ") for scenario in scenarios], rotation=30, ha="right", fontsize=9)
    ax.set_yticks(np.arange(len(all_results)), [result["config"]["id"] for result in all_results], fontsize=9)
    for row_index, result in enumerate(all_results):
        for column, scenario in enumerate(scenarios):
            point = result["test"]["recall_priority"]["scenarios"][scenario]
            ax.text(column, row_index, f"{point['fn']}/{point['defect_n']}\n{point['fnr']:.0%}", ha="center", va="center", fontsize=9,
                    color="white" if point["fnr"] > 0.55 else "black")
    fp_values = np.array([[result["test"]["recall_priority"]["overall"]["fpr"]] for result in all_results])
    fp_ax.imshow(fp_values, cmap="Blues", vmin=0, vmax=1, aspect="auto")
    fp_ax.set_xticks([0], ["Normal FPR"])
    fp_ax.set_yticks([])
    for row_index, result in enumerate(all_results):
        point = result["test"]["recall_priority"]["overall"]
        fp_ax.text(0, row_index, f"{point['fp']}/{point['normal_n']}\n{point['fpr']:.1%}", ha="center", va="center", fontsize=10)
    fig.colorbar(im, ax=ax, shrink=0.7, label="Image-level FNR")
    fig.suptitle(banner + "\nAll predeclared configurations; thresholds fixed by calibration recall objective (5*FNR+FPR)")
    fig.savefig(output / "ablation_scenario_fnr.png", dpi=160)
    plt.close(fig)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5), layout="constrained")
    for ax, item in zip(axes, (baseline, selected)):
        rows = [row for row in scored_rows if row["config_id"] == item["config"]["id"] and row["split"] == "test"]
        for label, color in (("normal", "#0072b2"), ("defect", "#d55e00")):
            ax.hist([row["score"] for row in rows if row["label"] == label], bins=20, alpha=0.6, label=label, color=color)
        for strategy, style in (("training_heuristic", ":"), ("recall_priority", "--"), ("balanced", "-."), ("zero_fp", "-")):
            ax.axvline(item["strategies"][strategy]["threshold"], linestyle=style, linewidth=1.5, label=strategy)
        ax.set_title(item["config"]["id"])
        ax.set_xlabel("Raw max anomaly distance (not a probability)")
        ax.set_ylabel("Number of test images")
        ax.legend(fontsize=8)
    fig.suptitle(banner + "\nThresholds fixed using calibration before test scoring")
    fig.savefig(output / "score_distributions.png", dpi=160)
    plt.close(fig)

    # Raw image / injected ground-truth mask / anomaly map. First test item per scenario.
    entries = [item for key, item in sorted(examples.items()) if key[0] == selected["config"]["id"]]
    if entries:
        import cv2
        tile_w, tile_h = 288, 156
        canvas = Image.new("RGB", (tile_w * 3, 66 + (tile_h + 28) * len(entries)), "white")
        draw = ImageDraw.Draw(canvas)
        draw.text((8, 8), banner.replace("—", "-"), fill="black")
        draw.text((8, 26), f"Selected: {selected['config']['id']}; first test image per scenario", fill="black")
        draw.text((8, 44), "IMAGE                                      INJECTED MASK                            ANOMALY HEATMAP", fill="black")
        threshold = selected["strategies"]["recall_priority"]["threshold"]
        for index, entry in enumerate(entries):
            row, heatmap = entry["row"], entry["heatmap"]
            original = load_rgb(row["path"])
            mask = load_rgb(row["mask_path"]) if row["mask_path"] else Image.new("RGB", original.size, "black")
            scaled = np.clip(heatmap / threshold * 127.5, 0, 255).astype(np.uint8)
            color = cv2.cvtColor(cv2.applyColorMap(scaled, cv2.COLORMAP_TURBO), cv2.COLOR_BGR2RGB)
            overlay = Image.blend(original, Image.fromarray(color), 0.45)
            top = 66 + index * (tile_h + 28)
            for column, image in enumerate((original, mask, overlay)):
                thumb = ImageOps.contain(image, (tile_w - 4, tile_h))
                canvas.paste(thumb, (column * tile_w + 2, top))
            decision = "DETECTED" if row["score"] >= threshold else "MISSED"
            draw.text((8, top + tile_h + 2), f"{row['scenario']} | {row['domain']} | score {row['score']:.4f} / threshold {threshold:.4f} | {decision}", fill="black")
        canvas.save(output / "synthetic_examples.png" if synthetic else output / "manifest_examples.png")


def run(args):
    from app.vision.algorithms import PatchCoreDetector
    from app.vision.calibration import threshold_strategies
    import torch
    torch.set_num_threads(args.torch_threads)
    torch.set_num_interop_threads(1)
    started = time.perf_counter()
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    if (output / "summary.json").exists() and not args.overwrite:
        raise ValueError("output already contains summary.json; choose another output or explicitly use --overwrite")
    manifest = Path(args.manifest).resolve() if args.manifest else generate_synthetic_dataset(
        output / "dataset", seed=args.seed, train_normal=args.train_normal,
        calibration_normal=args.calibration_normal, calibration_per_scenario=args.calibration_per_scenario,
        test_normal=args.test_normal, test_per_scenario=args.test_per_scenario,
    )
    samples = load_manifest(manifest)
    write_csv(output / "validated_manifest.csv", samples)
    configurations = [dict(item) for item in CONFIGURATIONS]
    if args.include_small_coreset:
        configurations.append({**CONFIGURATIONS[0], "id": "224_stretch_sigma4_coreset001", "coreset_ratio": 0.01})
    if args.configs:
        requested = args.configs.split(",")
        unknown = set(requested) - {item["id"] for item in configurations}
        if unknown:
            raise ValueError(f"unknown configurations: {sorted(unknown)}")
        configurations = [item for item in configurations if item["id"] in requested]
    weights = Path(args.weights).resolve(strict=True)
    source_paths = [Path(__file__), ROOT / "services/agent-service/app/vision/algorithms.py",
                    ROOT / "services/agent-service/app/vision/evaluation.py", ROOT / "services/agent-service/app/vision/calibration.py",
                    ROOT / "services/agent-service/app/vision/preprocessing.py"]
    data_kind = "synthetic" if args.synthetic else args.data_kind
    dataset_metadata_path = manifest.parent / "dataset.json"
    dataset_metadata = json.loads(dataset_metadata_path.read_text(encoding="utf-8")) if data_kind == "synthetic" and dataset_metadata_path.exists() else None
    provenance = {
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "seed": args.seed if args.synthetic else (dataset_metadata or {}).get("seed"),
        "data_kind": data_kind, "dataset_metadata": dataset_metadata,
        "manifest": str(manifest), "manifest_sha256": file_sha256(manifest),
        "weights": str(weights), "weights_sha256": file_sha256(weights),
        "source_sha256": {str(path.relative_to(ROOT)): file_sha256(path) for path in source_paths},
        "environment": _environment(), "torch_threads": args.torch_threads,
    }
    plan = {
        **provenance, "configurations": configurations,
        "selection_rule": "calibration only: minimize 5*FNR+FPR at recall_priority threshold; tie FNR, FPR, preregistered config order",
        "threshold_rule": "calibration only; recall_priority=5*FNR+FPR, balanced=FNR+FPR, zero_fp=nextafter(max(normal),+infinity)",
        "training_heuristic": "normal training patch p99 times 1.2; not a calibrated image threshold",
        "decision_rule": "image score = max(raw anomaly_map); defect iff score >= threshold",
        "test_policy": "Lock recommended config and all thresholds after calibration, then score test for every predeclared ablation once. No test-based threshold tuning.",
        "localization_policy": "Metrics are image-level; an image flagged positive does not establish correct defect localization.",
    }
    write_json(output / "preregistered_plan.json", plan)
    for path in source_paths:
        snapshot = output / "source_snapshot" / path.relative_to(ROOT)
        snapshot.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, snapshot)
        if file_sha256(snapshot) != provenance["source_sha256"][str(path.relative_to(ROOT))]:
            raise RuntimeError("evaluation source changed while preparing source snapshot")
    train_images = [load_rgb(row["path"]) for row in samples if row["split"] == "train"]
    calibration = [row for row in samples if row["split"] == "calibration"]
    tests = [row for row in samples if row["split"] == "test"]
    fitted_cache, models, results, scores, sweeps = {}, {}, [], [], []
    for index, config in enumerate(configurations):
        print(f"CALIBRATION {index + 1}/{len(configurations)} {config['id']}", flush=True)
        preprocessing = {key: value for key, value in config.items() if key not in {"id", "coreset_ratio"}}
        detector = PatchCoreDetector(str(weights), config=preprocessing)
        # Sigma changes postprocessing only, so the same normal memory bank is valid.
        bank_key = (config["input_size"], config["resize_mode"], config["contrast"], config["coreset_ratio"])
        fit_start = time.perf_counter()
        cache_hit = bank_key in fitted_cache
        if not cache_hit:
            fitted_cache[bank_key] = detector.fit(train_images, coreset_ratio=config["coreset_ratio"])
        fitted = fitted_cache[bank_key]
        fit_seconds = time.perf_counter() - fit_start
        bank = fitted["memory_bank"]
        models[config["id"]] = (detector, bank)
        config_scores = []
        inference_start = time.perf_counter()
        for position, sample in enumerate(calibration):
            heatmap = detector.anomaly_map(load_rgb(sample["path"]), bank)
            if not np.isfinite(heatmap).all():
                raise ValueError("nonfinite anomaly map")
            config_scores.append({**sample, "config_id": config["id"], "score": float(heatmap.max())})
            if (position + 1) % 40 == 0:
                print(f"  calibration {position + 1}/{len(calibration)}", flush=True)
        strategies = threshold_strategies(
            [row["score"] for row in config_scores if row["label"] == "normal"],
            [row["score"] for row in config_scores if row["label"] == "defect"],
        )
        # Independent metrics ensure the report shares the exact >= contract.
        strategies["training_heuristic"] = {"threshold": fitted["metadata"]["suggested_threshold"],
                                             "objective": "training patch heuristic; no calibration optimization"}
        for strategy in strategies.values():
            strategy["metrics"] = metrics_from_scores(config_scores, strategy["threshold"])
        metadata = dict(fitted["metadata"])
        # Retain the original fit metadata verbatim: sigma2 can reuse a sigma4 bank
        # because sigma acts only after feature matching, but scoring is separate.
        result = {"config": config, "preregistered_order": index, "fit_metadata": metadata,
                  "bank_training_metadata": metadata, "scoring_preprocessing": preprocessing,
                  "training_feature_config": {key: value for key, value in preprocessing.items() if key != "blur_sigma"},
                  "effective_coreset_ratio": len(bank) / metadata["patch_count"],
                  "memory_cap_binding": math.ceil(metadata["patch_count"] * config["coreset_ratio"]) > 1024,
                  "fit_reused_same_preprocessing": cache_hit, "memory_bank_sha256": __import__("hashlib").sha256(bank.tobytes()).hexdigest(),
                  "fit_seconds": fit_seconds, "calibration_seconds": time.perf_counter() - inference_start,
                  "strategies": strategies,
                  "calibration": {name: scenario_metrics(config_scores, strategy["threshold"]) for name, strategy in strategies.items()}}
        scores.extend(config_scores)
        sweeps.extend({"config_id": config["id"], "split": "calibration", **point} for point in threshold_sweep(config_scores))
        results.append(result)
        write_csv(output / "calibration_scores.csv", scores)
        write_csv(output / "threshold_sweep.csv", sweeps)
        write_json(output / "calibration_results.json", results)

    selected_id = choose_configuration(results)
    selection = {"config_id": selected_id, "strategy": "recall_priority", "based_on": "calibration only",
                 "locked_before_test_scoring_utc": datetime.now(timezone.utc).isoformat(),
                 "rule": plan["selection_rule"]}
    write_json(output / "selection_locked.json", selection)
    print(f"LOCKED recommendation: {selected_id}; now scoring test", flush=True)
    examples = {}
    for index, result in enumerate(results):
        config = result["config"]
        detector, bank = models[config["id"]]
        print(f"TEST {index + 1}/{len(results)} {config['id']}", flush=True)
        inference_start = time.perf_counter()
        test_scores = []
        for position, sample in enumerate(tests):
            heatmap = detector.anomaly_map(load_rgb(sample["path"]), bank)
            if not np.isfinite(heatmap).all():
                raise ValueError("nonfinite anomaly map")
            row = {**sample, "config_id": config["id"], "score": float(heatmap.max())}
            test_scores.append(row)
            key = (config["id"], sample["scenario"])
            if config["id"] == selected_id and sample["label"] == "defect" and key not in examples:
                examples[key] = {"row": row, "heatmap": heatmap.copy()}
            if (position + 1) % 40 == 0:
                print(f"  test {position + 1}/{len(tests)}", flush=True)
        result["test_seconds"] = time.perf_counter() - inference_start
        result["test"] = {name: scenario_metrics(test_scores, strategy["threshold"]) for name, strategy in result["strategies"].items()}
        scores.extend(test_scores)
        write_csv(output / "scores.csv", scores)
    summary = {**provenance, "selection": selection, "configurations": results,
               "counts": {split: {label: sum(row["split"] == split and row["label"] == label for row in samples)
                                   for label in ("normal", "defect")} for split in ("train", "calibration", "test")},
               "elapsed_seconds": time.perf_counter() - started,
               "interpretation": ["SYNTHETIC results are stress-test evidence, not industrial accuracy." if data_kind == "synthetic" else "Results apply only to the explicitly provided held-out test set.",
                                  "Image-level detection does not verify defect localization.",
                                  "Wilson intervals are descriptive binomial intervals; procedural samples are not independent real production batches.",
                                  "No configuration or threshold was selected using test results."]}
    write_json(output / "summary.json", summary)
    comparison_rows = []
    for result in results:
        for strategy, evaluation in result["test"].items():
            comparison_rows.append({"config_id": result["config"]["id"], "strategy": strategy, **evaluation["overall"]})
    write_csv(output / "test_comparison.csv", comparison_rows)
    make_figures(output, summary, scores, examples)
    print(json.dumps({"output": str(output), "selected": selected_id, "elapsed_seconds": summary["elapsed_seconds"]}, indent=2), flush=True)
    return summary


def parser():
    result = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    source = result.add_mutually_exclusive_group(required=True)
    source.add_argument("--synthetic", action="store_true", help="Generate procedural stress cases; never claim industrial accuracy")
    source.add_argument("--manifest", help="CSV or JSON with explicit train/calibration/test split")
    result.add_argument("--data-kind", choices=("user_manifest", "synthetic"), default="user_manifest",
                        help="Origin label for --manifest; use synthetic when reusing generated stress-test images")
    result.add_argument("--weights", default=str(ROOT / ".runtime/quality-vision-validation/resnet18-f37072fd.pth"))
    result.add_argument("--output", default=str(ROOT / "output/patchcore-evaluation"))
    result.add_argument("--seed", type=int, default=20261019)
    result.add_argument("--train-normal", type=int, default=12)
    result.add_argument("--calibration-normal", type=int, default=24)
    result.add_argument("--calibration-per-scenario", type=int, default=8)
    result.add_argument("--test-normal", type=int, default=40)
    result.add_argument("--test-per-scenario", type=int, default=20)
    result.add_argument("--torch-threads", type=int, choices=range(1, 17), default=4)
    result.add_argument("--include-small-coreset", action="store_true")
    result.add_argument("--configs", help="Comma-separated subset of predeclared config ids, for a smoke run in a different output folder")
    result.add_argument("--overwrite", action="store_true", help="Explicitly replace an existing report in this output folder")
    return result


if __name__ == "__main__":
    run(parser().parse_args())
