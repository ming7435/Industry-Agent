import importlib
from hashlib import sha256
import pytest


def test_managed_files_reject_traversal_and_tampering(tmp_path):
    assert importlib.util.find_spec('app.cad_documents'), 'managed artifacts missing'
    from app.cad_documents.artifacts import ArtifactStore
    store=ArtifactStore(tmp_path)
    with pytest.raises(ValueError): store.job_directory('../outside')
    target=store.job_directory('JOB-a')/'model.FCStd'
    target.write_bytes(b'original')
    entry=dict(job_id='JOB-a',name='model.FCStd',sha256=sha256(b'original').hexdigest(),size=8)
    assert store.entry_path(entry).read_bytes()==b'original'
    target.write_bytes(b'different')
    with pytest.raises(ValueError): store.entry_path(entry)
    with pytest.raises(ValueError): store.entry_path({**entry,'name':'../secret'})


def test_symlink_files_are_not_trusted(tmp_path):
    assert importlib.util.find_spec('app.cad_documents'), 'managed artifacts missing'
    from app.cad_documents.artifacts import ArtifactStore
    store=ArtifactStore(tmp_path/'store')
    target=tmp_path/'outside'
    target.write_bytes(b'original')
    link=store.job_directory('JOB-a')/'model.FCStd'
    try: link.symlink_to(target)
    except OSError: pytest.skip('Windows symlink permission unavailable')
    with pytest.raises(ValueError): store.entry_path(dict(job_id='JOB-a',name='model.FCStd',size=8,sha256=sha256(b'original').hexdigest()))
