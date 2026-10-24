"""Render frozen PatchCore comparisons; does not change models or thresholds."""
from __future__ import annotations

import argparse
import html
import json
from pathlib import Path
import statistics
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import patchcore_multiview_experiment as experiment


def pct(value):
    return f'{value * 100:.2f}%'


def render_examples(output, comparison, limit=8):
    import cv2
    import numpy as np
    from PIL import Image, ImageDraw
    from app.vision.algorithms import PatchCoreDetector
    from app.vision.evaluation import load_rgb

    locked, protocol = comparison['locked'], comparison['protocol']
    size = locked['input_size']
    old = experiment.read(output / 'baseline/test_scores.json')
    new = experiment.read(output / str(size) / 'test_scores.json')
    baseline_detector = PatchCoreDetector(str(experiment.WEIGHTS), protocol['active_config'])
    detector = PatchCoreDetector(str(experiment.WEIGHTS), experiment.read(output / str(size) / 'model.json')['preprocessing'])
    with np.load(experiment.ACTIVE / 'memory.npz', allow_pickle=False) as saved:
        baseline_bank = saved['memory_bank'].copy()
    with np.load(output / str(size) / 'memory.npz', allow_pickle=False) as saved:
        banks = [saved[f'view_{i}'].copy() for i in range(5)]
    old_by_id = {r['sample_id']: r for r in old}
    # Selection is for post-test explanation only. Never reused for training.
    groups = [comparison['candidate']['misses'], comparison['candidate']['false_alarms'],
              [s for s in comparison['baseline']['misses'] if s not in comparison['candidate']['misses']],
              [s for s in comparison['baseline']['false_alarms'] if s not in comparison['candidate']['false_alarms']]]
    selected = []
    for index in range(limit):
        for group in groups:
            if index < len(group) and group[index] not in selected:
                selected.append(group[index])
                if len(selected) == limit:
                    break
        if len(selected) == limit:
            break
    if not selected:
        selected = [r['sample_id'] for r in new if r['label'] == 'defect'][:limit]
    examples = []
    dest = output / 'examples'
    dest.mkdir(exist_ok=True)
    for sample_id in selected:
        row = next(r for r in new if r['sample_id'] == sample_id)
        with load_rgb(row['path']) as image:
            base_map = baseline_detector.anomaly_map(image, baseline_bank)
            new_map = np.zeros((image.height, image.width), dtype=np.float32)
            for box, bank in zip(experiment.view_boxes(image.size), banks):
                with image.crop(box) as view:
                    new_map[box[1]:box[3], box[0]:box[2]] = detector.anomaly_map(view, bank)
            tiles = []
            truth = image.copy()
            mask_path = Path(row['path']).parents[2] / 'ground_truth' / row['scenario'] / (sample_id + '.png')
            if mask_path.exists():
                with Image.open(mask_path) as mask_image:
                    mask = np.asarray(mask_image.convert('L'))
                if mask.shape == (image.height, image.width):
                    contours, _ = cv2.findContours((mask > 0).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    pixels = np.asarray(truth).copy()
                    cv2.drawContours(pixels, contours, -1, (0, 255, 120), 3)
                    truth = Image.fromarray(pixels)
            panels = [(truth, f'{sample_id} | ground truth: {row["scenario"]} (green outline if mask available)')]
            for name, heatmap, threshold in [('ACTIVE', base_map, protocol['active_threshold']),
                                             (f'CANDIDATE {size}/view', new_map, locked['threshold'])]:
                level = np.clip(heatmap.astype(np.float64) / threshold * 127.5, 0, 255).astype(np.uint8)
                colors = Image.fromarray(cv2.cvtColor(cv2.applyColorMap(level, cv2.COLORMAP_TURBO), cv2.COLOR_BGR2RGB))
                overlay = Image.blend(image, colors, .45)
                score = float(heatmap.max())
                panels.append((overlay, f'{name}: {"ANOMALY" if score >= threshold else "NORMAL"} | score={score:.5f} threshold={threshold:.5f}'))
            panel_width = 1200
            panel_height = round(panel_width * image.height / image.width)
            canvas = Image.new('RGB', (panel_width, 3 * (panel_height + 30)), 'white')
            draw = ImageDraw.Draw(canvas)
            for index, (panel, label) in enumerate(panels):
                top = index * (panel_height + 30)
                draw.text((8, top + 8), label, fill='#163240')
                canvas.paste(panel.resize((panel_width, panel_height)), (0, top + 30))
            file = dest / (sample_id + '.jpg')
            canvas.save(file, quality=92)
        examples.append(dict(sample_id=sample_id, scenario=row['scenario'], label=row['label'],
                             baseline_score=old_by_id[sample_id]['score'], candidate_score=row['score'],
                             image='examples/' + file.name))
    experiment.write(output / 'examples.json', examples)
    return examples


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'output/patchcore-multiview-v2')
    args = parser.parse_args()
    output = args.output.resolve()
    experiment.setup_runtime()
    experiment.check_protocol(output)
    result = experiment.read(output / 'comparison.json')
    baseline, candidate = result['baseline']['overall'], result['candidate']['overall']
    examples = render_examples(output, result)
    cal = [(size, experiment.read(output / str(size) / 'calibration.json')) for size in (224, 448)]
    scenarios = []
    for name, value in result['candidate']['by_scenario'].items():
        if value['defect_n']:
            old = result['baseline']['by_scenario'][name]
            scenarios.append(f'| {name} | {old["fn"]}/{old["defect_n"]} | {value["fn"]}/{value["defect_n"]} | {pct(value["fnr"])} |')
    passed = result['gate']['empirical_pass']
    statement = '实测门槛通过，尚需应用兼容性核验；本脚本未部署。' if passed else '未达到替换门槛，保留现用模型。'
    lines = ['# PatchCore 多视角优化与真实图片验证', '', statement, '',
             '## 数据与隔离', '',
             '- 来源：真实公开 MANTA 齿轮照片，不是用户产线新采集图片。',
             '- 建库：1768 张正常五视角合成图；五视角来自实拍，同一原图始终属于同一分区。',
             '- 校准：312 张正常图、12 张缺陷图，其中 300 张正常图已从候选建库池剔除。',
             '- 测试：150 张正常图、69 张缺陷图。与建库和校准分离；它们曾评估过旧模型，因此不是全新未使用的测试集。',
             '- 按原始图片/工件组合计数，未把五个视角扩大成五个独立测试样本。批次身份未提供。', '',
             '## 优化内容', '',
             '- 原方案将整张五视角图缩为 448 像素宽，单视角约 90 像素。',
             '- 候选分别以每视角 224 和 448 像素提取正常特征，按视角建立 5 个记忆库，每库 1024 个特征。',
             '- 两种配置均重新建库；在更大的独立正常校准集上选择零误报阈值，再按校准漏检率选择配置。',
             '- 配置、阈值、源码和权重摘要在测试前锁定，测试后未反调阈值。', '',
             '## 校准结果', '', '| 每视角分辨率 | 漏检/缺陷 | 误报/正常 | 阈值 |', '|---|---:|---:|---:|']
    for size, item in cal:
        m = item['metrics']
        lines.append(f'| {size} | {m["fn"]}/{m["defect_count"]} | {m["fp"]}/{m["normal_count"]} | {item["threshold"]:.6f} |')
    lines += ['', '## 锁定后的测试结果', '',
              '| 指标 | 现用模型 | 候选模型 |', '|---|---:|---:|',
              f'| 漏检率 | {baseline["fn"]}/{baseline["defect_n"]}（{pct(baseline["fnr"])}） | {candidate["fn"]}/{candidate["defect_n"]}（{pct(candidate["fnr"])}） |',
              f'| 正常误检率 | {baseline["fp"]}/{baseline["normal_n"]}（{pct(baseline["fpr"])}） | {candidate["fp"]}/{candidate["normal_n"]}（{pct(candidate["fpr"])}） |', '',
              '| 缺陷场景 | 现用漏检 | 候选漏检 | 候选漏检率 |', '|---|---:|---:|---:|', *scenarios, '',
              '## 结果边界', '',
              f'- 候选漏检率的描述性 95% Wilson 区间为 {pct(candidate["fnr_wilson95"][0])}–{pct(candidate["fnr_wilson95"][1])}；误检率区间为 {pct(candidate["fpr_wilson95"][0])}–{pct(candidate["fpr_wilson95"][1])}。',
              '- 即使 69 张缺陷图零漏检，也不足以证明总体漏检率稳定低于 1%。',
              '- 本方案明确针对五视角齿轮拼图，不能未经验证自动套用于普通单视角图片。',
              '- 原模型、YOLO 权重和模型登记未修改；校准旧模型时新增 300 张正常图曾参与旧模型建库，因此不把那部分旧模型校准成绩用作公平效果比较。最终测试不受此问题影响。', '',
              '## 实拍图片对照', '']
    for example in examples:
        lines += [f'### {example["sample_id"]} / {example["scenario"]}', '',
                  f'![原图与两种检测热图]({example["image"]})', '']
    (output / 'report.md').write_text('\n'.join(lines), encoding='utf-8')
    cards = ''.join(f'<article><h3>{html.escape(e["sample_id"])} · {html.escape(e["scenario"])}</h3><img src="{e["image"]}" loading="lazy"></article>' for e in examples)
    body = f'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>PatchCore 实拍验证</title>
    <style>body{{font:16px/1.6 system-ui;margin:0;background:#eef3f5;color:#193342}}main{{max-width:1200px;margin:auto;padding:32px}}h1{{margin-bottom:8px}}.banner,article,.metric{{background:white;padding:24px;border-radius:14px;margin:20px 0}}.metrics{{display:grid;grid-template-columns:1fr 1fr;gap:20px}}strong{{font-size:30px}}img{{width:100%}}.note{{color:#526975}}a{{color:#087e8b}}</style>
    <main><h1>PatchCore 多视角优化 · 实拍验证</h1><p class="note">固定分组 / 独立于建库与校准 / 150 张正常 + 69 张缺陷</p>
    <section class="banner">{statement}<br>采用每视角 {result['locked']['input_size']} 像素、5 个正常记忆库。门槛：漏检 ≤ 1%，误检 ≤ 1%，两者均不劣于现用模型。</section>
    <section class="metrics"><div class="metric">漏检率<br><strong>{pct(baseline['fnr'])} → {pct(candidate['fnr'])}</strong><br>{baseline['fn']} → {candidate['fn']} / 69 张缺陷图</div><div class="metric">正常误检率<br><strong>{pct(baseline['fpr'])} → {pct(candidate['fpr'])}</strong><br>{baseline['fp']} → {candidate['fp']} / 150 张正常图</div></section>
    <p class="note">数据为公开实拍齿轮照片；测试集曾用于旧模型评估。本报告不代表产线验收，也不将单图五个视角算作五个独立样本。</p><p><a href="report.md">完整报告</a> · <a href="comparison.json">逐类指标与替换条件</a> · <a href="selection_locked.json">测试前锁定记录</a></p>{cards}</main></html>'''
    (output / 'index.html').write_text(body, encoding='utf-8')
    verification = dict(checked_at=experiment.now(), active_models_unchanged=True,
                         comparison_sha256=experiment.sha(output / 'comparison.json'),
                         lock_sha256=experiment.sha(output / 'selection_locked.json'),
                         script_sha256=experiment.sha(experiment.__file__),
                         report_script_sha256=experiment.sha(__file__), deployed=False,
                         empirical_pass=passed)
    experiment.check_protocol(output)
    experiment.write(output / 'verification.json', verification)
    print(json.dumps(verification, ensure_ascii=False))


if __name__ == '__main__':
    main()
