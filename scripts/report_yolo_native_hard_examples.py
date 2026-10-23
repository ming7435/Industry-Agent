"""Build an evidence report for the native-crop training experiment."""
import argparse
import html
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.prepare_yolo_native_hard_examples import OUT,SOURCE
from scripts.train_yolo_fine_defects import read
from app.vision.yolo_evaluation import class_aware_localization


def target_metrics(row):
    return class_aware_localization([{'ground_truth':[g for g in row['ground_truth'] if g['label'] in ('dirt','hair')],
        'predictions':[g for g in row['predictions'] if g['label'] in ('dirt','hair')]}],.01,.5)


def main():
    from PIL import Image,ImageDraw,ImageFont
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--result',type=Path,required=True)
    parser.add_argument('--api',type=Path,required=True)
    args=parser.parse_args()
    baseline=read(ROOT/'output/gear-yolo-fine-defects-v1/evaluation/packed-classifier-epoch4-contained/test-comparison.json')
    result=read(args.result);data=read(OUT/'data-summary.json');audit=read(OUT/'data-audit.json')
    api=read(args.api/'report.json');proof=read(OUT/'verification.json')
    history=read(OUT/'training/history.json')
    a=baseline['metrics']['class_and_position'];b=result['metrics']['class_and_position']
    lines=[]
    for label,title in [('dirt','污渍'),('hair','细丝')]:
        aa,bb=a['by_class'][label],b['by_class'][label]
        lines.extend([(title+'正确检出',f'{aa["tp"]}/{aa["gt"]}',f'{bb["tp"]}/{bb["gt"]}'),
                      (title+'漏检',str(aa['fn']),str(bb['fn'])),(title+'误框',str(aa['fp']),str(bb['fp']))])
    lines.extend([('全类别正确定位',f'{a["tp"]}/{a["gt_instances"]}',f'{b["tp"]}/{b["gt_instances"]}'),
                  ('全类别误框',str(a['fp']),str(b['fp'])),('类别与位置 F1',f'{a["f1"]:.4f}',f'{b["f1"]:.4f}')])
    deployed=proof['candidate_deployed']
    decision='已通过校准、真实回归和接口验证，并替换现用模型。' if deployed else '候选未满足全部替换条件，现用模型保持原版本。'
    old={r['sample_id']:r for r in baseline['samples']};new={r['sample_id']:r for r in result['samples']}
    picked=[]
    for label in ('dirt','hair'):
        ranked=[]
        for identity,row in new.items():
            gt=[g for g in row['ground_truth'] if g['label']==label]
            if not gt:continue
            scores=[]
            for version in (old[identity],row):
                scores.append(class_aware_localization([{'ground_truth':gt,'predictions':[p for p in version['predictions'] if p['label']==label]}],.01,.5))
            ranked.append((scores[1]['tp']-scores[0]['tp'],-scores[1]['fp'],identity))
        if ranked:
            picked.append(max(ranked)[2])
    regressions=sorted(new,key=lambda identity:(target_metrics(new[identity])['fp']-target_metrics(old[identity])['fp'],
                         target_metrics(old[identity])['tp']-target_metrics(new[identity])['tp']),reverse=True)
    picked=list(dict.fromkeys(picked+regressions[:1]))
    pictures=[]
    font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
    for identity in picked:
        row=new[identity]
        with Image.open(SOURCE/row['path']) as source:
            original=source.convert('RGB')
        canvas=Image.new('RGB',(original.width*3,original.height+42),'#172b38');draw=ImageDraw.Draw(canvas)
        for panel,(title,boxes,color) in enumerate([
            ('Ground truth',row['ground_truth'],'#00a879'),
            ('Current model',old[identity]['predictions'],'#f39532'),
            ('Candidate',row['predictions'],'#e85674')]):
            pic=original.copy();paint=ImageDraw.Draw(pic)
            for box in boxes:
                if box['label'] not in ('dirt','hair'):continue
                x1,y1,x2,y2=box['bbox'];paint.rectangle((x1,y1,x2,y2),outline=color,width=2)
                label=box['label']+(f' {box["confidence"]:.2f}' if 'confidence' in box else '')
                paint.text((x1,max(0,y1-18)),label,fill=color,font=font,stroke_width=1,stroke_fill='white')
            canvas.paste(pic,(panel*original.width,42));draw.text((panel*original.width+12,10),f'{identity} | {title}',fill='white',font=font)
        filename=f'comparison-{identity}.jpg';canvas.save(OUT/filename,quality=93);pictures.append(filename)
    table='\n'.join('| '+' | '.join(line)+' |' for line in lines)
    md=f'''# 污渍与细丝：补样、难负样本训练与真实图片验证

**{decision}**

## 同一批118张真实图片对比

318处原始缺陷标注；类别一致、IoU ≥ 0.5，一对一匹配。参数在测试前冻结。

| 指标 | 现用基线 | 本轮候选 |
|---|---:|---:|
{table}

## 补充的训练数据

- 训练输入 {data['training_inputs']} 个，来自原有 {data['source_photos']} 张训练照片；新增独立实拍照片为0。
- 原图局部裁剪478张、对应几何及光照增强480张、易混淆缺陷局部图160张、纹理/边缘/夹具负样本498张，保留779张整图回放。
- 污渍标注485处、细丝925处，包含同一缺陷在裁剪、增强后的重复呈现，不能当作485/925个独立实物缺陷。
- 155张负样本会触发现用模型的污渍/细丝低分候选框。负样本是未标注缺陷的局部区域，不是独立认证的正常工件。
- {audit['images_verified']}张图片的摘要、像素、裁剪及变换标注、YOLO标签全部核对通过。188张校准图和118张测试图未参与训练。

## 训练与替换约束

- 正式训练完整完成{len(history)}轮；候选轮次与停止原因见训练记录和校准选择记录。
- 使用标准YOLO检测损失，同时微调分类及检测框预测；共享骨干冻结，缓存仅用于加速本机CPU训练。
- 对其他类别增加原模型输出约束，保留标准YOLO权重格式及单一YOLO入口。
- 污渍、细丝必须分别减少漏检，总误框必须下降；污渍误框保持0，细丝误框不得超过基线。校准门槛和测试门槛分别记录。
- 本轮部署状态：{deployed}。详细检查见verification.json及校准选择记录。

## 实际接口验证

- {api['metrics']['images']}张包含污渍/细丝的真实图经过实际PatchCore → YOLO接口。
- PatchCore判断异常后进入YOLO的图片：{api['metrics']['yolo_completed_images']}张。保留全部成功、漏检、误框记录与图片。
- 程序回归测试通过数：{proof['tests_passed']}。

## 结果适用范围

这118张是复用的公开真实齿轮回归图，不是新拍的独立产线验收图。此前测试反馈影响了此次训练方案；测试标签未用于本轮阈值选择。
数据没有独立正常齿轮测试集，无法计算正常工件误报率；这里的误框是在带缺陷测试图上，类别或位置不匹配的预测框。
PatchCore记忆库与公开塑料齿轮图片的来源域不同，接口跑通不能证明产线判定准确率。

## 证据

- [完整真实接口图片]({args.api.resolve().as_posix()}/index.html)
- [118张逐图检测记录]({args.result.resolve().as_posix()})
- [训练数据核对]({OUT.as_posix()}/data-audit.json)
- [训练数据清单]({(OUT/'dataset/manifest.json').as_posix()})
'''
    # Avoid external assets; all examples are local actual inference outputs.
    md+='\n'+ '\n\n'.join(f'![真实图片目标类别对比]({OUT.as_posix()}/{p})' for p in pictures)+'\n'
    (OUT/'report.md').write_text(md,encoding='utf-8')
    body=''.join('<tr>'+''.join(f'<td>{html.escape(cell)}</td>' for cell in row)+'</tr>' for row in lines)
    page='''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>YOLO 补样训练实测</title><style>body{max-width:1200px;margin:32px auto;padding:0 24px;font:16px/1.7 system-ui;background:#f2f5f6;color:#19333d}section{background:white;padding:24px;border-radius:12px;margin:20px 0}table{border-collapse:collapse;width:100%}td,th{padding:10px;border-bottom:1px solid #dce5e8;text-align:left}img{width:100%;margin-top:20px}a{color:#087e79}.decision{font-size:20px;font-weight:700}</style>'''
    page+=f'<h1>污渍与细丝 · 补样训练实测</h1><p class="decision">{decision}</p><section><h2>118张真实图片</h2><p>类别一致且IoU≥0.5。公开真实回归图；不是新增独立产线验收。</p><table><tr><th>指标</th><th>现用基线</th><th>本轮候选</th></tr>{body}</table></section>'
    page+=f'<section><h2>训练数据</h2><p>2395个训练输入；485处污渍标注、925处细丝标注、498张纹理/边缘负样本。来自779张原有训练照片，新增独立实拍照片为0。188张校准图、118张测试图与训练隔离。</p><img src="native_target_crop.jpg"><img src="mined_texture_edge_negative.jpg"></section>'
    page+='<section><h2>真实图片对比</h2><p>左：污渍/细丝真值；中：现用基线；右：候选。包含改善或残留失败样例，完整结果见逐图记录。</p>'+''.join(f'<img src="{p}">' for p in pictures)+'</section>'
    page+=f'<section><h2>证据与范围</h2><p>没有独立正常齿轮测试集，不能计算正常工件误报率。</p><p><a href="report.md">完整报告</a> · <a href="{html.escape(args.api.resolve().as_uri())}/index.html">20张真实接口输出</a> · <a href="verification.json">程序与部署检查</a></p></section>'
    (OUT/'index.html').write_text(page,encoding='utf-8')
    print({'report':str(OUT/'report.md'),'comparison_images':pictures,'candidate_deployed':deployed})


if __name__=='__main__':
    main()
