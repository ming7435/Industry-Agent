"""Probe the pinned text-to-cad kernel without a GUI or background service."""
from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import sys

CADGEN_VERSION = '0.7.10'
PROBE_CODE = '''import json, subprocess
from importlib.metadata import version
from cadgen import build123d as bd
from cadgen._internal.node_runtime import cad_node_executable
shape = bd.Box(1, 1, 1)
node_version = subprocess.check_output([cad_node_executable(), '--version'], text=True, timeout=5).strip()
print(json.dumps({'provider': 'text-to-cad', 'cadgen_version': version('cadgen'),
                  'build123d_version': version('build123d'),
                  'node_version': node_version,
                  'valid': bool(shape.is_valid), 'volume': shape.volume}))
'''


def probe(env: dict[str, str] | None = None, *, timeout_seconds: float = 60) -> dict:
    """A successful import alone is insufficient: load OCP and build a unit solid."""
    settings = {**os.environ, **(env or {})}
    settings.setdefault('CADGEN_DAEMON', '0')
    settings.setdefault('CADGEN_COMPONENT_WORKERS', '1')
    python = settings.get('CADGEN_PYTHON', '').strip() or sys.executable
    failure = {'ready': False, 'provider': 'text-to-cad'}
    try:
        result = subprocess.run(
            [python, '-I', '-c', PROBE_CODE], env=settings,
            stdin=subprocess.DEVNULL, capture_output=True, text=True,
            encoding='utf-8', errors='replace', timeout=timeout_seconds,
            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
        )
    except FileNotFoundError:
        return {**failure, 'reason': 'interpreter_unavailable'}
    except subprocess.TimeoutExpired:
        return {**failure, 'reason': 'probe_timeout'}
    except OSError:
        return {**failure, 'reason': 'probe_failed'}
    try:
        evidence = json.loads(result.stdout)
        node_version = str(evidence.get('node_version', ''))
        node_major = int(node_version.removeprefix('v').split('.')[0])
        if (result.returncode != 0 or evidence.get('provider') != 'text-to-cad'
                or evidence.get('cadgen_version') != CADGEN_VERSION
                or not node_version.startswith('v') or node_major < 20
                or evidence.get('valid') is not True
                or not math.isclose(float(evidence.get('volume', 0)), 1.0, abs_tol=1e-8)):
            return {**failure, 'reason': 'probe_failed'}
    except (ValueError, TypeError, AttributeError):
        return {**failure, 'reason': 'probe_failed'}
    return {'ready': True, 'provider': 'text-to-cad',
            'cadgen_version': evidence['cadgen_version'],
            'build123d_version': evidence.get('build123d_version', ''),
            'node_version': node_version}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', nargs='?', choices=['status', 'start', 'stop'], default='status')
    args = parser.parse_args()
    if args.action == 'stop':
        print(json.dumps({'provider': 'text-to-cad', 'stopped': False, 'reason': 'no_background_runtime'}))
        return 0
    result = probe()
    print(json.dumps(result))
    return 0 if result['ready'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
