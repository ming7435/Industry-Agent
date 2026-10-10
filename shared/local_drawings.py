"""Read-only device drawing references, separate from component engineering evidence."""
from __future__ import annotations

import os
from pathlib import Path
import re
from typing import Any


_ROOT = Path(__file__).resolve().parents[1]
_REFERENCES = (
    ('TRAK-TC820LTYSI-001', 'TC820LTYsi', 'TC820si.html', 'DEVICE-REFERENCE-TC820SI',
     'TC820LTYsi 原始设备图纸', 'original_edrawings',
     ('TC820LTYsi', 'TRAK TC820LTYsi', 'TC820si', 'TRAK TC820si')),
    ('LNS-QL-SERVO-80-S2-001', 'QL Servo 80 S2', 'QLS80S2.html', 'DEVICE-REFERENCE-QLS80S2',
     'QL Servo 80 S2 设备图纸与参考模型', 'reference_model',
     ('QL Servo 80 S2', 'LNS QL Servo 80 S2', 'QLServo80S2', 'QLS80S2', 'LNS QLS80S2')),
    ('RENISHAW-EQUATOR300-001', 'Equator300', 'Equator300.html', 'DEVICE-REFERENCE-EQUATOR300',
     'Equator300 设备图纸与参考模型', 'reference_model',
     ('Equator300', 'Equator 300', 'Renishaw Equator300')),
)


def _model_key(value: Any) -> str:
    return re.sub(r'[^A-Z0-9]', '', str(value or '').upper())


def _source_file(filename: str) -> Path | None:
    configured = os.getenv('LOCAL_DRAWINGS_ROOT')
    if configured is not None:
        roots = [Path(configured.strip())] if configured.strip() else []
    else:
        roots = [_ROOT / 'frontend/monitor-react/public/drawings', _ROOT / 'frontend/monitor/drawings']
    for directory in roots:
        try:
            directory = directory.resolve()
            path = (directory / filename).resolve()
            if directory.is_dir() and path.is_relative_to(directory) and path.is_file() and path.stat().st_size > 0:
                return path
        except (OSError, ValueError, RuntimeError):
            continue
    return None


def local_drawing_file(filename: str) -> Path | None:
    """仅允许图纸目录内的单个 HTML 文件，拒绝外链、路径穿越及空文件。"""
    if not isinstance(filename, str) or not re.fullmatch(r'[A-Za-z0-9_-][A-Za-z0-9_.-]*\.html', filename):
        return None
    return _source_file(filename)


def is_local_drawing_url(value: Any) -> bool:
    """校验已登记的同源查看器地址；不允许查询参数、外链或子目录。"""
    return isinstance(value, str) and re.fullmatch(r'/drawings/[A-Za-z0-9_-][A-Za-z0-9_.-]*\.html', value) is not None


def known_drawing_device(filename: str) -> str:
    """已有三份资料的设备归属不能在登记时改成另一台机器。"""
    if not isinstance(filename, str):
        return ''
    # Windows 文件名不区分大小写；变换文件名大小写不能改变设备归属。
    return next((reference[0] for reference in _REFERENCES if reference[2].casefold() == filename.casefold()), '')


def device_reference_drawings(device_id: str = '', device_model: str = '', **filters: Any) -> list[dict[str, Any]]:
    """Return known references; empty scope enumerates the catalog for health only.

    Model aliases are a finite allowlist. A contradictory device/model or an
    unsupported structured scope cannot fall back to another device's viewer.
    Only stat is read, never the multi-megabyte HTML or embedded JavaScript.
    """
    if not isinstance(device_id, str) or not isinstance(device_model, str):
        return []
    device_id = device_id.strip()
    model_supplied = bool(device_model.strip())
    model = _model_key(device_model)
    if any(filters.get(key) is not None and not isinstance(filters[key], str)
           for key in ('tenant_id', 'project_id', 'version', 'drawing_id', 'part_no', 'component', 'component_id')):
        return []
    if any(filters.get(key) for key in ('tenant_id', 'project_id', 'version', 'part_no', 'component', 'component_id')):
        return []
    drawing_id = str(filters.get('drawing_id') or '').strip()
    records = []
    for identity, canonical_model, filename, reference_id, name, kind, aliases in _REFERENCES:
        if device_id and device_id != identity:
            continue
        if model_supplied and model not in {_model_key(alias) for alias in aliases}:
            continue
        if drawing_id and drawing_id != reference_id:
            continue
        path = _source_file(filename)
        if path is None:
            continue
        try:
            source_path = path.relative_to(_ROOT).as_posix()
        except ValueError:
            source_path = 'LOCAL_DRAWINGS_ROOT/' + filename
        records.append({'drawing_id': reference_id, 'drawing_name': name, 'device_id': identity,
                        'device_model': canonical_model, 'drawing_url': '/drawings/' + filename,
                        'model_url': '/drawings/' + filename, 'drawing_type': 'html', 'source_format': 'html',
                        'evidence_scope': 'device_reference', 'engineering_status': 'reference_only',
                        'source_kind': kind, 'source_path': source_path, 'source': 'local-device-drawing-reference'})
    return records
