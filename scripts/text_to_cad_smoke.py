"""Build and reopen a real text-to-cad model, checking STEP, STL and dimensions."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

MODEL_SOURCE = '''from cadgen import build123d as bd
from cadgen import step, stl

@step(out="model.step")
@stl(out="model.stl")
def model():
    block = bd.Box(20, 15, 10, align=(bd.Align.MIN, bd.Align.MIN, bd.Align.MIN))
    bore = bd.Pos(10, 7.5, 0) * bd.Cylinder(3, 10, align=(bd.Align.CENTER, bd.Align.CENTER, bd.Align.MIN))
    shape = block - bore
    shape.label = "DrilledBlock"
    return shape

if __name__ == "__main__":
    model()
'''

CHECK_SOURCE = '''import json, struct, sys
from pathlib import Path
from cadgen import read_step
root = Path(sys.argv[1])
shape = read_step(str(root / "model.step"))
data = (root / "model.stl").read_bytes()
facets = struct.unpack("<I", data[80:84])[0] if len(data) >= 84 else 0
if len(data) != 84 + facets * 50:
    facets = data.lower().count(b"facet normal")
size = shape.bounding_box().size
print(json.dumps({"valid": bool(shape.is_valid), "solids": len(shape.solids()),
    "volume": shape.volume, "step_roundtrip_volume": shape.volume,
    "stl_facets": facets, "bounds_mm": [size.X, size.Y, size.Z]}))
'''


def validate_geometry(geometry: dict) -> dict:
    expected_volume = 3000 - 90 * math.pi
    try:
        passed = (geometry['valid'] is True and geometry['solids'] == 1
                  and math.isclose(geometry['volume'], expected_volume, abs_tol=1e-6)
                  and math.isclose(geometry['step_roundtrip_volume'], expected_volume, abs_tol=1e-6)
                  and geometry['stl_facets'] > 0
                  and len(geometry['bounds_mm']) == 3
                  and all(math.isclose(actual, expected, abs_tol=1e-6)
                          for actual, expected in zip(geometry['bounds_mm'], [20, 15, 10])))
    except (KeyError, TypeError, ValueError):
        passed = False
    if not passed:
        raise RuntimeError('text-to-cad geometry or saved export verification failed')
    return geometry


def verify(output_dir: Path, list_only: bool = False) -> dict:
    from scripts.text_to_cad_runtime import probe
    runtime = probe()
    if not runtime['ready']:
        raise RuntimeError('text-to-cad runtime is not ready: ' + runtime['reason'])
    report = {'verified_at': datetime.now(timezone.utc).isoformat(), 'runtime': runtime}
    if list_only:
        return report
    output_dir = output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / 'model.py').write_text(MODEL_SOURCE, encoding='utf-8')
    (output_dir / 'model.json').write_text(json.dumps({
        'provider': 'text-to-cad', 'units': 'mm', 'name': 'DrilledBlock',
        'block_mm': [20, 15, 10], 'bore_radius_mm': 3, 'bore_center_mm': [10, 7.5],
    }, indent=2), encoding='utf-8')
    python = os.getenv('CADGEN_PYTHON', '').strip() or sys.executable
    options = {'cwd': output_dir, 'stdin': subprocess.DEVNULL, 'capture_output': True,
               'env': {**os.environ, 'CADGEN_DAEMON': '0',
                       'CADGEN_COMPONENT_WORKERS': '1',
                       'CADGEN_CACHE_DIR': os.getenv('CADGEN_CACHE_DIR') or str(ROOT / '.runtime/text-to-cad-cache')},
               'text': True, 'encoding': 'utf-8', 'errors': 'replace', 'timeout': 180,
               'creationflags': getattr(subprocess, 'CREATE_NO_WINDOW', 0)}
    try:
        build = subprocess.run([python, '-I', str(output_dir / 'model.py')], **options)
        if build.returncode:
            raise RuntimeError('text-to-cad model build failed')
        check = subprocess.run([python, '-I', '-c', CHECK_SOURCE, str(output_dir)], **options)
        if check.returncode:
            raise RuntimeError('text-to-cad export readback failed')
        geometry = validate_geometry(json.loads(check.stdout))
    except (OSError, subprocess.TimeoutExpired, ValueError) as error:
        raise RuntimeError('text-to-cad smoke execution failed') from None
    report['geometry'] = geometry
    report['artifacts'] = {}
    for name in ['model.py', 'model.json', 'model.step', 'model.stl']:
        path = output_dir / name
        data = path.read_bytes()
        if not data or (path.suffix == '.step' and not data.startswith(b'ISO-10303-21;')):
            raise RuntimeError('text-to-cad export is missing or invalid: ' + name)
        report['artifacts'][name] = {'path': str(path), 'bytes': len(data),
                                     'sha256': hashlib.sha256(data).hexdigest()}
    (output_dir / 'verification.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--list-only', action='store_true', help='Probe the kernel without creating model files')
    parser.add_argument('--output-dir', type=Path, default=ROOT / '.runtime/verification' /
                        ('text-to-cad-' + datetime.now().strftime('%Y%m%d-%H%M%S')))
    args = parser.parse_args()
    print(json.dumps(verify(args.output_dir, args.list_only), indent=2))


if __name__ == '__main__':
    main()
