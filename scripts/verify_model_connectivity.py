"""限次数验证当前模型提供方；默认只读配置，不调用收费接口。"""

from __future__ import annotations

import argparse
import base64
import io
import json
import os
from pathlib import Path
import sys
import time


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live", action="store_true", help="明确执行最多四次真实模型请求")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    from dotenv import load_dotenv
    load_dotenv(root / ".env", override=False)
    # 只在当前验证进程生效，不修改用户的总配置。
    os.environ["MODEL_PROVIDER_MAX_ATTEMPTS"] = "1"
    os.environ["MODEL_PROVIDER_TIMEOUT_SECONDS"] = "20"
    sys.path.insert(0, str(root / "services/model-service"))
    from app.providers.gateway import ModelGateway
    gateway = ModelGateway()
    print(json.dumps({"chat_provider": gateway.name, "aux_provider": gateway.aux_name,
                      "live": args.live, "max_requests": 4 if args.live else 0}, ensure_ascii=False), flush=True)
    if not args.live:
        return 0
    from PIL import Image
    stream = io.BytesIO()
    Image.new("RGB", (64, 64), "white").save(stream, format="PNG")
    image_url = "data:image/png;base64," + base64.b64encode(stream.getvalue()).decode("ascii")
    probes = [
        ("chat", gateway.chat, {"messages": [{"role": "user", "content": "请只回复：模型连接正常"}], "max_tokens": 16}),
        ("embedding", gateway.embeddings, {"input": ["主轴温度报警"]}),
        ("rerank", gateway.rerank, {"query": "主轴温度报警", "documents": ["检查主轴温度", "检查送料机构"], "top_n": 1}),
        ("vision", gateway.vision, {"messages": [{"role": "user", "content": [
            {"type": "text", "text": "只回复图片的颜色。"}, {"type": "image_url", "image_url": {"url": image_url}}]}], "max_tokens": 16}),
    ]
    failed = 0
    for capability, call, payload in probes:
        started = time.monotonic()
        result = {"capability": capability}
        try:
            response = call(payload)
            result.update(success=True, metadata=response.get("model_metadata", {}))
        except Exception as error:
            failed += 1
            # 网关已清理上游正文；这里只打印错误类别，不打印输入、凭据或生成正文。
            result.update(success=False, error_type=type(error).__name__)
            from app.providers.base import ProviderError
            if isinstance(error, ProviderError):
                result["error"] = str(error)
        result["elapsed_seconds"] = round(time.monotonic() - started, 3)
        print(json.dumps(result, ensure_ascii=False), flush=True)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
