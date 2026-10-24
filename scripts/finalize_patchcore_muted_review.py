"""Apply explicit visual review decisions, preserving every evaluation sample."""
from collections import Counter
from pathlib import Path
import patchcore_multiview_experiment as base

OUT = base.ROOT / 'output/patchcore-label-audit-v2'
PREVIOUS = base.ROOT / 'output/patchcore-label-audit-v1'
# These IDs were individually inspected in the six saved contact sheets and
# the supplementary detailed crops. A screening hit alone is not a label.
CONFIRMED = set('01241 01279 01842 00024 00793 00904 01789 01090 01908 01718 '
                '01976 00218 01721 01953 01426 00199 01810 01547 00823 01575 '
                '02057 01656 01610 01302 02051 01840 01492 01151 01729 02058 '
                '01680 01368 01791 02024 02304 02263 02310'.split())


def main():
    rows = base.read(PREVIOUS / 'corrected-manifest.json')
    original = base.read(base.ROOT / 'output/patchcore-multiview-v2/manifest.json')
    proposals = base.read(OUT / 'proposals.json')
    sheets = base.read(OUT / 'review-sheets.json')
    evidence = {sid: s for s in sheets for sid in s['sample_ids']}
    decisions = []
    for row in proposals:
        sid = row['sample_id']
        confirmed = sid.split('_')[-1] in CONFIRMED
        detail = OUT / ('detail-' + sid.split('_')[-1] + '.jpg')
        decisions.append(dict(sample_id=sid, file_sha256=row['file_sha256'],
            original_label='normal', decision='confirmed_brown_stain' if confirmed else 'uncertain_edge_or_dark_region',
            reviewer='assistant_visual_review', reviewed_sheet_sha256=evidence[sid]['sha256'],
            detail_sha256=base.sha(detail) if detail.exists() else None,
            reason='Visible localized brown/yellow-brown mark on the gear.' if confirmed else
                   'Small dark/edge region cannot be distinguished confidently from shading in this image; do not force a defect label.'))
    # The nearest-neighbour inspection found an additional muted stain and an
    # uncertain discoloured reference that were NOT flagged by either filter.
    by_id = {r['sample_id']: r for r in original}
    neighbor = base.ROOT / 'output/patchcore-root-cause-v5/neighbors/mechanics_gear_00049.jpg'
    for suffix, decision, reason in [
        ('00049', 'confirmed_brown_stain', 'Visible muted pink-brown mark on the inside wall of the bore.'),
        ('00952', 'uncertain_edge_or_dark_region', 'Muted grey-brown streak in nearest normal patch; quarantine pending higher-resolution expert review.')]:
        sid = 'mechanics_gear_' + suffix
        assert sid not in {r['sample_id'] for r in decisions}
        decisions.append(dict(sample_id=sid, file_sha256=by_id[sid]['file_sha256'], original_label='normal',
            decision=decision, reviewer='assistant_visual_review', reviewed_sheet_sha256=base.sha(neighbor),
            proposal_origin='calibration-nearest-neighbour-diagnostic', reason=reason))
    assert len(CONFIRMED) == sum(d['decision']=='confirmed_brown_stain' for d in decisions)-1
    lookup = {d['sample_id']: d for d in decisions}
    for row in rows:
        d = lookup.get(row['sample_id'])
        if d is None: continue
        assert base.sha(row['path']) == d['file_sha256']
        row['pre_v2_label'] = row['label']; row['pre_v2_scenario'] = row['scenario']
        row['review_v2'] = d['decision']
        if d['decision'] == 'confirmed_brown_stain':
            row['label'] = 'defect'; row['scenario'] = 'brown_stain'
        if row['split'] == 'train':
            row['pre_v2_split'] = 'train'; row['split'] = 'quarantine'
    base.validate_manifest(rows)
    for split in ('calibration','test'):
        assert {r['sample_id'] for r in rows if r['split']==split} == {r['sample_id'] for r in original if r['split']==split}
    result = dict(reviewed_at=base.now(), rule='Human-confirmed brown marks are defects.',
        decisions=decisions, prior_review_sha256=base.sha(PREVIOUS/'review-decisions.json'),
        screening_is_not_exhaustive=True, test_labels_remain_provisional=True,
        uncertain_policy='Quarantine train only; retain original evaluation labels, flag uncertainty, retain every evaluation image.',
        counts=dict(Counter(d['decision'] for d in decisions)),
        partition_counts={s:dict(Counter(r['label'] for r in rows if r['split']==s)) for s in ('train','calibration','test','quarantine')})
    base.write(OUT/'review-decisions.json',result)
    base.write(OUT/'corrected-manifest.json',rows)
    print(result['counts'],result['partition_counts'])


if __name__ == '__main__': main()
