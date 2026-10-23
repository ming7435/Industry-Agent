"""Verify dataset crop geometry and precision-constrained threshold selection."""
from scripts.train_yolo_fine_defects import crop_truth
from scripts.evaluate_yolo_fine_defects import select


def defect(label, bbox, confidence=None):
    result = {'label': label, 'bbox': bbox}
    if confidence is not None:
        result['confidence'] = confidence
    return result


def test_crop_preserves_all_labels_and_translates_to_local_pixels():
    truth = [defect('dirt', [12, 14, 18, 20]), defect('darkspot', [21, 22, 25, 26]),
             defect('hair', [50, 50, 60, 60])]
    assert crop_truth(truth, [10, 10, 40, 40]) == [
        defect('dirt', [2, 4, 8, 10]), defect('darkspot', [11, 12, 15, 16])]
    assert crop_truth(truth, [10, 10, 17, 40]) is None
    assert crop_truth(truth, [0, 0, 10, 10]) == []


def policy():
    return {'confidence_grid': [.05, .5, 1.0], 'calibration_gates': {
        'dirt_tp_min': 1, 'hair_tp_min': 1, 'overall_tp_min': 2,
        'overall_class_fp_max': 0, 'overall_spatial_fp_max': 0, 'overall_f1_min': 1}}


def test_selection_keeps_both_targets_and_rejects_low_confidence_false_box():
    truth = [defect('dirt', [1, 1, 5, 5]), defect('hair', [10, 10, 20, 20])]
    predictions = [dict(g, confidence=.8) for g in truth] + [defect('hair', [40, 40, 50, 50], .1)]
    result = select([{'ground_truth': truth, 'predictions': predictions}], ['dirt', 'hair'], policy())
    assert result['eligible']
    assert result['thresholds'] == {'dirt': .5, 'hair': .5}
    assert result['metrics']['class_and_position']['tp'] == 2
    assert result['metrics']['spatial']['fp'] == 0


def test_unavoidable_false_box_cannot_be_promoted_for_recall_alone():
    truth = [defect('dirt', [1, 1, 5, 5]), defect('hair', [10, 10, 20, 20])]
    predictions = [dict(g, confidence=.8) for g in truth] + [defect('hair', [40, 40, 50, 50], .95)]
    result = select([{'ground_truth': truth, 'predictions': predictions}], ['dirt', 'hair'], policy())
    assert not result['eligible']


def test_explicit_target_false_box_cap_applies_even_when_overall_budget_allows_it():
    truth = [defect('dirt', [1, 1, 5, 5]), defect('hair', [10, 10, 20, 20])]
    predictions = [dict(g, confidence=.8) for g in truth] + [defect('hair', [40, 40, 50, 50], .95)]
    protocol = policy()
    protocol['calibration_gates'].update(overall_class_fp_max=10, overall_spatial_fp_max=10,
                                        overall_f1_min=0, target_fp_max={'dirt':0, 'hair':0})
    result = select([{'ground_truth': truth, 'predictions': predictions}], ['dirt', 'hair'], protocol)
    assert not result['eligible']


def test_classifier_preservation_penalizes_drift_without_blocking_target_learning():
    import torch
    from scripts.train_yolo_classifier_refinement import preservation_loss
    teacher = torch.tensor([[[[0.]], [[-1.]], [[2.]]]])
    student = (teacher + 1).requires_grad_()
    loss = preservation_loss([(student, teacher)], [0, 2])
    assert loss.item() > 0
    loss.backward()
    assert student.grad[0, 0].item() > 0
    assert student.grad[0, 2].item() > 0
    assert student.grad[0, 1].item() == 0
    assert preservation_loss([(teacher, teacher)], [0, 2]).item() == 0


def test_packed_classifier_preserves_existing_classes_and_refines_only_targets():
    import torch
    from torch import nn
    from ultralytics.nn.modules import Conv, DWConv
    from scripts.export_yolo_refined_classifier import pack_branch
    def branch():
        return nn.Sequential(nn.Sequential(DWConv(4,4,3),Conv(4,8,1)),
                             nn.Sequential(DWConv(8,8,3),Conv(8,8,1)),nn.Conv2d(8,3,1)).eval()
    torch.manual_seed(27)
    original, refined = branch(), branch()
    combined = pack_branch(original,refined,[1])
    inputs = torch.randn(2,4,13,17)
    with torch.no_grad():
        before, after, result = original(inputs),refined(inputs),combined(inputs)
    torch.testing.assert_close(result[:,[0,2]],before[:,[0,2]],atol=1e-6,rtol=1e-6)
    torch.testing.assert_close(result[:,1],after[:,1],atol=1e-6,rtol=1e-6)
    assert not torch.allclose(result[:,1],before[:,1])
