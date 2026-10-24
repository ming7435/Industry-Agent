"""Evaluate the preregistered shallow/deep union only if calibration qualifies."""
from __future__ import annotations

from pathlib import Path

import patchcore_fine_features as fine

base = fine.base
OUT = base.ROOT / 'output/patchcore-feature-study-v4'


def combine(left, right, left_choice, right_choice):
    other={r['sample_id']:r for r in right}
    if len(other)!=len(right) or {r['sample_id'] for r in left}!=set(other):
        raise ValueError('Branch image sets differ')
    rows=[]
    for row in left:
        partner=other[row['sample_id']]
        if any(row[k]!=partner[k] for k in ('file_sha256','label','scenario','split')):
            raise ValueError('Branch image identity or labels differ')
        a=row['roi_score'] if left_choice['roi'] else row['score']
        b=partner['roi_score'] if right_choice['roi'] else partner['score']
        rows.append({**row,'score':max(a/left_choice['threshold'],b/right_choice['threshold'])})
    return rows


def choices(rows):
    result=[]
    for roi in (False,True):
        key='roi_score' if roi else 'score'
        choice=base.select_threshold([r[key] for r in rows if r['label']=='normal'],
                                     [r[key] for r in rows if r['label']=='defect'],max_fpr=.005)
        choice.update(roi=roi,rule='Per-branch calibration FPR <= 0.5%')
        result.append(choice)
    return result


def main():
    fine.check(OUT)
    registration=OUT/'feature-union-preregistration.json'
    plan=base.read(registration)
    if not plan['fine_model_not_yet_built']:
        raise ValueError('Union was not preregistered before shallow-model construction')
    dest=OUT/'feature-union'
    dest.mkdir(exist_ok=True)
    if not (OUT/'calibration_scores.json').exists():
        base.write(dest/'decision.json',dict(evaluated=False,reason='Shallow study was not needed under its preregistered stopping rule.'))
        return
    deep=base.read(fine.PARENT/'448/calibration_scores.json')
    shallow=base.read(OUT/'calibration_scores.json')
    candidates=[]
    for a in choices(deep):
        for b in choices(shallow):
            metrics=base.evaluate(combine(deep,shallow,a,b),1.)['overall']
            candidates.append(dict(deep=a,shallow=b,metrics=metrics))
    selected=min(candidates,key=lambda c:(c['metrics']['fnr'],c['metrics']['fpr'],c['deep']['roi'],c['shallow']['roi']))
    qualifies=selected['metrics']['fnr']<=.01 and selected['metrics']['fpr']<=.01
    decision=dict(evaluated=True,calibration_candidates=candidates,selected=selected,
        qualifies_for_heldout=qualifies,preregistration_sha256=base.sha(registration),
        note='Two feature memories form one PatchCore gate; no threshold was chosen on held-out data.')
    base.write(dest/'decision.json',decision)
    if not qualifies:
        base.status(dest,'calibration_failed_no_extra_test',metrics=selected['metrics'])
        return
    lock=dict(locked_at=base.now(),selected=selected,source_sha256=base.sha(__file__),
        deep_memory_sha256=base.sha(fine.PARENT/'448/memory.npz'),shallow_memory_sha256=base.sha(OUT/'memory.npz'),
        preregistration_sha256=base.sha(registration))
    base.write(dest/'selection_locked.json',lock)
    base.setup_runtime()
    deep_test=fine.clean.score(fine.PARENT,448,'test')
    shallow_test=fine.score(OUT,'test')
    candidate=base.evaluate(combine(deep_test,shallow_test,selected['deep'],selected['shallow']),1.)
    baseline=base.read(OUT/'comparison.json')['baseline']
    result=dict(candidate=candidate,baseline=baseline,gate=base.replacement_gate(candidate['overall'],baseline['overall']),
        lock=lock,finished_at=base.now(),deployed=False)
    fine.check(OUT)
    base.write(dest/'comparison.json',result)
    base.status(dest,'completed',candidate=candidate['overall'],gate=result['gate'])


if __name__=='__main__':main()
