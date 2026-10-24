"""Check training provenance, frozen regression, API parity and deployment guard."""
from datetime import datetime, timezone
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / 'services/agent-service')]
from scripts.train_yolo_feature_separation import OUT, ACTIVE
from scripts.train_yolo_fine_defects import read, save, digest, SOURCE


def main():
    paths = read(OUT / 'validation-paths.json')
    selection_path, test_path = Path(paths['selection']), Path(paths['test'])
    selection, result = read(selection_path), read(test_path)
    api_path = Path(paths['api']) / 'report.json'
    api = read(api_path)
    assert digest(selection_path) == paths['selection_sha256']
    assert digest(test_path) == paths['test_sha256']
    assert digest(api_path) == paths['api_report_sha256']
    assert result.get('selection_sha256', result.get('freeze_sha256')) == digest(selection_path)
    weights = Path(selection['weights'])
    assert digest(weights) == selection['weights_sha256'] == result['weights_sha256']
    assert selection['protocol_sha256'] == digest(OUT / 'protocol.json')
    manifest = read(SOURCE / 'manifest.json')
    assert digest(SOURCE / 'manifest.json') == selection['manifest_sha256']
    originals = {r['sample_id']: r for r in manifest['samples']}
    subset = read(OUT / 'subset.json')['samples']
    assert all(r['source_split'] == r['split'] == 'train' and
               originals[r['source_id']]['split'] == 'train' for r in subset)
    train_groups = {originals[r['source_id']]['group_id'] for r in subset}
    assert not train_groups & {r['group_id'] for r in originals.values() if r['split'] != 'train'}
    expected_test = {r['sample_id'] for r in originals.values() if r['split'] == 'test'}
    assert len(expected_test) == result['images'] == len(result['samples']) == 118
    assert {r['sample_id'] for r in result['samples']} == expected_test
    expected_focus = {r['sample_id'] for r in result['samples']
                      if any(g['label'] in ('dirt', 'hair') for g in r['ground_truth'])}
    assert {r['sample_id'] for r in api['samples']} == expected_focus and len(expected_focus) == 20
    offline = {r['sample_id']: r for r in result['samples']}
    for row in api['samples']:
        assert row['yolo_state'] == 'completed' and row['patchcore_status'] == 'defect'
        assert row['yolo_weights'] == digest(weights)
        expected = offline[row['sample_id']]
        assert row['ground_truth'] == expected['ground_truth']
        key = lambda p: (p['label'], *p['bbox'], p['confidence'])
        actual_boxes, expected_boxes = sorted(row['predictions'], key=key), sorted(expected['predictions'], key=key)
        assert len(actual_boxes) == len(expected_boxes)
        for a, b in zip(actual_boxes, expected_boxes):
            assert a['label'] == b['label']
            assert abs(a['confidence'] - b['confidence']) < 1e-5
            assert max(abs(x-y) for x,y in zip(a['bbox'], b['bbox'])) < 1e-4
        if not row['predictions']:
            assert row['classification'] == 'unknown_anomaly'
    history = read(OUT / 'training/history.json')
    assert [r['epoch'] for r in history] == [1, 2, 3, 4]
    for row in history:
        assert digest(OUT / 'training' / f"epoch{row['epoch']}.pt") == row['sha256']
    from scripts.train_yolo_geometric_refinement import runtime
    torch = runtime(); torch.set_num_threads(2)
    from ultralytics import YOLO
    before = YOLO(str(ACTIVE / 'best.pt')).model.float().state_dict()
    after = YOLO(str(weights)).model.float().state_dict()
    assert before.keys() == after.keys()
    changed = [k for k in before if not torch.equal(before[k], after[k])]
    assert changed and all(int(k.split('.')[1]) > 10 for k in changed)
    assert any(11 <= int(k.split('.')[1]) <= 22 for k in changed)
    baseline = read(OUT / 'baseline-deployment.json')
    assert digest(ACTIVE / 'best.pt') == baseline['weights_sha256']
    assert digest(ACTIVE / 'model.json') == baseline['metadata_sha256']
    from dotenv import dotenv_values
    env = dotenv_values(ROOT / '.env')
    assert Path(env['QUALITY_YOLO_WEIGHTS']).resolve() == (ACTIVE / 'best.pt').resolve()
    assert Path(env['QUALITY_YOLO_METADATA']).resolve() == (ACTIVE / 'model.json').resolve()
    pc = Path(env['QUALITY_PATCHCORE_GEAR_PRESET_DIR'])
    assert all(digest(pc / f) == sha for f,sha in baseline['patchcore'].items())
    suites = ET.parse(OUT / 'tests.xml').getroot().findall('testsuite')
    assert suites and all(int(s.attrib['failures']) == int(s.attrib['errors']) == 0 for s in suites)
    tests_passed = sum(int(s.attrib['tests']) - int(s.attrib['skipped']) for s in suites)
    protocol = read(OUT / 'protocol.json');gates = protocol['test_gates']
    cls, spatial = result['metrics']['class_and_position'], result['metrics']['spatial']
    failed = []
    if not selection['eligible']:failed.append('Calibration gate failed')
    for label in ('dirt', 'hair'):
        if cls['by_class'][label]['tp'] < gates[label + '_tp_min']:
            failed.append(f'{label}: recall did not meet the minimum')
        if cls['by_class'][label]['fp'] > gates['target_fp_max'][label]:
            failed.append(f'{label}: false boxes exceeded the limit')
    for name, actual, limit, lower in (
        ('overall TP', cls['tp'], gates['overall_tp_min'], True),
        ('overall FP', cls['fp'], gates['overall_class_fp_max'], False),
        ('spatial FP', spatial['fp'], gates['overall_spatial_fp_max'], False),
        ('F1', cls['f1'], gates['overall_f1_min'], True)):
        if (actual < limit) if lower else (actual > limit):failed.append(f'{name}: {actual} outside bound {limit}')
    assert bool(result['deployment_gate_passed']) == (not failed)
    data = read(OUT / 'data-summary.json')
    staged = read(OUT / 'staged-model/model.json')
    assert staged['training_images'] == len(subset) == data['unique_training_images']
    assert staged['training_source_photos'] == data['source_photos']
    proof = {'created_at': datetime.now(timezone.utc).isoformat(), 'tests_passed': tests_passed,
        'completed_training_epochs': len(history), 'training_inputs': len(subset),
        'training_source_photos': data['source_photos'], 'new_independent_photos': 0,
        'training_source_groups_disjoint': True, 'frozen_backbone_unchanged': True,
        'neck_parameters_changed': True, 'real_regression_images': 118,
        'actual_pipeline_images': 20, 'api_offline_prediction_match_images': 20,
        'calibration_gate_passed': bool(selection['eligible']),
        'candidate_eligible_for_deployment': not failed, 'candidate_deployed': False,
        'candidate_rejected': bool(failed), 'rejection_reasons': failed,
        'active_weights_and_metadata_unchanged': True, 'active_yolo_environment_paths_unchanged': True,
        'patchcore_files_unchanged': True, 'candidate_weights_sha256': digest(weights),
        'active_weights_sha256': digest(ACTIVE / 'best.pt'),
        'test_report_sha256': digest(test_path), 'actual_api_report_sha256': digest(api_path),
        'normal_gear_fpr_available': False, 'test_is_iterative_regression': True}
    save(OUT / 'verification.json', proof)
    print(proof, flush=True)


if __name__ == '__main__':main()
