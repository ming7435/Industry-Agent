"""服务测试不能读取本机密钥、业务数据库或收费模型配置。"""
import os
import pytest

# 收集阶段先阻止模块加载 .env；个别契约测试显式注入自己的临时 HTTP 服务。
os.environ['PYTHON_DOTENV_DISABLED'] = '1'
for key in ('BACKEND_SERVICE_BASE_URL', 'RAG_SERVICE_BASE_URL', 'MODEL_SERVICE_BASE_URL', 'CAD_SERVICE_BASE_URL', 'MCP_CAD_URL', 'MCP_MES_URL', 'MCP_QMS_URL', 'MCP_INVENTORY_URL', 'AGENT_API_TOKEN', 'BACKEND_INTERNAL_TOKEN'):
    os.environ[key] = ''
os.environ['APP_ENV'] = 'testing'
os.environ['RAG_ALLOW_LOCAL_FALLBACK'] = 'true'
os.environ['FACTORY_API_BASE_URL'] = 'http://127.0.0.1:9'
os.environ['FACTORY_CONTROL_MODE'] = ''


@pytest.fixture(autouse=True)
def isolated_runtime_files(tmp_path, monkeypatch):
    for key in ('EVENT_STORE_PATH', 'WORKORDER_STORE_PATH', 'LEARNING_RESULT_STORE_PATH', 'REPORT_STORE_PATH', 'PENDING_TASK_STORE_PATH', 'LINE_SAFETY_STORE_PATH'):
        monkeypatch.setenv(key, str(tmp_path / (key.lower() + '.sqlite3')))
    from app.config import get_settings
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
