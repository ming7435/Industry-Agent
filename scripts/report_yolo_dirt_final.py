"""Verify and present frozen calibration/test evidence before any deployment."""
from datetime import datetime,timezone
import html
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1];sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.prepare_yolo_dirt_pairs import ACTIVE,SOURCE,read,save,digest
from scripts.evaluate_yolo_dirt_pairs import validate_freeze,passes_gates

OUT=ROOT/'output/gear-yolo-dirt-competition-v15'
BASE_RESULT=ROOT/'output/gear-yolo-fine-defects-v1/evaluation/packed-classifier-epoch4-contained/test-comparison.json'


def main():
    from dotenv import dotenv_values
    from PIL import Image,ImageDraw,ImageFont
    folder=OUT/'evaluation/epoch4';selection=read(folder/'selection.json');result=read(folder/'test-comparison.json')
    protocol=read(OUT/'protocol.json');baseline=read(OUT/'baseline-deployment.json');old=read(BASE_RESULT)
    weights=OUT/'training/packed-epoch4.pt';freeze=validate_freeze(folder/'test-freeze.json',weights,folder/'selection.json',OUT/'protocol.json')
    assert result['weights_sha256']==digest(weights) and result['selection_sha256']==digest(folder/'selection.json')
    assert result['freeze_sha256']==digest(folder/'test-freeze.json')
    assert freeze['evaluation_script_sha256']==digest(ROOT/'scripts/evaluate_yolo_dirt_pairs.py')
    assert freeze['consensus_script_sha256']==digest(ROOT/'scripts/yolo_consensus_experiment.py')
    assert digest(BASE_RESULT)==protocol['baseline_test_sha256']
    assert passes_gates(selection['metrics'],protocol['calibration_gates'])
    assert result['regression_gate_passed']==passes_gates(result['metrics'],protocol['test_gates'])
    assert result['images']==118 and len(result['samples'])==118
    assert {r['sample_id'] for r in result['samples']}=={r['sample_id'] for r in old['samples']}
    suites=ET.parse(OUT/'tests.xml').getroot().findall('testsuite')
    assert suites and all(int(s.attrib['failures'])==int(s.attrib['errors'])==0 for s in suites)
    tests=sum(int(s.attrib['tests'])-int(s.attrib['skipped']) for s in suites)
    env=dotenv_values(ROOT/'.env')
    assert Path(env['QUALITY_YOLO_WEIGHTS']).resolve()==(ACTIVE/'best.pt').resolve()
    assert Path(env['QUALITY_YOLO_METADATA']).resolve()==(ACTIVE/'model.json').resolve()
    assert digest(ACTIVE/'best.pt')==baseline['weights_sha256'] and digest(ACTIVE/'model.json')==baseline['metadata_sha256']
    pc=Path(env['QUALITY_PATCHCORE_GEAR_PRESET_DIR'])
    assert all(digest(pc/name)==value for name,value in baseline['patchcore'].items())
    packed=read(OUT/'training/packed-epoch4.json')
    assert packed['weights_sha256']==digest(weights) and packed['public_classes']==16 and packed['one_checkpoint']
    assert packed['reload_non_dirt_parity_verified'] and packed['baseline_dirt_not_reduced_after_serialization']
    rounds=[]
    for name in ('gear-yolo-dirt-pairs-v11','gear-yolo-dirt-scale-v12','gear-yolo-dirt-balanced-v13'):
        root=ROOT/'output'/name;history=read(root/'training/history.json');data=read(root/'data-summary.json')
        provenance=read(root/'training/provenance.json')
        assert [h['epoch'] for h in history]==[1,2,3,4]
        assert digest(root/'training/training-script.py')==provenance['script_sha256']
        assert digest(root/'dataset/manifest.json')==provenance['dataset_sha256']
        assert all(digest(root/'training'/f"epoch{h['epoch']}.pt")==h['weights_sha256'] for h in history)
        rounds.append({'name':name,'epochs':4,'training_inputs':data['training_inputs'],
                       'source_photos':data['source_photos'],'new_independent_photos':0})
    before,after=old['metrics']['class_and_position'],result['metrics']['class_and_position']
    cal=selection['metrics']['class_and_position'];metrics=[]
    for label,title in [('dirt','污渍'),('hair','细丝')]:
        a,b=before['by_class'][label],after['by_class'][label]
        metrics.extend([(title+'检出',f"{a['tp']}/{a['gt']}",f"{b['tp']}/{b['gt']}"),
                        (title+'漏检',str(a['fn']),str(b['fn'])),(title+'误检框',str(a['fp']),str(b['fp']))])
    metrics.extend([('整体正确定位',str(before['tp']),str(after['tp'])),('整体误检框',str(before['fp']),str(after['fp'])),
                    ('类别与位置 F1',f"{before['f1']:.4f}",f"{after['f1']:.4f}")])
    verdict='离线校准与最终回归通过，仍待实际接口一致性核验' if result['regression_gate_passed'] else '最终真实图片回归未达标，现用模型保留'
    proof={'created_at':datetime.now(timezone.utc).isoformat(),'candidate_deployed':False,'test_completed':True,
        'calibration_gate_passed':True,'frozen_test_gate_passed':result['regression_gate_passed'],'actual_api_run':False,
        'tests_passed':tests,'training_rounds':rounds,'calibration_metrics':selection['metrics'],
        'baseline_test_metrics':old['metrics'],'candidate_test_metrics':result['metrics'],
        'active_model_weights_metadata_and_paths_unchanged':True,'patchcore_files_unchanged':True,
        'weights_sha256':digest(weights),'test_result_sha256':digest(folder/'test-comparison.json'),
        'selection_sha256':digest(folder/'selection.json'),'normal_part_fpr_available':False,
        'test_previously_seen':True,'test_used_for_this_iteration_thresholds':False}
    save(OUT/'verification.json',proof)
    table='\n'.join('| '+' | '.join(row)+' |' for row in metrics)
    report=f'''# 污渍补样、训练与真实图片最终回归

**{verdict}。**

## 118 张真实图片结果

检出同时要求类别正确、IoU≥0.5、一对一匹配；这组图片与训练、校准来源分离，含 17 处污渍、18 处细丝。

| 指标 | 现用模型 | 最终候选 |
|---|---:|---:|
{table}

## 188 张完整校准结果

- 污渍：检出 {cal['by_class']['dirt']['tp']}/10，漏检 {cal['by_class']['dirt']['fn']}，误检框 {cal['by_class']['dirt']['fp']}。
- 细丝：检出 {cal['by_class']['hair']['tp']}/10，漏检 {cal['by_class']['hair']['fn']}，误检框 {cal['by_class']['hair']['fp']}。
- 整体正确定位 {cal['tp']} 处，误检框 {cal['fp']} 个。现用模型对应为 212 处、87 个。
- 校准通过后锁定权重、各类别阈值、多视图参数和评估代码，再运行最终回归；未按测试结果重新调阈值。

## 本次完成的训练与修正

1. 完成三组各 4 轮训练，均使用原始 779 张训练照片及其派生输入，新增独立实拍照片为 0。
2. 制作 600 处模拟污渍及对应干净背景，校验合成位置、变化像素、原有标注和来源隔离。初批放大裁剪输入中的合成污渍短边中位数约 30 像素；调整后整图合成污渍约 10 像素，真实训练整图约 10.84 像素。
3. 保留 600 个纹理、边缘背景输入；进一步补入来自 253 张训练照片的 400 个易混淆视图（288 个黑点、112 个细丝），将后续合成输入限制为 300 个，提高真实污渍的训练频次。
4. 固定主干和定位分支，训练污渍分类分支的特征层；保留细丝等其余类别原始输出。将原有与新学到的污渍响应打包在同一权重中，仍对外输出 16 个类别、一个 YOLO 模型。
5. 修复独立提取污渍候选时过度保留黑点竞争框的问题：同一视图、同一位置有更高或同分的其他类别时，不放行该污渍分组。细丝规则继续固定。

## 证据边界

- 原始污渍训练来源只有 20 张照片、28 处标注；增加合成、裁剪或重复次数不等于增加独立照片。
- {tests} 项相关程序测试通过。完整训练日志、样本审计、模型哈希、校准与最终回归记录均保留在本项目。
- 这些是真实公开齿轮照片，不是当前产线采集的验收数据；118 张回归图在此前迭代中已被使用，不能称为从未见过的测试集。
- 缺少独立正常工件图片，误检框数不能当作正常工件误报率。最低回归门槛通过也不代表工业验收通过。
- 本报告生成时尚未部署候选、尚未进行其实际 API 核验；当前 YOLO 权重、配置路径及 PatchCore 记忆库哈希保持原样。
'''
    error_section=''
    if (OUT/'heldout-error-audit.json').exists():
        errors=read(OUT/'heldout-error-audit.json');counts=errors['by_kind']
        assert len(errors['errors'])==after['by_class']['dirt']['fp']+after['by_class']['hair']['fp']
        report+=f'''\n## 剩余误检的逐框核对

目标两类共 {len(errors['errors'])} 个误检框：{counts.get('other_annotated_class',0)} 个与其他类别标注匹配，{counts.get('localization_or_duplicate',0)} 个与同类标注重叠但未通过定位匹配或属于重复框，{counts.get('no_matching_annotation',0)} 个没有匹配到对应标注。
这里的“未匹配标注”不代表已确认该位置绝对正常。此项核对只记录失败现象，没有用来修改本轮阈值或训练样本。

污渍与黑点的区分、污渍和细丝只框出局部的问题仍未解决；本轮固定的定位分支没有得到新的定位训练。

![最终回归中的误检实例：绿框为原始标注，橙框为候选预测]({(OUT/'heldout-false-positives.jpg').as_posix()})
'''
        error_section='<section><h2>最终回归误检实例</h2><p>绿框：原始标注；橙框：候选预测。包括错分类、框只覆盖局部及未匹配标注的情况。</p><img src="heldout-false-positives.jpg"></section>'
    (OUT/'report.md').write_text(report,encoding='utf-8')
    examples=OUT/'examples';examples.mkdir(exist_ok=True);old_rows={r['sample_id']:r for r in old['samples']}
    font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',14);cards=[]
    for row in result['samples']:
        truth=[g for g in row['ground_truth'] if g['label'] in ('dirt','hair')]
        if not truth:continue
        source=SOURCE/row['path']
        with Image.open(source) as original:
            original=original.convert('RGB');w,h=original.size
            panel=Image.new('RGB',(w*2,h+50),'#f3f6f9');title=ImageDraw.Draw(panel)
            for column,(name,predictions) in enumerate([('现用模型',old_rows[row['sample_id']]['predictions']),('本轮候选（未部署）',row['predictions'])]):
                tile=original.copy();draw=ImageDraw.Draw(tile)
                for g in truth:draw.rectangle(g['bbox'],outline='#00a879',width=2)
                for p in predictions:
                    if p['label'] not in ('dirt','hair'):continue
                    draw.rectangle(p['bbox'],outline='#ee6622',width=2)
                    draw.text((p['bbox'][0],max(0,p['bbox'][1]-16)),f"{p['label']} {p['confidence']:.2f}",fill='#cc4411',font=font)
                panel.paste(tile,(column*w,50));title.text((column*w+8,4),name+' · 绿框：原始标注；橙框：预测',fill='#22394b',font=font)
            file=examples/(row['sample_id']+'.jpg');panel.save(file,quality=94)
        cards.append(f'<section><h3>{html.escape(row["sample_id"])}</h3><img src="examples/{file.name}"></section>')
    cells=''.join('<tr>'+''.join('<td>'+html.escape(x)+'</td>' for x in row)+'</tr>' for row in metrics)
    page=f'''<!doctype html><html lang="zh"><meta charset="utf-8"><title>YOLO 污渍最终回归</title><style>body{{font:16px/1.7 "Microsoft YaHei",sans-serif;background:#edf2f6;color:#243746;margin:0}}main{{max-width:1300px;margin:32px auto}}section{{background:white;border-radius:12px;padding:24px;margin:20px 0}}td,th{{padding:10px;text-align:left;border-bottom:1px solid #dbe4ed}}table{{width:100%;border-collapse:collapse}}img{{max-width:100%;height:auto}}.status{{background:#fff0d1;padding:14px;border-radius:8px}}</style><main><h1>污渍补样、训练与真实图片最终回归</h1><p class="status">{verdict}</p><section><h2>118 张真实图片</h2><table><tr><th>指标</th><th>现用模型</th><th>本轮候选</th></tr>{cells}</table><p>类别正确、IoU≥0.5、一对一匹配。污渍共 17 处、细丝共 18 处。</p></section><section><h2>训练和核验</h2><p>三组各 4 轮训练；600 处模拟污渍、600 个背景输入、400 个易混淆局部视图。原始训练来源仍为 779 张照片。</p><p>{tests} 项测试通过。候选尚未部署，实际 API 尚未核验。</p><p>公开数据回归不等于产线验收；正常工件误报率仍不可计算。</p><a href="report.md">完整文字记录</a></section>{''.join(cards)}</main></html>'''
    page=page.replace('</main>',error_section+'</main>')
    (OUT/'index.html').write_text(page,encoding='utf-8')
    print({'frozen_test_passed':result['regression_gate_passed'],'candidate_deployed':False,'tests':tests,'comparison_images':len(cards)},flush=True)


if __name__=='__main__':main()
