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

### 当前数据与模型

当前外观检测采用公开塑料齿轮数据的固定240张子集（160张端面、80张齿面），保留16类原始缺陷标签和651个矩形框。来源：[作者仓库](https://github.com/fangandyim/Plastic-Gear-Surface-Defect-Dataset)、[Kaggle数据页](https://www.kaggle.com/datasets/yimingfang1994/plastic-gear-surface-defect-dataset)。完整源数据为1165张，本次未声称使用全集。平台及LICENSE写Apache2，但作者README限定非商业学术研究；本地仅作研究验证，不推定商业授权。

旧金属纹理合成模型和钢材YOLOv8模型已从运行清单移除，不会出现在页面或参与推理。保留通用ResNet18骨干，用于用户另行上传真实良品建立PatchCore记忆库。当前齿轮子集全部带缺陷，没有已确认正常齿轮，因此不能建立正常记忆库，也不能统计正常图误报率。

部署配置：

```dotenv
QUALITY_YOLO_WEIGHTS=L:/industry_agent/.runtime/quality-models/yolo11-gear-v1/best.pt
QUALITY_YOLO_METADATA=L:/industry_agent/.runtime/quality-models/yolo11-gear-v1/model.json
QUALITY_PATCHCORE_BACKBONE_WEIGHTS=L:/industry_agent/.runtime/quality-models/backbones/resnet18-f37072fd.pth
QUALITY_PATCHCORE_PRESET_DIR=
QUALITY_VISION_DATA_MODE=gear
QUALITY_VISION_DATASET_MANIFEST=L:/industry_agent/output/gear-dataset/prepared/manifest.json
```

服务校验权重摘要，页面展示实际模型名称和原始覆盖类别；模型尚在训练或不可用时，检测按钮不会启用。数据和评估证据保存在 `output/gear-dataset/`。

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

## 两种独立的视觉检测方式

页面通过“视觉检测算法”选择PatchCore或YOLO11，点击“运行缺陷检测”只执行所选算法。PatchCore独立输出异常距离、热力图和异常区域；YOLO11独立输出缺陷类别、置信度和检测框。两种方式各自保存模型参数与检测记录，各自检查是否就绪；一种模型缺失或失败不会自动调用另一种模型。

顺序联合入口及联合结论已取消。旧浏览器缓存中的联合记录编号和待保存状态不再恢复，也不会阻止单模型检测。旧的`sequential/fuse`和`production/verify`写接口在认证后返回410停用提示；已经保存的历史记录仍可按原有账号权限读取。

正常记忆库必须使用明确正常标签且与待检产品和拍摄条件相匹配的真实图片。后台2068张正常齿轮图全量建库任务独立于页面算法选择，继续按下文的数据划分执行。参数检测与视觉外观的人工综合复核仍按实物记录，引用的是本次选择的单模型检测证据。

### 公开正常齿轮数据

已核实 [MANTA 官方项目](https://grainnet.github.io/MANTA)提供带正常标签的独立齿轮类别，作者的 [Figshare 存储](https://figshare.com/articles/dataset/27937518)可匿名下载单独的 `gear.tar.gz`（2,692,003,445字节）。[作者补充材料](https://grainnet.github.io/static/pdfs/Manta-supp.pdf)列出2068张正常训练图、162张正常测试图、81张异常测试图。每张为同一物体的五视角拼图，划分和评估应保留整个原图身份，不能将不同视角分配到训练和测试两侧。

来源核验记录保存在 `.runtime/quality-research/manta-gear-source.json`，数据准备目录为 `.runtime/datasets/manta-gear/`；下载完成、完整摘要校验和实际文件计数以该目录的准备状态及清单为准。官网声明CC BY-NC-SA 4.0、非商业用途，Figshare元数据标CC BY 4.0，两处不一致；本项目仅用于非商业研究验证，商业产线使用前须澄清授权。

MANTA与当前塑料齿轮YOLO11训练数据的产品及拍摄域不同，必须单独建库、校准和评估。不能把该正常库当作现有塑料齿轮的合格标准，也不能将跨域组合的结果报告为产线准确率。

可复现入口（已有下载任务运行时不要重复启动下载）：

```powershell
.\.venv\Scripts\python.exe scripts/prepare_manta_dataset.py
.\.venv\Scripts\python.exe scripts/evaluate_manta_patchcore.py --wait-for-data
```

准备脚本支持断点续传，校验作者MD5、解压路径、文件数量及文件SHA256。评估脚本只有在准备状态为`complete`且清单校验通过后才运行；缺少或损坏数据时停止，不生成指标。全量方案使用官方`train/good`的2068张正常图全部建库。官方`test/good`中的12张正常图及`test/fragmentation`中的12张缺陷图固定用于阈值校准，其余150张正常图和69张缺陷图用于独立测试。每个原图只进入一个集合，缺陷图不会进入正常记忆库。这是完整正常训练集加自定义校准/测试划分，不能称为官方MANTA基准成绩。阈值在独立测试前锁定，五视角整图不跨集合，输出逐图分数、误报/漏检名单和三种阈值策略的测试结果。

全量建库走离线入口，逐张读取并提取特征，每张图先选最多32个局部核心集特征，再从不超过66176个候选中选最多1024个最终记忆特征。所有2068张图都参与特征提取，但最终记忆库是压缩后的特征集合，不是2068张原图的副本。该分层近似采样的配置及候选数量写入模型元数据，不等同于对全部原始特征做一次全局采样。在线上传入口的24张限制继续用于控制请求体和服务资源，不限制离线全量任务。

评估状态保存在 `.runtime/quality-research/manta-gear-patchcore-status.json`，全量结果与独立记忆库保存在 `.runtime/quality-research/manta-gear-patchcore-full-v1/`。`metrics_available: false` 表示尚无可报告指标；该流程不会修改在线模型清单或生产统计。

### 真实齿轮评估与限制

`prepare_gear_subset.py` 按固定种子20261025选取真实图片，核对上游ZIP成员CRC及标注尺寸。`train_gear_yolo.py` 将原始矩形框转换为YOLO标签，图片按比例缩至最长边640，标注同步缩放；同数字编号的端面/齿面保守归入同组，再划分train/calibration/test。源数据未提供物理工件编号，因此不能保证不同编号是不同实物，不能将结果当作独立产线验收。

训练只读取train，calibration用于选轮和阈值；训练YAML不含test路径。`finalize_gear_yolo.py` 在校准集选择空间F1，冻结权重、数据摘要及全部参数后评估test。报告逐图框、位置命中/漏检/多余框，以及同时满足位置和类别的统计。`normal_samples_available=false` 时，正常图误报率为null，不能写成零误报。

模型元数据的建议置信度、NMS IoU和输入尺寸用于页面及服务，实际值随检测记录保存。训练样本有限、类别长尾明显，这是一版研究基线；真实产品验收需补充正常图、更多罕见缺陷和明确的工件/批次标识。

## 接口与边界

尺寸模拟检测要求比对仪处于运行状态。若显示“模拟比对仪未运行”，页面会显示当次设备/监控/控制状态、停机原因及工单入口；需要完成实际核查、维修和已有复机流程后再重试。没有关联工单时先核查停机原因。视觉图片检测独立于该工位，可在设备停机时使用；它不会修改设备状态或提交维修完成回执。

所有视觉接口均沿用工作台个人登录会话；写请求还使用现有服务写入认证。返回值不包含服务器模型路径。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/quality/vision/dataset/samples/{sample_id}` | 读取清单内的真实齿轮测试图片，需登录 |
| GET | `/api/quality/vision/capabilities` | 算法依赖、权重就绪状态和当前账号的模型 |
| POST | `/api/quality/vision/patchcore/train` | 正常图片建库，返回模型元数据 |
| POST | `/api/quality/vision/patchcore/calibrate` | 用独立正常/缺陷图片选择阈值，保存三种策略及校准集指标 |
| POST | `/api/quality/vision/detect` | 执行推理，返回标注、热图、区域与流程 |
| POST | `/api/quality/vision/sequential/fuse` | 已停用，认证后返回410；请使用单模型检测接口 |
| GET | `/api/quality/vision/inspections/{inspection_id}` | 按账号读取已保存的视觉检测记录 |
| POST | `/api/quality/vision/production/verify` | 已停用，认证后返回410；不再新增双模型合成验证 |
| GET | `/api/quality/vision/production/jobs/{job_id}/latest` | 读取当前账号对该产出的最近一次验证，含已保存图片与部分失败证据 |

图片使用 PNG / JPEG / WebP 的 base64 或 data URL，单张最多 4 MiB、最多 1600 万像素。训练或校准单批最多 24 张，请求 JSON 总量最多 40 MiB（base64 比原文件大约增加三分之一）。CPU 部署建议使用单 worker：单进程一次只执行一个建库/校准/推理任务，忙时返回可重试提示；锁不跨进程。训练逐张解码、提取特征并关闭原图；检测仍以原图尺寸生成热图，1600 万像素图片可能需要数百 MiB 临时内存。不会自动重试 POST；如果请求超时，应核对状态后再操作。

代码验证覆盖特征距离/coreset、图片解码、认证和存储隔离、模型缺失、响应契约以及浏览器的建库/检测/切换输入流程。产品上的实际检测准确率仍需使用目标产品的数据集验证。

算法参考：[Anomalib PatchCore 文档](https://anomalib.readthedocs.io/en/stable/markdown/guides/reference/models/image/patchcore.html)、[Ultralytics 推理结果接口](https://docs.ultralytics.com/modes/predict/)。

## 齿轮参数和外观检测

### 综合判定与合格率

质检页新增“综合判定与合格率”，按账号隔离保存实物登记和人工复核。先登记统计范围、批次、唯一实物编号和设计版本，再分别复核参数与外观。两项均确认通过才合格；任一项确认不通过即不合格；其余待复检。合格率为合格件数除以合格与不合格件数之和；同时展示待复检数量和整件判定覆盖率。无可判定件时为null，页面显示“—”，不会显示100%。

“流程验证”和“生产复核”分别统计，默认流程验证。现有模拟参数样本不自动成为生产测量；生产复核需由操作人核对实际测量报告和完整外观检查，填写依据、说明，并确认已完成该项目全部必检内容后才可保存通过。本阶段记录的是人工复核结论，尚未接入量具报告自动校验或自动综合放行。

在综合面板选择实物后运行视觉检测，服务端保存该实物、批次、设计版本的不可变关联。可在复核面板“引用本次视觉检测”保存模型和图像摘要，但模型的clear/defect不会自动转换成人工通过/不通过。公开测试图片和旧模拟流程不能关联生产实物；与其他实物关联的视觉证据不能用于该件复核。单纯上传图片而未选择实物仍可单独检测，不参与综合统计。

同一账号、范围、批次和实物重复登记返回原记录；生产实物唯一编号跨批次重复被拒绝。设计版本不能静默替换。复检以最新项目结论更新同一件统计，保留历史。写入包含期望版本和幂等请求号，过期版本拒绝覆盖，响应丢失可按原请求核对/重试。当前单进程文件锁与原子写入，不支持多worker并发写入；生产部署需要共享事务存储。

同一实物新增视觉检测时，旧外观通过结论退回待复检，需结合新证据再次确认；旧外观不通过结论保留，只有人工复核可修改。检测过程中旧版本的复核请求也会被拒绝，避免新证据被旧通过结论覆盖。

新增接口（均位于已有视觉认证及代理边界内）：

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | /api/quality/vision/combined/parts?scope=validation&batch_id= | 读取登记、复核明细及服务端综合统计 |
| POST | /api/quality/vision/combined/parts | 登记实物，初始待复检 |
| POST | /api/quality/vision/combined/parts/{quality_part_id}/reviews | 保存参数/外观人工复核及可选视觉证据 |

检测请求可附加quality_part_id和image_source（upload/public_gear_reference），实物身份由服务端登记记录解析。综合记录存放在QUALITY_VISION_ROOT下的账号摘要目录内combined-quality.json；不会创建或放行正式QMS单据。scripts/verify_combined_quality.py使用隔离账号和真实YOLO权重验证绑定、复核、统计、保存回读及重复请求，不写入当前用户的生产统计。

CAD已经支持渐开线直齿轮的齿数、模数、压力角、齿宽和孔径等建模参数。模拟参数比对比较保存的设计和模拟产出；这不等于从相机图像实测齿形、尺寸或精度，后者需要相机标定、测量算法和量具核验。

外观检测独立于参数比对。在质检的视觉缺陷检测中，选择齿轮测试图片并加载，或上传实际图片，然后运行YOLO11。示例只开放管理员清单中的test图片，按登录会话读取，检查文件摘要及目录边界；缺陷标注不传给推理模型。结果保存和回读仍按账号隔离，不能替代正式质量放行。

旧生产合成纹理验证已停用，页面仅保留历史结果读取。`scripts/verify_gear_vision.py` 通过隔离账号、真实模型和现有接口验证图片加载、推理、保存回读及账号隔离，不连接真实相机，也不冒充当前生产零件实拍。
