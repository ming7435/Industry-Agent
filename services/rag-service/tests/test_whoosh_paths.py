from pathlib import Path

import pytest

from app.whoosh.indexer import index_dir_for_collection


@pytest.mark.parametrize('collection', ['../outside', '/outside', r'C:\outside', r'..\outside', r'\\server\share', 'nested/index', 'cases.', 'cases ', 'CON', 'nul', 'A:stream'])
def test_collection_cannot_select_a_path_outside_its_index_root(tmp_path, collection):
    with pytest.raises(ValueError):
        index_dir_for_collection(tmp_path / 'indexes', collection)
    assert not (tmp_path / 'outside').exists()


def test_collection_accepts_existing_unicode_names_and_legacy_root(tmp_path):
    root = tmp_path / 'indexes'
    assert index_dir_for_collection(root, 'industry_rag_中文目录') == root / 'industry_rag_中文目录'
    assert index_dir_for_collection(root, None) == root


def test_collection_link_cannot_escape_root(tmp_path):
    root, outside = tmp_path / 'indexes', tmp_path / 'outside'
    root.mkdir()
    outside.mkdir()
    try:
        (root / 'cases').symlink_to(outside, target_is_directory=True)
    except OSError:
        pytest.skip('Host does not permit test directory links')
    with pytest.raises(ValueError):
        index_dir_for_collection(root, 'cases')
