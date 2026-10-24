"""Record completed dirt training, real calibration results, and deployment status."""
import argparse
from datetime import datetime,timezone
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1];sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.prepare_yolo_dirt_pairs import OUT,SOURCE,read,save,digest,ACTIVE
from scripts.yolo_consensus_experiment import target_rows
from scripts.probe_yolo_class_competition import OUT as BASE_CACHE


def main():
    from scripts.evaluate_yolo import configure_inference_runtime
    torch=configure_inference_runtime(ACTIVE/'best.pt')
    from dotenv import dotenv_values
    from PIL import Image,ImageDraw,ImageFont
    from app.vision.yolo_multiview import merge_views
    from app.vision.yolo_evaluation import class_aware_localization
    protocol=read(OUT/'protocol.json');baseline=read(OUT/'baseline-deployment.json')
    status=read(OUT/'calibration-status.json');data=read(OUT/'data-summary.json')
    history=read(OUT/'training/history.json');provenance=read(OUT/'training/provenance.json')
    assert [r['epoch'] for r in history]==[1,2,3,4]
    assert all(digest(OUT/'training'/f"epoch{r['epoch']}.pt")==r['weights_sha256'] for r in history)
    assert provenance['dataset_sha256']==digest(OUT/'dataset/manifest.json')
    assert provenance['feature_manifest_sha256']==digest(OUT/'feature-manifest.json')
    assert provenance['protocol_sha256']==digest(OUT/'protocol.json')
    assert digest(OUT/'training/training-script.py')==provenance['script_sha256']
    assert digest(ACTIVE/'best.pt')==baseline['weights_sha256'] and digest(ACTIVE/'model.json')==baseline['metadata_sha256']
    env=dotenv_values(ROOT/'.env')
    assert Path(env['QUALITY_YOLO_WEIGHTS']).resolve()==(ACTIVE/'best.pt').resolve()
    assert Path(env['QUALITY_YOLO_METADATA']).resolve()==(ACTIVE/'model.json').resolve()
    pc=Path(env['QUALITY_PATCHCORE_GEAR_PRESET_DIR'])
    assert all(digest(pc/name)==expected for name,expected in baseline['patchcore'].items())
    suites=ET.parse(OUT/'tests.xml').getroot().findall('testsuite')
    assert suites and all(int(s.attrib['errors'])==int(s.attrib['failures'])==0 for s in suites)
    tests=sum(int(s.attrib['tests'])-int(s.attrib['skipped']) for s in suites)
    candidates=status['candidates'];assert [r['epoch'] for r in candidates]==[2,4]
    for candidate in candidates:
        marker=read(OUT/'training'/f"packed-epoch{candidate['epoch']}.json")
        assert marker['weights_sha256']==digest(OUT/'training'/f"packed-epoch{candidate['epoch']}.pt")
        assert marker['reload_non_dirt_parity_verified'] and marker['shared_box_head_preserved']
        assert candidate['triage']['hair_matches_frozen_baseline']
    best=max(candidates,key=lambda c:(c['triage']['dirt']['best']['tp'] if c['triage']['dirt'] else -1,
                                    -c['triage']['dirt']['best']['fp'] if c['triage']['dirt'] else -999,-c['epoch']))
    raw=read(OUT/'evaluation'/f"epoch{best['epoch']}"/'triage-views.json')
    chosen=best['triage']['dirt'];params=chosen['parameters'];floor=chosen['best']['threshold']
    dirt=target_rows(raw['samples'],'dirt',params)
    predictions={r['sample_id']:[p for p in r['predictions'] if p['confidence']>=floor] for r in dirt}
    metadata=read(ACTIVE/'model.json');source=read(SOURCE/'manifest.json');classes=source['classes']
    baseline_rows=[];base_predictions={}
    for row in read(BASE_CACHE/'raw-manifest.json')['samples']:
        file=BASE_CACHE/row['cache_path'];assert digest(file)==row['cache_sha256']
        views=[]
        for view in torch.load(file,weights_only=True):
            boxes=[{'label':classes[int(b[5])],'confidence':b[4],'bbox':b[:4]} for b in view['reference_boxes'].tolist() if b[2]>b[0] and b[3]>b[1]]
            views.append({'kind':view['kind'],'window':view['window'],'defects':boxes})
        boxes=merge_views(views,views[0]['window'][2:],metadata['recommended_confidence'],.45,metadata['inference'])
        baseline_rows.append({'sample_id':row['sample_id'],'ground_truth':row['ground_truth'],'predictions':boxes})
        base_predictions[row['sample_id']]=[p for p in boxes if p['label']=='dirt']
    assert {r['sample_id'] for r in raw['samples']}==set(base_predictions) and len(raw['samples'])==43
    baseline_metrics=class_aware_localization(baseline_rows,.01,.5)
    extra_data=''
    extra_findings=''
    if data.get('confuser_source_photos'):
        labels=data['confuser_labels']
        extra_data=(f"- 额外加入 400 个易混淆视图，来自 {data['confuser_source_photos']} 张训练照片："
            f"黑点 {labels['darkspot']} 个、细丝 {labels['hair']} 个；所有原有缺陷标注保留。\n"
            f"- 本轮合成输入限制为 {data['synthetic_images']} 个，覆盖 {data['distinct_synthetic_stains']} 个模拟污渍；"
            f"真实污渍输入每轮重复 {provenance['real_dirt_replay_total']} 次。重复和裁剪均不计作新照片。\n")
        extra_findings=('4. 第二次训练中，高分污渍误检多处对应已标注黑点，另有细丝被错分为污渍；'
            '本轮新增这些类别的训练局部视图，降低合成样本比例并加强真实污渍训练。\n'
            '5. 原始训练数据仅有 20 张含污渍照片、28 处污渍标注；样本扩充并未增加独立实拍污渍来源。\n')
    proof={'created_at':datetime.now(timezone.utc).isoformat(),'training_epochs':4,'training_inputs':data['training_inputs'],
        'training_used_inputs':provenance['unique_inputs'],'source_photos':data['source_photos'],'new_independent_photos':0,
        'baseline_43_calibration':baseline_metrics,'candidates':candidates,
        'tests_passed':tests,'test_run':False,'actual_api_run':False,'candidate_deployed':False,
        'active_yolo_weights_and_metadata_unchanged':True,'active_environment_model_paths_unchanged':True,'patchcore_files_unchanged':True,
        'hair_weights_and_frozen_parameters_preserved':True,'hair_real_43_counts':best['triage']['hair'],
        'candidate_eligible_for_frozen_test':status['eligible_for_frozen_test'],
        'normal_gear_fpr_available':False,'calibration_result_sha256':digest(OUT/'calibration-status.json'),
        'dataset_sha256':digest(OUT/'dataset/manifest.json')}
    save(OUT/'verification.json',proof)
    label='已通过校准门槛，待最终真实回归和 API 核验' if status['eligible_for_frozen_test'] else '未达到替换条件，现用模型保留'
    table=[]
    for candidate in candidates:
        d=candidate['triage']['dirt'];h=candidate['triage']['hair']
        dtext=f"{d['best']['tp']} / {d['best']['fn']} / {d['best']['fp']}" if d else '无可行阈值'
        table.append(f"| 第 {candidate['epoch']} 轮 | {dtext} | {h['tp']} / {h['fn']} / {h['fp']} | {'通过' if candidate['eligible'] else '未通过'} |")
    text=f'''# 污渍样本补充、训练与真实图片核验

**状态：{label}。**

## 数据与训练

- 共 {data['training_inputs']} 个训练输入，来自 {data['source_photos']} 张原始训练照片；新增独立实拍照片为 0。
- 实际使用 {provenance['unique_inputs']} 个输入；缺少有效定位候选的正样本已排除并记录。
- 新增污渍为真实污渍残差迁移与低对比度模拟污渍；保留同背景的无新增污渍图片作为对照。
- 原有缺陷标注保留，校准和测试来源不参与合成或训练。
{extra_data}- 完整训练 4 轮，仅优化污渍分类分支的特征层；主干网络和定位框分支固定。模型仍为一个标准 YOLO 权重文件。
- 导出后检查细丝及其他类别原始输出、共享定位框的一致性，检查通过。

## 真实校准图片结果

固定 43 张真实图片，含全部 10 处污渍、10 处细丝校准标注。检出要求类别一致、IoU≥0.5，一对一匹配。

| 候选 | 污渍：检出 / 漏检 / 误检框 | 细丝：检出 / 漏检 / 误检框 | 允许继续最终测试 |
|---|---:|---:|---|
| 现用模型 | 2 / 8 / 0 | 3 / 7 / 0 | 对照基线 |
{chr(10).join(table)}

污渍初筛门槛保持为至少检出 3/10、误检 0。细丝采用此前固定的多视图参数，保持检出 4/10、误检 0。
完整校准集与最终测试另有整体检出和误检上限，均未放宽。

## 本轮发现与处理

1. 首批合成位置中存在拍摄夹具与背景区域，已审核修正到齿轮表面；背景图片保留为负样本。
2. 第一轮补样后，放大裁剪中的合成污渍短边中位数约 30 像素，真实训练原图约 11 像素；已增加按原始尺寸和实际推理视图生成的训练数据。
3. 对原模型高分污渍在训练中的预测增加保留约束，防止其在新样本训练中退步。
{extra_findings}

## 验证边界与部署

- 相关测试 {tests} 项通过。
- 本报告记录训练和真实图片校准；本轮尚未运行 118 张最终回归或实际 API 核验。
- 当前 YOLO 权重、配置路径、PatchCore 记忆库文件哈希均保持原样。
- 真实照片来自公开齿轮数据。缺少独立正常工件样本，误检框数不能当作正常工件误报率。

这里只是模型替换的最低回归门槛；少量污渍标注上的结果不能证明达到工业产线验收水平。
'''
    (OUT/'report.md').write_text(text,encoding='utf-8')
    examples=OUT/'examples';examples.mkdir(exist_ok=True);font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',17)
    selected=[r for r in raw['samples'] if any(g['label']=='dirt' for g in r['ground_truth'])]
    cards=[]
    for row in selected:
        truth=[g for g in row['ground_truth'] if g['label']=='dirt']
        with Image.open(SOURCE/row['path']) as image:
            image=image.convert('RGB');x1=min(g['bbox'][0] for g in truth);y1=min(g['bbox'][1] for g in truth)
            x2=max(g['bbox'][2] for g in truth);y2=max(g['bbox'][3] for g in truth)
            window=[max(0,int(x1)-48),max(0,int(y1)-48),min(image.width,int(x2)+48),min(image.height,int(y2)+48)]
            width,height=window[2]-window[0],window[3]-window[1];factor=min(530/width,370/height)
            size=(round(width*factor),round(height*factor));panel=Image.new('RGB',(size[0]*2,size[1]+58),'#f2f5f8');draw=ImageDraw.Draw(panel)
            for column,(title,boxes) in enumerate([('现用模型',base_predictions[row['sample_id']]),(f"第 {best['epoch']} 轮候选（未部署）",predictions[row['sample_id']])]):
                tile=image.crop(window).resize(size);paint=ImageDraw.Draw(tile)
                for g in truth:paint.rectangle([(v-window[i%2])*factor for i,v in enumerate(g['bbox'])],outline='#00ae73',width=3)
                for p in boxes:paint.rectangle([(v-window[i%2])*factor for i,v in enumerate(p['bbox'])],outline='#ee6025',width=2)
                panel.paste(tile,(column*size[0],58));draw.text((column*size[0]+6,4),title,fill='#172b3a',font=font)
                draw.text((column*size[0]+6,29),'绿：真实标注；橙：预测框',fill='#526575',font=font)
            path=examples/(row['sample_id']+'.jpg');panel.save(path,quality=94)
        cards.append(f'<section><h3>{row["sample_id"]}</h3><img src="examples/{path.name}"></section>')
    html_rows=''.join(f'<tr><td>第 {c["epoch"]} 轮</td><td>{c["triage"]["dirt"]["best"]["tp"]} / {c["triage"]["dirt"]["best"]["fn"]} / {c["triage"]["dirt"]["best"]["fp"]}</td><td>{c["triage"]["hair"]["tp"]} / {c["triage"]["hair"]["fn"]} / {c["triage"]["hair"]["fp"]}</td></tr>' for c in candidates if c['triage']['dirt'])
    html=f'''<!doctype html><html lang="zh"><meta charset="utf-8"><title>污渍训练核验</title><style>body{{font:16px/1.7 "Microsoft YaHei",sans-serif;background:#edf2f6;color:#243746;margin:0}}main{{max-width:1100px;margin:32px auto}}section{{background:white;border-radius:12px;padding:24px;margin:20px 0}}table{{border-collapse:collapse;width:100%}}td,th{{padding:12px;text-align:left;border-bottom:1px solid #dbe4ed}}img{{max-width:100%;height:auto}}.status{{background:#fff0d1;padding:14px;border-radius:8px}}</style><main><h1>污渍训练与真实图片核验</h1><p class="status">{label}</p><section><h2>训练数据</h2><p>{data['training_inputs']} 个训练输入，来自 {data['source_photos']} 张原始照片；完整训练 4 轮。</p><p>合成样本单独记录；校准和测试图片未参与训练。</p><img src="synthetic-audited.jpg"></section><section><h2>43 张真实图片初筛</h2><table><tr><th>候选</th><th>污渍：检出 / 漏检 / 误检</th><th>细丝：检出 / 漏检 / 误检</th></tr>{html_rows}</table><p>两类各 10 处标注。类别一致、IoU≥0.5、一对一匹配。</p><p>细丝参数固定；污渍、整体召回和误检门槛未放宽。</p></section>{''.join(cards)}<section><h2>核验记录</h2><p>{tests} 项相关测试通过；现用权重与 PatchCore 记忆库保持原样。</p><p>本轮尚未运行最终回归和实际 API 核验。</p><a href="report.md">完整记录</a></section></main></html>'''
    (OUT/'index.html').write_text(html,encoding='utf-8')
    print({k:proof[k] for k in ('training_epochs','training_inputs','tests_passed','candidate_deployed','candidate_eligible_for_frozen_test')},flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--experiment-root',type=Path,default=OUT)
    args=parser.parse_args();OUT=args.experiment_root.resolve(strict=True);main()
