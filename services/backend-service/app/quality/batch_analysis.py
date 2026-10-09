"""Read-only batch yield and traceability analysis from saved, verified inspections."""
from collections import defaultdict
from datetime import datetime, timezone
from typing import Mapping

from shared.part_design_quality import SCOPE


def _untrusted(value):
    if isinstance(value, Mapping):
        return (any(value.get(key) is True for key in ('synthetic', 'degraded', 'is_synthetic'))
                or value.get('evidence_status') == 'untrusted'
                or any(_untrusted(item) for item in value.values()))
    return isinstance(value, (list, tuple)) and any(_untrusted(item) for item in value)


def _created_at(record):
    try:
        value = datetime.fromisoformat(str(record.get('created_at') or '').replace('Z', '+00:00'))
        return value.replace(tzinfo=timezone.utc).timestamp() if value.tzinfo is None else value.timestamp()
    except (ValueError, TypeError, OverflowError):
        return float('-inf')


def _matches_observation(part, record):
    return bool(record.get('part_recorded_at') and record['part_recorded_at'] == part.get('recorded_at')
                and record.get('measurements') == part.get('measurements')
                and record.get('comparison_scope', '') == part.get('comparison_scope', ''))


def _verified_defects(part, check, key):
    if part.get('comparison_scope') == SCOPE:
        return [{**item, 'check': key} for item in check.get('defects', []) if item.get('status') == 'fail' and item.get('sufficient_data') is True]
    from .inspection import _number, _valid_rule
    result = []
    for defect in check.get('defects', []):
        item, evidence = defect.get('item'), dict(defect)
        if key == 'dimensions':
            if defect.get('sufficient_data') is not True:
                continue
            evidence['unit'] = 'mm' if str(item).endswith('_mm') else '—'
        elif key == 'appearance':
            if (part.get('appearance') or {}).get(item) is not True:
                continue
            evidence.update(expected=False, actual=True)
        elif key == 'material' and item == 'material_grade':
            if not all(isinstance(defect.get(field), str) and defect[field].strip() for field in ('actual', 'expected')):
                continue
        elif (key == 'material' and item == 'hardness_hb') or (key == 'function' and item == 'runout_mm'):
            if _number(defect.get('actual')) is None or not _valid_rule(defect.get('expected')):
                continue
            evidence['unit'] = 'HB' if item == 'hardness_hb' else 'mm'
        elif (key == 'function' and item == 'rotation_test') or key == 'process':
            if (part.get(key) or {}).get(item) is not False:
                continue
            evidence.update(expected=True, actual=False)
        else:
            continue
        # Only real out-of-range numbers get a deviation; missing values are not measured failures.
        bounds = evidence.get('expected') if isinstance(evidence.get('expected'), Mapping) else evidence
        actual = _number(evidence.get('actual'))
        if actual is not None:
            lower, upper = _number(bounds.get('min')), _number(bounds.get('max'))
            if lower is not None and actual < lower:
                evidence['difference'] = actual - lower
            elif upper is not None and actual > upper:
                evidence['difference'] = actual - upper
        result.append({**evidence, 'check': key})
    return result


def _assessment(part, record, inspection):
    """Keep proven parameter failures even when the complete inspection is pending."""
    if (not record or _untrusted(record) or not _matches_observation(part, record)
            or record.get('comparison_scope', '') != part.get('comparison_scope', '')
            or record.get('target_type') != 'production_part'):
        return 'pending', []
    checks = record.get('quality_validation')
    if not isinstance(checks, Mapping):
        return 'pending', []
    operations = {'dimensions': 'inspect_part_dimensions'}
    if part.get('comparison_scope') != SCOPE:
        if record.get('specifications') != part.get('specifications'):
            return 'pending', []
        operations.update(appearance='inspect_part_appearance', material='inspect_part_material',
                          function='inspect_part_function', process='inspect_part_process')
    defects = []
    complete = True
    for key, operation in operations.items():
        try:
            expected = inspection.call(operation, part=part, specifications=part.get('specifications') or {})
        except (ValueError, TypeError, KeyError):
            complete = False
            continue
        saved = checks.get(key)
        if (not isinstance(saved, Mapping) or _untrusted(saved)
                or expected.get('success') is not True or saved.get('success') is not True
                or saved.get('passed') is not expected.get('passed')
                or saved.get('sufficient_data') is not expected.get('sufficient_data')
                or saved.get('status') != expected.get('status')
                or saved.get('items') != expected.get('items')):
            complete = False
            continue
        if part.get('comparison_scope') == SCOPE:
            if (saved.get('design_digest') != expected.get('design_digest')
                    or (record.get('design_reference') or {}).get('digest') != expected.get('design_digest')):
                return 'pending', []
        complete &= expected.get('sufficient_data') is True and expected.get('status') in ('pass', 'fail')
        defects.extend(_verified_defects(part, expected, key))
    if record.get('result') != ('failed' if defects or not complete else 'passed'):
        return 'pending', []
    return ('unqualified' if defects else 'qualified') if complete else 'pending', defects


