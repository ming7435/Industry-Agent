from pathlib import Path

import pytest
from PIL import Image

from app.ingestion.parser import ImageParseError, parse_document, parse_markdown, image_asset_from_file


def png(path):
    Image.new('RGB', (2, 2), 'white').save(path, format='PNG')


@pytest.mark.parametrize('absolute', [False, True])
def test_markdown_cannot_send_an_image_outside_its_asset_root(tmp_path, absolute):
    corpus = tmp_path / 'corpus'
    corpus.mkdir()
    outside = tmp_path / 'outside.png'
    png(outside)
    source = corpus / 'guide.md'
    reference = outside.as_posix() if absolute else '../outside.png'
    source.write_text(f'![diagram]({reference})', encoding='utf-8')
    with pytest.raises(ValueError):
        parse_markdown(source)


def test_corpus_root_allows_legitimate_sibling_image_directories(tmp_path):
    corpus = tmp_path / 'corpus'
    (corpus / 'manuals').mkdir(parents=True)
    (corpus / 'images').mkdir()
    png(corpus / 'images' / 'part.png')
    source = corpus / 'manuals' / 'guide.md'
    source.write_text('![part](../images/part.png)', encoding='utf-8')
    document = parse_document(source, source_root=corpus)
    assert len(document.assets) == 1
    assert document.assets[0].media_type == 'image/png'


@pytest.mark.parametrize('filename', ['secret', 'secret.png'])
def test_non_image_bytes_never_become_a_vision_payload(tmp_path, filename):
    source = tmp_path / filename
    source.write_bytes(b'isolated-not-an-image')
    with pytest.raises((ValueError, ImageParseError)):
        image_asset_from_file(source)


def test_markdown_image_link_cannot_escape_corpus(tmp_path):
    corpus = tmp_path / 'corpus'
    corpus.mkdir()
    outside = tmp_path / 'outside.png'
    png(outside)
    try:
        (corpus / 'part.png').symlink_to(outside)
    except OSError:
        pytest.skip('Host does not permit test file links')
    source = corpus / 'guide.md'
    source.write_text('![part](part.png)', encoding='utf-8')
    with pytest.raises(ValueError):
        parse_document(source, source_root=corpus)


def test_truncated_jpeg_never_becomes_a_vision_payload(tmp_path):
    source = tmp_path / 'part.jpg'
    Image.new('RGB', (10, 10), 'white').save(source)
    source.write_bytes(source.read_bytes()[:-2])
    with pytest.raises((ValueError, ImageParseError)):
        image_asset_from_file(source)


def test_image_byte_and_pixel_budgets_are_enforced(tmp_path, monkeypatch):
    import shared.ingestion_security as security
    source = tmp_path / 'part.png'
    png(source)
    monkeypatch.setattr(security, 'MAX_IMAGE_BYTES', 32)
    with pytest.raises((ValueError, ImageParseError)):
        image_asset_from_file(source)
    monkeypatch.setattr(security, 'MAX_IMAGE_BYTES', 1024)
    monkeypatch.setattr(security, 'MAX_IMAGE_PIXELS', 3)
    with pytest.raises((ValueError, ImageParseError)):
        image_asset_from_file(source)


def test_jp2_remains_a_verified_png_payload(tmp_path):
    from PIL import features
    if not features.check_codec('jpg_2000'):
        pytest.skip('Pillow JPEG2000 codec is unavailable')
    source = tmp_path / 'part.jp2'
    Image.new('RGB', (2, 2), 'white').save(source, format='JPEG2000')
    asset = image_asset_from_file(source)
    assert asset.media_type == 'image/png'
    assert asset.data.startswith(b'\x89PNG\r\n\x1a\n')
