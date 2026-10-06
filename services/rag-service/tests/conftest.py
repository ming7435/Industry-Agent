"""RAG 单元测试禁止加载本机业务配置，默认文档库使用临时路径。"""
import os
import pytest
os.environ["PYTHON_DOTENV_DISABLED"] = "1"
os.environ["APP_ENV"] = "testing"


@pytest.fixture(autouse=True)
def isolated_documents(tmp_path, monkeypatch):
    monkeypatch.setenv("RAG_DOCUMENT_STORE_PATH", str(tmp_path / "documents.sqlite3"))
