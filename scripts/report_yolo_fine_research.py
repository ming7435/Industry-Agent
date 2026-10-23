"""Report rejected research weights without implying production improvement."""
from pathlib import Path
import html
import json
import sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from scripts.train_yolo_fine_defects import read,digest,save


def main():
    out=ROOT/'output/gear-yolo-fine-defects-v2'
    report=read(out/'diagnostic-test.json');verification=read(out/'verification.json')
    assert digest(out/'diagnostic-freeze.json')==report['freeze_sha256']
    assert verification['candidate_deployed'] is False and verification['environment_file_unchanged']
    before=report['baseline']['class_and_position'];after=report['candidate']['class_and_position']
    rows=['# 污渍与细丝专项优化：第二轮实测','',
          '**结论：本轮候选未达到替换条件，现用 YOLO 保持原版本。细丝召回有所提高，但误框增加，污渍检出退步。**','',
          '## 118 张真实图片回归','',
          '318 处原始缺陷标注；正确检出要求类别相同、IoU ≥ 0.5，一对一匹配。两版使用相同图片、相同标注与匹配标准。',
          '这批图片是复用的公开真实齿轮回归集，不是新采集的独立产线验收集。没有正常齿轮图片，不能计算正常工件误报率。','',
          '| 指标 | 现用模型 | 本轮候选（未上线） |','|---|---:|---:|']
    for key,title in [('dirt','污渍'),('hair','细丝')]:
        b,a=before['by_class'][key],after['by_class'][key]
        rows.extend([f'| {title}正确检出 | {b["tp"]}/{b["gt"]} | {a["tp"]}/{a["gt"]} |',
                     f'| {title}漏检 | {b["fn"]} | {a["fn"]} |',f'| {title}误框 | {b["fp"]} | {a["fp"]} |'])
    rows.extend([f'| 全类别正确定位 | {before["tp"]}/{before["gt_instances"]} | {after["tp"]}/{after["gt_instances"]} |',
                 f'| 全类别误框 | {before["fp"]} | {after["fp"]} |',f'| 类别与位置 F1 | {before["f1"]:.4f} | {after["f1"]:.4f} |','',
                 '## 本轮完成的工作','',
                 '- 完成两组分类训练，各 12 轮；比较几何正负样本监督与全训练集统计归一化。冻结共享骨干和定位部分，导出仍为一个标准 YOLO 权重。',
                 '- 修正小批次中缺失目标类别时的损失归一化偏差，并增加批次拆分不变性测试；训练修正不等于实测效果达标。',
                 '- 883 个输入来自 437 张既有训练图片。训练缓存全部验签，来源均属 train；校准和测试图没有进入训练。',
                 '- 使用包含全部 20 处目标标注的 43 张校准子集筛查候选，比较分类阈值、细节裁剪和形状约束。污渍校准门槛未过，所以没有继续把候选当成可上线版本。',
                 '- 比较跨裁剪一致性、90/180 度旋转、局部对比度增强及 1024 像素原图处理，未确认能同时满足污渍与细丝门槛。这些研究变体未加入现用推理流程。',
                 '- 固定候选权重和参数后，仅进行一次完整 118 张诊断性回归，保留未达标结论，不根据这次测试修改阈值。','',
                 '## 真实接口与运行验证','',
                 '- 20 张包含污渍或细丝标注的真实测试图，全部通过隔离账号和存储运行 PatchCore → YOLO 实际接口。',
                 '- 20 张均被 PatchCore 判断异常后进入 YOLO；接口框与离线冻结候选逐条一致，保留全部成功、漏检和误检样例。',
                 f'- {verification["tests_passed"]} 项回归测试通过；页面及五个后台服务健康检查成功。',
                 '- .env 文件、现用 YOLO 权重与元数据、PatchCore 记忆库文件摘要均保持不变。没有替换现用模型，没有新增页面模型入口。','',
                 '## 暴露的问题与下一步','',
                 '- 原训练集仅 28 处污渍、80 处细丝标注，暗斑有 904 处；数据分布不均。部分正确位置的候选被分为暗斑等其他类别。',
                 '- 准备后的图片最长边为 640，原图为 1024；细小缺陷在准备图中只有几个像素。原图对照单独记录，不能冒充新增独立照片。',
                 '- 本轮提高细丝分数后，在不含目标类别的图片上产生额外误框。后续应优先增加这类难负样本，以及有复核标注的原始分辨率污渍样本，重新训练后做完整校准。',
                 '- 仍需独立产线正常图、污渍和细丝图验证。当前数据不能证明产线漏检率或正常件误报率。','',
                 '## 证据文件','',
                 '- [20 张实际接口图片](L:/industry_agent/output/quality-fine-defects-research-v2/index.html)',
                 '- [逐图回归记录](L:/industry_agent/output/gear-yolo-fine-defects-v2/diagnostic-test.json)',
                 '- [冻结参数和未达标原因](L:/industry_agent/output/gear-yolo-fine-defects-v2/diagnostic-freeze.json)',
                 '- [验证与现用模型保持记录](L:/industry_agent/output/gear-yolo-fine-defects-v2/verification.json)',
                 '- [Ultralytics 训练参数与类别权重说明](https://docs.ultralytics.com/modes/train/)', ''])
    (out/'report.md').write_text('\n'.join(rows),encoding='utf-8')
    api=read(ROOT/'output/quality-fine-defects-research-v2/report.json')
    old_api=read(ROOT/'output/quality-fine-defects-real-v3/report.json')
    old={r['sample_id']:r for r in old_api['samples']}
    gained=[]
    for r in api['samples']:
        count=r['class_and_position']['by_class'].get('hair',{}).get('tp',0)
        previous=old[r['sample_id']]['class_and_position']['by_class'].get('hair',{}).get('tp',0)
        if count>previous:gained.append(r['sample_id'])
    examples=(gained[:1]+['endface552'])
    save(out/'comparison-examples.json',{'hair_gain_examples':gained,'dirt_lost_example':'endface552'})
    page='<!doctype html><meta charset="utf-8"><title>YOLO 第二轮研究结果：未上线</title><style>body{font:16px/1.6 system-ui;max-width:1100px;margin:32px auto;background:#f5f7fa;color:#172b3a}pre{white-space:pre-wrap;background:white;padding:24px}section{background:white;padding:24px;margin:20px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}img{width:100%}figure{margin:0}</style><h1>研究候选未上线</h1><pre>'+html.escape('\n'.join(rows))+'</pre>'
    for identity in examples:
        page+=f'<section><h2>{html.escape(identity)}</h2><div class="pair">'
        for folder,label in [('quality-fine-defects-real-v3','现用模型'),('quality-fine-defects-research-v2','本轮候选，未上线')]:
            path=ROOT/'output'/folder/identity/'yolo.png'
            if path.exists():page+=f'<figure><img src="../{folder}/{identity}/yolo.png"><figcaption>{label}</figcaption></figure>'
        page+='</div></section>'
    (out/'index.html').write_text(page,encoding='utf-8')
    gallery=ROOT/'output/quality-fine-defects-research-v2/index.html'
    contents=gallery.read_text(encoding='utf-8')
    marker='<h1>真实图片 · PatchCore → YOLO</h1>'
    contents=contents.replace(marker,'<h1>真实图片 · 研究候选（未上线）</h1><p><strong>该候选未通过校准及误框要求，现用模型未替换。以下为隔离验证的原始输出，包含误检和漏检。</strong></p>')
    gallery.write_text(contents,encoding='utf-8')
    print({'report':str(out/'report.md'),'candidate_deployed':False,'examples':examples})


if __name__=='__main__':main()
