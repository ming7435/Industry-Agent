"""Summarize frozen calibration/test evidence and native API annotation images."""
import html
import json
from pathlib import Path
from statistics import median

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/gear-yolo-recall-v1'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def main():
    selection = read(OUT / 'selection.json')
    test = read(OUT / 'test-comparison.json')
    before_dir = ROOT / 'output/quality-real-images-20261022-run2'
    after_dir = ROOT / 'output/quality-real-images-recall-v1'
    before, after = read(before_dir / 'report.json'), read(after_dir / 'report.json')
    old, new = test['baseline'], test['candidate']
    count = new['class_and_position']['gt_instances']
    lines = ['# YOLO 漏检优化与真实图片回归验证', '',
             '## 已接入的改动', '',
             '- 权重仍为 v3；本次优化推理方式，没有重新训练或新增训练图片。',
             '- 同一 YOLO 检测整图和四个重叠局部区域；坐标还原到原图，按类别去除重复框，过滤裁剪边缘碎框。',
             '- 已有 PatchCore 记忆库和阈值保持原值，只有 PatchCore 判异常时运行 YOLO。',
             '- 页面仍只有一个 YOLO；自动收图读取同一部署的建议参数。', '',
             '## 参数选择和证据范围', '',
             '只在188张真实校准图上比较72组置信度组合，再冻结参数。整图置信度0.35，局部最低0.40；裁剪边长比例0.60，内部边缘过滤2像素，NMS IoU0.45，输入640。', '',
             '随后回归118张未参加训练的真实测试图片、318处缺陷标注。测试集以前已经使用过，本次未用它选参数；这是重复留出集回归，不是新采集的独立现场验收。两次新鲜整图推理分别在188/118张图片上复现了此前缓存的基线指标。', '',
             '计数单位为标注缺陷/预测框。类别与位置匹配要求类别相同且IoU≥0.5；位置匹配仅要求IoU≥0.5。每个预测框/标注最多匹配一次。', '',
             '## 118张真实图片结果', '',
             '| 指标 | 原版 | 优化后 |', '|---|---:|---:|']
    for label, group, key in [('类别和位置均正确', 'class_and_position', 'tp'),
                              ('类别或位置未匹配的标注（漏检）', 'class_and_position', 'fn'),
                              ('类别或位置未匹配的预测框', 'class_and_position', 'fp'),
                              ('仅位置正确', 'spatial', 'tp'), ('仅位置漏检', 'spatial', 'fn'),
                              ('仅位置多余框', 'spatial', 'fp')]:
        lines.append(f'| {label} | {old[group][key]} | {new[group][key]} |')
    for label, group in [('类别与位置F1', 'class_and_position'), ('位置F1', 'spatial')]:
        lines.append(f'| {label} | {old[group]["f1"]:.4f} | {new[group]["f1"]:.4f} |')
    lines += ['', f'类别与位置口径的漏检率：{old["class_and_position"]["fn"]/count:.2%} → {new["class_and_position"]["fn"]/count:.2%}，少漏15处（相对减少8.2%）。', '',
              '**代价：** 未匹配预测框105→122；仅位置多余框86→106，增加23.3%，超过校准选参时使用的20%上限。该上限是校准选择约束，不能声称测试集也满足。此部署继续保留研究验证属性，不作为产线验收通过。', '',
              '### 各类别正确识别数量', '', '| 类别 | 标注数 | 原版正确 | 优化后正确 |', '|---|---:|---:|---:|']
    for label, row in new['class_and_position']['by_class'].items():
        if row['gt']:
            prior = old['class_and_position']['by_class'].get(label, {}).get('tp', 0)
            lines.append(f'| {label} | {row["gt"]} | {prior} | {row["tp"]} |')
    lines += ['', '## 12张原抽样图片：实际认证API串联验证', '',
              '两次使用相同图片和PatchCore阈值；新YOLO输出与118张离线结果中的对应记录逐框一致，PatchCore分数逐图相同。全部12张先被PatchCore判异常，再执行YOLO。11张画出框；1张污渍图仍为异常未定位。', '',
              '| 指标 | 原版 | 优化后 |', '|---|---:|---:|']
    for label, key in [('正确识别', 'tp'), ('漏检', 'fn'), ('多余或不匹配框', 'fp')]:
        lines.append(f'| {label} | {before["metrics"]["class_and_position"][key]} | {after["metrics"]["class_and_position"][key]} |')
    lines += ['', f'此次隔离CPU实测，完整串联请求耗时中位数 {median(r["inference_seconds"] for r in after["samples"]):.3f} 秒（包含模型加载、证据保存等；不是在线吞吐保证）。局部推理增加计算开销。', '',
              '另以MANTA正常图和异常图各一张确认：正常时跳过YOLO，异常时运行YOLO，结果可回读且跨账号读取被拒绝。该跨域控制不验证YOLO框的位置准确性。', '',
              '## 局限', '',
              '- 污渍、飞边、流痕、缺料等类别仍有大量漏检；当前提升主要来自小黑点（60→73）和溢料（42→44）。',
              '- 塑料齿轮测试集没有正常图，正常件误报率无法计算；上述多余框数量不是正常件误报率。',
              '- PatchCore的MANTA数据与塑料齿轮YOLO存在产品/拍摄域差异。',
              '- 源数据的数字编号分组不证明不同照片一定来自不同物理工件。', '',
              '## 本地证据', '',
              '- `protocol.json`：推理前保存的选择规则。', '- `selection.json`：188张校准图的72组参数与冻结结果。',
              '- `calibration-raw.json`、`test-raw.json`：逐图各视角原始预测。',
              '- `test-comparison.json`：118张逐图标注、预测与汇总。',
              '- `deployment.json`：部署路径、权重与PatchCore摘要。',
              '- `../quality-real-images-recall-v1/`：12张原图、实际推理PNG、API证据与逐图指标。',
              '- `../quality-pipeline-recall-v1/`：正常/异常控制及权限回读检查。',
              '- `index.html`：12张图片的原版与优化后对照（均为真实模型输出）。', '']
    (OUT / 'report.md').write_text('\n'.join(lines), encoding='utf-8')
    cards = []
    for prior, row in zip(before['samples'], after['samples']):
        assert prior['sample_id'] == row['sample_id'] and prior['image_sha256'] == row['image_sha256']
        identity = html.escape(row['sample_id'])
        a, b = prior['class_and_position'], row['class_and_position']
        cards.append(f'''<section><h2>{identity}</h2><p>正确 {a['tp']} → {b['tp']} · 漏检 {a['fn']} → {b['fn']} · 多余/不匹配 {a['fp']} → {b['fp']}</p><div class="images">
<figure><img src="../quality-real-images-20261022-run2/{identity}/yolo.png"><figcaption>原版 YOLO 实际输出</figcaption></figure>
<figure><img src="../quality-real-images-recall-v1/{identity}/yolo.png"><figcaption>优化后 YOLO 实际输出</figcaption></figure>
</div></section>''')
    page = '''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>YOLO真实图片优化对照</title>
<style>body{font:16px/1.65 system-ui;background:#edf3f5;color:#173c45;max-width:1400px;margin:36px auto;padding:0 24px}h1{font-size:30px}section{background:white;border-radius:14px;padding:24px;margin:24px 0}.images{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}figure{margin:0}img{width:100%;object-fit:contain}figcaption{text-align:center;color:#506871}p{max-width:1000px}</style>
<h1>YOLO真实图片：优化前后</h1><p>118张真实回归测试图：正确识别136→151处，漏检182→167处，多余或不匹配框105→122个。类别必须相同，位置IoU≥0.5。下列12张为此前固定抽样图片，两次均通过PatchCore→YOLO实际接口；均为模型原始标注输出。</p><p>改善主要来自小黑点；污渍等仍会漏检，未匹配框增加。此次复用了留出测试集；没有正常塑料齿轮图片，不能计算正常件误报率。</p>'''
    (OUT / 'index.html').write_text(page + ''.join(cards) + '</html>', encoding='utf-8')
    print(str(OUT / 'report.md'))


if __name__ == '__main__':
    main()
