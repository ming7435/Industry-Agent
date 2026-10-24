"""Report reviewed-label PatchCore results with unchanged original-label metrics."""
from __future__ import annotations

import html
import argparse
from pathlib import Path
import json
import xml.etree.ElementTree as ET

import patchcore_clean_experiment as clean
from patchcore_foreground import foreground_mask

base = clean.base
OUT = base.ROOT / 'output/patchcore-clean-v3'


def percent(value):
    return f'{100 * value:.2f}%'


def pictures(result):
    import cv2
    import numpy as np
    from PIL import Image, ImageDraw
    from app.vision.algorithms import PatchCoreDetector
    from app.vision.evaluation import load_rgb
    selected = result['selected']
    size = selected['size']
    source = Path(selected.get('candidate_directory', OUT / str(size)))
    old_protocol = base.read(clean.OLD / 'protocol.json')
    old_detector = PatchCoreDetector(str(base.WEIGHTS), old_protocol['active_config'])
    metadata = base.read(source / 'model.json')
    factory = PatchCoreDetector
    if metadata.get('backbone') == 'resnet18_layer1_layer2':
        from patchcore_fine_features import FineDetector
        factory = FineDetector
    detector = factory(str(base.WEIGHTS), metadata['preprocessing'])
    with np.load(base.ACTIVE / 'memory.npz', allow_pickle=False) as saved:
        old_bank = saved['memory_bank'].copy()
    with np.load(source / 'memory.npz', allow_pickle=False) as saved:
        banks = [saved[f'view_{i}'].copy() for i in range(5)]
    rows = base.read(source / 'test_scores.json')
    groups = [result['candidate']['misses'], result['candidate']['false_alarms'],
              [s for s in result['baseline']['misses'] if s not in result['candidate']['misses']],
              [s for s in result['baseline']['false_alarms'] if s not in result['candidate']['false_alarms']],
              [r['sample_id'] for r in rows if r['scenario'] == 'brown_stain']]
    ids = []
    for index in range(8):
        for group in groups:
            if index < len(group) and group[index] not in ids:
                ids.append(group[index])
        if len(ids) >= 8:
            break
    dest = OUT / 'examples'
    dest.mkdir(exist_ok=True)
    evidence = []
    for sample_id in ids[:8]:
        row = next(r for r in rows if r['sample_id'] == sample_id)
        with load_rgb(row['path']) as image:
            old_map = old_detector.anomaly_map(image, old_bank)
            new_map = np.zeros((image.height, image.width), dtype=np.float32)
            for view, box in enumerate(base.view_boxes(image.size)):
                with image.crop(box) as tile:
                    value = detector.anomaly_map(tile, banks[view])
                    if selected['roi']:
                        value = np.where(foreground_mask(tile), value, 0.)
                    new_map[:, box[0]:box[2]] = value
            expected = row['roi_score'] if selected['roi'] else row['score']
            if abs(float(new_map.max()) - expected) > 1e-6:
                raise ValueError('Visualization recomputation differs from frozen candidate score')
            panels = [(image, f'{sample_id}: reviewed label={row["label"]}; scenario={row["scenario"]}')]
            for name, value, threshold in [('ACTIVE', old_map, old_protocol['active_threshold']),
                                           ('CANDIDATE', new_map, selected['threshold'])]:
                colors = np.clip(value.astype(np.float64) / threshold * 127.5, 0, 255).astype(np.uint8)
                overlay = Image.blend(image, Image.fromarray(cv2.cvtColor(cv2.applyColorMap(colors, cv2.COLORMAP_TURBO), cv2.COLOR_BGR2RGB)), .45)
                verdict = 'ANOMALY' if float(value.max()) >= threshold else 'NORMAL'
                panels.append((overlay, f'{name}: {verdict}; score={float(value.max()):.5f}; threshold={threshold:.5f}'))
            width = 1200
            height = round(width * image.height / image.width)
            canvas = Image.new('RGB', (width, 3 * (height + 30)), 'white')
            draw = ImageDraw.Draw(canvas)
            for i, (panel, label) in enumerate(panels):
                top = i * (height + 30)
                draw.text((8, top + 7), label, fill='black')
                canvas.paste(panel.resize((width, height)), (0, top + 30))
            canvas.save(dest / (sample_id + '.jpg'), quality=92)
        evidence.append(dict(sample_id=sample_id, label=row['label'], scenario=row['scenario'], image=f'examples/{sample_id}.jpg'))
        print('Verified image', sample_id, flush=True)
    base.write(OUT / 'examples.json', evidence)
    return evidence