def _solution(defect, device_id, line_ids):
    key = str(defect.get('item') or '')
    check = defect.get('check')
    if key.endswith('.hand'):
        category, focus = 'thread_hand', '核对图纸螺纹旋向、加工程序和刀具规格'
    elif key.endswith('.axis') or '.position.' in key or key.endswith('.edges'):
        category, focus = 'datum_position', '核对图纸基准、工件坐标、装夹定位和特征位置'
    elif key == 'cut_feature_count':
        category, focus = 'missing_feature', '核对加工工序与程序，确认是否漏加工孔或切除特征'
    elif check == 'appearance':
        category, focus = 'appearance', '复核缺陷图像或人工观察记录，核对加工、去毛刺和搬运工序'
    elif check == 'material':
        category, focus = 'material', '追溯来料及热处理批次，复核材质证明和材料实测结果，不直接认定设备故障'
    elif check == 'function':
        category, focus = 'function', '按零件检验规程复核功能测试条件、装配与装夹基准'
    elif check == 'process':
        category, focus = 'process', '核对真实工序完成记录、生产追溯和检验人员确认，不用补写通过标志代替检测'
    else:
        category, focus = 'dimension', '由工艺人员核对该参数的加工程序、刀具及装夹条件，确认原因后按设备规程整改'
    return {'category': category, 'item': key, 'name': defect.get('name') or key or check,
        'target_device_id': device_id, 'target_line_ids': line_ids, 'root_cause_status': 'unconfirmed',
        'possible_cause': focus, 'requires_manual_confirmation': True,
        'steps': ['隔离并标识关联的不合格零件，保存当前图纸版本、实测值和批次记录',
                  '先复核量具、单位和测量基准，排除测量误差', focus,
                  '设备检查或参数修改须由具备资质的人员按安全规程执行；系统不自动控制机器'],
        'reinspection_requirements': ['整改后重新测量本项及受影响参数，保存新的真实实测记录',
            '重新执行同一图纸版本的检测；待检测或数据不足不得视为合格',
            '复检通过并完成既有放行校验后，方可解除该零件的隔离']}


def _solutions(defects, device_id, line_ids):
    result, seen = [], set()
    for defect in defects:
        identity = (defect.get('check'), defect.get('item'))
        if identity not in seen:
            seen.add(identity)
            result.append(_solution(defect, device_id, line_ids))
    return result


