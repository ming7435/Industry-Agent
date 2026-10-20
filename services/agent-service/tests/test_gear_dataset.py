import json
from hashlib import sha256
from pathlib import Path
import pytest
from app.vision.dataset import public_dataset,dataset_sample
from app.vision.service import VisionServiceError
from app.vision.yolo_evaluation import aggregate_results,match_detections
from test_quality_vision_api import connected

@pytest.fixture
def data(tmp_path,monkeypatch):
    image=tmp_path/'heldout.png';image.write_bytes(b'PNG-fixture')
    row={'sample_id':'endface123','split':'test','path':'heldout.png','label':'defect','domain':'endface',
         'file_sha256':sha256(image.read_bytes()).hexdigest(),'ground_truth':[{'bbox':[1,1,2,2],'label':'darkspot'}]}
    manifest=tmp_path/'manifest.json'
    value={'kind':'real_gear_dataset','samples':[row,{**row,'sample_id':'train1','split':'train'}]}
    manifest.write_text(json.dumps(value),encoding='utf-8')
    monkeypatch.setenv('QUALITY_VISION_DATASET_MANIFEST',str(manifest))
    return manifest,value,image

def test_gear_catalog_exposes_heldout_ids_without_server_paths(data):
    catalog=public_dataset()
    assert catalog['normal_count']==0
    assert [s['sample_id'] for s in catalog['samples']]==['endface123']
    assert str(data[0].parent) not in json.dumps(catalog)
    assert dataset_sample('endface123')['filename']=='heldout.png'
    with pytest.raises(VisionServiceError):dataset_sample('train1')

def test_gear_sample_rejects_tampering_and_outside_paths(data):
    manifest,value,image=data
    image.write_bytes(b'tampered')
    with pytest.raises(VisionServiceError,match='校验'):dataset_sample('endface123')
    value['samples'][0]['path']='../outside.png'
    manifest.write_text(json.dumps(value),encoding='utf-8')
    with pytest.raises(VisionServiceError,match='路径'):dataset_sample('endface123')

def test_no_normal_gear_images_never_claims_zero_false_positive_rate():
    truth=[{'bbox':[0,0,4,4],'label':'damage'}]
    rows=[{'sample_id':'gear1','group_id':'g1','label':'defect','scenario':'gear','domain':'endface',
           'ground_truth':truth,'matching':match_detections(truth,[],.25,.5)}]
    metrics=aggregate_results(rows)['overall']
    assert metrics['normal_images']==0 and metrics['image_fpr'] is None
    assert metrics['fn']==1

def test_gear_image_endpoint_requires_login(connected,data):
    client,service,root=connected
    assert client.get('/api/quality/vision/dataset/samples/endface123').status_code==200
    client.cookies.clear()
    assert client.get('/api/quality/vision/dataset/samples/endface123').status_code==401

def test_gear_mode_disables_old_brushed_panel_generation(monkeypatch):
    from app.vision.production import ProductionVisionService
    monkeypatch.setenv('QUALITY_VISION_DATA_MODE','gear')
    with pytest.raises(VisionServiceError,match='旧合成纹理流程已停用'):
        ProductionVisionService(object()).verify({},object(),'unused','unused')
