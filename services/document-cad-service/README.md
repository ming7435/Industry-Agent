# document-cad-service

CAD Agent 通过 MCP 风格接口访问本服务，不直接解析原始 DWG/DXF。

启动：

```powershell
L:\anaconda\python.exe -m uvicorn app.main:app --app-dir services\document-cad-service --host 127.0.0.1 --port 8010
```

Agent Service 配置 `MCP_CAD_URL=http://127.0.0.1:8010` 后，CAD 工具会走远程服务；未配置时保留本地兼容回退。
