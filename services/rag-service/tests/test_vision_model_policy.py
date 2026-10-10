import pytest

from app.ingestion.vision import SiliconFlowVisionConfig


@pytest.mark.parametrize("model", ["deepseek-ai/DeepSeek-V4-Flash", "Pro/deepseek-ai/DeepSeek-V4-Flash-0731", "deepseek-chat"])
def test_document_vision_rejects_deepseek_configuration(model):
    with pytest.raises(ValueError, match="DeepSeek"):
        SiliconFlowVisionConfig(api_key="isolated-test-key", model=model)


def test_document_vision_accepts_qwen_configuration():
    SiliconFlowVisionConfig(api_key="isolated-test-key", model="Qwen/Qwen3-VL-8B-Instruct")
