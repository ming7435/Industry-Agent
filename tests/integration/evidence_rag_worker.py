"""仅供隔离契约测试：真实 RAG 路由/管道，临时索引，模型指向本机测试端点。"""
from pathlib import Path
import sys

import uvicorn
from fastapi import FastAPI

from app.api import routes
from app.api.documents import DocumentStore
from app.api.pipeline import SearchPipeline
from app.clients.model import RemoteLLM
from app.whoosh.indexer import build_index
from app.whoosh.retriever import BM25Retriever


def main():
    root, port = Path(sys.argv[1]), int(sys.argv[2])
    index = root / 'whoosh'
    build_index([{'chunk_id': 'MANUAL-1:0', 'text': 'bearing repair inspection',
                  'metadata': {'corpus': 'manuals', 'device_id': 'D-1'}}], index)
    pipeline = SearchPipeline(BM25Retriever(index_dir=str(index)), None, None, None, RemoteLLM())
    store = DocumentStore(str(root / 'documents.sqlite3'))
    routes.get_pipeline = lambda: pipeline
    routes.get_document_store = lambda: store
    app = FastAPI()
    app.include_router(routes.router)
    uvicorn.run(app, host='127.0.0.1', port=port, log_level='error')


if __name__ == '__main__':
    main()
