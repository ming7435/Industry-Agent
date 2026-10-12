import test from 'node:test';
import assert from 'node:assert/strict';
import * as formatting from './textFormatting.mjs';
import {buildDiagnosisView} from './diagnosisView.mjs';

test('业务结果保留独立段落与中文换行，而不是合并成长段',()=>{
  const value='第一段：压力异常。\n\n第二段：需要核查油位。';
  const result=formatting.normalizeResultText?.(value)??'';
  assert.equal(result,value);
  assert.equal((formatting.splitResultBlocks?.(result)??[]).filter(block=>block.type==='paragraph').length,2);
});

test('维修建议保留有序步骤和起始序号，无序注意事项分组显示',()=>{
  const blocks=formatting.splitResultBlocks?.('3. **断电检查**\n4. 核对油位\n\n- 保持停机\n- 记录现场结果')??[];
  assert.deepEqual(blocks,[{type:'list',ordered:true,start:3,items:['**断电检查**','核对油位']},
    {type:'list',ordered:false,items:['保持停机','记录现场结果']}]);
});

test('中文与紧凑编号正确排版，不把小数和设备型号识别成步骤',()=>{
  const blocks=formatting.splitResultBlocks?.('（1）确认停机\n（2）检查油位\n\n压力 0.42 MPa，TRAK-TC820LTYSI-001。')??[];
  assert.equal(blocks[0]?.type,'list');assert.equal(blocks[0]?.items.length,2);
  assert.equal(blocks[1]?.text,'压力 0.42 MPa，TRAK-TC820LTYSI-001。');
});

test('连续标签值对齐展示，长段落保持原文',()=>{
  const blocks=formatting.splitResultBlocks?.('处置原则：保持设备停机\n恢复条件：现场复测通过\n\n液压压力仍需由维修人员核对。')??[];
  assert.deepEqual(blocks[0],{type:'fields',items:[{label:'处置原则',value:'保持设备停机'},{label:'恢复条件',value:'现场复测通过'}]});
  assert.equal(blocks[1]?.text,'液压压力仍需由维修人员核对。');
});

test('单个步骤清理重复编号，多个步骤保持原顺序',()=>{
  assert.deepEqual(formatting.resultListItems?.(['1. **核查油位**','2. 检查可见泄漏'])??[],['**核查油位**','检查可见泄漏']);
  assert.deepEqual(formatting.resultListItems?.(['（1）确认停机\n（2）核对报警'])??[],['确认停机','核对报警']);
});

test('结构化返回与数组显示完整业务正文，数字零保持有效',()=>{
  assert.equal(formatting.normalizeResultText?.(['确认停机','记录压力'])??'','- 确认停机\n- 记录压力');
  assert.equal(formatting.normalizeResultText?.({content:'检查液压站',trace_id:'TRACE-internal'})??'','检查液压站');
  assert.equal(formatting.normalizeResultText?.({name:'压力',value:0,unit:'MPa'})??'','压力：0 MPa');
});

test('原始 JSON 业务结果转为可读字段，不显示内部跟踪字段',()=>{
  assert.equal(formatting.normalizeResultText?.('{"summary":"压力异常","recommendation":"核对油位","trace_id":"INTERNAL"}')??'',
    '结论：压力异常\n处置建议：核对油位');
});

test('返回的 Markdown 表格用具名信息卡保留每个单元格',()=>{
  const blocks=formatting.splitResultBlocks?.('| 检查项 | 结果 |\n| --- | --- |\n| 油位 | 正常 |\n| 压力 | 0.62 MPa |')??[];
  assert.deepEqual(blocks,[{type:'table',headers:['检查项','结果'],rows:[['油位','正常'],['压力','0.62 MPa']]}]);
});

test('危险 HTML 作为普通文字保留，格式器不执行或生成 HTML',()=>{
  assert.equal(formatting.normalizeResultText?.('<img src=x onerror=alert(1)>')??'','<img src=x onerror=alert(1)>');
});

test('原格式器支持的 answer 包装正文保留在诊断和其他结果中',()=>{
  const text='液压压力异常，保持停机并核对油位。';
  assert.equal(formatting.normalizeResultText({answer:text}),text);
  assert.equal(buildDiagnosisView({diagnosis:{latest:{status:'completed',summary:{answer:text}}}}).summary,text);
});

test('加粗标签包住冒号时也不残留裸 Markdown，值的强调保留',()=>{
  const blocks=formatting.splitResultBlocks('**处置原则：**保持停机\n**恢复条件：**复测通过');
  assert.deepEqual(blocks,[{type:'fields',items:[{label:'处置原则',value:'保持停机'},{label:'恢复条件',value:'复测通过'}]}]);
  const emphasized=formatting.splitResultBlocks('__处置原则：__**保持停机**\n__恢复条件：__复测通过');
  assert.equal(emphasized[0].items[0].value,'**保持停机**');
});

test('标签和值各自加粗时完整保留标签及正文强调',()=>{
  for(const marker of ['**','__']){
    assert.deepEqual(formatting.splitResultBlocks(`${marker}处置原则${marker}：${marker}保持停机${marker}\n恢复条件：复测通过`),[
      {type:'fields',items:[{label:'处置原则',value:`${marker}保持停机${marker}`},{label:'恢复条件',value:'复测通过'}]}]);
  }
});

test('已编号的建议数组保持单一有序列表，不再叠加圆点',()=>{
  assert.deepEqual(formatting.splitResultBlocks(['1. 核查油位','2. 记录结果']),[
    {type:'list',ordered:true,start:1,items:['核查油位','记录结果']}]);
});

test('结构化建议的标签独立于列表，第一步不丢失',()=>{
  assert.deepEqual(formatting.splitResultBlocks({recommendation:['核查油位','记录结果']}),[
    {type:'heading',text:'处置建议'},{type:'list',ordered:false,items:['核查油位','记录结果']}]);
});

test('返回的代码段保持缩进和比较符号，格式化不更改正文',()=>{
  assert.deepEqual(formatting.splitResultBlocks('```python\ndef check():\n    pressure = 0.42\n    return pressure < 0.60\n```'),[
    {type:'code',text:'def check():\n    pressure = 0.42\n    return pressure < 0.60'}]);
});
