"""Prepare the author's public MANTA gear benchmark for non-commercial research.

The full gear archive is about 2.51 GiB. Downloads use resumable HTTP ranges,
then verify the author's MD5 before extracting regular files under output-dir.
No training or active application/model configuration changes are performed.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import tarfile
import time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, wait
from datetime import datetime, timezone

import requests
from PIL import Image

# Defaults are repository-relative, irrespective of the caller's current folder.
ROOT = Path(__file__).resolve().parents[1] / ".runtime" / "datasets" / "manta-gear"
URL = "https://ndownloader.figshare.com/files/50904840"
SIZE = 2692003445
MD5 = "bfa0b4e86d28b3ea7e63d628b7a5510c"
PART = ROOT / "gear.tar.gz.part"
ARCHIVE = ROOT / "gear.tar.gz"
STATUS = ROOT / "preparation-status.json"
WORKERS = 12


def report(stage, **details):
    record = {
        "stage": stage, "updated_at": datetime.now(timezone.utc).isoformat(),
        **details,
    }
    temp = STATUS.with_suffix(".json.part")
    temp.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(temp, STATUS)
    print(json.dumps(record, ensure_ascii=False), flush=True)


def md5(path):
    digest = hashlib.md5()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download():
    if ARCHIVE.exists():
        if ARCHIVE.stat().st_size != SIZE or md5(ARCHIVE) != MD5:
            raise RuntimeError("Existing archive does not match author checksum; left untouched")
        report("archive_verified", bytes=SIZE, md5=MD5, reused=True)
        return
    free = shutil.disk_usage(ROOT).free
    if free < 9 * 1024**3:
        raise RuntimeError(f"Insufficient free disk space: {free} bytes")
    report("download_start", bytes_total=SIZE, free_disk_bytes=free)
    chunk_root = ROOT / "download-parts"
    chunk_root.mkdir(exist_ok=True)
    chunk_size = 64 * 1024 * 1024
    ranges = [(i, start, min(SIZE - 1, start + chunk_size - 1))
              for i, start in enumerate(range(0, SIZE, chunk_size))]
    if PART.exists() and PART.stat().st_size < SIZE and not any(chunk_root.iterdir()):
        with PART.open("rb") as prefix:
            for i, start, end in ranges:
                data = prefix.read(end - start + 1)
                if not data:
                    break
                (chunk_root / f"{i:03d}.part").write_bytes(data)

    def fetch_range(item):
        i, start, end = item
        target = chunk_root / f"{i:03d}.part"
        length = end - start + 1
        for attempt in range(5):
            local_size = target.stat().st_size if target.exists() else 0
            if local_size == length:
                return
            if local_size > length:
                raise RuntimeError(f"Segment {i} is larger than expected")
            request_start = start + local_size
            try:
                with requests.get(URL, headers={"Range": f"bytes={request_start}-{end}"},
                                  stream=True, timeout=(20, 60)) as response:
                    response.raise_for_status()
                    if response.status_code != 206:
                        raise RuntimeError("Server did not honor byte-range download")
                    if response.headers.get("Content-Range") != f"bytes {request_start}-{end}/{SIZE}":
                        raise RuntimeError("Unexpected Content-Range on segmented download")
                    with target.open("ab") as output:
                        for chunk in response.iter_content(1024 * 1024):
                            if chunk:
                                output.write(chunk)
                if target.stat().st_size != length:
                    raise requests.RequestException("Segment incomplete")
                return
            except requests.RequestException:
                if attempt == 4:
                    raise
                time.sleep(2)

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        pending = {pool.submit(fetch_range, item) for item in ranges}
        while pending:
            done, pending = wait(pending, timeout=20)
            for future in done:
                future.result()
            received = sum(path.stat().st_size for path in chunk_root.glob("*.part"))
            report("downloading", bytes=received, bytes_total=SIZE,
                   percent=round(received * 100 / SIZE, 2), parallel_connections=WORKERS)
    report("assembling_archive")
    with PART.open("wb") as output:
        for i, start, end in ranges:
            with (chunk_root / f"{i:03d}.part").open("rb") as segment:
                shutil.copyfileobj(segment, output, 8 * 1024 * 1024)
    if PART.stat().st_size != SIZE:
        raise RuntimeError("Downloaded length does not match author metadata")
    report("verifying_archive", bytes=SIZE)
    actual = md5(PART)
    if actual != MD5:
        raise RuntimeError(f"MD5 mismatch: {actual}")
    os.replace(PART, ARCHIVE)
    report("archive_verified", bytes=SIZE, md5=actual)


def extract():
    entries = []
    counts = Counter()
    sample_shapes = {}
    duplicates = defaultdict(list)
    total_bytes = 0
    with tarfile.open(ARCHIVE, "r:gz") as source:
        for member in source:
            posix = PurePosixPath(member.name)
            if posix.is_absolute() or ".." in posix.parts or "\\" in member.name:
                raise RuntimeError(f"Unsafe archive member: {member.name}")
            if not posix.parts or posix.parts[0] != "gear":
                raise RuntimeError(f"Unexpected archive root: {member.name}")
            destination = ROOT.joinpath(*posix.parts).resolve()
            destination.relative_to(ROOT)
            if member.isdir():
                destination.mkdir(parents=True, exist_ok=True)
                continue
            if not member.isfile():
                raise RuntimeError(f"Unsupported archive member type: {member.name}")
            if destination.exists() and destination.is_symlink():
                raise RuntimeError(f"Existing symlink: {destination}")
            destination.parent.mkdir(parents=True, exist_ok=True)
            temporary = destination.with_name(destination.name + ".extracting")
            digest = hashlib.sha256()
            extracted = source.extractfile(member)
            if extracted is None:
                raise RuntimeError(f"Cannot extract regular file: {member.name}")
            with extracted, temporary.open("wb") as output:
                for chunk in iter(lambda: extracted.read(1024 * 1024), b""):
                    digest.update(chunk)
                    output.write(chunk)
            if temporary.stat().st_size != member.size:
                raise RuntimeError(f"Extraction length mismatch: {member.name}")
            os.replace(temporary, destination)
            folder = "/".join(posix.parts[1:-1])
            counts[folder] += 1
            total_bytes += member.size
            sha = digest.hexdigest()
            entries.append({"path": member.name, "size_bytes": member.size, "sha256": sha})
            if folder.startswith(("train/", "test/")):
                duplicates[sha].append(member.name)
            if destination.suffix.lower() in (".png", ".jpg", ".jpeg") and folder not in sample_shapes:
                with Image.open(destination) as picture:
                    sample_shapes[folder] = {"file": member.name, "width": picture.width,
                                             "height": picture.height, "mode": picture.mode}
            if len(entries) % 100 == 0:
                report("extracting", files=len(entries), extracted_bytes=total_bytes)
    report("extracted", files=len(entries), extracted_bytes=total_bytes)
    return entries, counts, sample_shapes, duplicates


def main():
    download()
    entries, counts, shapes, hashes = extract()
    train = counts.get("train/good", 0)
    normal_test = counts.get("test/good", 0)
    anomaly_test = sum(n for folder, n in counts.items()
                       if folder.startswith("test/") and folder != "test/good")
    masks = sum(n for folder, n in counts.items() if folder.startswith("ground_truth/"))
    matches = (train, normal_test, anomaly_test, masks) == (2068, 162, 81, 81)
    cross_split_duplicates = []
    for sha, files in hashes.items():
        if len({f.split("/")[1] for f in files}) > 1:
            cross_split_duplicates.append({"sha256": sha, "paths": files})
    summary = {
        "source": "MANTA official public gear benchmark (not user's production-line data)",
        "project_url": "https://grainnet.github.io/MANTA",
        "figshare_record": "https://figshare.com/articles/dataset/27937518",
        "download_url": URL, "archive_size_bytes": SIZE, "archive_md5": MD5,
        "archive_md5_verified": True,
        "author_site_license": "CC BY-NC-SA 4.0; non-commercial use only",
        "figshare_license_metadata": "CC BY 4.0",
        "license_policy": "Observe stricter author-site non-commercial terms pending clarification.",
        "image_layout": "Five views of one object packed in one image; keep views of one object in the same split.",
        "actual_counts": {"train_normal": train, "test_normal": normal_test,
                          "test_anomalous": anomaly_test, "anomaly_masks": masks},
        "counts_match_author_supplement": matches,
        "per_folder_file_counts": dict(sorted(counts.items())),
        "sample_dimensions": shapes,
        "cross_split_exact_duplicate_groups": cross_split_duplicates,
        "training_performed": False, "active_model_config_changed": False,
        "prepared_at": datetime.now(timezone.utc).isoformat(),
    }
    (ROOT / "source-and-counts.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "file-manifest.json").write_text(
        json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
    readme = f"""# MANTA 齿轮公开基准数据

