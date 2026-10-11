from fastapi import HTTPException
from shared.freecad_documents import CommandRecord,CadDocumentError
from app.api.team_auth import team_actor
from .gateway import Gateway


class CadDocumentPublisher:
    def __init__(self,application): self.application=application
    def publish(self,actor_id,document_id,command_id,expected_revision):
        return CommandRecord.model_validate(self.application.gateway.call('claim_publication',actor_id=actor_id,document_id=document_id,
                                            command_id=command_id,expected_revision=expected_revision))
    def designs(self,actor_id,cursor='',limit=50):
        return self.application.gateway.call('list_designs',actor_id=actor_id,cursor=cursor,limit=limit)
    def public_run(self,request,run_id): return read_published_run(request,run_id)


def read_published_run(request,run_id):
    gateway=Gateway()
    try:
        if not gateway.call('published_exists',run_id=run_id): return None
        actor=team_actor(request,gateway.backend)
        record=gateway.call('find_published',actor_id=actor['user_id'],run_id=run_id)
        if record is None: raise HTTPException(409,'已发布版本目录发生不一致')
        from shared.freecad_documents import verify_document_standard
        standard=verify_document_standard(record['standard_parameters'])
        if standard.run_id!=run_id or standard.document_id!=record['document_id'] or standard.revision!=record['revision']:
            raise HTTPException(409,'已发布标准来源不一致')
        return record
    except CadDocumentError as error: raise HTTPException(error.status_code,error.message) from None
    except (ValueError,KeyError): raise HTTPException(409,'已发布标准摘要或结构无效') from None
