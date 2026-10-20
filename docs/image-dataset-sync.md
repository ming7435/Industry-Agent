# 随仓库同步的图片数据集

本次仅纳入已经准备完成的公开塑料齿轮缺陷研究子集，位置为
`output/gear-dataset/`。这不是上游 1165 张图片的完整数据集。

## 文件范围

- `raw/images/`：240 张原始 PNG 图片。
- `raw/json/`：240 份对应的原始矩形框标注。
- `prepared/images/`：240 张预处理图片，不是额外的独立样本。
- `prepared/labels/`：240 份 YOLO 文本标签，不含缓存。
- `prepared/manifest.json`：样本身份、图片摘要、类别和划分。
- `prepared/data.yaml`：本机训练配置；其中 `path` 是原机器绝对路径，
  在其他机器训练前需要改为该机器的 `prepared/` 目录。
- 上游 `README.md`、`LICENSE`、`Description.pdf`，以及类别表和子集选取清单。

划分为训练 145 张、校准 46 张、测试 49 张。240 张预处理图片在提交前
均按清单核对了 SHA256，原始图片与标注也逐项核对了文件配对。

## 来源与使用限制

来源：
[作者仓库](https://github.com/fangandyim/Plastic-Gear-Surface-Defect-Dataset)、
[Kaggle 数据页](https://www.kaggle.com/datasets/yimingfang1994/plastic-gear-surface-defect-dataset)。

原始版权和引用要求见数据目录中的上游 README。该 README 明确要求仅用于
非商业学术研究；它与上游 LICENSE 文件的表述存在差异。本项目保留两份原文，
本次同步不构成商业使用授权，其他用途需向数据所有者核实许可。

## 不包含

不上传模型权重、账号检测记录、数据库、日志、密钥、图片缓存，以及尚未
完成的 MANTA 下载分片。`output/` 其余文件仍保持忽略，仅上述数据文件被纳入版本控制。
