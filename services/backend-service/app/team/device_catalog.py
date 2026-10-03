"""注册仅接受虚拟工厂真实暴露的设备。"""
import json
import os
from urllib.request import urlopen


def devices():
    with urlopen(os.getenv('FACTORY_API_BASE_URL', 'http://127.0.0.1:4529').rstrip('/') + '/api/devices', timeout=5) as response:
        value = json.load(response)
    if not isinstance(value, list):
        raise ValueError('设备目录不可用')
    return value
