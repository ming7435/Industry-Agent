"""通过隔离的真实子进程测试 MCP 协议，不连接设备或模型。"""
import importlib
import json
import sys

import pytest


SERVER = '''import json,sys,time
for line in sys.stdin:
    msg=json.loads(line)
    if 'id' not in msg: continue
    method=msg['method']
    if method=='initialize': result={'protocolVersion':'2025-03-26','capabilities':{'tools':{}},'serverInfo':{'name':'isolated','version':'1'}}
    elif method=='tools/list': result={'tools':[{'name':'execute_code','inputSchema':{'type':'object'}}]}
    elif msg['params']['name']=='get_rpc_status': result={'content':[{'type':'text','text':'Server status: {"server_running": true}'}]}
    elif msg['params']['arguments'].get('code')=='slow': time.sleep(20); continue
    else: result={'content':[{'type':'text','text':msg['params']['arguments'].get('code','')}]}
    print(json.dumps({'jsonrpc':'2.0','id':msg['id'],'result':result}),flush=True)
'''


def client(timeout=3):
    name = 'app.clients.freecad'
    assert importlib.util.find_spec(name), '缺少本地 MCP stdio 客户端'
    return importlib.import_module(name).FreeCADClient(command=[sys.executable, '-u', '-c', SERVER], timeout=timeout)


def test_real_stdio_initialization_and_tool_result():
    value = client()
    assert value.list_tools()[0]['name'] == 'execute_code'
    assert value.call_tool('execute_code', {'code': '测试参数'})['content'][0]['text'] == '测试参数'
    value.close()


def test_timeout_is_unknown_and_does_not_repeat_write():
    value = client(timeout=0.3)
    with pytest.raises(Exception) as error:
        value.call_tool('execute_code', {'code': 'slow'}, timeout=0.3)
    assert error.value.code == 'outcome_unknown'
    value.close()


def test_missing_executable_has_controlled_error():
    value = client()
    value.command = ['Z:/missing/freecad-mcp.exe']
    result = value.status()
    assert result['connected'] is False
    assert result['error_code'] == 'unavailable'


def test_running_rpc_with_stuck_gui_is_not_ready():
    evidence = {'success': True, 'rpc_server': 'running', 'gui_dispatch': {'state': 'stuck'}}
    value = client()
    value.command[-1] = SERVER.replace('Server status: {"server_running": true}', json.dumps(evidence))
    result = value.status()
    assert result['connected'] is False
    assert result['error_code'] == 'gui_stuck'
    assert result['tools'] == []


@pytest.mark.parametrize('state', ['healthy', 'busy'])
def test_live_rpc_and_responsive_gui_are_connected(state):
    evidence = {'success': True, 'rpc_server': 'running', 'gui_dispatch': {'state': state}}
    value = client()
    value.command[-1] = SERVER.replace('Server status: {"server_running": true}', json.dumps(evidence))
    assert value.status()['connected'] is True
