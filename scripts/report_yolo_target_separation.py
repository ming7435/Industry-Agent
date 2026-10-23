"""Report frozen real-image results and the preceding scale-regression audit."""
import argparse
import html
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service')]
from scripts.train_yolo_fine_defects import read,SOURCE
from scripts.train_yolo_target_separation import OUT


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--result',type=Path,required=True)
    parser.add_argument('--api',type=Path,required=True)
    args=parser.parse_args()
    baseline=read(ROOT/'output/gear-yolo-fine-defects-v1/evaluation/packed-classifier-epoch4-contained/test-comparison.json')
    result=read(args.result);proof=read(OUT/'verification.json');api=read(args.api/'report.json')
    data=read(OUT/'data-summary.json');history=read(OUT/'training/history.json')
    a=baseline['metrics']['class_and_position'];b=result['metrics']['class_and_position']
    rows=[]
    for label,title in [('dirt','污渍'),('hair','细丝')]:
        old,new=a['by_class'][label],b['by_class'][label]
        rows.extend([(title+'检出',f'{old["tp"]}/{old["gt"]}',f'{new["tp"]}/{new["gt"]}'),
                     (title+'漏检',str(old['fn']),str(new['fn'])),(title+'误框',str(old['fp']),str(new['fp']))])
    rows.extend([('全部类别正确定位',str(a['tp']),str(b['tp'])),('全部类别误框',str(a['fp']),str(b['fp'])),
                 ('F1',f'{a["f1"]:.4f}',f'{b["f1"]:.4f}')])
    decision='已通过替换条件并完成部署。' if proof['candidate_deployed'] else '未满足全部替换条件；现用模型保留。'
    table='\n'.join('| '+' | '.join(r)+' |' for r in rows)
    text=f'''# YOLO 污渍、细丝退化排查与定向训练

**{decision}**

## 真实图片回归

{result['images']} 张公开真实齿轮图，共 {b['gt_instances']} 处原始标注。类别与 IoU≥0.5 同时匹配才记为检出。

| 指标 | 现用基线 | 本轮候选 |
|---|---:|---:|
{table}

## 为什么上一轮污渍漏检增加

1. 在相同现用推理配置下，上一轮权重的校准污渍检出由 2/10 降至 1/10，不能只归因于阈值变化。
2. 在固定的原模型正样本位置比较，上一轮训练使整图污渍平均分数 0.00981→0.00512，但放大裁剪图分数 0.03969→0.11318，表现出尺度偏置。
3. 上一轮低阈值下有 6/10 处污渍能够正确框中，最终有 5 处因低分被过滤。降至 0.05 仍只有 2 处检出且出现 31 个误框，不能靠降阈值解决。
4. 原始训练数据仅有 28 处污渍、80 处细丝，相比 904 处黑斑，目标类别的独立样本少；有些外观与黑斑、细丝相近。抽查未发现完全没有正样本分配的目标。

这些证据区分了阈值、分类和尺度问题；训练集分数变化不等价于产线准确率。

## 本轮做了什么

- {data['unique_training_images']} 个训练输入来自 {data['source_photos']} 张源图；新增独立照片为 0。
- {data['whole_target_inputs']} 张含污渍或细丝的整图每轮呈现 6 次；每轮共 {data['presentations_per_epoch']} 次输入。
- 保留原有 498 张纹理、边缘与夹具负样本；其来源是没有标注框的局部区域，不是经独立认证的正常工件。
- 固定骨干、特征融合和定位分支，只训练两类分类分支；采用类别平衡的焦点损失、几何正样本和重叠片段忽略规则。
- 完成 {len(history)} 轮训练。第 2、4 轮在 188 张校准图上比较，参数冻结后才运行真实测试；原替换门槛保留。
- 打包为一个标准 YOLO 权重，保留其他 14 类分类输出；导出和重新加载一致性检查通过。

## 接口与程序验证

- {api['metrics']['images']} 张目标真实图运行实际 PatchCore→YOLO 接口；{api['metrics']['yolo_completed_images']} 张完成 YOLO。
- {proof['tests_passed']} 项相关程序测试通过。
- 候选部署状态：{proof['candidate_deployed']}。模型、配置和 PatchCore 的文件摘要核对记录在 verification.json。

## 适用范围

测试图是多次复用的公开实拍回归图，不能称为全新独立产线验收。训练与本轮阈值选择均未使用测试标注。
没有独立正常齿轮测试集，因此这里只比较带缺陷图上的误框数，不能给出正常工件误报率。
PatchCore 的建库数据与公开塑料齿轮图来源不同，接口运行完成不能证明产线效果。

## 完整证据

- [退化排查](diagnosis.md)
- [逐图回归记录]({args.result.resolve().as_posix()})
- [全部真实接口图]({args.api.resolve().as_posix()}/index.html)
- [验证记录](verification.json)
- [预先固定的规则](protocol.json)
'''
    (OUT/'report.md').write_text(text,encoding='utf-8')
    table_html=''.join('<tr>'+''.join(f'<td>{html.escape(c)}</td>' for c in row)+'</tr>' for row in rows)
    page='''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>YOLO 定向训练实测</title><style>body{font:16px/1.7 system-ui;max-width:1100px;margin:32px auto;padding:0 24px;background:#f3f6f7;color:#19343d}section{padding:24px;background:white;border-radius:12px;margin:20px 0}table{width:100%;border-collapse:collapse}th,td{padding:10px;text-align:left;border-bottom:1px solid #dbe4e8}img{max-width:100%}a{color:#007f78}</style>'''
    page+=f'<h1>YOLO 污渍与细丝 · 退化排查及真实验证</h1><p><strong>{decision}</strong></p><section><h2>{result["images"]}张真实图片回归</h2><table><tr><th>指标</th><th>现用基线</th><th>候选</th></tr>{table_html}</table><p>公开实拍回归图；无独立正常工件测试集，误框数不等于正常件误报率。</p></section>'
    page+='<section><h2>发现的问题</h2><p>上一轮污渍在放大裁剪图上的分数提高，而整图分数降低；同一推理配置下检出也退步。简单降低阈值产生大量误框。</p><p>本轮增加整图尺度监督并保持原定位能力，同时保留困难负样本。</p><img src="training-dirt-audit.jpg"><p>原始训练集28处污渍标注。</p><img src="hard-negative-audit.jpg"><p>训练中最容易混淆的16张纹理及边缘负样本。</p></section>'
    page+=f'<section><h2>完整记录</h2><p><a href="report.md">完整报告</a> · <a href="diagnosis.md">原因排查</a> · <a href="../{html.escape(args.api.name)}/index.html">全部真实接口图</a> · <a href="verification.json">验证记录</a></p></section>'
    (OUT/'index.html').write_text(page,encoding='utf-8')
    print({'report':str(OUT/'report.md'),'candidate_deployed':proof['candidate_deployed']})


if __name__=='__main__':main()
