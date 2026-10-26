"""Record supplemental visual decisions without altering frozen experiments."""
from collections import Counter
from pathlib import Path
import patchcore_multiview_experiment as base


CONFIRMED = {
    '01476': 'Brown patch on side face in views 3 and 4; largest earlier crop showed an edge.',
    '01632': 'Brown spot on flat face beside bore in views 1, 2, 3 and 4.',
    '01795': 'Brown face spot above bore and brown tooth mark visible across views.',
    '01862': 'Tan/brown deposit at tooth root on object surface in views 0 and 1.',
    '00830': 'Brown marks on flat face/tooth in views 0, 3 and 4.',
    '02288': 'Tan/brown patch on lower-left tooth surface in view 0.',
    '02152': 'Brown streak on left flat face in view 0; earlier crop showed outer edge.',
    '02279': 'Brown spot on bore wall in view 3; other small face marks are also visible.',
    '02299': 'Brown mark on bore wall visible in views 1, 2 and 4.',
}
UNCERTAIN = {
    '01314': 'Small dark/edge region; cannot reliably distinguish deposit from shadow/background.',
    '00313': 'Small dark edge; no sufficiently clear brown surface deposit.',
    '01361': 'Faint gray/yellow edge; classification remains uncertain.',
    '01835': 'Dark edge region, insufficient color evidence.',
    '01152': 'Dark edge region, insufficient color evidence.',
    '01981': 'Tiny region outside object edge; attachment unclear.',
    '00082': 'Muted tooth-edge coloration; surface stain versus illumination unresolved.',
    '01606': 'Brownish speck at boundary; object versus background attachment unclear.',
    '01078': 'Brownish protruding edge region; attachment to object unclear.',
    '01204': 'Dim tooth-valley edge, insufficient evidence of a stain.',
    '01699': 'Brown proposal outside lower edge; curved dark surface traces in views 3/4 need separate defect review.',
    '01667': 'Dim bore/edge coloration; insufficient evidence of brown deposit.',
    '01691': 'Very small edge proposal, unclear attachment.',
    '00816': 'Dark specks/marks in bore and on teeth; category and acceptance unresolved.',
    '01773': 'Pale small surface tint and dark background proposal remain ambiguous.',
    '02261': 'Small blurred region at object boundary, insufficient stain evidence.',
    '02213': 'Dark tooth valley, insufficient stain evidence.',
    '02242': 'Dark edge proposals; no clear brown face spot.',
    '01244': 'Pale yellow/green edge tint can be illumination; not confirmed as brown stain.',
    '01671': 'Pale yellow/green spot near bore; not confirmed as brown stain.',
}


def main():
    out = base.ROOT / 'output/patchcore-label-review-all-views'
    manifest_path = base.ROOT / 'output/patchcore-label-audit-v2/corrected-manifest.json'
    frozen_paths = [manifest_path,
        base.ROOT / 'output/patchcore-reviewed-ablation-v5/comparison.json',
        base.ROOT / 'output/patchcore-chroma-study-v6/comparison.json']
    before = {str(p): base.sha(p) for p in frozen_paths}
    gallery = base.read(out / 'manifest.json')
    source = {r['sample_id']: r for r in base.read(manifest_path)}
    assert set(CONFIRMED).isdisjoint(UNCERTAIN)
    assert {r['sample_id'].rsplit('_', 1)[1] for r in gallery} == set(CONFIRMED) | set(UNCERTAIN)
    decisions = []
    for row in gallery:
        sid = row['sample_id']
        number = sid.rsplit('_', 1)[1]
        assert base.sha(Path(row['path'])) == row['gallery_sha256']
        assert base.sha(Path(source[sid]['path'])) == row['source_sha256']
        decision = 'confirmed_brown_stain' if number in CONFIRMED else 'unresolved'
        decisions.append({**row, 'decision': decision,
            'reason': CONFIRMED.get(number, UNCERTAIN.get(number)),
            'proposed_label': 'defect' if number in CONFIRMED else None,
            'reviewer': 'assistant_visual_review',
            'human_annotator_verified': False})
    result = dict(reviewed_at=base.now(),
        status='supplemental_review_only_not_applied_to_frozen_runs',
        rule='Visible brown surface spots are defects per user acceptance rule.',
        selection='26 previously uncertain calibration/test images plus 3 calibration color-outlier images.',
        limitation='Selected after earlier model analysis; not a blind labeling pass or a full-dataset audit.',
        counts=dict(Counter(r['decision'] for r in decisions)),
        confirmed_by_split=dict(Counter(r['split'] for r in decisions if r['decision']=='confirmed_brown_stain')),
        records=decisions, frozen_inputs_sha256=before,
        label_files_changed=False, deployment_allowed=False)
    base.write(out / 'supplemental-review.json', result)
    assert all(base.sha(Path(path)) == digest for path, digest in before.items())
    print(result['counts'], result['confirmed_by_split'])


if __name__ == '__main__':
    main()
