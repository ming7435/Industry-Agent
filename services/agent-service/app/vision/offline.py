"""Streaming PatchCore memory construction for explicitly counted offline datasets.

The HTTP training limit remains in ``PatchCoreDetector.fit``. This separate path
extracts every declared image and retains only bounded per-image representatives.
Callers own the image iterator and should close each image after it is yielded.
"""
from __future__ import annotations

import math

from .algorithms import (
    MAX_CALIBRATION_PATCHES,
    MAX_MEMORY_SIZE,
    MAX_TRAINING_SAMPLES,
    PROJECTION_DIM,
    _feature_matrix,
    _numpy,
    _validate_image,
    greedy_coreset,
    nearest_distances,
)
from .preprocessing import _patchcore_transform, parse_patchcore_config


MAX_OFFLINE_CANDIDATES = MAX_TRAINING_SAMPLES * 56 * 56
_GREEDY_METHOD = "deterministic_greedy_k_center_random_projection"


def fit_full_memory(detector, images, expected_count: int, per_image_features=32,
                    coreset_ratio=.1, progress=None):
    """Fit using all images, then local and global greedy coresets of original rows.

    No images are silently dropped. A short/long iterator or an invalid feature
    matrix aborts construction. The training-distance threshold is an initial
    heuristic and requires independent labeled calibration before deployment.
    """
    if type(expected_count) is not int or expected_count < 2:
        raise ValueError("expected_count must be an integer of at least 2 normal images")
    if type(per_image_features) is not int or not 1 <= per_image_features <= MAX_MEMORY_SIZE:
        raise ValueError("per_image_features must be an integer between 1 and 1024")
    max_candidates = expected_count * per_image_features
    if max_candidates > MAX_OFFLINE_CANDIDATES:
        raise ValueError(f"expected_count * per_image_features exceeds {MAX_OFFLINE_CANDIDATES} candidate features")
    if type(coreset_ratio) not in (int, float) or not math.isfinite(coreset_ratio) or not 0 < coreset_ratio <= 1:
        raise ValueError("coreset_ratio must be finite and in (0, 1]")
    if progress is not None and not callable(progress):
        raise ValueError("progress must be callable")
    config = parse_patchcore_config(detector.config)
    np = _numpy()
    candidates = None
    image_count = raw_count = eligible_count = candidate_count = 0
    feature_dimension = None

    def report(phase):
        if progress is not None:
            progress({"phase": phase, "completed": image_count, "total": expected_count,
                      "candidate_feature_count": candidate_count})

    for original in images:
        if image_count >= expected_count:
            raise ValueError("image count exceeds expected_count; refusing to truncate the dataset")
        image = _validate_image(original)
        try:
            features, grid = detector._extract_features(image)
            features = _feature_matrix(features)
            if not isinstance(grid, (tuple, list)) or len(grid) != 2 \
                    or any(type(size) is not int or size <= 0 for size in grid) \
                    or grid[0] * grid[1] != len(features):
                raise ValueError("feature grid must match the nonempty feature matrix")
            if feature_dimension is None:
                feature_dimension = int(features.shape[1])
                # One fixed allocation; never keep a list of full image features.
                candidates = np.empty((max_candidates, feature_dimension), dtype=np.float32)
            elif features.shape[1] != feature_dimension:
                raise ValueError("feature dimension changed within the offline dataset")
            raw_count += len(features)
            if config["resize_mode"] == "letterbox":
                left, top, right, bottom = _patchcore_transform(image.size, config)["content_box"]
                size = config["input_size"]
                centers_x = (np.arange(grid[1]) + .5) * size / grid[1]
                centers_y = (np.arange(grid[0]) + .5) * size / grid[0]
                valid = ((centers_y >= top) & (centers_y < bottom))[:, None] \
                    & ((centers_x >= left) & (centers_x < right))[None, :]
                features = features[valid.reshape(-1)]
                if not len(features):
                    raise ValueError("Letterbox training content contains no patch centers")
            eligible_count += len(features)
            local = greedy_coreset(features, ratio=1.0, max_size=per_image_features)
            candidates[candidate_count:candidate_count + len(local)] = local
            candidate_count += len(local)
            image_count += 1
            del features, local
        finally:
            # Only close a conversion owned here; original images belong to the caller.
            if image is not original:
                image.close()
        report("extract")
        del image, original
    if image_count != expected_count:
        raise ValueError(f"image count {image_count} does not match expected_count {expected_count}")

    candidates = candidates[:candidate_count]
    report("coreset")
    memory_bank = greedy_coreset(candidates, ratio=coreset_ratio, max_size=MAX_MEMORY_SIZE)
    report("calibration")
    calibration_count = min(candidate_count, MAX_CALIBRATION_PATCHES)
    calibration = candidates[np.linspace(0, candidate_count - 1, calibration_count, dtype=int)]
    distances = nearest_distances(calibration, memory_bank)
    suggested = max(.001, float(np.quantile(distances, .99)) * 1.2)
    metadata = {
        "algorithm": "patchcore",
        "pipeline_version": 2,
        "preprocessing": dict(config),
        "config": dict(config),
        "backbone": "resnet18_layer2_layer3",
        "sample_count": image_count,
        "expected_sample_count": expected_count,
        "all_images_processed": True,
        "patch_count": eligible_count,
        "original_feature_count": raw_count,
        "eligible_feature_count": eligible_count,
        "candidate_feature_count": candidate_count,
        "selected_features": len(memory_bank),
        "memory_size": len(memory_bank),
        "feature_dimension": feature_dimension,
        "input_size": config["input_size"],
        "coreset_ratio": float(coreset_ratio),
        "coreset_method": "hierarchical_" + _GREEDY_METHOD,
        "local_coreset_method": _GREEDY_METHOD,
        "local_coreset_max_features": per_image_features,
        "global_coreset_method": _GREEDY_METHOD,
        "global_coreset_max_features": MAX_MEMORY_SIZE,
        "max_candidate_features": MAX_OFFLINE_CANDIDATES,
        "sampling_note": "Every image is extracted; local then global greedy k-center selects original feature rows. "
                         "The final memory need not contain a representative from every image.",
        "padding_policy": "letterbox patch centers outside image content are excluded",
        "projection_dimension": min(PROJECTION_DIM, feature_dimension),
        "projection_seed": 0,
        "calibration_patch_count": calibration_count,
        "suggested_threshold": suggested,
        "threshold_method": "heuristic_training_candidate_patch_p99_times_1.2_floor_0.001",
        "calibration_required": True,
        "calibration_note": "Initial threshold uses sampled training candidates, not held-out images. "
                            "Validate on separate normal and defective images; distances are not probabilities.",
        "score_method": "max_smoothed_pixel_nearest_neighbor_distance",
    }
    report("complete")
    return {"memory_bank": memory_bank, "metadata": metadata}
