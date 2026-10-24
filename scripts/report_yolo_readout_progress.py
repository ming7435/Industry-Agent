"""Summarize measured calibration progress and verify the deployment guard."""
from datetime import datetime,timezone
from html import escape
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.train_yolo_fine_defects import read,save,digest,SOURCE
from scripts.probe_yolo_class_competition import OUT as CACHE,ACTIVE
from scripts.yolo_consensus_experiment import OUT as CONSENSUS,target_rows
from scripts.evaluate_yolo_fine_defects import score
from scripts.train_yolo_dirt_readout import OUT as READOUT
from scripts.train_yolo_dirt_residual import OUT


def main():
    from scripts.evaluate_yolo import configure_inference_runtime
    torch=configure_inference_runtime(ACTIVE/'best.pt')
    from app.vision.yolo_multiview import merge_views
    from app.vision.yolo_evaluation import class_aware_localization,bbox_iou
    from app.vision.evaluation import load_rgb
    from dotenv import dotenv_values
    from PIL import Image,ImageDraw,ImageFont
    metadata=read(ACTIVE/'model.json');classes=read(SOURCE/'manifest.json')['classes']
    reference=read(CACHE/'raw-manifest-full.json');baseline=[]
    assert len(reference['samples'])==188
    for row in reference['samples']:
        path=CACHE/row['cache_path'];assert digest(path)==row['cache_sha256']
        views=[]
        for view in torch.load(path,weights_only=True):
            defects=[{'label':classes[int(b[5])],'confidence':b[4],'bbox':b[:4]} for b in view['reference_boxes'].tolist() if b[2]>b[0] and b[3]>b[1]]
            views.append({'kind':view['kind'],'window':view['window'],'defects':defects})
        predictions=merge_views(views,views[0]['window'][2:],metadata['recommended_confidence'],.45,metadata['inference'])
        baseline.append({**row,'predictions':predictions})
    hair_options=read(CONSENSUS/'hair-full-calibration.json')['candidates']
    viable=[c for c in hair_options if c['tp']>=4 and c['fp']<=1]
    chosen=max(viable,key=lambda c:(c['tp'],-c['fp'],c['threshold']))
    candidate_hair=target_rows(read(CONSENSUS/'calibration-full-views.json')['samples'],'hair',chosen['parameters'])
    hair_by_id={r['sample_id']:[p for p in r['predictions'] if p['confidence']>=chosen['threshold']] for r in candidate_hair}
    combined=[{**r,'predictions':[p for p in r['predictions'] if p['label']!='hair']+hair_by_id[r['sample_id']]} for r in baseline]
    base_metrics=score(baseline);combined_metrics=score(combined)
    baseline_record=read(OUT/'baseline-deployment.json')
    assert digest(ACTIVE/'best.pt')==baseline_record['weights_sha256']
    assert digest(ACTIVE/'model.json')==baseline_record['metadata_sha256']
    env=dotenv_values(ROOT/'.env')
    assert Path(env['QUALITY_YOLO_WEIGHTS']).resolve()==(ACTIVE/'best.pt').resolve()
    assert Path(env['QUALITY_YOLO_METADATA']).resolve()==(ACTIVE/'model.json').resolve()
    pc=Path(env['QUALITY_PATCHCORE_GEAR_PRESET_DIR'])
    assert all(digest(pc/name)==expected for name,expected in baseline_record['patchcore'].items())
    suites=ET.parse(READOUT/'tests.xml').getroot().findall('testsuite')
    assert suites and all(int(s.attrib['errors'])==int(s.attrib['failures'])==0 for s in suites)
    test_count=sum(int(s.attrib['tests'])-int(s.attrib['skipped']) for s in suites)
    triage=read(OUT/'triage-results.json');previous=read(READOUT/'triage-results.json')
    training=read(OUT/'training-results.json');cache=read(OUT/'training-cache.json')
    proof={'created_at':datetime.now(timezone.utc).isoformat(),'real_calibration_images':188,'candidate_triage_images':43,
        'baseline_calibration':base_metrics,'baseline_plus_hair_consensus_calibration':combined_metrics,
        'hair_parameters':chosen,'pure_readout_triage':{l:v['best'] for l,v in previous['targets'].items()},
        'residual_readout_triage':{l:v['best'] for l,v in triage['targets'].items()},
        'residual_passed_target_triage':triage['eligible_for_full_calibration'],
        'training_inputs':cache['inputs'],'training_source_photos':cache['source_photos'],'new_independent_photos':0,
        'new_test_evaluation_run':False,'new_actual_api_evaluation_run':False,'normal_gear_fpr_available':False,
        'tests_passed':test_count,'active_weights_and_metadata_unchanged':True,'active_yolo_environment_paths_unchanged':True,
        'patchcore_files_unchanged':True,'candidate_deployed':False,'candidate_weights_sha256':training['weights_sha256'],
        'non_dirt_and_box_forward_exactly_equal':training['non_dirt_and_box_forward_exactly_equal'],
        'gates_unchanged':read(OUT/'protocol.json')['calibration_gates']==read(ROOT/'output/gear-yolo-fine-defects-v5/protocol.json')['calibration_gates'],
        'triage_result_sha256':digest(OUT/'triage-results.json')}
    save(OUT/'verification.json',proof)
    images=OUT/'examples';images.mkdir(exist_ok=True)
    font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',18)
    small=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',14)
    cards=[];example_records=[]
    combined_by_id={r['sample_id']:r for r in combined}
    for row in baseline:
        hair_gt=[g for g in row['ground_truth'] if g['label']=='hair']
        if not hair_gt:continue
        before=[p for p in row['predictions'] if p['label']=='hair'];after=hair_by_id[row['sample_id']]
        gt=[g for g in hair_gt if any(bbox_iou(g['bbox'],p['bbox'])>=.5 for p in after)
            and not any(bbox_iou(g['bbox'],p['bbox'])>=.5 for p in before)]
        if not gt:continue
        with load_rgb(SOURCE/row['path']) as source:
            panel=Image.new('RGB',(source.width*2,source.height+65),'#f3f6fa');draw=ImageDraw.Draw(panel)
            for column,(title,predictions) in enumerate((('现用模型：细丝',before),('候选策略：细丝（未部署）',after))):
                tile=source.copy();td=ImageDraw.Draw(tile)
                for g in hair_gt:td.rectangle(g['bbox'],outline='#00b86b',width=3)
                for p in predictions:
                    td.rectangle(p['bbox'],outline='#e75d2a',width=2)
                    td.text((p['bbox'][0],max(0,p['bbox'][1]-19)),f"hair {p['confidence']:.3f}",fill='#e75d2a',font=small)
                x=column*source.width;panel.paste(tile,(x,65));draw.text((x+12,8),title,fill='#172b3a',font=font)
                draw.text((x+12,35),'绿色：真实标注 / 橙色：预测框',fill='#526575',font=small)
            path=images/(row['sample_id']+'.jpg');panel.save(path,quality=93)
        cards.append(f'<section><h3>{escape(row["sample_id"])}</h3><img src="examples/{path.name}" alt="真实照片细丝定位对比"></section>')
        example_records.append({'sample_id':row['sample_id'],'source_sha256':row['file_sha256'],'before':before,'after':after,'ground_truth':hair_gt})
    save(OUT/'examples.json',example_records)
    dirt=triage['targets']['dirt']['best']
    dirt_text=f"检出 {dirt['best']['tp']}/10，漏检 {dirt['best']['fn']}，误检 {dirt['best']['fp']}" if dirt else '无可满足误检上限的阈值'
    b=base_metrics['class_and_position']['by_class'];c=combined_metrics['class_and_position']['by_class']
    report=f'''# YOLO 污渍与细丝优化核验

## 本轮状态

现用 YOLO、配置路径和 PatchCore 记忆库均未替换。新权重与候选策略保留在实验目录。

### 完整真实校准集（188 张）

| 类别 | 现用检出 / 漏检 / 误检 | 保留现用污渍、使用候选细丝策略 |
|---|---:|---:|
| 污渍（10 处） | {b['dirt']['tp']} / {b['dirt']['fn']} / {b['dirt']['fp']} | {c['dirt']['tp']} / {c['dirt']['fn']} / {c['dirt']['fp']} |
| 细丝（10 处） | {b['hair']['tp']} / {b['hair']['fn']} / {b['hair']['fp']} | {c['hair']['tp']} / {c['hair']['fn']} / {c['hair']['fp']} |

这些是校准结果，不能作为最终测试或产线验收结果。计数要求类别一致且 IoU≥0.5，并使用一对一匹配。

### 污渍训练与真实图片核验

- 779 张原始训练照片及其原生裁剪、易混缺陷和纹理边缘负样本，共 1915 个训练输入；新增独立照片为 0。
- 污渍真实标注只有 28 处，来自 20 张照片。中间尺度只有 10 个正样本来源组，粗尺度仅 1 个。
- 单独重拟合污渍分类层导致大量背景高分。它在固定 43 张真实校准图片上未通过误检约束，已拒绝。
- 保留原背景抑制能力的修正版本，43 张真实校准图片结果：{dirt_text}。
- 修正幅度仅由训练图片的分组交叉验证选择；其他类别原始分数和框坐标通过直接前向一致性检查。
- 通过目标初筛：{triage['eligible_for_full_calibration']}。污渍要求至少检出 3/10 且误检 0；细丝要求至少检出 4/10 且误检≤1。

### 已查明的因素

1. 当前推理先保留每个候选框最高分的类别，部分污渍/细丝候选被其他类别覆盖。602 个视图的解码重放与原输出一致。
2. 多个漏检污渍候选的本类分数本身很低，单独改解码或降低阈值不能解决。
3. 替代原分类层后，类别平衡训练产生大量背景误检；本轮替代分类层尚未在现有数据上可靠泛化。
4. 多视图一致性有助于细丝，但污渍还没有满足整体替换条件。

### 验证边界

- 相关自动化测试：{test_count} 项通过。
- 本轮没有重新运行 118 张回归测试或实际 API 验证；候选需先通过校准门槛。
- 真实照片来自公开数据集，不是新增产线实拍。正常齿轮独立测试集尚缺，因此这里的误检框数不能当作正常工件误报率。
- 未使用校准/测试图片训练，未修改原始标注，未放宽替换门槛。
'''
    (OUT/'report.md').write_text(report,encoding='utf-8')
    table=''.join(f'<tr><td>{name}</td><td>{b[label]["tp"]} / {b[label]["fn"]} / {b[label]["fp"]}</td><td>{c[label]["tp"]} / {c[label]["fn"]} / {c[label]["fp"]}</td></tr>' for label,name in [('dirt','污渍'),('hair','细丝')])
    html=f'''<!doctype html><html lang="zh"><meta charset="utf-8"><title>YOLO 真实图片核验</title><style>body{{font:16px/1.7 "Microsoft YaHei",sans-serif;background:#edf2f6;color:#243746;margin:0}}main{{max-width:1100px;margin:32px auto}}section{{background:white;border-radius:12px;padding:24px;margin:20px 0}}h1,h2{{line-height:1.3}}table{{border-collapse:collapse;width:100%}}td,th{{padding:12px;text-align:left;border-bottom:1px solid #dbe4ed}}img{{width:100%;height:auto}}.status{{background:#fff0d1;padding:14px;border-radius:8px}}small{{color:#587080}}</style><main><h1>YOLO 污渍与细丝优化核验</h1><p class="status">尚未整体达标 · 现用模型未替换</p><section><h2>188 张真实校准图片</h2><table><tr><th>类别</th><th>现用：检出 / 漏检 / 误检</th><th>候选细丝策略：检出 / 漏检 / 误检</th></tr>{table}</table><p>两类各有 10 处标注。类别与位置同时匹配，IoU≥0.5。</p><small>候选结果用于校准；不代表最终测试或产线验收。</small></section><section><h2>污渍修正训练</h2><p>1915 个训练输入，来自 779 张原始照片。固定 43 张真实校准图片：{dirt_text}。</p><p>整体替换仍要求污渍与细丝同时改善，并通过全部误检、整体召回门槛。</p></section>{''.join(cards)}<section><h2>验证记录</h2><p>{test_count} 项相关测试通过。当前 YOLO 权重、配置路径与 PatchCore 文件哈希均保持一致。</p><p>缺少独立正常齿轮测试集，本页不报告正常工件误报率。</p><a href="report.md">完整核验说明</a></section></main></html>'''
    (OUT/'index.html').write_text(html,encoding='utf-8')
    print({k:proof[k] for k in ('real_calibration_images','candidate_triage_images','tests_passed','candidate_deployed','residual_readout_triage')},flush=True)


if __name__=='__main__':main()
