"""Finish this experiment's calibration, frozen regression and isolated API check.

Select exactly one checkpoint on calibration before reading its test results.
This helper never changes the deployed model or the environment file.
"""
import json
from pathlib import Path
import subprocess
import sys
from time import monotonic, sleep

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / 'services/agent-service')]
from scripts.train_yolo_feature_separation import OUT
from scripts.train_yolo_fine_defects import read, save, digest

API = ROOT / 'output/quality-feature-defects-real-v5'


def run(script, *arguments):
    subprocess.run([sys.executable, str(ROOT / 'scripts' / script),
                    *map(str, arguments)], cwd=ROOT, check=True)


def main():
    started = monotonic()
    while True:
        try:
            decisions = read(OUT / 'calibration-progress.json')
            if {r['epoch'] for r in decisions} == {2, 4}:
                break
        except (FileNotFoundError, json.JSONDecodeError):
            pass
        if monotonic() - started > 7200:
            raise TimeoutError('The two calibration decisions did not finish')
        sleep(3)
    assert not (OUT / 'final-checkpoint-selection.json').exists()
    accepted = []
    for row in decisions:
        if row.get('full_calibration_passed'):
            selection = read(OUT / 'evaluation' / row['name'] / 'selection.json')
            assert selection['eligible']
            accepted.append((row, selection))
    if accepted:
        chosen, selected = max(accepted, key=lambda x: (
            x[1]['target_tp'], x[1]['metrics']['class_and_position']['f1']))
        name = chosen['name']
    else:
        ranked = read(OUT / 'calibration-triage-ranking.json')
        name = ranked[0]['name']
        chosen = next(r for r in decisions if r['name'] == name)
    weights = OUT / 'training' / f"epoch{chosen['epoch']}.pt"
    assert digest(weights) == chosen['weights_sha256']
    save(OUT / 'final-checkpoint-selection.json', {
        'name': name, 'epoch': chosen['epoch'], 'weights_sha256': digest(weights),
        'selection_split': 'calibration', 'test_used_for_checkpoint_selection': False,
        'diagnostic_only': not bool(accepted), 'calibration_decisions': decisions})
    folder = OUT / 'evaluation' / name
    common = ['--experiment-root', OUT, '--weights', weights, '--name', name]
    if not (folder / 'selection.json').exists():
        run('evaluate_yolo_fine_defects.py', *common, '--split', 'calibration')
    selected = read(folder / 'selection.json')
    if accepted:
        run('evaluate_yolo_fine_defects.py', *common, '--split', 'test')
        selection, result = folder / 'selection.json', folder / 'test-comparison.json'
    else:
        # The fixed triage includes all target GT; a failed target bound cannot
        # become acceptable by adding further negative/control images.
        assert not selected['eligible'], 'Triage and full-calibration gates disagree'
        run('verify_yolo_native_candidate.py', 'freeze-rejected',
            '--experiment-root', OUT, '--name', name)
        run('verify_yolo_native_candidate.py', 'evaluate', '--experiment-root', OUT)
        selection, result = OUT / 'diagnostic-freeze.json', OUT / 'diagnostic-test.json'
    run('verify_yolo_native_candidate.py', 'stage', '--experiment-root', OUT,
        '--selection', selection, '--test', result)
    run('verify_pipeline_real_images.py', '--out', API,
        '--yolo-deployment', OUT / 'staged-model', '--focus-labels', 'dirt', 'hair')
    save(OUT / 'validation-paths.json', {
        'selection': str(selection), 'test': str(result), 'api': str(API),
        'selection_sha256': digest(selection), 'test_sha256': digest(result),
        'api_report_sha256': digest(API / 'report.json'),
        'candidate_deployed': False})
    print({'validation_finished': True, 'paths': str(OUT / 'validation-paths.json')}, flush=True)


if __name__ == '__main__':
    main()
