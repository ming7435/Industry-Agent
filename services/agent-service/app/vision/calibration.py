"""Threshold selection from labeled calibration scores, never final test scores.

An image is anomalous iff its raw score >= the positive threshold. Policies use
class-normalized rates so changing the normal/defect sample ratio alone does not
change the relative cost. A zero-FP policy is a calibration-set observation only.
"""
from __future__ import annotations

import math
from numbers import Real


def _scores(values):
    if isinstance(values, (str, bytes)):
        raise ValueError('scores must be a sequence of finite nonnegative numbers')
    try:
        result = list(values)
    except TypeError:
        raise ValueError('scores must be a sequence') from None
    if not result or any(isinstance(value, bool) or not isinstance(value, Real)
                         or not math.isfinite(value) or value < 0 for value in result):
        raise ValueError('each calibration class needs finite nonnegative scores')
    return [float(value) for value in result]


def _metrics(normal, defect, threshold):
    fp = sum(score >= threshold for score in normal)
    tp = sum(score >= threshold for score in defect)
    fn, tn = len(defect) - tp, len(normal) - fp
    return {'tp': tp, 'fn': fn, 'tn': tn, 'fp': fp,
            'normal_count': len(normal), 'defect_count': len(defect),
            'recall': tp / len(defect), 'fnr': fn / len(defect), 'fpr': fp / len(normal),
            'precision': tp / (tp + fp) if tp + fp else None}


def threshold_strategies(normal_scores, defect_scores):
    normal, defect = _scores(normal_scores), _scores(defect_scores)
    upper = math.nextafter(max(normal + defect), math.inf)
    zero_fp_threshold = math.nextafter(max(normal), math.inf)
    if not math.isfinite(upper):
        raise ValueError('scores do not allow a finite upper threshold')
    candidates = sorted({math.nextafter(0.0, math.inf), upper,
                         *(score for score in normal + defect if score > 0)})
    rows = [{'threshold': threshold, 'metrics': _metrics(normal, defect, threshold)}
            for threshold in candidates]

    def best(cost):
        selected = min(rows, key=lambda row: (
            cost * row['metrics']['fnr'] + row['metrics']['fpr'],
            row['metrics']['fnr'] if cost > 1 else row['metrics']['fpr'],
            row['metrics']['fpr'], -row['threshold']))
        return {**selected, 'objective': f'{cost}*FNR+FPR'}

    return {'recall_priority': best(5), 'balanced': best(1),
            'zero_fp': {'threshold': zero_fp_threshold,
                        'metrics': _metrics(normal, defect, zero_fp_threshold),
                        'objective': 'FP=0 on calibration only; minimum feasible threshold'}}
