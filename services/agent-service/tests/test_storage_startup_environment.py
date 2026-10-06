"""本地启动的存储默认值和共享模块导入路径必须可复现。"""
from pathlib import Path
import importlib.util
import os


def test_launcher_sets_mysql_and_redis_without_sqlite_default(monkeypatch):
    path = Path(__file__).resolve().parents[3] / "scripts" / "start_all.py"
    spec = importlib.util.spec_from_file_location("storage_startup", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    # 配置读取是边界；真实默认值/合并和导入路径函数仍执行。
    monkeypatch.setattr(module, "_read_env_file", lambda _: {})
    for name in ("BACKEND_STORAGE", "WORKORDER_BACKEND", "PYTHONPATH", "REDIS_URL"):
        monkeypatch.delenv(name, raising=False)
    values = module._env_for_service(path.parents[1] / "services" / "rag-service")
    assert values["BACKEND_STORAGE"] == "mysql"
    assert values["WORKORDER_BACKEND"] == "mysql"
    assert values["REDIS_URL"] == "redis://127.0.0.1:6379/0"
    assert str(module.PROJECT_ROOT) in values.get("PYTHONPATH", "").split(os.pathsep)


def test_local_launcher_generates_one_shared_internal_identity_without_changing_env_file(monkeypatch):
    path = Path(__file__).resolve().parents[3] / "scripts" / "start_all.py"
    spec = importlib.util.spec_from_file_location("storage_startup_identity", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    monkeypatch.setattr(module, "_read_env_file", lambda _: {})
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.delenv("BACKEND_INTERNAL_TOKEN", raising=False)
    one = module._env_for_service(path.parents[1])
    two = module._env_for_service(path.parents[1] / "services")
    assert bool(one.get("BACKEND_INTERNAL_TOKEN")), "MySQL 内部身份未配置"
    import hmac
    same_identity = hmac.compare_digest(one["BACKEND_INTERNAL_TOKEN"], two["BACKEND_INTERNAL_TOKEN"])
    assert same_identity, "各本地子进程内部身份不一致"
    monkeypatch.setenv("APP_ENV", "production")
    assert not module._env_for_service(path.parents[1]).get("BACKEND_INTERNAL_TOKEN")


def test_launcher_refuses_partial_reuse_with_unknown_internal_identity(monkeypatch):
    import pytest
    path = Path(__file__).resolve().parents[3] / "scripts" / "start_all.py"
    spec = importlib.util.spec_from_file_location("storage_startup_reuse", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    monkeypatch.setattr(module, "_read_env_file", lambda _: {})
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.delenv("BACKEND_INTERNAL_TOKEN", raising=False)
    monkeypatch.setattr(module, "_port_in_use", lambda host, port: port == 8030)
    started = []
    monkeypatch.setattr(module.subprocess, "Popen", lambda *a, **kw: started.append(a))
    with pytest.raises(RuntimeError, match="内部身份|统一停止"):
        module.main()
    assert started == [], "身份冲突必须在任何子进程启动前阻断"
