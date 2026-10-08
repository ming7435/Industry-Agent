# 图内尺寸拖动回归夹具

`model.stl` 是本机 FreeCAD 真实生成的 90 mm 法兰轴套，不是网页模拟网格。

- 源运行：`FC-d5fe68329a81634e1afb68c163fa4afea7be9d9a37982c23c28554ccb3883e75`。
- SHA-256：`b33e44beb0e3c4e339f2a57d287148e2e220832ed363b3169fdfaa4cb590c37f`。
- 外形：`90 × 90 × 42 mm`；法兰厚 12 mm，凸台直径 32 mm、高 30 mm，中心通孔 16 mm，四个安装孔直径 6 mm。
- 仅用于浏览器验证真实 STL 当前视角下的标注命中和拖动行为，不启动 FreeCAD、模型 API 或设备。

原始回读校验、体积及产物哈希在 `.runtime/verification/cad-direct-edit-live/summary.json`。夹具复制到测试目录后，回归不依赖运行记录或本机数据服务。
