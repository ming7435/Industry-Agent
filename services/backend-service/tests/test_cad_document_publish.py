from shared.freecad_documents import NativeReceipt,canonical_digest
from test_cad_document_repository import repository


def test_publish_same_revision_returns_original_run(tmp_path):
    repo=repository(tmp_path/'cad.sqlite')
    doc=repo.create_document('USER-a','r','球体','00001')
    assert hasattr(repo,'claim_publication'), 'immutable publication missing'
    # Seed a completed revision in this isolated fixture; native proof is tested separately.
    snapshot=repo.read_snapshot('USER-a',doc.document_id,0).model_dump(mode='json')
    snapshot.update(revision=1,validation={'valid':True,'solid_count':1,'step_roundtrip':True,'units':'mm'})
    snapshot['objects']=[dict(object_id='OBJ-a',name='Sphere',label='球体',type_id='Part::Sphere',visible=True)]
    snapshot['product_root_ids']=['OBJ-a']
    with repo.transaction() as db:
        from app.cad_documents.repository import encoded
        db.execute('INSERT INTO cad_revisions VALUES (?,?,?)',[doc.document_id,1,encoded(snapshot)])
        doc.revision=1; repo._write_head(db,doc)
    first=repo.claim_publication('USER-a',doc.document_id,'CMD-publish-1',1)
    job=repo.take_job('worker-a')
    run_id='FC-'+canonical_digest(['USER-a',doc.document_id,1])
    standard=dict(schema_version='freecad_document_parameters_v1',document_id=doc.document_id,revision=1,
                  run_id=run_id,extractor_version='native-1',parameters=[],uncovered=[])
    standard['digest']=canonical_digest(standard)
    artifacts=[dict(job_id=job.job_id,name=name,size=10,sha256='a'*64) for name in ('model.py','model.json','model.step','model.stl')]
    snapshot['artifacts']=artifacts
    receipt=NativeReceipt(job_id=job.job_id,input_digest=job.input_digest,state='completed',snapshot=snapshot,
                          artifacts=artifacts,validation=snapshot['validation'],result={})
    saved=repo.commit_publication('worker-a',receipt,standard)
    again=repo.claim_publication('USER-a',doc.document_id,'CMD-publish-2',1)
    assert again.state=='completed' and again.result['run_id']==run_id
    assert repo.list_designs('USER-a')['directory_version']==1
    assert saved['result']['version']==1
    assert repo.get_document('USER-a',doc.document_id).part_number=='00001'
    published=repo.find_published('USER-a',run_id)
    assert {a['name'] for a in published['artifacts']}=={'model.py','model.json','model.step','model.stl'}
    assert published['standard_parameters']['schema_version']=='freecad_document_parameters_v1'
    assert all(a['url'].startswith('/api/cad/text-to-cad/runs/') for a in published['artifacts'])
