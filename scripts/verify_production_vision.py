"""Opt-in integration check: real virtual machining engine and deployed models.

Uses isolated account/database and a seeded cylindrical design; never changes
live accounts, factory state, or model weights. Does not validate camera input,
CAD generation, production accuracy, or the live browser's authenticated session.
"""
import argparse
from contextlib import ExitStack, contextmanager
from copy import deepcopy
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import secrets
import sys
from time import perf_counter
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]


def write_report(output, flow, summary):
    """Export original evidence bytes and compare predicted boxes to known masks."""
    import base64
    from io import BytesIO
    import math
    import numpy as np
    from PIL import Image
    names = {'normal': '正常纹理', 'obvious_scratch': '明显划痕', 'low_contrast': '低对比度缺陷'}
    verdicts = {'clear': '未报警', 'defect': '报警'}
    lines = ['# 生产视觉合成流程验证', '',
        f"验证时间：{summary['verified_at']}。批次：`{flow['source']['batch_id']}`。", '',
        '使用隔离账号、数据库与虚拟工厂引擎，从预置通孔轴套设计开始执行保存方案、下发、启动、产出确认、参数比较和六次真实模型推理。', '',
        '参数比较通过；结果持久化回读、同请求幂等、同进程新建服务后回载、跨账号拒绝访问均通过。没有写入正式质量放行记录。', '',
        '**范围**：合成图不是零件照片或 CAD 渲染；未验证 CAD 生成、真实相机采集及当前登录浏览器的实点操作。三个场景不构成准确率评估。', '',
        '| 场景 | PatchCore 图像判定 / 分数 | YOLO 图像判定 / 分数 | PatchCore / YOLO 框覆盖已知缺陷像素 |',
        '| --- | --- | --- | --- |']
    spatial = []
    evidence = []
    for scenario in flow['scenarios']:
        name = scenario['scenario']
        mask_bytes = base64.b64decode(scenario['mask_image'].split(',')[1])
        with Image.open(BytesIO(mask_bytes)) as im:
            mask = np.asarray(im).copy() > 0
        count = int(mask.sum())
        row = {'scenario': name, 'gt_mask_pixels': count, 'algorithms': []}
        scores, coverages = [], []
        files = [('input', scenario['input_image']), ('mask', scenario['mask_image'])]
        for result in scenario['results']:
            boxes = []
            for defect in result['defects']:
                x0, y0, x1, y1 = defect['bbox']
                x0, y0 = max(0, math.floor(x0)), max(0, math.floor(y0))
                x1, y1 = min(mask.shape[1], math.ceil(x1)), min(mask.shape[0], math.ceil(y1))
                intersection = int(mask[y0:y1, x0:x1].sum())
                area = (x1 - x0) * (y1 - y0)
                boxes.append({'label': defect['label'], 'bbox': defect['bbox'],
                    'gt_mask_coverage': intersection / count if count else None,
                    'bbox_mask_iou': intersection / (area + count - intersection) if count else None})
            row['algorithms'].append({'algorithm': result['algorithm'], 'detections': boxes})
            coverage = max((box['gt_mask_coverage'] for box in boxes), default=0) if count else None
            coverages.append(f'{coverage:.0%}' if coverage is not None else '不适用')
            scores.append(f"{verdicts[result['status']]} / {result['score']:.4f}")
            files.append((result['algorithm'], result['annotated_image']))
            if result.get('heatmap_image'):
                files.append(('heatmap', result['heatmap_image']))
        lines.append(f"| {names[name]} | {scores[0]} | {scores[1]} | {' / '.join(coverages)} |")
        spatial.append(row)
        evidence.extend(['', '## ' + names[name], ''])
        for kind, encoded in files:
            path = output / f'{name}-{kind}.png'
            path.write_bytes(base64.b64decode(encoded.split(',')[1]))
            evidence.extend([f'![{names[name]} · {kind}]({path.as_posix()})', ''])
    lines.extend(['', '覆盖比例取单个预测框对已知缺陷像素的最大覆盖；框很大也可能达到 100%，因此它不等于定位准确率。完整框与掩膜 IoU 保存在 localization-overlap.json。', '',
        '图像级报警不能代替缺陷定位：若正常图出现报警，或缺陷图所有检测框与已知缺陷像素均无交集，应继续核对误报和漏检。', '',
        '当前 PatchCore 阈值来自预置合成校准集；YOLO 使用所加载模型元数据中的建议参数，实际值与模型摘要见 summary.json。本次流程测试不反向调参。', '',
        '后续需用实际产品图片建立正常记忆库，按缺陷类型标注 YOLO 数据，并在独立校准集选阈值、独立测试集统计漏检与定位效果。'])
    if flow.get('localization_metrics'):
        lines.extend(['', '## 空间定位核验', '',
                      '以预测框和已知缺陷包围框 IoU ≥ 0.5 做一对一匹配，不比较类别名称。框过大即使覆盖缺陷，也可能不满足定位条件。', '',
                      '| 算法 | 定位命中 | 定位漏检 | 多余框 | 已知缺陷数 |', '| --- | --- | --- | --- | --- |'])
        for algorithm in ('patchcore', 'yolo'):
            counts = flow['localization_metrics'][algorithm]
            lines.append(f"| {algorithm} | {counts['tp']} | {counts['fn']} | {counts['fp']} | {counts['ground_truth_count']} |")
    (output / 'localization-overlap.json').write_text(json.dumps(spatial, ensure_ascii=False, indent=2), encoding='utf-8')
    (output / 'report.md').write_text('\n'.join(lines + evidence), encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute', action='store_true')
    parser.add_argument('--output', type=Path, default=ROOT / 'output/production-flow-verification')
    parser.add_argument('--yolo-weights', type=Path, default=ROOT / '.runtime/quality-models/yolo11-synthetic-v1/best.pt')
    parser.add_argument('--yolo-metadata', type=Path, default=ROOT / '.runtime/quality-models/yolo11-synthetic-v1/model.json')
    args = parser.parse_args()
    if not args.execute:
        print('Use --execute to run isolated synthetic production with real local models.')
        return
    output = args.output.resolve() / datetime.now().strftime('%Y%m%d-%H%M%S')
    output.mkdir(parents=True, exist_ok=False)
    # Do not load deployment secrets or connect to its business database.
    os.environ.update(APP_ENV='testing', PYTHON_DOTENV_DISABLED='1', BACKEND_STORAGE='sqlite',
                      FACTORY_CONTROL_MODE='virtual', RAG_ALLOW_LOCAL_FALLBACK='true',
                      ULTRALYTICS_SAFE_LOAD='1', YOLO_AUTOINSTALL='false')
    for key in ('BACKEND_SERVICE_BASE_URL', 'RAG_SERVICE_BASE_URL', 'MODEL_SERVICE_BASE_URL',
                'CAD_SERVICE_BASE_URL', 'MCP_CAD_URL', 'MCP_MES_URL', 'MCP_QMS_URL',
                'MCP_INVENTORY_URL', 'AGENT_API_TOKEN', 'BACKEND_INTERNAL_TOKEN',
                'OPENAI_API_KEY'):
        os.environ[key] = ''
    os.environ['FACTORY_API_BASE_URL'] = 'http://127.0.0.1:9'
    for key in ('EVENT_STORE_PATH', 'WORKORDER_STORE_PATH', 'LEARNING_RESULT_STORE_PATH',
                'REPORT_STORE_PATH', 'PENDING_TASK_STORE_PATH', 'LINE_SAFETY_STORE_PATH'):
        os.environ[key] = str(output / (key.lower() + '.sqlite3'))
    preset = ROOT / '.runtime/quality-models/patchcore-synthetic-v1'
    os.environ.update(QUALITY_PATCHCORE_BACKBONE_WEIGHTS=str(preset / 'resnet18-f37072fd.pth'),
                      QUALITY_PATCHCORE_PRESET_DIR=str(preset),
                      QUALITY_YOLO_WEIGHTS=str(args.yolo_weights.resolve(strict=True)),
                      QUALITY_YOLO_METADATA=str(args.yolo_metadata.resolve(strict=True)))
    sys.path[:0] = [str(ROOT), str(ROOT / 'services/agent-service'),
                    str(ROOT / 'services/agent-service/tests')]
    import pytest
    from fastapi import FastAPI, HTTPException, Request
    from fastapi.testclient import TestClient
    from virtual_production_test_support import production_backend
    from test_virtual_factory_client import isolated_factory, run, setup
    from app.api.production_simulation import build_virtual_production_router
    from app.api.quality_vision import build_quality_vision_router
    from app.production_simulation.backend import VirtualProductionBackend
    from app.production_simulation.coordinator import VirtualProductionCoordinator
    from app.production_simulation.factory import VirtualFactoryClient
    from app.runtime.container import AgentContainer
    from app.tools.registry import ToolRegistry
    from app.vision.service import VisionService

    started = perf_counter()
    with ExitStack() as stack:
        monkeypatch = stack.enter_context(pytest.MonkeyPatch.context())
        backend_dir, factory_dir = output / 'backend', output / 'factory'
        backend_dir.mkdir(); factory_dir.mkdir()
        backend_fixture = stack.enter_context(contextmanager(production_backend.__wrapped__)(backend_dir, monkeypatch))
        factory_fixture = stack.enter_context(contextmanager(isolated_factory.__wrapped__)(factory_dir, monkeypatch))
        backend = VirtualProductionBackend(backend_fixture.client)
        factory = VirtualFactoryClient(factory_fixture[0])
        system = AgentContainer(tools=ToolRegistry())
        coordinator = VirtualProductionCoordinator(backend, factory, system.operations, system.trace)
        design = run(hole=True)
        design.update(part_name='合成流程验证轴套', part_number='VERIFY-FLOW-001')
        write_token = secrets.token_urlsafe(24)

        def write_auth(request: Request):
            if request.headers.get('authorization') != 'Bearer ' + write_token:
                raise HTTPException(401, 'test write credential required')

        def application():
            app = FastAPI()
            app.include_router(build_virtual_production_router(coordinator, backend, write_auth,
                cad_reader=lambda request, identity: deepcopy(design)))
            app.include_router(build_quality_vision_router(write_auth,
                backend_factory=lambda: backend_fixture.client, service=VisionService(output / 'vision')))
            return app

        client = stack.enter_context(TestClient(application()))
        # Only the isolated fixture directory recognizes this test session.
        client.cookies.set('maintenance_session', 'owner-session')
        client.headers['authorization'] = 'Bearer ' + write_token

        def post(path, body):
            response = client.post(path, json=body)
            assert response.status_code == 200, (path, response.status_code, response.text[:400])
            return response.json()

        caps = client.get('/api/quality/vision/capabilities').json()
        assert all(item['available'] for item in caps['algorithms'])
        assert {'patchcore-demo', 'yolo-default'} <= {item['model_id'] for item in caps['models']}
        yolo_model = next(item for item in caps['models'] if item['model_id'] == 'yolo-default')
        plan = post('/api/production/virtual/plans', {'command_id': 'verify-' + uuid4().hex,
            'design_run_id': design['run_id'], 'setup': setup(hole=True), 'material': '模拟钢材',
            'batch_id': 'VERIFY-FLOW-' + output.name})
        route = '/api/production/virtual/jobs/' + plan['job_id']
        identity = {'digest': plan['program_digest']}
        received = post(route + '/submit', identity)
        assert received['status'] == 'received'
        running = post(route + '/start', identity)
        assert running['status'] == 'running'
        factory_fixture[1].tick(20)
        completed = post(route + '/sync', {})
        assert completed['status'] == 'completed' and completed['sync_status'] == 'confirmed'
        assert completed['output']['profile'] == {'outer_diameter_mm': 20.0, 'inner_diameter_mm': 6.0, 'length_mm': 10.0}
        request_body = {'job_id': plan['job_id'], 'request_id': str(uuid4())}
        flow = post('/api/quality/vision/production/verify', request_body)
        assert flow['status'] == 'completed', flow.get('error')
        assert flow['parameter_inspection']['status'] == 'pass'
        source = flow['source']
        for field in ('job_id', 'part_id', 'batch_id', 'design_run_id', 'program_digest'):
            assert source[field] == completed[field]
        assert source['output_digest'] == completed['output']['output_digest']
        identifiers = []
        for scenario in flow['scenarios']:
            assert len(scenario['results']) == 2
            for result in scenario['results']:
                assert result['image_sha256'] == scenario['image_sha256']
                assert result['source_context']['source'] == source
                assert result['part_id'] == completed['part_id']
                if result['algorithm'] == 'yolo':
                    assert result['parameters']['confidence'] == yolo_model.get('recommended_confidence', .25)
                    assert result['parameters']['iou'] == yolo_model.get('recommended_iou', .45)
                identifiers.append(result['inspection_id'])
                read = client.get('/api/quality/vision/inspections/' + result['inspection_id'])
                assert read.status_code == 200 and read.json() == result
        assert len(set(identifiers)) == 6
        replay = post('/api/quality/vision/production/verify', request_body)
        assert replay == flow
        assert len(list((output / 'vision').rglob('VI-*.json'))) == 6
        restored_client = stack.enter_context(TestClient(application()))
        restored_client.cookies.set('maintenance_session', 'owner-session')
        restored = restored_client.get('/api/quality/vision/production/jobs/' + plan['job_id'] + '/latest')
        assert restored.status_code == 200 and restored.json() == {'run': flow}
        restored_client.cookies.set('maintenance_session', 'other-session')
        denied = restored_client.get('/api/quality/vision/production/jobs/' + plan['job_id'] + '/latest')
        assert denied.status_code == 403
        assert backend_fixture.repository.list_records('quality') == []
        trace = system.trace.list()
        writes = [item for item in factory_fixture[2] if item['method'] == 'POST']
        assert len(writes) == 2
        summary = {'verified_at': datetime.now(timezone.utc).isoformat(),
            'scope': 'isolated_accounts_databases_and_factory_with_real_deployed_model_inference',
            'design_input': 'seeded validated cylindrical design; CAD generation not exercised',
            'browser_session': 'not exercised by this script; component browser tests are separate',
            'source': source, 'run_id': flow['run_id'], 'status': flow['status'],
            'parameter_status': flow['parameter_inspection']['status'],
            'scenarios': [{key: scene[key] for key in ('scenario', 'label', 'image_sha256')} | {
                'results': [{key: result[key] for key in ('algorithm', 'inspection_id', 'model_id',
                    'model_sha256', 'status', 'score', 'threshold', 'parameters')} for result in scene['results']]}
                for scene in flow['scenarios']], 'metrics': flow['metrics'],
            'localization_metrics': flow.get('localization_metrics'), 'inferences': len(identifiers),
            'factory_submit_start_count': len(writes), 'idempotent_replay': True,
            'fresh_service_restored': True, 'cross_owner_denied': True,
            'formal_quality_records': 0, 'agents_in_trace': sorted({r.get('agent') for r in trace if r.get('agent')}),
            'elapsed_seconds': round(perf_counter() - started, 2)}
        for name, value in [('flow.json', flow), ('summary.json', summary), ('production-job.json', completed)]:
            (output / name).write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')
        write_report(output, flow, summary)
        print(json.dumps({'output': str(output), 'run_id': flow['run_id'], 'metrics': flow['metrics'],
                          'inferences': 6, 'fresh_service_restored': True,
                          'elapsed_seconds': summary['elapsed_seconds']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
