"""同名 app 包独立测试进程，不读取本机业务配置。"""
import os
os.environ["PYTHON_DOTENV_DISABLED"] = "1"
os.environ["APP_ENV"] = "testing"
