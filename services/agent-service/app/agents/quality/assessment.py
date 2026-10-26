"""Evidence classification for saved inspections; no release or equipment commands."""
from copy import deepcopy


DISPOSITIONS = {
    'remeasure': ('复测后判定', '尺寸偏差尚无公差、加工余量和根因证据，处置保持待确认。'),
    'complete_measurement': ('补测后复检', '补齐该样本缺失的测量项后再判定。'),
    'clean_reinspect': ('清洗后复检', '确认表面污染可清除，清洗后重新进行视觉检测。'),
    'remove_reinspect': ('去除异物后复检', '确认异物可去除且未损伤工件，再重新检测。'),
    'rework_review': ('返工评估', '依据图纸公差、剩余加工余量和表面要求确定是否可修复。'),
    'scrap_review': ('报废重造评估', '疑似结构性缺陷，确认缺陷和不可修复性后才能决定报废重造。'),
    'hold_review': ('隔离待复核', '异常类别或定位尚未确认，当前证据不足以选择返工或报废。'),
}
VISUAL_RULES = {
    'dirt': ('surface_contamination', '污渍', 'clean_reinspect'),
    'stain': ('surface_contamination', '污渍', 'clean_reinspect'),
    'brown_stain': ('surface_contamination', '褐色污渍', 'clean_reinspect'),
    'hair': ('foreign_material', '细丝／异物', 'remove_reinspect'),
    'filament': ('foreign_material', '细丝／异物', 'remove_reinspect'),
    'scratch': ('surface_damage', '划伤', 'rework_review'),
    'damage': ('surface_damage', '表面损伤', 'rework_review'),
    'darkspot': ('surface_damage', '暗斑', 'rework_review'),
    'white': ('surface_damage', '白斑', 'rework_review'),
    'burn': ('surface_damage', '烧伤', 'rework_review'),
    'flash': ('surface_damage', '飞边', 'rework_review'),
    'bulge': ('surface_damage', '凸起', 'rework_review'),
    'overflow': ('surface_damage', '溢料', 'rework_review'),
    'flow': ('surface_damage', '流痕', 'rework_review'),
    'broken': ('structural_damage', '破损／断裂', 'scrap_review'),
    'crack': ('structural_damage', '裂纹', 'scrap_review'),
    'missing': ('structural_damage', '缺损', 'scrap_review'),
    'shortshot': ('structural_damage', '欠注／缺料', 'scrap_review'),
    'void': ('structural_damage', '空洞', 'scrap_review'),
    'perforation': ('structural_damage', '穿孔', 'scrap_review'),
    'reverse': ('orientation', '方向异常', 'hold_review'),
}


def _issue(category, label, location, evidence, action, *, causes, part_id='', bbox=None, device=None):
    title, basis = DISPOSITIONS[action]
    return dict(category=category, category_label=label, location=location,
                evidence=evidence, part_id=part_id, bbox=deepcopy(bbox), device=device,
                cause_status='unconfirmed', cause_categories=causes,
                disposition=dict(code=action, label=title, basis=basis, requires_confirmation=True))


