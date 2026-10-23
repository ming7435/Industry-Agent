# 随仓库同步的视觉模型

2026-10-23 按当前本机部署选择以下模型文件，随代码同步到 GitHub 和 Gitee。
保留原部署目录，不修改本机 `.env`，也不重新训练或替换模型。
这些文件共 74,580,179 字节（约 71.13 MiB），使用普通 Git 保存，无需 Git LFS。

## 文件与用途

以下路径均相对于项目根目录：

| 路径 | 用途 | 字节数 |
| --- | --- | ---: |
| `.runtime/quality-models/backbones/resnet18-f37072fd.pth` | PatchCore 的 ImageNet 预训练 ResNet18 骨干 | 46,830,571 |
| `.runtime/quality-models/patchcore-gear-v1/memory.npz` | 已部署的齿轮正常特征记忆库 | 1,367,208 |
| `.runtime/quality-models/patchcore-gear-v1/model.json` | 记忆库预处理、校准阈值和摘要 | 2,149 |
| `.runtime/quality-models/yolo11-gear-fine-defects-v2/best.pt` | 当前齿轮缺陷定位权重，包含细化后的污渍/细丝分类分支 | 5,860,894 |
| `.runtime/quality-models/yolo11-gear-fine-defects-v2/model.json` | 缺陷类别、分块推理参数、建议阈值、摘要与评估限制 | 3,097 |
| `.runtime/quality-models/part-seg-v1/best.pt` | 保留接口使用的工件端面/齿面分割权重，不参与当前串联缺陷判定 | 20,516,260 |

`.runtime/` 继续被忽略；只有上表六个明确指定的模型文件纳入版本控制。
根目录 `.gitattributes` 为这些模型文件禁用换行转换，保证跨系统拉取后的字节摘要一致。
不会因此上传 `.runtime/quality-vision/` 中按账号保存的检测记录、图片、个人记忆库，
或其他运行数据。旧权重、训练检查点、训练缓存和完整训练数据也不在本次模型同步范围内。

## 在另一台机器配置

先按 [视觉检测部署说明](quality-vision.md) 安装可选的视觉推理依赖。
在项目根目录的本机 `.env` 中配置以下路径；将示例的 `L:/industry_agent`
替换为实际克隆目录，不要提交 `.env`：

```dotenv
QUALITY_PATCHCORE_BACKBONE_WEIGHTS=L:/industry_agent/.runtime/quality-models/backbones/resnet18-f37072fd.pth
QUALITY_PATCHCORE_GEAR_PRESET_DIR=L:/industry_agent/.runtime/quality-models/patchcore-gear-v1
QUALITY_YOLO_WEIGHTS=L:/industry_agent/.runtime/quality-models/yolo11-gear-fine-defects-v2/best.pt
QUALITY_YOLO_METADATA=L:/industry_agent/.runtime/quality-models/yolo11-gear-fine-defects-v2/model.json
QUALITY_PART_SEG_WEIGHTS=L:/industry_agent/.runtime/quality-models/part-seg-v1/best.pt
```

缺陷模型的权重和 `model.json` 必须配套使用，不要仅替换其中一个。
PatchCore 记忆库也必须与所列骨干权重及其元数据配套。
配置生效需要按应用部署流程重新加载服务；本次仓库同步本身不重启服务。
模型推理不要求下载完整训练集；复现训练与评估则还需要对应数据及依赖。
已同步的 240 张图片子集见 [图片数据集同步说明](image-dataset-sync.md)，
该子集不等于当前扩充模型的完整训练数据。

## 文件完整性

在 PowerShell 中可用 `Get-FileHash -Algorithm SHA256 <文件路径>` 核对：

```text
backbones/resnet18-f37072fd.pth
f37072fd47e89c5e827621c5baffa7500819f7896bbacec160b1a16c560e07ec

patchcore-gear-v1/memory.npz
e2db04b4171c84ab314c0f3cc07ea96aafde5645797faf14b33439647601afe6

patchcore-gear-v1/model.json
b3f3089e02a650e643f09f3435a6bc451f31158450dcd249f3dc8bb4b1812ab2

yolo11-gear-fine-defects-v2/best.pt
0f8a2fd39608210d596126eb928f3ea10fecff0760fa67ffea470bc9f079ffb0

yolo11-gear-fine-defects-v2/model.json
c662983d16e4d65362c458aa1927ec40ad24ff59a060bd1b9e5093d253944b4a

part-seg-v1/best.pt
0bd2708cc0408b2ed682e2126276401e597913aeed3946528e1caaf200dd3acd
```

## 来源与使用边界

- ResNet18 来自项目已使用的 PyTorch ImageNet 预训练权重，来源链接见视觉检测部署说明。
- YOLO 缺陷模型使用公开塑料齿轮数据训练；作者 README 的非商业学术研究限制
  与上游 LICENSE 表述存在差异，保留的 `model.json` 已记录该限制，不推定商业授权。
- PatchCore 记忆库来自 MANTA 齿轮正常图。官网与存储页的许可表述不一致，
  目前仅作非商业研究验证；其来源、校准与跨数据域限制见视觉检测部署说明。
- 工件分割权重由用户提供，类别为 `endface` 和 `toothface`；不包含其完整训练集，
  本次同步不对其独立测试指标或商业许可作额外确认。

这些权重不是经过产线验收的通用合格标准。代码测试和文件摘要通过，
不代表模型在真实产品、相机与光照条件下的准确率已经验证。
DeepSeek、SiliconFlow 等外部 API 模型不属于本地权重文件；不上传其密钥或账号配置。
