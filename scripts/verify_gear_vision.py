"""Exercise actual configured gear YOLO weights through isolated authenticated API/storage."""
from pathlib import Path
from contextlib import ExitStack,contextmanager
import base64,json,os,secrets,sys
ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'services/agent-service'),str(ROOT/'services/agent-service/tests')]
def main():
    os.environ.update(APP_ENV='testing',PYTHON_DOTENV_DISABLED='1',ULTRALYTICS_SAFE_LOAD='1',YOLO_AUTOINSTALL='false',
        QUALITY_YOLO_WEIGHTS=str(ROOT/'.runtime/quality-models/yolo11-gear-v1/best.pt'),
        QUALITY_YOLO_METADATA=str(ROOT/'.runtime/quality-models/yolo11-gear-v1/model.json'),
        QUALITY_PATCHCORE_PRESET_DIR='',QUALITY_VISION_DATA_MODE='gear',
        QUALITY_VISION_DATASET_MANIFEST=str(ROOT/'output/gear-dataset/prepared/manifest.json'))
    from scripts.evaluate_yolo import configure_inference_runtime
    configure_inference_runtime(Path(os.environ['QUALITY_YOLO_WEIGHTS']))
    import pytest
    from fastapi import FastAPI,Request,HTTPException
    from fastapi.testclient import TestClient
    from virtual_production_test_support import production_backend
    from app.api.quality_vision import build_quality_vision_router
    from app.vision.service import VisionService
    out=ROOT/'output/gear-dataset/api-verification';out.mkdir(exist_ok=False)
    with ExitStack() as stack:
        mp=stack.enter_context(pytest.MonkeyPatch.context())
        backend_dir=out/'backend';backend_dir.mkdir()
        backend=stack.enter_context(contextmanager(production_backend.__wrapped__)(backend_dir,mp))
        token=secrets.token_urlsafe(24)
        def auth(request:Request):
            if request.headers.get('authorization')!='Bearer '+token:raise HTTPException(401,'write credential required')
        def application():
            app=FastAPI();app.include_router(build_quality_vision_router(auth,backend_factory=lambda:backend.client,service=VisionService(out/'vision')));return app
        client=stack.enter_context(TestClient(application()))
        client.cookies.set('maintenance_session','owner-session');client.headers['authorization']='Bearer '+token
        response=client.get('/api/quality/vision/capabilities');assert response.status_code==200
        caps=response.json();model=next(m for m in caps['models'] if m['model_id']=='yolo-default')
        assert '齿轮' in model['name'] and not any(m['model_id']=='patchcore-demo' for m in caps['models'])
        results=[]
        for item in caps['dataset']['samples'][:3]:
            response=client.get('/api/quality/vision/dataset/samples/'+item['sample_id']);assert response.status_code==200
            sample=response.json()
            body={'algorithm':'yolo','model_id':'yolo-default','filename':sample['filename'],'image':sample['image'],
                  'confidence':model['recommended_confidence'],'iou':model['recommended_iou']}
            response=client.post('/api/quality/vision/detect',json=body);assert response.status_code==200,response.text[:200]
            result=response.json()
            assert result['model']['name']==model['name'] and result['parameters']['input_size']==640
            assert client.get('/api/quality/vision/inspections/'+result['inspection_id']).json()==result
            for name,value in [('input',sample['image']),('yolo',result['annotated_image'])]:
                (out/(item['sample_id']+'-'+name+'.png')).write_bytes(base64.b64decode(value.split(',')[1]))
            results.append({k:result[k] for k in ['inspection_id','status','score','defects','parameters','model_sha256','image_sha256']})
        fresh=stack.enter_context(TestClient(application()));fresh.cookies.set('maintenance_session','owner-session')
        assert fresh.get('/api/quality/vision/inspections/'+results[0]['inspection_id']).status_code==200
        fresh.cookies.set('maintenance_session','other-session')
        assert fresh.get('/api/quality/vision/inspections/'+results[0]['inspection_id']).status_code==404
        assert backend.repository.list_records('quality')==[]
        summary={'scope':'real gear images, actual YOLO inference, isolated account/API/storage; no camera or physical geometry inspection',
                 'results':results,'fresh_service_readback':True,'cross_account_denied':True,'formal_quality_writes':0}
        (out/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps({'output':str(out),'actual_inferences':len(results),'readback':'passed','cross_account':'denied'}))
if __name__=='__main__':main()
