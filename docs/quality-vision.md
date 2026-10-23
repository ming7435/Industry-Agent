# PatchCore 与 YOLO 视觉缺陷检测

## 质检工作区布局

质检页分为“视觉检测”“尺寸比对”“综合复核”三个工作区，默认进入视觉检测。桌面上左侧选择模型、上传图片并运行，右侧查看原图、定位结果和热力图；窄屏自动改为上下排列。检测参数、模型信息、训练校准说明和自动收图详情默认收起。

工作区切换保留当前图片、推理结果及复核实物，切换工作区不会触发检测；最近使用的工作区保存在当前浏览器标签页中。历史流程验证仅在展开时加载。`quality_panel=vision|dimensions|review` 可直接定位工作区；原 `design_run_id` 和 `production_job_id` 链接分别定位尺寸比对和历史复核。

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

当前 v3 外观模型采用公开塑料齿轮数据的1165张源图，排除6张重复冲突图并隔离原测试组74张后，使用1085张做分组训练、校准与全新测试，保留16类原始缺陷标签。v1/v2 使用的是固定240张子集（160张端面、80张齿面，651个矩形框）。来源：[作者仓库](https://github.com/fangandyim/Plastic-Gear-Surface-Defect-Dataset)、[Kaggle数据页](https://www.kaggle.com/datasets/yimingfang1994/plastic-gear-surface-defect-dataset)。平台及LICENSE写Apache2，但作者README限定非商业学术研究；本地仅作研究验证，不推定商业授权。

旧金属纹理合成模型和钢材YOLOv8模型已从运行清单移除，不会出现在页面或参与推理。保留通用ResNet18骨干，用于用户另行上传真实良品建立PatchCore记忆库。当前齿轮子集全部带缺陷，没有已确认正常齿轮，因此不能建立正常记忆库，也不能统计正常图误报率。

部署配置：

```dotenv
QUALITY_YOLO_WEIGHTS=L:/industry_agent/.runtime/quality-models/yolo11-gear-v3/best.pt
QUALITY_YOLO_METADATA=L:/industry_agent/.runtime/quality-models/yolo11-gear-v3/model.json
QUALITY_PATCHCORE_BACKBONE_WEIGHTS=L:/industry_agent/.runtime/quality-models/backbones/resnet18-f37072fd.pth
QUALITY_PATCHCORE_PRESET_DIR=
QUALITY_PATCHCORE_GEAR_PRESET_DIR=L:/industry_agent/.runtime/quality-models/patchcore-gear-v1
QUALITY_VISION_AUTO_INBOX_DIR=L:/industry_agent/.runtime/quality-auto-inbox
QUALITY_VISION_DATA_MODE=gear
QUALITY_VISION_DATASET_MANIFEST=L:/industry_agent/output/gear-full-dataset/prepared/manifest.json
```

服务校验权重摘要，页面展示实际模型名称和原始覆盖类别；模型尚在训练或不可用时，检测按钮不会启用。初始子集证据保存在 `output/gear-dataset/`，扩充模型的划分和评估证据保存在 `output/gear-full-dataset/` 与 `output/gear-yolo-full-v1/`。

### 本地目录自动检测（尚未接入实体相机）

车间三维视图已在机床出料滚筒上方展示工业相机、立柱支架和环形补光灯，镜头对准输送线中心。当前它是工位示意模型，不会从浏览器场景生成检测图片；实际取图仍需上传图片，或由采集程序写入下述本地目录。

配置 `QUALITY_VISION_AUTO_INBOX_DIR` 并重启 Agent Service 后，服务持续监听其 `incoming` 子目录。采集程序把完整的 PNG/JPEG/WebP 图片放入该目录，服务确认文件大小与修改时间稳定后，自动用现成的 `patchcore-gear` 记忆库检测；页面每 2.5 秒读取状态和最新定位图、热力图。无需在页面逐张上传或点击“运行缺陷检测”。采集程序应先写 `.tmp` 文件，再原子改名为图片扩展名；单张上限 4 MiB。

处理成功的原图移至同级 `processed`，无效图片移至 `failed`，暂时性模型错误保留原图待重试。自动结果标记 `image_source=local_inbox`，保存在独立的本地自动检测账号下，不关联生产实物、不进入综合合格率。当前只验证公开 MANTA 同来源图片；未来接入工业相机时，应由采集程序写入目录，并使用本产线良品重建与校准模型后，再设计正式生产判定和吞吐保障。

### 直接使用已有齿轮记忆库

质检页面固定使用已部署的 `patchcore-gear`，自动加载 2068 张正常样本构建的记忆库及其保存阈值。无需选择算法、创建记忆库或上传正常训练样本。用户上传一张待检图片后点击“运行缺陷检测”，即可完成 PatchCore 判断和异常时的 YOLO 定位。

界面仅保留已保存的模型/校准记录和折叠的检测参数。记忆库加载失败时提示刷新模型状态或联系维护人员；不会切换到演示库、个人库，也不会要求用户自行建立新库。后端建库与校准接口保留供既有维护流程使用。

算法链路：RGB 预处理 → 224×224 或 448×448 输入 → 冻结的 ResNet18 `layer2` / `layer3` 特征 → 局部平均池化和多尺度对齐 → 特征合并 → greedy k-center coreset 正常记忆库 → 最近邻欧氏距离 → 上采样和平滑热图 → 阈值分割与异常区域框。详细逻辑、指标口径、合成压力测试和真实数据入口见 [PatchCore 评估说明](patchcore-evaluation.md)。

这是面向本地工作台的轻量 PatchCore 实现。它采用 ResNet18 和有界记忆库，并以像素异常热图的最大值作为图像分数；不声称复现论文的 WideResNet50 和加权图像评分基准。材质、光照、相机或产品变化后应重新建库、验证阈值。

## YOLO

### 已接入的工件分割权重

质检页面已移除独立工件分割入口，仅保留 `yolo-default` 缺陷模型用于串联质检。此前导入的 `part-seg-v1` 权重和分割接口仍保存在本地，类别为端面（`endface`）和齿面（`toothface`）；它们不参与当前缺陷判定。

本地默认权重路径为 `.runtime/quality-models/part-seg-v1/best.pt`，可用 `QUALITY_PART_SEG_WEIGHTS` 指向其他本地文件。接收的图片为 PNG/JPEG/WebP，单张不超过 4 MiB；页面需登录。接口为 `POST /api/quality/vision/part-segmentation/predict`，请求 JSON `{ "image": "data:image/png;base64,...", "confidence": 0.25 }`，返回 `purpose=part_segmentation`、`detections` 和叠加轮廓的 `annotated_image`。`mask_area` 按原图像素计算，因此与原压缩包服务在模型输入分辨率上统计的数值不同。

用户提供的压缩包包含模型和单张联调图片。已核验权重任务类型为 `segment`、类别为 `endface/toothface`，自带图片在本机 CPU 推理检出 1 个端面。压缩包所述 24 张独立测试图的 mAP 指标尚未在本项目复验；生产相机图像仍需单独验证。三维相机模型本身不产生图像，实际相机采集需要通过上传或采集程序供图。

### 缺陷目标检测

1. 用实际缺陷数据进行边界框标注，划分训练集、验证集和测试集。
2. 按 [Ultralytics 目标检测训练说明](https://docs.ultralytics.com/tasks/detect/) 离线训练，使用验证/测试集确认漏检率、误检率和类别覆盖范围。
3. 将训练产物配置为 `QUALITY_YOLO_WEIGHTS`。本次功能提供在线推理；数据标注和 YOLO 训练在离线环境完成。
4. 页面自动加载唯一的 `yolo-default`，在 PatchCore 检出异常后执行定位。检测参数默认使用模型建议值。

算法链路：缺陷图片与框标注 → 离线训练及验证 → 加载缺陷权重 → 图片预处理 → YOLO 推理 → 置信度筛选 / NMS → 恢复原图坐标 → 标注和检测记录。

## 默认串联质检：PatchCore 判断 → YOLO 定位

页面固定为“PatchCore → YOLO”串联质检。一次上传、一次运行，由服务端在同一推理锁内顺序处理同一图片：

1. PatchCore 与正常记忆库比较，按异常距离阈值判断本图是否异常。
2. 未检出异常：记录 `clear`，YOLO 明确标为 `skipped`，不执行定位。
3. 检出异常：运行已部署的 YOLO 缺陷模型，识别位置、类别和置信度。
4. YOLO 检出缺陷：`known_defect`；YOLO 未检出已知缺陷：`unknown_anomaly`，仍为异常待复核；YOLO 失败：`localization_failed`，保留 PatchCore 证据和失败原因。
5. PatchCore 失败时整次请求报错，不执行 YOLO，也不生成正常结论。

`POST /api/quality/vision/pipeline/detect` 接收 `patchcore_model_id`、`image`、`filename`、`threshold`、`confidence`、`iou`，以及可选的 `part_id`、`quality_part_id`、`image_source`。禁止客户端提交结论。结果算法标记为 `patchcore_yolo_pipeline`，包含 `patchcore`、可空的 `yolo`、`yolo_state`、`classification`、阶段记录编号和图片摘要。顶层分数/阈值来自 PatchCore；缺陷类别和位置以完成定位的 YOLO 结果展示，未定位时明确标注 PatchCore 异常区域。

本地自动收图采用相同串联流程。YOLO 失败时图片仍存入 processed，保留异常记录，并在自动检测状态中报告定位错误，不静默当作正常。

界面仅保留固定串联流程，已移除算法切换、单独调试和工件分割选项。旧的 `sequential/fuse` 和 `production/verify` 写接口仍停用；历史记录保持账号隔离读取。综合复核引用整个串联记录，保存两阶段证据及 YOLO 跳过/失败状态；重检会使旧的人工通过状态回到待复核，不自动计为整件合格。

串联门控依赖 PatchCore 的召回率：第一步漏检时不会进入 YOLO。正常记忆库、阈值和 YOLO 缺陷模型均需匹配同一产品和拍摄条件。当前 MANTA 正常库与塑料齿轮 YOLO 数据域不同，已完成的是运行流程验证，不能据此声称产线准确率。

验证入口：`scripts/verify_vision_pipeline.py`。它使用实际本机权重，在隔离账号和临时存储中检验正常图跳过、异常图继续 YOLO、保存回读及跨账号隔离；输出位于 `output/quality-pipeline/real-model-verification.json`。

### 齿轮正常记忆库数据

已核实 [MANTA 官方项目](https://grainnet.github.io/MANTA)提供带正常标签的独立齿轮类别，作者的 [Figshare 存储](https://figshare.com/articles/dataset/27937518)可匿名下载单独的 `gear.tar.gz`（2,692,003,445字节）。[作者补充材料](https://grainnet.github.io/static/pdfs/Manta-supp.pdf)列出2068张正常训练图、162张正常测试图、81张异常测试图。每张为同一物体的五视角拼图，划分和评估应保留整个原图身份，不能将不同视角分配到训练和测试两侧。

来源核验记录保存在 `.runtime/quality-research/manta-gear-source.json`，数据准备目录为 `.runtime/datasets/manta-gear/`；下载完成、完整摘要校验和实际文件计数以该目录的准备状态及清单为准。官网声明CC BY-NC-SA 4.0、非商业用途，Figshare元数据标CC BY 4.0，两处不一致；本项目仅用于非商业研究验证，商业产线使用前须澄清授权。

MANTA与当前塑料齿轮YOLO11训练数据的产品及拍摄域不同，必须单独建库、校准和评估。不能把该正常库当作现有塑料齿轮的合格标准，也不能将跨域组合的结果报告为产线准确率。

可复现入口（已有下载任务运行时不要重复启动下载）：

```powershell
.\.venv\Scripts\python.exe scripts/prepare_manta_dataset.py
.\.venv\Scripts\python.exe scripts/evaluate_manta_patchcore.py --wait-for-data
```

准备脚本支持断点续传，校验作者MD5、解压路径、文件数量及文件SHA256。评估脚本只有在准备状态为`complete`且清单校验通过后才运行；缺少或损坏数据时停止，不生成指标。全量方案使用官方`train/good`的2068张正常图全部建库。官方`test/good`中的12张正常图，以及`test/fragmentation`（23张）、`test/multi_anomalies`（24张）、`test/scratch`（11张）和`test/stain`（23张）共81张缺陷图中固定选出的12张，用于阈值校准；其余150张正常图和69张缺陷图用于独立测试。每个原图只进入一个集合，缺陷图不会进入正常记忆库。这是完整正常训练集加自定义校准/测试划分，不能称为官方MANTA基准成绩。阈值在独立测试前锁定，五视角整图不跨集合，输出逐图分数、按实际缺陷场景统计的误报/漏检名单和三种阈值策略的测试结果。

全量建库走离线入口，逐张读取并提取特征，每张图先选最多32个局部核心集特征，再从不超过66176个候选中选最多1024个最终记忆特征。所有2068张图都参与特征提取，但最终记忆库是压缩后的特征集合，不是2068张原图的副本。该分层近似采样的配置及候选数量写入模型元数据，不等同于对全部原始特征做一次全局采样。在线上传入口的24张限制继续用于控制请求体和服务资源，不限制离线全量任务。

评估状态保存在 `.runtime/quality-research/manta-gear-patchcore-status.json`，全量结果与独立记忆库保存在 `.runtime/quality-research/manta-gear-patchcore-full-v1/`。`metrics_available: false` 表示尚无可报告指标。离线评估本身不会修改在线模型清单或生产统计。

2026-10-21 的离线结果：2068张正常图全部完成特征提取，产生66176个候选特征，经分层核心集采样得到1024个记忆特征；记忆库重新加载和留出正常图热图检查通过。12张正常图、12张缺陷图仅用于阈值校准，其余150张正常图、69张缺陷图用于独立测试。召回优先阈值1.7814下漏检0/69、误报115/150（76.7%）；平衡阈值1.8823下漏检12/69（17.4%）、误报26/150（17.3%）。平衡阈值的漏检分别为破碎2/19、多缺陷4/21、划痕1/9、污渍5/20。结果见 `summary.json` 和逐图 `test_scores.json`。这些数字属于MANTA公开数据的自定义划分，不是官方基准，也不是当前生产线的合格率。若离线测试被中断，可执行 `evaluate_manta_patchcore.py --resume`，它会重新核对源文件、样本划分、记忆库和已保存分数后继续，不重建正常库。

执行 `scripts/provision_manta_patchcore.py` 会核对全量建库、记忆库摘要及阈值校准结果，生成只读的 `patchcore-gear` 齿轮正常记忆库。当前本地服务通过 `QUALITY_PATCHCORE_GEAR_PRESET_DIR` 将它展示在质检页面，并默认采用平衡阈值1.8823。预置的实际推理已在正常/缺陷测试图各一张上复核，分数与离线逐图记录一致。该库可直接用于检测和综合复核；若要用于本产线产品，建议采集同产品、同相机与光照的已确认良品重新建库，并用独立缺陷图校准。

### 真实齿轮评估与限制

`prepare_gear_subset.py` 按固定种子20261025选取真实图片，核对上游ZIP成员CRC及标注尺寸。`train_gear_yolo.py` 将原始矩形框转换为YOLO标签，图片按比例缩至最长边640，标注同步缩放；同数字编号的端面/齿面保守归入同组，再划分train/calibration/test。源数据未提供物理工件编号，因此不能保证不同编号是不同实物，不能将结果当作独立产线验收。

训练只读取train，calibration用于选轮和阈值；训练YAML不含test路径。`finalize_gear_yolo.py` 在校准集选择空间F1，冻结权重、数据摘要及全部参数后评估test。报告逐图框、位置命中/漏检/多余框，以及同时满足位置和类别的统计。`normal_samples_available=false` 时，正常图误报率为null，不能写成零误报。

模型元数据的建议置信度、NMS IoU和输入尺寸用于页面及服务，实际值随检测记录保存。当前 v3 在全新118张测试图的318个标注缺陷中正确定位155个，其中类别和位置均正确136个，另有86个多余框；同图 v2 分别为100、95、58。v3 对 `burn` 仅命中1/19、`hair` 仅命中1/18，稀有类别仍明显漏检。详细选择过程见 `output/gear-yolo-full-v1/report.md`；原子集 v2 结果见 `output/gear-yolo-refinement-v1/report.md`。这仍是研究模型；真实产品验收需补充正常图、更多罕见缺陷和明确的工件/批次标识。

扩充数据实验使用同一公开来源的1165张图，排除6张内容重复且标注冲突的图片，并隔离原测试组的74张图；其余1085张按数字编号分组为训练779张、校准188张、全新测试118张。三个集合的组和像素摘要均不重叠，新测试组没有出现在原240张子集中。`output/gear-full-dataset/prepared/manifest.json` 保存逐图来源与划分，`output/gear-yolo-full-v1/` 保存训练参数、冻结阈值和评估。校准集的类别与位置联合F1由 v2 的0.413升至 v3 的0.520，空间定位F1由0.440升至0.556；全新测试集的两项F1分别由0.399升至0.487、0.420升至0.555。提升只针对公开数据，不是产线准确率或正常齿轮误报率。

### 合成训练图扩充实验

经用户同意采用合成图片后，`scripts/expand_gear_yolo_synthetic.py` 从现有 **779 张真实训练图**各生成3张角度、位置、曝光和传感器噪声变化图，矩形标注随几何变换同步更新。新增 **2337 张合成训练图**，训练目录共3116张；新增真实拍摄图片数为0，物理工件独立性不能由这些合成图推出。原188张校准图只做只读链接，118张测试图不出现在训练配置中。输出保存在 `output/gear-yolo-synthetic-v1/`，不覆盖 v3 数据和权重。

`scripts/verify_gear_yolo_synthetic.py` 逐图核对摘要、类别和标注范围，检查合成图像素唯一性、源图仅来自训练集、校准图与原版一致，以及测试图未暴露。`scripts/train_gear_yolo_synthetic.py` 使用 v3 权重和扩充训练集单独微调；候选模型只在原真实校准图和冻结测试图上与 v3 比较。候选模型未通过相同图片上的类别定位 F1 和空间 F1 门槛前，不替换当前部署的 v3。

2026-10-22已完成2轮微调及真实校准图比较：类别与位置F1从v3的0.519582降至0.461707，位置F1从0.556136降至0.536105，多余位置框从119增至235。候选模型未通过替换门槛，当前继续使用v3；新增2337张合成图和训练权重均保存在项目中，候选模型未继续使用测试集。标注几何核对通过，另有50项API测试和25项浏览器测试通过。完整报告见 `output/gear-yolo-synthetic-v1/report.md`。

### YOLO 局部细节推理优化（2026-10-22）

当前单一 `yolo-default` 使用 `yolo11-gear-recall-v1` 部署配置，权重仍为 v3，未新增训练。对原图和四个重叠局部区域分别推理，过滤内部裁剪边缘碎框，将局部坐标映射回原图后按类别合并重复框。整图置信度0.35，局部最低置信度0.40，裁剪边长比例0.60，NMS IoU0.45，每个输入640。配置只由本地模型元数据提供，随每次检测记录保存。用户手动提高置信度时，局部检测也服从该下限。自动收图入口读取同一部署的建议参数。

只使用188张真实校准图选择参数，随后冻结配置，再对既有118张真实测试图回归验证；测试图未参与本次调参，也未参与权重训练，但此前已经使用，不能称为全新独立测试。匹配要求IoU≥0.5，并分别统计仅位置匹配、类别与位置均匹配。318处标注中，类别与位置均匹配从136增至151，漏检从182降至167，未匹配预测框从105增至122；仅位置匹配从155增至167，漏检从163降至151，多余位置框从86增至106。类别与位置F1从0.4866升至0.5110，位置F1从0.5546升至0.5651。校准时多余框的20%增幅限制仅用于选参数；测试集的位置多余框增加23.3%，并未满足同样的20%限制，不声称误检受控或通过产线验收。

在此前固定抽样的12张真实图上，实际认证接口完整执行PatchCore→YOLO：类别与位置均正确13→15处，漏检15→13处，多余框5→6个。PatchCore分数与此前逐图完全一致，YOLO输出与冻结离线参数结果一致。污渍图 `endface554` 仍为异常未定位，不会因YOLO没框而变为正常。另以MANTA正常/异常图各一张验证正常时跳过YOLO、异常时运行YOLO；跨域结果只证明流程，不能证明定位准确率。

证据保存在 `output/gear-yolo-recall-v1/`，实际API输出保存在 `output/quality-real-images-recall-v1/`。可复现入口为 `scripts/optimize_yolo_recall.py`、`scripts/verify_pipeline_real_images.py`；输出使用独立目录避免覆盖此前结果。局部推理增加CPU开销，仍有稀有类别漏检；本批没有正常塑料齿轮图，不能计算正常件误报率。页面继续使用一个YOLO及已有PatchCore记忆库。

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

## 2026-10-22 污渍与细丝专项优化

当前仍只有一个 `yolo-default`，使用 `yolo11-gear-fine-defects-v2` 权重。沿用既有 PatchCore 齿轮记忆库与阈值，先判断异常，再调用 YOLO 定位。没有新增建库步骤。

专项训练使用训练集中的真实图片与局部裁剪。最后一组为 437 张原始训练照片派生的 883 个输入，补入暗斑、孔洞、溢料与边缘纹理等易混淆样本；这些裁剪不计为新采集的独立照片。一个 YOLO 共用原有骨干、特征融合和定位头，分类层用标准卷积保留原类别通道，并引入污渍/细丝微调通道。推理对整图、四个局部区域和九个细节区域使用相同权重，坐标还原到原图后按类去重；低置信度细丝框完全落在更高置信度细丝框中时去除重复。

固定参数下，118 张真实齿轮回归图共 318 个标注实例，按“类别一致且 IoU ≥ 0.5”匹配：

| 指标 | 原版本 | 当前版本 |
| --- | ---: | ---: |
| 污渍正确检出 / 标注 | 0 / 17 | 1 / 17 |
| 污渍误框 | 0 | 0 |
| 细丝正确检出 / 标注 | 1 / 18 | 2 / 18 |
| 细丝误框 | 3 | 2 |
| 所有类别正确检出 / 标注 | 151 / 318 | 151 / 318 |
| 所有类别漏检 | 167 | 167 |
| 所有类别误框（类别或位置不匹配） | 122 | 85 |

污渍、细丝只各增加一个正确检出，整体召回未提高，仍有大量漏检。部分其他类别的检出有所下降，完整逐类明细见报告。这批没有正常塑料齿轮图片，不能据此计算正常工件误报率。该测试集在优化过程中被复用，重复框修复也参考了回归输出，因此仅作为迭代回归证据，不是新的独立产线验收。

使用最终权重对全部 20 张含污渍或细丝的测试图运行实际认证接口，PatchCore → YOLO 顺序、保存回读、原图坐标与离线预测一致；正常控制图跳过 YOLO，异常未定位时仍保留未知异常。152 项代码测试通过。CPU 推理由原五个视图增加至十四个视图，计算量有所增加。

复核入口：`output/gear-yolo-fine-defects-v1/report.md`、`output/quality-fine-defects-real-v3/index.html`。训练、校准选择、逐图预测、前三次回归结果及部署前后权重摘要均保留在项目中；原模型目录保留用于回退。

### 第二轮专项训练：候选未替换现用模型

后续完成两组各 12 轮的几何分类训练，分别采用批内归一化和训练集统计归一化。883 个输入仍来自 437 张 train 图片，全部缓存与来源摘要已核对。40 种候选/裁剪/形状组合在目标误框约束下均未通过两类检出门槛；跨裁剪一致性、旋转、局部对比度及原图分辨率对照也未得到可替换方案。研究代码只用于离线实验。

固定一份校准中细丝有所改善的候选，完成一次 118 张真实图片诊断回归：污渍正确检出从 1/17 退到 0/17，细丝从 2/18 增到 5/18，但细丝误框从 2 个增到 11 个；全类别正确定位 151→153，误框 85→94，F1 0.5451→0.5416。校准失败和回归误框增加均阻止替换，当前仍使用上节 `yolo11-gear-fine-defects-v2`。

20 张目标缺陷图另行通过隔离的实际 PatchCore → YOLO 接口运行，逐框结果与离线候选一致。158 项测试通过，页面和五个后台服务健康检查成功。`.env`、现用模型及 PatchCore 记忆库摘要保持不变。

本轮记录：`output/gear-yolo-fine-defects-v2/report.md`；对比图片：`output/gear-yolo-fine-defects-v2/index.html`；20 张候选实际输出：`output/quality-fine-defects-research-v2/index.html`。这些是未上线候选的诊断结果，不能当成现用模型或独立产线验收成绩。

## 2026-10-23 原图补样与纹理、边缘负样本训练

训练输入由883扩充至2395个：779张整图、478张原图目标裁剪、480张几何与光照增强、160张易混淆缺陷局部图、498张纹理/边缘/夹具负样本。污渍标注485处、细丝925处，包含同一源缺陷的重复呈现；来源为779张既有训练照片，新增独立实拍照片为0。498张负样本中155张会触发现用模型的目标低分候选框。它们是未标注缺陷的局部区域，不是独立认证的正常工件。

全部2583张训练及校准图片通过摘要、像素、裁剪与变换标注、YOLO标签核对。188张真实校准图、118张真实回归图未参与训练。完成3轮检测头训练及4轮修正训练；共享骨干冻结，分类与定位头使用标准YOLO检测损失。在训练集167处目标标注抽查中，发现37处旧模型更偏向其他类别，因而取消了目标标注区域及一格邻域内的旧分类约束，其他区域继续约束。权重仍为单个标准YOLO模型。

完整校准的最佳候选总正确定位212→227、误框87→72；细丝3/10→4/10，但污渍2/10→1/10。因污渍门槛失败，仅冻结候选做诊断性回归，没有降低替换门槛。相同118张真实图片、318处标注、类别一致且IoU≥0.5：

| 指标 | 现用模型 | 补样训练候选（未上线） |
| --- | ---: | ---: |
| 污渍正确检出 / 标注 | 1 / 17 | 0 / 17 |
| 污渍漏检 / 误框 | 16 / 0 | 17 / 0 |
| 细丝正确检出 / 标注 | 2 / 18 | 2 / 18 |
| 细丝漏检 / 误框 | 16 / 2 | 16 / 3 |
| 全类别正确定位 / 标注 | 151 / 318 | 152 / 318 |
| 全类别误框 | 85 | 49 |
| 类别与位置F1 | 0.5451 | 0.5857 |

整体误框减少36个，但重点缺陷漏检未改善，因此现用`yolo11-gear-fine-defects-v2`保持不变。没有新增模型入口，也未更换PatchCore记忆库。20张目标缺陷真实图通过隔离的实际PatchCore→YOLO接口，逐框与冻结的离线结果一致，3张异常但没有定位框的图片仍保留未知异常。168项程序回归通过，六个本地服务健康检查成功，环境、现用权重与元数据、PatchCore文件摘要均未改变。

这些结果来自复用的公开真实回归图片，并非新采集的独立产线验收；没有正常齿轮测试集，不能据此计算正常工件误报率。报告：`output/gear-yolo-fine-defects-v3/report.md`；对比页面：`output/gear-yolo-fine-defects-v3/index.html`；20张实际接口图片：`output/quality-fine-defects-native-v3/index.html`。
