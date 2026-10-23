"""Write an auditable fine-defect report from saved model/API results."""
import argparse
from datetime import datetime, timezone
import html
import re
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT),str(ROOT / 'services/agent-service')]
from scripts.train_yolo_fine_defects import BASE, OUT, digest, read, save


def main():
    from dotenv import dotenv_values
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--evaluation', required=True)
    parser.add_argument('--pipeline-output', type=Path, required=True)
    args = parser.parse_args()
    args.pipeline_output = args.pipeline_output.resolve(strict=True)
    folder = OUT / 'evaluation' / args.evaluation
    selected, result = read(folder/'selection.json'),read(folder/'test-comparison.json')
    assert result['selection_sha256'] == digest(folder/'selection.json')
    baseline = read(ROOT/'output/gear-yolo-recall-v1/test-comparison.json')['candidate']
    before,after = baseline['class_and_position'],result['metrics']['class_and_position']
    pipeline = read(args.pipeline_output/'report.json')
    verification = read(OUT/'verification.json')
    same_verified_model = verification.get('candidate_weights_sha256') == result['weights_sha256']
    frontend = verification.get('frontend_actual_records', {}) if same_verified_model else {}
    runtime = verification.get('runtime', {}) if same_verified_model else {}
    passed_tests = int(re.search(r'(\d+) passed', (OUT/'verification-tests.log').read_text(encoding='utf-8')).group(1))
    offline = {r['sample_id']:r for r in result['samples']}
    for row in pipeline['samples']:
        expected, actual = offline[row['sample_id']]['predictions'],row['predictions']
        assert len(expected)==len(actual)
        for a,b in zip(expected,actual):
            assert a['label']==b['label'] and abs(a['confidence']-b['confidence'])<1e-5
            assert max(abs(x-y) for x,y in zip(a['bbox'],b['bbox']))<1e-4
    environment = dotenv_values(ROOT/'.env')
    active_hash = digest(environment['QUALITY_YOLO_WEIGHTS'])
    deployed = active_hash == result['weights_sha256']
    assert not deployed or result['deployment_gate_passed']
    reasons = []
    for label in ('dirt','hair'):
        counts = after['by_class'].get(label,{'tp':0,'fp':0})
        old = before['by_class'][label]
        if counts['tp'] <= old['tp']:
            reasons.append(f'{label} 正确检出未提高：{counts["tp"]}/{old["gt"]}')
        if counts['fp'] > max(2,counts['tp']):
            reasons.append(f'{label} 误框 {counts["fp"]}，超过该类预设上限 {max(2,counts["tp"])}')
    if after['tp'] < before['tp']: reasons.append('整体正确检出减少')
    if after['fp'] > before['fp']: reasons.append('整体类别/位置误框增加')
    if result['metrics']['spatial']['fp'] > baseline['spatial']['fp']: reasons.append('整体位置误框增加')
    if after['f1'] < before['f1']: reasons.append('整体 F1 下降')
    comparison = {'created_at':datetime.now(timezone.utc).isoformat(),'active_deployment_changed':deployed,
                  'active_weights_sha256':active_hash,'candidate_weights_sha256':result['weights_sha256'],
                  'gate_passed':result['deployment_gate_passed'],'gate_failures':reasons,
                  'before':baseline,'after':result['metrics'],'api_metrics':pipeline['metrics'],
                  'offline_api_predictions_match':True,'api_images':len(pipeline['samples']),
                  'selection':str(folder/'selection.json'),'test':str(folder/'test-comparison.json'),
                  'normal_gear_fpr_available':False,'reused_test_set':True}
    completed_tests = sorted(OUT.glob('evaluation/*/test-comparison.json'))
    comparison['completed_full_test_evaluations'] = [str(p.relative_to(ROOT)) for p in completed_tests]
    save(OUT/'comparison.json',comparison)
    lines = ['# 污渍与细丝 YOLO 优化验证','',
             '**部署状态：'+('新候选已替换原有 YOLO。' if deployed else '候选尚未替换当前 YOLO。')+'**','',
             '## 真实图片回归','',
             '118 张既有真实齿轮测试图，共 318 处标注缺陷。正确检出要求类别相同且 IoU ≥ 0.5；每个标注和预测只匹配一次。',
             '本批是复用的回归集，不是新采集的独立产线验证集。没有正常塑料齿轮图片，不能计算正常工件误报率。','',
             f'本轮共保存 {len(completed_tests)} 次完整测试集评估。候选参数依原校准集选择；已有测试反馈意味着这些数字应解释为迭代回归结果，不能当作从未见过的新测试集成绩。','',
             '| 指标 | 当前基线 | 本次候选 |','|---|---:|---:|']
    for label,title in [('dirt','污渍'),('hair','细丝')]:
        b,a = before['by_class'][label],after['by_class'].get(label,{'tp':0,'fn':before['by_class'][label]['gt'],'fp':0})
        lines += [f'| {title}正确检出 | {b["tp"]}/{b["gt"]} | {a["tp"]}/{b["gt"]} |',
                  f'| {title}漏检 | {b["fn"]} | {a["fn"]} |',f'| {title}误框 | {b["fp"]} | {a["fp"]} |']
    lines += [f'| 全类别正确检出 | {before["tp"]} | {after["tp"]} |',
              f'| 全类别漏检 | {before["fn"]} | {after["fn"]} |',
              f'| 全类别误框（类别或位置不匹配） | {before["fp"]} | {after["fp"]} |',
              f'| 仅位置不匹配的误框 | {baseline["spatial"]["fp"]} | {result["metrics"]["spatial"]["fp"]} |',
              f'| 类别与位置 F1 | {before["f1"]:.4f} | {after["f1"]:.4f} |','',
              '门槛结论：'+('通过。' if result['deployment_gate_passed'] else '未通过：'+'；'.join(reasons)+'。'),'',
              '## 改动与训练','',
              '- 完成普通微调、仅污渍/细丝输出层微调、分类分支带原模型约束微调三组训练，分别 8、6、5 轮。',
              '- 最后一组使用 883 个输入，来源为 437 张既有训练照片；包含局部裁剪与背景裁剪，不是新增 883 张独立实拍图。',
              '- 增加与污渍/细丝混淆的暗斑、孔洞、溢料、空洞，以及明显边缘纹理的训练裁剪。裁剪遇到截断的缺陷标注时弃用。',
              '- 输出仍是一套 YOLO：共享原有骨干、特征融合与定位头，用标准卷积合并原有类别与微调分类通道。',
              '- 同一权重对整图和重叠局部图推理，按类使用校准阈值，并比较是否启用细丝框形状约束。',
              '- 修正局部检测的重复框：低置信度细丝框完全包含于更高置信度细丝框时去重；部分重叠、其他类别和更高置信度的小框保留。该修正来自迭代回归中发现的问题。',
              '- 所有训练来源均为原 train 划分；188 张 calibration 选择阈值；test 没有进入训练。没有针对测试样本单独改规则。','',
              '## PatchCore → YOLO 实际接口验证','',
              f'- 共 {len(pipeline["samples"])} 张包含污渍或细丝标注的真实测试图片，全部进入实际接口；使用隔离账号与存储。',
              f'- PatchCore 判异常 {pipeline["metrics"]["patchcore_anomaly_images"]} 张；YOLO 完成 {pipeline["metrics"]["yolo_completed_images"]} 张。',
              '- API 框与离线冻结模型的预测逐条一致；检测记录保存、回读与顺序检查通过。',
              '- PatchCore 阈值保持 1.8822990655899048。正常控制图跳过 YOLO；异常控制图即使 YOLO 无框仍保留“未知异常”。',
              f'- {passed_tests} 项代码回归测试通过。',
              (f'- {frontend["actual_records_validated"]} 条实际结果通过前端响应校验（含正常与异常控制图）。'
               if frontend.get('passed') else '- 此候选的前端响应校验尚未记录。'),
              (f'- 上线后 {len(runtime["health"])} 项页面及服务健康检查通过；监听进程的新模型配置与权重摘要核对一致。'
               if runtime.get('passed') else '- 此候选的上线后服务检查尚未记录。'),
              '- PatchCore 记忆库来自 MANTA，YOLO 测试图来自塑料齿轮数据集；控制图用于验证流程，不代表产线分类准确率。','',
              '## 各类别明细','', '| 类别 | 标注 | 基线正确/漏检/误框 | 候选正确/漏检/误框 |','|---|---:|---:|---:|']
    for label in sorted(set(before['by_class'])|set(after['by_class'])):
        b = before['by_class'].get(label,{'gt':0,'tp':0,'fn':0,'fp':0})
        a = after['by_class'].get(label,{'gt':b['gt'],'tp':0,'fn':b['gt'],'fp':0})
        lines.append(f'| {label} | {b["gt"]} | {b["tp"]}/{b["fn"]}/{b["fp"]} | {a["tp"]}/{a["fn"]}/{a["fp"]} |')
    lines += ['', '## 可复核文件','',
              f'- 校准选择：`{folder.relative_to(ROOT)}/selection.json`',
              f'- 逐图测试：`{folder.relative_to(ROOT)}/test-comparison.json`',
              f'- 实际图片和模型原始标注：`{args.pipeline_output.relative_to(ROOT)}/index.html`',
              '- 数据来源与坐标核对：`output/gear-yolo-fine-defects-v1/classifier-data-verification.json`',
              '- 训练参数和模型摘要：`output/gear-yolo-fine-defects-v1/classifier-provenance.json`',
              '- 当前部署与候选摘要：`output/gear-yolo-fine-defects-v1/comparison.json`','']
    (OUT/'report.md').write_text('\n'.join(lines),encoding='utf-8')
    # A self-contained overview links to native, unaltered API annotation images.
    status = '已部署' if deployed else '未替换当前模型'
    page = '<!doctype html><meta charset="utf-8"><title>污渍与细丝验证</title><style>body{font:16px system-ui;max-width:1100px;margin:36px auto;color:#172b3a;background:#f5f7fa}pre{white-space:pre-wrap;background:white;padding:24px;border-radius:12px}img{width:100%;max-width:640px}article{background:white;padding:24px;margin:20px 0;border-radius:12px}</style>'
    page += f'<h1>YOLO 污渍与细丝验证 · {status}</h1><pre>'+html.escape('\n'.join(lines))+'</pre>'
    for identity in ('endface552','endface563','endface554'):
        path = args.pipeline_output / identity / 'yolo.png'
        if path.exists():
            relative = Path(os_path_relative(path,OUT)).as_posix()
            page += f'<article><h2>{html.escape(identity)} · 实际 YOLO 输出</h2><img src="{html.escape(relative)}"></article>'
    (OUT/'index.html').write_text(page,encoding='utf-8')
    print({'report':str(OUT/'report.md'),'deployed':deployed,'gate_passed':result['deployment_gate_passed'],'gate_failures':reasons})


def os_path_relative(path,base):
    import os
    return os.path.relpath(path,base)


if __name__ == '__main__':
    main()
