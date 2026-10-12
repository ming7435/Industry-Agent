"""Independent service identity for every RAG business endpoint."""
import hmac
import os

from fastapi import HTTPException, Request
from config.settings import settings


def require_rag_identity(request: Request) -> None:
    if request.url.path == '/health':
        return
    expected = os.getenv('RAG_INTERNAL_TOKEN', settings.rag_internal_token).strip()
    if not expected:
        raise HTTPException(503, 'RAG service authentication is not configured')
    scheme, _, supplied = request.headers.get('Authorization', '').partition(' ')
    if scheme.lower() != 'bearer' or not supplied or not hmac.compare_digest(
        supplied.encode('utf-8'), expected.encode('utf-8')
    ):
        raise HTTPException(401, 'RAG service authentication failed', headers={'WWW-Authenticate': 'Bearer'})
