"""Write a source-linked report from completed PatchCore experiments."""
from pathlib import Path
import xml.etree.ElementTree as ET
import patchcore_multiview_experiment as base

ROOT=base.ROOT
OUT=ROOT/'output/patchcore-root-cause-v5'


def rate(m,kind):
    count=m['fn' if kind=='fnr' else 'fp']
    n=m.get('defect_n',m.get('defect_count')) if kind=='fnr' else m.get('normal_n',m.get('normal_count'))
    return f'{count}/{n}（{100*count/n:.2f}%）'


def stain(evaluation):
    rows=[v for k,v in evaluation['by_scenario'].items() if 'stain' in k]
    return f"{sum(r['fn'] for r in rows)}/{sum(r['defect_n'] for r in rows)}"


def main():
    audit=base.read(ROOT/'output/patchcore-label-audit-v2/review-decisions.json')
    v5=base.read(ROOT/'output/patchcore-reviewed-ablation-v5/comparison.json')
    calibration=base.read(ROOT/'output/patchcore-reviewed-ablation-v5/calibration-results.json')
    p=base.read(ROOT/'output/patchcore-reviewed-ablation-v5/protocol.json')
    active_check={path:base.sha(ROOT/path)==digest for path,digest in p['active_hashes'].items()}
    active_check['.env']=base.sha(ROOT/'.env')==p['env_sha256']
    assert all(active_check.values())
    tests=ET.parse(OUT/'tests.xml').getroot().find('testsuite').attrib
    assert int(tests['tests'])==17 and int(tests['failures'])==0 and int(tests['errors'])==0
    supplemental=base.read(ROOT/'output/patchcore-label-review-all-views/supplemental-review.json')
    base.write(OUT/'verification.json',dict(verified_at=base.now(),active_unchanged=active_check,
        review_sha256=base.sha(ROOT/'output/patchcore-label-audit-v2/review-decisions.json'),
        comparison_sha256=base.sha(ROOT/'output/patchcore-reviewed-ablation-v5/comparison.json'),
        tests=tests, supplemental_review_sha256=base.sha(ROOT/'output/patchcore-label-review-all-views/supplemental-review.json')))
    lines=['# PatchCore 漏检根因与候选验证记录','',
        '日期：2026-10-24。结论以已保存的原始分数、模型哈希、审查记录为准。现用 PatchCore、YOLO 及配置均未替换。','',
        '## 1. 为什么之前的漏检数字增加','',
        '### 比较条件发生了变化','',
        '原现用模型容许了较多正常图误报，候选版本则把误报约束收紧到 1%。直接比较两者漏检率，会把阈值工作点的变化与特征质量混在一起。',
        '在旧版复核标签下，固定测试集、同为 1 张正常图误报时，现用模型漏 51/71，浅层候选漏 32/71，深层候选漏 43/71。此处是对旧回归集的事后诊断，不能用于选择部署阈值。',
        '[完整分数分布与同误报数量诊断](score-distributions.json)。','',
        '### 正常记忆库与校准标签存在污渍污染','',
        '最近邻追踪确认：污渍图 01546 的近邻来自仍标为正常的 01721，而该训练图齿根和表面有可见黄褐色斑点。校准正常图 00049 的孔壁也有淡褐色印迹。',
        '这证明数据污染存在，但不能据此断言它解释了所有漏检；本轮清理数据的对照结果仍然未达标。','',
        '![污渍与正常记忆近邻证据](neighbors/mechanics_gear_01546.jpg)','',
        '![被标为正常的校准图存在淡褐色污渍](neighbors/mechanics_gear_00049.jpg)','',
        '### 清理数据也会改变正常外观覆盖范围','',
        '本轮仅重新选择记忆库，保持已冻结的 ResNet18 特征、输入分辨率、每视角 1024 个记忆向量不变。剔除可疑训练图后，部分正常图距离也升高。清理记忆库并不自动保证漏检、误检同时下降。',
        '正常校准图数量由 303 变成 298 后，1% 误报预算允许的整数误报数也从 3 张变为 2 张；报告保留固定旧阈值和重新校准的两个对照，避免混淆。','',
        '元数据勘误：原始 JSON 的 rule 字段沿用了“高于所有正常校准分数”的零误报描述；实际代码按 floor(误报预算 × 正常样本数) 选择分位点，本轮预算为 1%，并非零误报。协议、阈值和混淆计数保留原样，解释以此处及 protocol.json 为准。','',
        '| 特征 | 对照 | 校准漏检 | 校准误报 |','|---|---|---|---|']
    for name,control in calibration['controls'].items():
        for key,title in [('previous_memory_previous_threshold','旧记忆库、旧阈值'),('previous_memory_reviewed_calibration','旧记忆库、复核标签重新校准'),('rebuilt_memory_previous_threshold','新记忆库、固定旧阈值')]:
            value=control[key];m=value.get('overall',value.get('metrics'))
            lines.append(f"| {name} | {title} | {rate(m,'fnr')} | {rate(m,'fpr')} |")
    lines+=['','## 2. 标签复核与数据划分','',
        f"本轮复核 143 个条目：38 个确认褐色污渍，105 个小暗部或边缘位置仍有疑问。此计数包括 141 个筛查提议和 2 个最近邻诊断发现的条目。",
        '训练集中可疑图片隔离；校准与回归集图片一张未删除。明确污渍才修正标签，不确定项保留原标签并单列敏感性分析。筛查未命中不等于已认证无缺陷。','',
        '| 划分 | 正常 | 缺陷 |','|---|---:|---:|']
    for split,counts in audit['partition_counts'].items():lines.append(f"| {split} | {counts.get('normal',0)} | {counts.get('defect',0)} |")
    lines+=['','[逐图复核决策](../patchcore-label-audit-v2/review-decisions.json) · [复核后的完整清单](../patchcore-label-audit-v2/corrected-manifest.json)','',
        '### 全视角补充复核发现','',
        '旧复核图只放大最大的可疑区域，可能漏掉其他视角和其他区域的污渍。已补充完整五视角与全部候选区域的展示。',
        f"对 29 张筛选图片的补充复核发现 {supplemental['counts']['confirmed_brown_stain']} 张可见褐色污渍（校准 5 张、回归 4 张）；20 张仍不确定。其中部分图片由颜色异常分析选出，因此这不是盲审，也不是全数据集的标注认证。",
        '补充结论由助手依据图像审查，尚未经独立人工标注员验证；单独保存为下一轮标签修订依据，没有改写本轮已冻结的清单、阈值或分数。下表仍采用 v2 标签口径，不能视为最终标签准确的验收结果。',
        '[全视角图库](../patchcore-label-review-all-views/index.html) · [补充复核记录](../patchcore-label-review-all-views/supplemental-review.json)','',
        '## 3. 真实图片回归结果','',
        '**以下 219 张图片与当前候选建库/校准分开，但已经用于前轮研究，也经过标签复核；不是新采集的盲测验收集。** 同一五视角合成图作为一组，未把五个视角当成五件独立工件。','',
        '| 模型 | 全部缺陷漏检 | 正常图误报 | 污渍漏检（含新复核褐斑） |','|---|---|---|---|']
    for title,evaluation in [('现用模型',v5['baseline']),('清理数据后候选 '+v5['selected']['variant'],v5['candidate'])]:
        lines.append(f"| {title} | {rate(evaluation['overall'],'fnr')} | {rate(evaluation['overall'],'fpr')} | {stain(evaluation)} |")
    v6path=ROOT/'output/patchcore-chroma-study-v6/comparison.json'
    if v6path.exists():
        v6=base.read(v6path)
        if 'candidate' in v6:
            ev=v6['candidate'];lines.append(f"| PatchCore 加颜色残差支持（实验） | {rate(ev['overall'],'fnr')} | {rate(ev['overall'],'fpr')} | {stain(ev)} |")
        else:lines+=['','颜色残差支持未通过预设校准改进门槛，未增加一次回归测试。']
        lines+=['','颜色支持仅用正常训练图片学习按视角、亮度分组的颜色分布；两条分支分别分配 0.5% 校准误报预算，组合后核对总误报。它是离线实验辅助分支，尚未接入生产检测。',
            '[颜色实验校准记录](../patchcore-chroma-study-v6/calibration.json) · [颜色实验结论](../patchcore-chroma-study-v6/comparison.json)']
    lines+=['','原始未复核标签的对照也保留在 [data-only comparison.json](../patchcore-reviewed-ablation-v5/comparison.json)；不能把不同标签版本的百分比直接当成模型提升。',
        '','## 4. 新真实图片来源','',
        '- [CSEM-MISD 官方数据](https://zenodo.org/records/7410513)：真实金属齿轮，35 件缺陷、35 件完整工件，每件 108 个光照条件；原始包 6.8 GB。属于新的外部材质域，不能代替当前白色塑料齿轮的产线验收。',
        '  下载已停止，保留 12 个完整分块，共 402,653,184 字节；完整包未下载、未解压、未用于验证。停止原因：材质域不符，优先等待更匹配来源的访问授权。',
        '- [MANTA 官方来源](https://grainnet.github.io/MANTA.html)：已核对 gear 公开档案，当前本地已覆盖该公开包，重复下载不能产生新独立样本。',
        '- [Plastic Gear Surface Defect Dataset](https://github.com/fangandyim/Plastic-Gear-Surface-Defect-Dataset)：公开版本 1165 张已在本项目使用，不能重复称为新增盲测。',
        '- [Real-IAD Variety 官方下载](https://huggingface.co/datasets/Real-IAD/Real-IAD_Variety)：gear.zip 约 1.04 GB。用户表示将在官网完成授权后通知；尚未收到完成通知，尚未下载或检验工件材质和标注适配性。','',
        '外部来源的未标注图片、同一工件的不同光照图片、已有图片的重复下载均不计为新增独立验收工件。',
        '','## 5. 替换门槛与当前限制','',
        '替换要求：真实独立验收中漏检率不超过 1%、误报率不超过 1%，同时不比现用模型退步。当前离线对照未建立符合该条件的替换证据，部署开关保持关闭。',
        '尚需解决：正常/缺陷分数重叠、淡污渍与正常暗部的区分、剩余疑点标注，以及与当前工件材质和相机条件相符的新独立真实数据。',
        '验证：校准策略、数据划分、五视角裁剪和前景区域的 17 项相关测试通过。它们验证程序约束，不代表模型达到 1% 指标。',
        '[现用模型与配置哈希核验](verification.json) · [数据清理实验协议](../patchcore-reviewed-ablation-v5/protocol.json)']
    (OUT/'report.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print(OUT/'report.md')


if __name__=='__main__':main()
