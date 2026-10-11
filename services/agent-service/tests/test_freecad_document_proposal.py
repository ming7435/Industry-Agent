import importlib
import pytest
from shared.freecad_documents import DocumentHead,DocumentSnapshot


def context():
    head=DocumentHead(document_id='DOC-a',owner_user_id='USER-a',part_name='底板',part_number='00123',revision=0,created_at=0,updated_at=0)
    snapshot=DocumentSnapshot(document_id='DOC-a',revision=0,objects=[],product_root_ids=[],source_spec=None,validation={},artifacts=[])
    return head,snapshot


def test_ai_missing_dimensions_needs_input():
    assert importlib.util.find_spec('app.cad_documents.proposal'), 'typed proposal parser missing'
    from app.cad_documents.proposal import propose_document_command
    assert propose_document_command(*context(),'生成一个长方体',None)['status']=='needs_input'


def test_proposal_does_not_mutate():
    assert importlib.util.find_spec('app.cad_documents.proposal'), 'typed proposal parser missing'
    from app.cad_documents.proposal import propose_document_command
    head,snapshot=context()
    result=propose_document_command(head,snapshot,'生成长40mm、宽20mm、高10mm的长方体',None)
    assert result['status']=='ready'
    assert result['command']['command_type']=='create_primitive'
    assert result['command']['parameters']==dict(primitive_type='box',length=40,width=20,height=10)
    assert snapshot.objects==[] and head.revision==0
@pytest.mark.parametrize('questions',['请补充尺寸',123,{},[''],[123]])
def test_malformed_model_questions_do_not_crash_browser(questions):
    import json
    from app.cad_documents.proposal import resolve_freecad_spec
    class Model:
        available=True;timeout=30
        def chat(self,*_):return {'choices':[{'message':{'content':json.dumps({'status':'needs_input','questions':questions})}}]}
    value=resolve_freecad_spec('帮我设计一个零件',Model())
    assert isinstance(value['questions'],list) and value['questions'] and all(isinstance(q,str) and q for q in value['questions'])
