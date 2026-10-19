# PatchCore 与 YOLO 视觉缺陷检测

质检页面的“视觉缺陷检测”支持上传零件图片、查看算法流程、执行模型推理和查看缺陷位置。它可以独立使用，不要求先生成 CAD 模型。已有建模参数模拟比对继续保留。

视觉结果只覆盖本次图片与指定模型：`clear` 表示“未检出视觉缺陷”，`defect` 表示“检出视觉缺陷”。它不会替代尺寸、材质、功能、过程记录等完整质检，也不会自动创建放行或设备控制动作。缺少模型、无效图片、依赖异常或推理失败都会返回错误，不生成合格结果。

## 本地准备

在项目根目录使用服务的 Python 环境安装可选依赖。CPU 环境可以先安装 CPU 版 PyTorch；有 GPU 的部署按 PyTorch 官方安装说明选择对应版本。

```powershell
.\.venv\Scripts\python.exe -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
.\.venv\Scripts\python.exe -m pip install -r services/agent-service/requirements-vision.txt
```

在根目录 `.env` 配置可信的本地权重，再重启 Agent Service：

```dotenv
QUALITY_PATCHCORE_BACKBONE_WEIGHTS=L:/models/resnet18-f37072fd.pth
QUALITY_YOLO_WEIGHTS=L:/models/defects/best.pt
QUALITY_VISION_ROOT=.runtime/quality-vision
```

