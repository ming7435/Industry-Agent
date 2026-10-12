import test from 'node:test';
import assert from 'node:assert/strict';
import { expertDocumentHtml } from './expertDocument.mjs';

test('技能说明展示为文章，标题、强调和引用不显示原始标记', () => {
  const html = expertDocumentHtml('# 报警诊断\n\n## 适用场景\n\n先核对 **设备** 和 `alarm_code`。\n\n- [检查说明](L:/industry_agent/check.py)\n- *不要猜测*');
  assert.match(html, /<h1>报警诊断<\/h1>/);
  assert.match(html, /<h2>适用场景<\/h2>/);
  assert.match(html, /<strong>设备<\/strong>/);
  assert.match(html, /<code>alarm_code<\/code>/);
  assert.match(html, /<ul><li>/);
  assert.match(html, /检查说明/);
  assert.match(html, /data-expert-href="L:\/industry_agent\/check.py"/);
  assert.doesNotMatch(html, /\*\*设备|`alarm_code`|\[检查说明\]|## 适用场景/);
});

test('表格和示例按正常格式展示，保留数据与示例内容', () => {
  const html = expertDocumentHtml('| 项目 | 数据 |\n| --- | --- |\n| 信号 | `ready` |\n\n```json\n{"signal":0}\n```');
  assert.match(html, /<table>/);
  assert.match(html, /<th>项目<\/th>/);
  assert.match(html, /<td><code>ready<\/code><\/td>/);
  assert.match(html, /<pre data-expert-language="json"><code>\{&quot;signal&quot;:0\}<\/code><\/pre>/);
  assert.doesNotMatch(html, /```|\| ---/);
});

test('格式转换不会把正文或链接当成可执行 HTML', () => {
  const html = expertDocumentHtml('# <img src=x onerror=alert(1)>\n\n[说明](javascript:alert(1))\n\n<script>坏内容</script>');
  assert.doesNotMatch(html, /<img|<script|\shref="javascript:/);
  assert.match(html, /&lt;img/);
  assert.match(html, /&lt;script&gt;/);
});

test('普通标识、嵌套列表和链接内的括号不会丢失', () => {
  const html = expertDocumentHtml('核对 object_id 和 needs_input。\n\n1. 核对设备\n   - 核对反馈\n2. 保留记录\n\n[检查说明](L:/drawings/check(1).pdf)');
  assert.match(html, /object_id 和 needs_input/);
  assert.match(html, /<ol><li>核对设备<ul><li>核对反馈<\/li><\/ul><\/li><li>保留记录<\/li><\/ol>/);
  assert.match(html, /data-expert-href="L:\/drawings\/check\(1\).pdf"/);
});