来源：MANTA (CVPR 2025) 作者官方网站 https://grainnet.github.io/MANTA
Figshare 作者发布记录：https://figshare.com/articles/dataset/27937518
单类原始包：{URL}
原包字节数：{SIZE}；MD5：{MD5}（已验证）。

这些是真实采集的公开齿轮基准图片，不是本项目用户生产线采集数据。
与现有 fangandyim 塑料齿轮 YOLO11 训练数据不同，不可将跨域结果称为本产线性能。

## 实际文件数量

- gear/train/good：{train} 张，仅用于拟合正常记忆库。
- gear/test/good：{normal_test} 张，独立正常测试图片。
- gear/test/ 下其他缺陷目录：{anomaly_test} 张，独立异常测试图片。
- gear/ground_truth/：{masks} 张缺陷掩码。
- 数量是否匹配作者补充表：{matches}。

保留作者 train/test 组织；未训练、未改变活跃模型配置。
五视角同物体在一张图片中，裁分视角时必须保留物体身份，避免跨集合泄漏。
如从训练数据留出阈值校准集，应先独立划分；不得以测试集调参后再报独立测试成绩。
完整文件 SHA256、大小见 file-manifest.json；目录计数与样本尺寸见 source-and-counts.json。

## 使用范围

作者官网明确 CC BY-NC-SA 4.0，禁止商业用途；Figshare 元数据标 CC BY 4.0，存在冲突。
本次按作者官网较严格说明用于非商业研究和流程验证。商业产线使用前须向权利人澄清许可。
"""
    (ROOT / "README.md").write_text(readme, encoding="utf-8")
    if not matches:
        raise RuntimeError("Actual counts differ from expected author counts; review required")
    report("complete", actual_counts=summary["actual_counts"],
           cross_split_exact_duplicate_groups=len(cross_split_duplicates),
           root=str(ROOT))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output-dir", type=Path, default=ROOT,
        help="Dataset directory (default: repository/.runtime/datasets/manta-gear). "
             "Do not run multiple preparations against the same directory.",
    )
    parser.add_argument(
        "--workers", type=int, choices=range(1, 17), default=12, metavar="1..16",
        help="Concurrent resumable HTTP range requests (default: 12).",
    )
    args = parser.parse_args()
    ROOT = args.output_dir.expanduser().resolve()
    ROOT.mkdir(parents=True, exist_ok=True)
    PART = ROOT / "gear.tar.gz.part"
    ARCHIVE = ROOT / "gear.tar.gz"
    STATUS = ROOT / "preparation-status.json"
    WORKERS = args.workers
    try:
        main()
    except Exception as exc:
        report("failed", error_type=type(exc).__name__, error=str(exc))
        raise
