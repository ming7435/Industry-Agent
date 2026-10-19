"""Compile portable CAD programs without loading a native kernel in the API process."""
import json
from pathlib import Path

def model_program(spec, directory, run_id, *, portable=False, claim=False):
    from .freecad_spec_kernel import kernel_source
    source = kernel_source(spec)
    output = 'Path(__file__).resolve().parent' if portable else f'Path({str(directory)!r})'
    declaration = f'\nSPEC = json.loads({json.dumps(spec, ensure_ascii=False, allow_nan=False)!r})\nOUT = {output}\nRUN_ID = {run_id!r}\n'
    claim_code = '''    try:
        with (OUT / '.execution-claimed').open('x', encoding='utf-8') as stream:
            stream.write(RUN_ID)
    except FileExistsError:
        raise RuntimeError('INDUSTRY_CAD_EXECUTION_ALREADY_CLAIMED')
''' if claim else ''
    runtime_setup = '''import os
from pathlib import Path
os.environ.setdefault('CADGEN_CACHE_DIR', str(Path(__file__).resolve().parent / '.cadgen-cache'))
os.environ['CADGEN_DAEMON'] = '0'
os.environ.setdefault('CADGEN_COMPONENT_WORKERS', '1')
'''
    program = runtime_setup + source + declaration + '''
from cadgen import step, stl, read_step

@step(out=(OUT / 'model.step').as_posix())
@stl(out=(OUT / 'model.stl').as_posix())
def model():
    shapes, extra = build_spec(SPEC, OUT)
    (OUT / '.geometry.json').write_text(json.dumps(geometry_evidence(shapes, SPEC, extra), ensure_ascii=False, allow_nan=False), encoding='utf-8')
    return shapes[0] if len(shapes)==1 else bd.Compound(children=shapes)

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
''' + claim_code + '''    model()
    proof = json.loads((OUT / '.geometry.json').read_text(encoding='utf-8'))
    restored = read_step(OUT / 'model.step')
    if not restored.is_valid or len(restored.solids()) != proof['solid_count']:
        raise ValueError('STEP 回读实体校验失败')
    if not math.isclose(restored.volume, proof['volume_mm3'], rel_tol=1e-7, abs_tol=1e-6):
        raise ValueError('STEP 回读体积校验失败')
    if any(not math.isclose(a,b,rel_tol=1e-7,abs_tol=1e-6) for a,b in zip(restored.bounding_box(optimal=True).size,proof['bounds_mm'])):
        raise ValueError('STEP 回读尺寸校验失败')
    proof.update(run_id=RUN_ID, spec=SPEC, step_roundtrip=True, provider='text-to-cad')
    temporary = OUT / '.manifest.tmp'
    temporary.write_text(json.dumps(proof, ensure_ascii=False, allow_nan=False), encoding='utf-8')
    temporary.replace(OUT / 'manifest.json')
    print('INDUSTRY_CAD_RESULT:' + json.dumps(proof, ensure_ascii=False, allow_nan=False))
'''
    # cadgen 0.7.10 reads its Python metadata using the OS default encoding.
    # ASCII escapes preserve Unicode parameters on Windows as well as UTF-8 hosts.
    return program.encode('ascii', errors='backslashreplace').decode('ascii')