def classify_inspection(record, *, kind):
    """Called with server-loaded records only. Classification is distinct from cause proof."""
    if kind not in {'dimensions', 'vision'} or not isinstance(record, dict):
        raise ValueError('Unsupported quality evidence')
    source_id = record.get('batch_id' if kind == 'dimensions' else 'inspection_id')
    if not source_id:
        raise ValueError('A saved inspection identity is required')
    issues, uncovered = [], 0
    checks = dict(dimensions='not_tested', vision='not_tested')
    if kind == 'dimensions':
        if record.get('simulation') is not True or record.get('synthetic') is not True:
            raise ValueError('Expected a saved simulated dimension batch')
        scope = 'simulation'
        checks['dimensions'] = record.get('status', 'review')
        parameters = (record.get('basis') or {}).get('parameters') or []
        uncovered = sum(p.get('comparable') is False for p in parameters)
        trace = record.get('traceability') or {}
        device = trace.get('production_device_id') if trace.get('traceability_source') == 'simulation_profile' else None
        if checks['dimensions'] in {'qualified', 'unqualified', 'partial'}:
            for row in record.get('issues') or []:
                if row.get('actual') is None or row.get('expected') is None:
                    continue
                issues.append(_issue('dimension', '尺寸／设计参数偏差', row.get('name') or row.get('key') or '未标明参数',
                    f"设计值 {row['expected']} {row.get('unit', '')} · 模拟测量 {row['actual']} {row.get('unit', '')} · 差值 {row.get('difference', '—')}",
                    'remeasure', causes=['equipment_parameters', 'drawing', 'measurement'], part_id=row.get('part_id', ''), device=device))
            for sample in record.get('samples') or []:
                observed = sample.get('observations') or {}
                for parameter in parameters:
                    if parameter.get('comparable') is not False and observed.get(parameter['key']) is None:
                        issues.append(_issue('acquisition', '测量数据缺失', parameter.get('name') or parameter['key'],
                            '该样本没有此参数的有效测量记录。', 'complete_measurement', causes=['measurement'], part_id=sample.get('part_id', '')))
        status = 'review' if issues or checks['dimensions'] != 'qualified' or uncovered else 'clear'
    else:
        if record.get('algorithm') != 'patchcore_yolo_pipeline':
            raise ValueError('Expected a saved PatchCore to YOLO pipeline record')
        scope = 'reference_image' if record.get('image_source') == 'public_gear_reference' else 'image_only'
        checks['vision'] = record.get('status', 'review')
        if checks['vision'] == 'defect':
            yolo = record.get('yolo') or {}
            known = record.get('yolo_state') == 'completed' and yolo.get('status') == 'defect'
            for defect in (yolo.get('defects') or []) if known else []:
                raw = defect.get('label', '')
                category, label, action = VISUAL_RULES.get(raw.lower(), ('visual_unknown', '未归类视觉缺陷', 'hold_review'))
                bbox = defect.get('bbox')
                location = '图片区域 [' + ', '.join(f'{x:g}' for x in bbox) + '] px' if bbox else '位置待确认'
                issues.append(_issue(category, label, location, f'YOLO 检测类别：{raw}；类别与位置为模型检测结果。',
                    action, causes=['workpiece'], part_id=record.get('part_id', ''), bbox=bbox))
            if not issues:
                issues.append(_issue('visual_unknown', '视觉异常待定位', '位置待确认',
                    'PatchCore 判定异常，YOLO 尚未给出有效缺陷位置或类别。', 'hold_review', causes=['workpiece']))
        status = 'clear' if checks['vision'] == 'clear' else 'review'
    return dict(version=1, agent='quality', mode='evidence_rules', source_id=source_id,
                scope=scope, status=status, checks=checks, issues=issues, uncovered_count=uncovered,
                cause_summary=[
                    dict(category='equipment_parameters', label='设备参数', status='待确认', evidence='尚无加工程序、刀补或设备参数与异常的对应证据。'),
                    dict(category='drawing', label='图纸／设计', status='待确认', evidence='尺寸偏差不能单独证明图纸错误；需要版本、公差及设计要求证据。'),
                    dict(category='workpiece', label='工件外观', status='模型检出异常' if kind == 'vision' and issues else '本图未检出异常' if kind == 'vision' and status == 'clear' else '未检测', evidence='仅依据当前上传图片的检测结果。' if kind == 'vision' else '本次尺寸记录未包含视觉图片。'),
                    dict(category='measurement', label='测量／采集', status='记录缺失' if any(i['category'] == 'acquisition' for i in issues) else '待确认', evidence='测量记录缺失与仪器故障分开记录。'),
                ], execution='not_executed', release_allowed=False)
