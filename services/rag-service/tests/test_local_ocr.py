from app.ingestion.ocr import LocalOcrClient, LocalOcrConfig


class FakeRapidOcr:
    def __call__(self, _path):
        return (
            [
                [[[0, 0], [1, 0], [1, 1], [0, 1]], "报警代码 E101", 0.99],
                [[[0, 2], [1, 2], [1, 3], [0, 3]], "检查伺服驱动器", 0.98],
            ],
            [0.1, 0.1, 0.1],
        )


def test_local_ocr_supports_rapidocr_backend():
    client = LocalOcrClient(
        LocalOcrConfig(backend="rapidocr", language="ch"),
        ocr_engine=FakeRapidOcr(),
    )

    text = client.describe_image(
        b"fake-image",
        media_type="image/png",
        filename="alarm.png",
        page_number=1,
        prompt="unused",
    )

    assert "报警代码 E101" in text
    assert "检查伺服驱动器" in text
