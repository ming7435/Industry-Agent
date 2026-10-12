"""RAG 单元测试禁止加载本机业务配置，默认文档库使用临时路径。"""
import os
import pytest
os.environ["PYTHON_DOTENV_DISABLED"] = "1"
os.environ["APP_ENV"] = "testing"
os.environ['RAG_INTERNAL_TOKEN'] = 'isolated-rag-token'


@pytest.fixture(autouse=True)
def isolated_documents(tmp_path, monkeypatch):
    monkeypatch.setenv("RAG_DOCUMENT_STORE_PATH", str(tmp_path / "documents.sqlite3"))
    monkeypatch.setenv('RAG_UPSERT_WHOOSH_ENABLED', 'false')
    monkeypatch.setenv('RAG_UPSERT_MILVUS_ENABLED', 'false')
    from config.settings import settings
    monkeypatch.setattr(settings, 'whoosh_index_dir', str(tmp_path / 'whoosh'))
