from copy import deepcopy
import pytest
from shared.freecad_documents import DocumentSnapshot,ObjectSnapshot,ObjectProperty
from shared.freecad_document_standards import build_document_standard
from shared import simulated_part_design_quality as sim

def published(revision=1,diameter=20):
    run_id='FC-'+str(revision)*64
    snapshot=DocumentSnapshot(document_id='DOC-a',revision=revision,objects=[ObjectSnapshot(object_id='OBJ-a',name='Sphere',label='球体',type_id='Part::Sphere',visible=True,properties=[ObjectProperty(name='diameter',type='length',value=diameter,unit='mm')])],product_root_ids=['OBJ-a'],source_spec=None,validation={'valid':True,'step_roundtrip':True,'solid_count':1},artifacts=[])
    return dict(run_id=run_id,document_id='DOC-a',revision=revision,status='completed',spec=None,part_name='球体',part_number='00123',validation=snapshot.validation,standard_parameters=build_document_standard(snapshot,run_id).model_dump(mode='json'))

def test_native_document_standard_is_authoritative():
    run=published();basis=sim.build_basis(run)
    assert basis['parameters']==run['standard_parameters']['parameters']
    assert basis['extractor']=='freecad_document_parameters_v1'
    assert sim.verify_basis(basis)==basis
    result=sim.compare_sample(basis,{'OBJ-a.diameter':{'value':20,'unit':'mm'}})
    assert result['status']=='qualified'

def test_corrupt_document_standard_does_not_use_old_spec():
    run=published();run['spec']={'units':'mm','operations':[{'type':'box','mode':'add','length':40,'width':20,'height':10,'position':[0,0,0]}]}
    run['standard_parameters']['parameters'][0]['expected']=900
    with pytest.raises(ValueError):sim.build_basis(run)
    run=published();run['revision']=2
    with pytest.raises(ValueError):sim.build_basis(run)

def test_prior_batch_stays_with_prior_run():
    first=sim.build_basis(published());before=deepcopy(first)
    second=sim.build_basis(published(2,30))
    assert second['digest']!=first['digest']
    assert sim.verify_basis(first)==before
    corrupted=deepcopy(first);corrupted['parameters'][0]['expected']=30
    with pytest.raises(ValueError):sim.verify_basis(corrupted)
