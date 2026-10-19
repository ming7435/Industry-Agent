import math

import pytest

from app.vision.calibration import threshold_strategies


def test_threshold_policies_preserve_equality_and_tradeoffs():
    strategies = threshold_strategies([1, 2, 3, 4], [2, 2.5, 3, 5])
    recall = strategies['recall_priority']
    zero = strategies['zero_fp']
    assert recall['metrics']['fn'] == 0
    assert recall['metrics']['fp'] == 3  # score == threshold is a detection
    assert zero['threshold'] == math.nextafter(4.0, math.inf)
    assert zero['metrics']['fp'] == 0 and zero['metrics']['fn'] == 3
    assert recall['metrics']['normal_count'] == 4
    assert recall['metrics']['defect_count'] == 4
    for value in strategies.values():
        metrics = value['metrics']
        assert metrics['fnr'] == metrics['fn'] / 4
        assert metrics['fpr'] == metrics['fp'] / 4
        assert metrics['recall'] == metrics['tp'] / 4


def test_perfectly_separable_scores_and_deterministic_ties():
    a = threshold_strategies([0, 0.1, 0.2], [2, 3, 4])
    b = threshold_strategies([0.2, 0, 0.1], [4, 2, 3])
    assert a == b
    for policy in a.values():
        assert policy['metrics']['fn'] == policy['metrics']['fp'] == 0
        assert policy['threshold'] > 0


def test_all_zero_scores_cannot_be_detected_with_positive_threshold():
    for policy in threshold_strategies([0, 0], [0]).values():
        assert policy['threshold'] > 0
        assert policy['metrics']['tp'] == 0
        assert policy['metrics']['precision'] is None


@pytest.mark.parametrize('normal,defect', [
    ([], [1]), ([0], []), ([float('nan')], [1]), ([0], [float('inf')]),
    ([-1], [1]), ([True], [1]), ([0], ['1']), ('123', [1]),
])
def test_calibration_requires_finite_labeled_independent_class_scores(normal, defect):
    with pytest.raises(ValueError):
        threshold_strategies(normal, defect)