def main():
    global OUT
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=OUT)
    args = parser.parse_args()
    OUT = args.output.resolve()
    check = clean.check
    if OUT.name == 'patchcore-feature-study-v4':
        from patchcore_fine_features import check as fine_check
        check = fine_check
    base.setup_runtime()
    check(OUT)
    result = base.read(OUT / 'comparison.json')
    old, new = result['baseline']['overall'], result['candidate']['overall']
    passed = result['gate']['empirical_pass']
    conclusion = '实测门槛通过；尚未部署，仍需应用兼容性与适用范围核验。' if passed else '未达到替换门槛，现用模型保持不变。'
    evidence = pictures(result)
    shallow_done = any(c.get('family') == 'shallow' for c in result.get('calibration_choices', []))
    tests = None
    if (OUT / 'tests.xml').exists():
        suites = ET.parse(OUT / 'tests.xml').getroot().findall('.//testsuite')
        tests = {key: sum(int(s.get(key, '0')) for s in suites)
                 for key in ('tests', 'failures', 'errors', 'skipped')}
        tests['junit_sha256'] = base.sha(OUT / 'tests.xml')
    lines = ['# PatchCore 清理正常标签后的实拍验证', '', conclusion, '',
        '## 确认的问题与修改', '',
        '- 旧方案将五视角图整体压缩到 448 像素宽，单视角只剩约 90 像素。候选改为逐视角提取特征。',
        '- 用户明确褐色斑点应算污渍。对颜色筛查发现的 33 张图片进行视觉复核，确认 32 张污渍，另 1 张训练图隔离待确认。',
        '- 从候选正常建库池隔离 22 张；校准集改标 9 张；测试集改标 2 张。未删除任何校准或测试图片。',
        '- 1746 张正常图重新选取五个记忆库，每个 1024 个特征。冻结骨干的单图特征可复用；含污渍的训练图不参与新的记忆库选择。',
        '- 比较每视角 224、448 像素，以及完整视图、工件区域两种评分方式。区域规则保留暗色表面缺陷与轮廓边缘。',
        ('- 已完成浅层特征对照，使用同一冻结 ResNet18 的 layer1/layer2、192 维特征、步长 4；原方案使用 layer2/layer3、384 维特征、步长 8。'
         if shallow_done else '- 本报告包含逐视角 layer2/layer3 特征试验。'), '',
        '## 固定数据分区', '',
        '- 建库：1746 张正常图；另有 22 张原训练图隔离。',
        '- 校准：303 张正常图、21 张缺陷图。',
        '- 测试：148 张正常图、71 张缺陷图。仍是原先 219 张照片，只有两张按业务规则改标。',
        '- 各分区之间源图及像素摘要无重叠；同一原图五个视角不拆成独立样本。',
        '- 来源为公开 MANTA 实拍照片，不是用户产线新采集样本。测试集曾用于旧模型评估，且两张标签已经视觉复核，因此不是新的盲测集。', '',
        '## 校准配置比较', '', '| 特征层 | 每视角输入 | 工件区域 | 漏检/缺陷 | 误报/正常 | 阈值 |', '|---|---|---|---:|---:|---:|']
    choices = result.get('calibration_choices')
    if choices is None:
        choices = [c for size in (224,448) for c in base.read(OUT / str(size) / 'calibration.json')]
    for c in choices:
        m=c['metrics']
        layer='layer1/2' if c.get('family')=='shallow' else 'layer2/3'
        lines.append(f'| {layer} | {c["size"]} | {"启用" if c["roi"] else "未启用"} | {m["fn"]}/{m["defect_count"]} | {m["fp"]}/{m["normal_count"]} | {c["threshold"]:.6f} |')
    union_path = OUT / 'feature-union/decision.json'
    union = base.read(union_path) if union_path.exists() else None
    union_summary = ''
    if union and union.get('evaluated'):
        m = union['selected']['metrics']
        union_summary = (f'浅层与深层特征联合方案：校准漏检 {m["fn"]}/{m["defect_n"]}'
                         f'（{percent(m["fnr"])}），误报 {m["fp"]}/{m["normal_n"]}'
                         f'（{percent(m["fpr"])}）。')
        if not union['qualifies_for_heldout']:
            union_summary += '未通过预先规定的校准门槛，未进行额外测试集评价。'
        else:
            evaluated_union = base.read(OUT / 'feature-union/comparison.json')
            u = evaluated_union['candidate']['overall']
            union_summary += (f'独立于建库的测试图：漏检 {u["fn"]}/{u["defect_n"]}，'
                              f'误报 {u["fp"]}/{u["normal_n"]}；'
                              f'实测替换门槛通过：{evaluated_union["gate"]["empirical_pass"]}。')
        lines += ['', '## 预先登记的特征联合试验', '', union_summary,
                  '', '每个分支校准误报预算为 0.5%，合并后仍要求漏检与误报均不超过 1%。'
                  '参数只由校准集确定，详细记录见 feature-union/decision.json。']
    lines += ['', '## 锁定模型后的测试', '', '| 指标 | 现用模型（相同修正标签） | 候选模型 |', '|---|---:|---:|',
        f'| 漏检 | {old["fn"]}/{old["defect_n"]}，{percent(old["fnr"])} | {new["fn"]}/{new["defect_n"]}，{percent(new["fnr"])} |',
        f'| 误报 | {old["fp"]}/{old["normal_n"]}，{percent(old["fpr"])} | {new["fp"]}/{new["normal_n"]}，{percent(new["fpr"])} |', '',
        '| 缺陷场景 | 现用漏检 | 候选漏检 |', '|---|---:|---:|']
    for scenario, m in result['candidate']['by_scenario'].items():
        if m['defect_n']:
            b=result['baseline']['by_scenario'][scenario]
            lines.append(f'| {scenario} | {b["fn"]}/{b["defect_n"]} | {m["fn"]}/{m["defect_n"]} |')
    stain_totals = {}
    for name in ('baseline', 'candidate'):
        stain_rows = [m for key, m in result[name]['by_scenario'].items()
                      if key in ('stain', 'brown_stain')]
        stain_totals[name] = (sum(m['fn'] for m in stain_rows), sum(m['defect_n'] for m in stain_rows))
    lines += ['', f'按业务规则合并原污渍类与新确认褐色斑点：现用漏检 {stain_totals["baseline"][0]}/{stain_totals["baseline"][1]}，'
              f'候选漏检 {stain_totals["candidate"][0]}/{stain_totals["candidate"][1]}。']
    original=result['original_labels']
    lines += ['', '## 原始标签口径保留', '',
        f'- 原标签下，现用模型漏检 {original["baseline"]["overall"]["fn"]}/69、误报 {original["baseline"]["overall"]["fp"]}/150；候选漏检 {original["candidate"]["overall"]["fn"]}/69、误报 {original["candidate"]["overall"]["fp"]}/150。',
        '- 标签复核记录与原始标签均保留；不会将改标本身算作模型改善。主要新旧对比使用同一批图片、同一套修正标签。', '',
        '## 限制与替换决定', '',
        f'- 替换条件：漏检率 ≤ 1%、正常误报率 ≤ 1%，且均不劣于现用模型。本轮实测是否满足：{passed}。',
        f'- 候选漏检率描述性 95% Wilson 区间：{percent(new["fnr_wilson95"][0])}–{percent(new["fnr_wilson95"][1])}；误报率区间：{percent(new["fpr_wilson95"][0])}–{percent(new["fpr_wilson95"][1])}。',
        '- 小样本零漏检也不能证明总体漏检率稳定低于 1%；公开数据效果不能替代真实产线验收。',
        '- 颜色筛查只用于发现复核候选，不代表其余图片已经完成全面人工标注认证。',
        '- 五视角和白色齿轮的区域规则有适用范围，未经验证不能用于任意单视角工件图片。',
        '- 当前 PatchCore、YOLO 权重及模型设置保持不变。', '',
        '方法参考：[PatchCore 作者实现](https://github.com/amazon-science/patchcore-inspection)。', '']
    if tests:
        lines += ['## 代码验证', '', f'- 相关测试 {tests["tests"]} 项；失败 {tests["failures"]}、错误 {tests["errors"]}、跳过 {tests["skipped"]}。',
                  '- 这些测试验证图像处理、数据隔离、区域规则、校准和替换门槛；模型识别效果以上述实拍计数为准。', '']
    lines += ['## 实拍对照', '']
    for example in evidence:
        lines += [f'### {example["sample_id"]} · {example["scenario"]}', '', f'![实拍原图与新旧模型热图]({example["image"]})', '']
    (OUT / 'report.md').write_text('\n'.join(lines), encoding='utf-8')
    cards=''.join(f'<section><h3>{html.escape(e["sample_id"])} · {e["scenario"]}</h3><img src="{e["image"]}"></section>' for e in evidence)
    page=f'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>PatchCore 标签复核与实拍验证</title><style>body{{font:16px/1.6 system-ui;background:#eff4f5;color:#193342;max-width:1200px;margin:24px auto}}section{{background:white;padding:24px;border-radius:12px;margin:20px 0}}img{{width:100%}}strong{{font-size:30px}}a{{color:#007c83}}</style><h1>PatchCore · 标签复核后的实拍验证</h1><section>{conclusion}<p>同一批 219 张实拍图片、同一套修正标签：148 张正常 + 71 张缺陷。</p><strong>漏检 {percent(old['fnr'])} → {percent(new['fnr'])}</strong><p>误报 {percent(old['fpr'])} → {percent(new['fpr'])}</p><p>候选：每视角 {result['selected']['size']} 像素；工件区域：{'启用' if result['selected']['roi'] else '未启用'}。</p><a href="report.md">完整报告</a> · <a href="comparison.json">原始指标</a> · <a href="../patchcore-label-audit-v1/index.html">标签复核证据</a></section><section>公开实拍数据与建库、校准分离；这批测试图曾用于旧模型评估，不是新产线盲测。原标签口径另行保留，标签修正不计作模型改善。</section>{cards}</html>'''
    (OUT / 'index.html').write_text(page,encoding='utf-8')
    if union_summary:
        page = page.replace('</section><section>公开实拍',
                            f'</section><section><h2>特征联合试验</h2>{html.escape(union_summary)}</section><section>公开实拍', 1)
        (OUT / 'index.html').write_text(page, encoding='utf-8')
    check(OUT)
    before=base.read(clean.OLD/'active-model-settings-before.json')
    current={name:[line for line in (ROOT/name).read_text(encoding='utf-8-sig').splitlines()
                   if line.startswith(('QUALITY_PATCHCORE_','QUALITY_YOLO_'))] for name in before}
    if before!=current: raise ValueError('Active model settings changed')
    verification=dict(checked_at=base.now(),active_models_unchanged=True,active_settings_unchanged=True,
        labels_reviewed=33,labels_corrected=32,uncertain_training_images_quarantined=1,evaluation_images_removed=0,
        selected_memory_sha256=result['selected']['memory_sha256'],comparison_sha256=base.sha(OUT/'comparison.json'),
        review_sha256=base.sha(clean.AUDIT/'review-decisions.json'),empirical_pass=passed,deployed=False)
    if union:
        verification['feature_union_decision_sha256'] = base.sha(union_path)
    if tests:
        verification['code_tests'] = tests
    base.write(OUT/'verification.json',verification)
    print(json.dumps(verification),flush=True)


ROOT = base.ROOT
if __name__=='__main__':
    main()