def build_batch_report(batch_id, parts, records, inspection):
    batch_id = str(batch_id or '').strip()
    if not batch_id:
        raise ValueError('请提供明确的生产批次，不允许查询全库作为一个批次')
    selected = {str(part['part_id']): part for part in parts
                if part.get('part_id') and part.get('batch_id') == batch_id and not _untrusted(part)}
    latest = {}
    # Workflow updated_at must not make an old inspection newer than a reinspection.
    for record in sorted(records, key=_created_at):
        part_id = str(record.get('part_id') or record.get('target_id') or '')
        if (part_id in selected and record.get('batch_id') == batch_id
                and _matches_observation(selected[part_id], record)):
            latest[part_id] = record
    part_rows, issues = [], []
    for part_id, part in sorted(selected.items()):
        record = latest.get(part_id) or {}
        status, defects = _assessment(part, record, inspection)
        device_id, line_id = str(part.get('device_id') or ''), str(part.get('line_id') or '')
        part_rows.append({'part_id': part_id, 'device_id': device_id, 'line_id': line_id, 'status': status,
            'quality_check_id': record.get('quality_check_id', ''), 'comparison_scope': part.get('comparison_scope', '')})
        if defects:
            issues.append({'part_id': part_id, 'device_id': device_id, 'device_name': part.get('device_name', ''),
                'line_id': line_id, 'line_name': part.get('line_name', ''), 'defects': defects,
                'inspection_status': status,
                'quality_check_id': record.get('quality_check_id', ''), 'production_order_id': part.get('production_order_id', ''),
                'traceability_source': part.get('source', ''), 'root_cause_status': 'unconfirmed',
                'solutions': _solutions(defects, device_id, [line_id] if line_id else [])})
    qualified = sum(row['status'] == 'qualified' for row in part_rows)
    unqualified = sum(row['status'] == 'unqualified' for row in part_rows)
    total, inspected = len(part_rows), qualified + unqualified
    summary = {'batch_id': batch_id, 'total_count': total, 'inspected_count': inspected,
        'qualified_count': qualified, 'unqualified_count': unqualified, 'pending_count': total - inspected,
        'rate_percent': round(100 * qualified / inspected, 2) if inspected else None,
        'coverage_percent': round(100 * inspected / total, 2) if total else None,
        'formula': '合格零件数 / 已完成有效检测零件数 × 100%', 'counting_rule': '同批次按零件编号去重，采用最新有效实测记录对应的检测；复检不重复计数',
        'population_scope': 'registered_parts',
        'population_note': '统计仅覆盖本批次已登记的零件；没有全批次生产总量数据时，不表示全批次产量或抽样推算结果。',
        'inspection_scopes': sorted({part.get('comparison_scope') or 'part_quality' for part in selected.values()}),
        'status': 'available' if inspected else 'not_tested', 'computed_at': datetime.now(timezone.utc).isoformat()}
    machine_groups, line_groups = defaultdict(list), defaultdict(list)
    for issue in issues:
        if issue['device_id']:
            machine_groups[issue['device_id']].append(issue)
        if issue['line_id']:
            line_groups[issue['line_id']].append(issue)
    machines = []
    for device_id, group in sorted(machine_groups.items()):
        line_ids = sorted({issue['line_id'] for issue in group if issue['line_id']})
        defects = [dict(defect, part_id=issue['part_id']) for issue in group for defect in issue['defects']]
        machines.append({'device_id': device_id, 'device_name': group[0]['device_name'], 'line_ids': line_ids,
            'affected_count': len(group), 'unqualified_count': sum(issue['inspection_status'] == 'unqualified' for issue in group),
            'pending_defect_count': sum(issue['inspection_status'] == 'pending' for issue in group),
            'failed_part_ids': [issue['part_id'] for issue in group],
            'status': 'associated', 'root_cause_status': 'unconfirmed', 'defects': defects,
            'evidence': [{'part_id': issue['part_id'], 'quality_check_id': issue['quality_check_id'],
                          'source': issue['traceability_source']} for issue in group],
            'solutions': _solutions(defects, device_id, line_ids)})
    lines = [{'line_id': line_id, 'line_name': group[0]['line_name'], 'affected_count': len(group),
              'unqualified_count': sum(issue['inspection_status'] == 'unqualified' for issue in group),
              'pending_defect_count': sum(issue['inspection_status'] == 'pending' for issue in group),
              'device_ids': sorted({issue['device_id'] for issue in group if issue['device_id']}),
              'failed_part_ids': [issue['part_id'] for issue in group], 'root_cause_status': 'unconfirmed'}
             for line_id, group in sorted(line_groups.items())]
    problems = {'issues': issues, 'machines': machines, 'lines': lines,
        'unlocated_part_ids': [issue['part_id'] for issue in issues if not issue['device_id'] or not issue['line_id']],
        'pending_part_ids': [row['part_id'] for row in part_rows if row['status'] == 'pending'],
        'status': 'needs_investigation' if issues else 'pending' if total - inspected else 'no_quality_issue',
        'note': '设备和产线来自已保存的生产追溯记录；关联不合格零件不等于已确认机器故障，具体根因须结合生产时设备证据复核。'}
    return {'success': True, 'batch_quality': summary, 'problem_analysis': problems,
            'parts': part_rows, 'source': 'backend-qms'}
