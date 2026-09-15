# 工业设备实时监测与智能诊断

当前版本实现了一条可运行的最小闭环：

```text
模拟工厂 API -> 实时 Monitor -> 六类规则 -> AbnormalEvent
-> Diagnosis Agent -> 报警定义 / 设备历史工具 -> 诊断结果
```

监测器接入模拟工厂 `http://127.0.0.1:8000`，默认每 0.5 秒读取一次设备快照。Diagnosis Agent 按事件变化触发：首次确认异常、等级升级、严重故障、新独立故障或恢复后再次发生；同一事件同等级持续期间不会重复调用。

## 当前范围

- 实时采集整机指标：温度、振动、主轴、液压、润滑、冷却、气压、刀塔等
- 六类规则：Critical、Threshold、Duration、Count、Trend、MultiMetric
- 统一异常事件 `AbnormalEvent`
- Diagnosis Agent 与 DeepSeek Tool Calling
- 工具：`get_alarm_definition`、`get_device_history`
- 中文实时监测页面与诊断任务记录

## 启动

先启动模拟工厂，再启动监控服务：

```powershell
L:\anaconda\python.exe services\agent-service\monitor_web_server.py
```

打开 `http://127.0.0.1:8001` 查看监测页面。

## 配置

本地 `.env` 中可配置以下项：

```dotenv
FACTORY_API_BASE_URL=http://127.0.0.1:8000
FACTORY_DEVICE_ID=TRAK-TC820LTYSI-001
MONITOR_INTERVAL_SECONDS=0.5
MONITOR_WEB_HOST=127.0.0.1
MONITOR_WEB_PORT=8001
```

`MONITOR_INTERVAL_SECONDS` 控制采样频率；改为 `0.5` 即每 0.5 秒采样一次。DeepSeek 相关密钥仅保存在本地 `.env`，不提交到仓库。

## 测试

```powershell
L:\anaconda\python.exe -m unittest discover -s services\agent-service\tests -p "test_*.py"
```