- PatchCore 使用 ImageNet 预训练的 ResNet18 `state_dict`。可从 [PyTorch 官方 ResNet18 权重](https://download.pytorch.org/models/resnet18-f37072fd.pth) 下载；文件 SHA256 应以 `f37072fd` 开头。未配置此文件时无法建库或推理。
- YOLO 使用 **针对实际缺陷类别训练好的** Ultralytics detect 模型（`.pt` 或兼容 `.onnx`）。普通 COCO 权重不具备工业缺陷类别，不能用于证明零件无缺陷。类别名来自模型。
- ONNX 模型需要额外安装对应的 ONNX Runtime。权重仅由服务器管理员配置，页面不接受上传或指定模型文件路径；推理不会自动下载权重。
- `QUALITY_VISION_ROOT` 保存按账号隔离的特征库和检测记录。默认目录被 Git 忽略；备份与多实例部署需配置持久共享存储，并按实际吞吐使用独立推理服务。

## PatchCore

### 已配置的试用模型

本地部署可提供两个可直接选择的模型：

- **NEU-DET 钢材缺陷模型（研究验证）**：公开的 YOLOv8n ONNX 权重，识别龟裂、夹杂、斑块、麻点、氧化皮和划痕。来自 [v1.0.0 发布页](https://github.com/winthegame259/steel-surface-defect-detection/releases/tag/v1.0.0)，SHA256 为 `495ad53dbff99bcbf629ec67f90e1e627800ab8db78177de592648b6e00345b1`。上游 AGPL-3.0 许可证随制品保留；上游将数据集描述为研究用途，正式应用还需核对数据与权重授权、验证目标产品。
- **PatchCore 合成纹理演示**：用 12 张合成正常纹理建库，用独立合成校准集选择阈值，仅供验证流程和热图。共享记忆库只读；用真实产品图片自建的个人模型仍可校准。

准备脚本 `scripts/provision_quality_models.py` 保留下载来源、校验和、建库及校准过程；运行参数以 `--help` 为准。模型制品保存在 `.runtime/quality-models/`，不提交大文件到 Git。配置示例：

```dotenv
QUALITY_YOLO_WEIGHTS=L:/industry_agent/.runtime/quality-models/neu-det-yolov8n-v1.0.0/neu_det_yolov8n_best.onnx
QUALITY_YOLO_METADATA=L:/industry_agent/.runtime/quality-models/neu-det-yolov8n-v1.0.0/model.json
QUALITY_PATCHCORE_PRESET_DIR=L:/industry_agent/.runtime/quality-models/patchcore-synthetic-v1
```

服务检查元数据与权重/记忆库文件摘要是否一致；检测记录保留所用模型说明。共享模型可被已登录账号使用，检测记录仍按账号隔离。模型说明错误会显示未就绪或警告，绝不以空模型返回“未检出”。

这次公开 YOLO 模型的实际推理验证确认可以输出缺陷框，但正常合成图片也产生过误报。合成纹理与真实钢材的图像分布不同，不能将这些试用结果当作真实产线准确率。

### 自建产品记忆库

1. 登录工作台账号，进入质检 → 视觉缺陷检测，选择 PatchCore。
2. 上传 2–24 张已确认正常、同一产品且拍摄条件覆盖预期变化的图片，填写特征库名称、选择输入分辨率/缩放/CLAHE/平滑配置并建立正常特征库。
3. 选择特征库，上传待检测图片，设置异常距离阈值，点击“运行缺陷检测”。
4. 使用“独立图片校准阈值”上传至少2张正常、1张缺陷图片（合计最多24张），选择召回优先、平衡或校准集零误报策略，再用另留的测试图片检查效果。服务端拒绝校准图片重复或与建库图片重叠。
5. 查看原图、异常热图、标注图和异常区域。建库后的初始阈值只是启发式起点，校准结果也不替代独立测试；分数不是缺陷概率。

算法链路：RGB 预处理 → 224×224 或 448×448 输入 → 冻结的 ResNet18 `layer2` / `layer3` 特征 → 局部平均池化和多尺度对齐 → 特征合并 → greedy k-center coreset 正常记忆库 → 最近邻欧氏距离 → 上采样和平滑热图 → 阈值分割与异常区域框。详细逻辑、指标口径、合成压力测试和真实数据入口见 [PatchCore 评估说明](patchcore-evaluation.md)。

这是面向本地工作台的轻量 PatchCore 实现。它采用 ResNet18 和有界记忆库，并以像素异常热图的最大值作为图像分数；不声称复现论文的 WideResNet50 和加权图像评分基准。材质、光照、相机或产品变化后应重新建库、验证阈值。

## YOLO

1. 用实际缺陷数据进行边界框标注，划分训练集、验证集和测试集。
2. 按 [Ultralytics 目标检测训练说明](https://docs.ultralytics.com/tasks/detect/) 离线训练，使用验证/测试集确认漏检率、误检率和类别覆盖范围。
3. 将训练产物配置为 `QUALITY_YOLO_WEIGHTS`。本次功能提供在线推理；数据标注和 YOLO 训练在离线环境完成。
4. 在页面选择 YOLO、上传图片，设置置信度和 NMS IoU 阈值并检测，查看缺陷类别、置信度、位置和标注图。

算法链路：缺陷图片与框标注 → 离线训练及验证 → 加载缺陷权重 → 图片预处理 → YOLO 推理 → 置信度筛选 / NMS → 恢复原图坐标 → 标注和检测记录。

## 接口与边界

尺寸模拟检测要求比对仪处于运行状态。若显示“模拟比对仪未运行”，页面会显示当次设备/监控/控制状态、停机原因及工单入口；需要完成实际核查、维修和已有复机流程后再重试。没有关联工单时先核查停机原因。视觉图片检测独立于该工位，可在设备停机时使用；它不会修改设备状态或提交维修完成回执。

所有视觉接口均沿用工作台个人登录会话；写请求还使用现有服务写入认证。返回值不包含服务器模型路径。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/quality/vision/capabilities` | 算法依赖、权重就绪状态和当前账号的模型 |
| POST | `/api/quality/vision/patchcore/train` | 正常图片建库，返回模型元数据 |
| POST | `/api/quality/vision/patchcore/calibrate` | 用独立正常/缺陷图片选择阈值，保存三种策略及校准集指标 |
| POST | `/api/quality/vision/detect` | 执行推理，返回标注、热图、区域与流程 |
| GET | `/api/quality/vision/inspections/{inspection_id}` | 按账号读取已保存的视觉检测记录 |

图片使用 PNG / JPEG / WebP 的 base64 或 data URL，单张最多 4 MiB、最多 1600 万像素。训练或校准单批最多 24 张，请求 JSON 总量最多 40 MiB（base64 比原文件大约增加三分之一）。CPU 部署建议使用单 worker：单进程一次只执行一个建库/校准/推理任务，忙时返回可重试提示；锁不跨进程。训练逐张解码、提取特征并关闭原图；检测仍以原图尺寸生成热图，1600 万像素图片可能需要数百 MiB 临时内存。不会自动重试 POST；如果请求超时，应核对状态后再操作。

代码验证覆盖特征距离/coreset、图片解码、认证和存储隔离、模型缺失、响应契约以及浏览器的建库/检测/切换输入流程。产品上的实际检测准确率仍需使用目标产品的数据集验证。

算法参考：[Anomalib PatchCore 文档](https://anomalib.readthedocs.io/en/stable/markdown/guides/reference/models/image/patchcore.html)、[Ultralytics 推理结果接口](https://docs.ultralytics.com/modes/predict/)。
