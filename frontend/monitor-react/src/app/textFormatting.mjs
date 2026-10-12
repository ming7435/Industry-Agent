const BULLET_PATTERN = /^(?:[-*•]|\d+[.)])\s+/;

function normalizeLines(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim());
}

const RETRIEVAL_META_LINE = /^(?:文档|来源|页码|内容类型|标题|分数|source|title|page|content[_ -]?type|score)\s*[:：]/i;
const OCR_PREFIX = /^\s*\[[^\]]+\]\s*本地OCR识别结果(?:（[^）]*）|\([^)]*\))?\s*[:：]?\s*/i;
const RAW_FIELD_PATTERN = /\b(?:device_id|timestamp|temperature|vibration|rpm|alarm_code|alarm_level|health_score)\s*=/i;
const RETRIEVAL_SUMMARY_PATTERN = /^检索到\s*\d+\s*条(?:相关)?知识证据\s*[：:]/;
const JSON_FENCE_PATTERN = /```(?:json)?\s*([\s\S]*?)```/gi;

export function parseEmbeddedJson(value) {
  const source = String(value ?? "");
  for (const match of source.matchAll(JSON_FENCE_PATTERN)) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {
      // 忽略格式错误的模型输出，保留可读的叙述文本。
    }
  }
  return null;
}

export function isDebugAnswer(value) {
  const text = String(value ?? "").trim();
  return /^\[fake-model\]\s*query\s*:/i.test(text) || /^query\s*:[^\n]+\n\s*evidence\s*:/i.test(text);
}

export function selectAgentAnswer(agentAnswer) {
  const candidates = [
    agentAnswer?.knowledge?.answer,
    RETRIEVAL_SUMMARY_PATTERN.test(String(agentAnswer?.knowledge?.summary || "").trim()) ? "" : agentAnswer?.knowledge?.summary,
    agentAnswer?.diagnosis?.summary,
    agentAnswer?.diagnosis?.fault,
    agentAnswer?.route_result?.reason,
  ];
  return candidates.map(cleanDisplayText).find(Boolean) || "";
}

export function cleanDisplayText(value) {
  const source = documentBodyOnly(value);
  if (!source || isDebugAnswer(source)) return "";
  return normalizeLines(source.replace(JSON_FENCE_PATTERN, ""))
    .map((line) => line.replace(OCR_PREFIX, "").trim())
    .filter((line) => line && !RETRIEVAL_META_LINE.test(line) && !/^\[[^\]]+\s*\|[^\]]+\]\s*$/i.test(line))
    .join("\n")
    .trim();
}

export function cleanEvidenceText(value) {
  const text = cleanDisplayText(value);
  if (!text) return "";
  if (/^\[(?:table|cad_drawing)\b/i.test(text) || /^(?:文档|页码|内容类型|本地OCR识别结果|表格行\d+)\s*[:：]/i.test(text)) return "";
  if (/表格行\d+\s*[:：]/i.test(text)) return "";
  if (!RAW_FIELD_PATTERN.test(text)) return text;
  const prefix = text.split(/\b(?:device_id|timestamp|temperature|vibration|rpm|alarm_code|alarm_level|health_score)\s*=/i)[0]
    .replace(/[：:]\s*$/, "")
    .trim();
  return prefix;
}

export function splitTextBlocks(value) {
  const lines = normalizeLines(value);
  const blocks = [];
  let paragraphs = [];
  let listItems = [];

  const flushParagraph = () => {
    if (paragraphs.length) {
      blocks.push({ type: "paragraph", text: paragraphs.join(" ") });
      paragraphs = [];
    }
  };
  const flushList = () => {
    if (listItems.length) {
      blocks.push({ type: "list", items: [...listItems] });
      listItems = [];
    }
  };

  for (const line of lines) {
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = line.match(/^(?:---\s+)?(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].trim() });
      continue;
    }
    if (/^(?:---|___|\*\*\*)+$/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push({ type: "rule" });
      continue;
    }
    if (BULLET_PATTERN.test(line)) {
      flushParagraph();
      listItems.push(line.replace(BULLET_PATTERN, "").trim());
      continue;
    }
    flushList();
    paragraphs.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

export function splitInlineMarkdown(value) {
  return String(value ?? "")
    .split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`)/g)
    .filter(Boolean)
    .map((part) => {
      if (/^\*\*[^*]+\*\*$/.test(part) || /^__[^_]+__$/.test(part)) {
        return { type: "strong", text: part.slice(2, -2) };
      }
      if (/^`[^`]+`$/.test(part)) return { type: "code", text: part.slice(1, -1) };
      return { type: "text", text: part };
    });
}

export function documentBodyOnly(document) {
  if (typeof document === "string") return document.trim();
  if (!document || typeof document !== "object") return "";
  return String(
    document.content
      ?? document.body
      ?? document.text
      ?? document.answer
      ?? document.summary
      ?? document.conclusion
      ?? document.diagnosis
      ?? document.fault
      ?? document.feedback
      ?? document.result
      ?? "",
  ).trim();
}

const RESULT_LABELS = {summary:'结论',fault:'故障判断',cause:'原因分析',diagnosis:'原因分析',analysis:'分析',
  recommendation:'处置建议',next_action:'下一步',action:'操作',safety:'安全要求',result:'结果',
  conclusion:'结论',feedback:'处理记录',description:'说明',evidence:'依据',steps:'执行步骤'};

// Display-only normalization: source records and editor values stay untouched.
export function normalizeResultText(value, depth = 0) {
  if (value == null || depth > 8) return '';
  if (Array.isArray(value)) return value.map(item=>normalizeResultText(item,depth+1)).filter(Boolean)
    .map(item=>resultListMarker(item.split('\n')[0])?item:`- ${item}`).join('\n');
  if (typeof value === 'object') {
    for (const key of ['content','body','text','answer']) {
      if (value[key] != null && value[key] !== '') return normalizeResultText(value[key],depth+1);
    }
    if (value.name && value.value != null) return `${value.name}：${normalizeResultText(value.value,depth+1)}${value.unit?` ${value.unit}`:''}`;
    return Object.entries(value).flatMap(([key,item])=>{
      const label=RESULT_LABELS[key]||(/^[\p{Script=Han}][\p{Script=Han}\s]{0,20}$/u.test(key)?key:'');
      const body=label?normalizeResultText(item,depth+1):'';
      return body?[`${label}：${body.includes('\n')?'\n':''}${body}`]:[];
    }).join('\n');
  }
  if (typeof value === 'boolean') return value?'是':'否';
  let source=String(value).replace(/\r\n?/g,'\n').trim();
  const json=source.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1]??source;
  if (/^[\[{]/.test(json)) {
    try {const parsed=JSON.parse(json);if(parsed&&typeof parsed==='object')return normalizeResultText(parsed,depth+1);} catch {/* Retain malformed content as safe text. */}
  }
  if(isDebugAnswer(source))return '';
  let fenced=false;
  return source.split('\n').map(line=>{
    const trimmed=line.trim();
    if(trimmed.startsWith('```')){fenced=!fenced;return trimmed;}
    return fenced?line:trimmed?cleanDisplayText(trimmed):'';
  }).join('\n').trim();
}

function resultListMarker(line) {
  const ordered=line.match(/^(?:[（(](\d{1,3})[）)]|(\d{1,3})[.)、．](?!\d)|(?:步骤\s*|第)(\d{1,3})(?:步)?[:：、.)]?)\s*(.+)$/u);
  if(ordered)return {ordered:true,start:Number(ordered[1]||ordered[2]||ordered[3]),text:ordered[4]};
  const chinese=line.match(/^([一二三四五六七八九十])[、．]\s*(.+)$/u);
  if(chinese)return {ordered:true,start:'一二三四五六七八九十'.indexOf(chinese[1])+1,text:chinese[2]};
  const bullet=line.match(/^(?:[-*]\s+|[•●▪]\s*)(.+)$/u);
  return bullet?{ordered:false,text:bullet[1]}:null;
}

export function splitResultBlocks(value) {
  const lines=normalizeResultText(value).split('\n'),blocks=[];
  let paragraphs=[],list=null,fields=[];
  const flush=()=>{
    if(paragraphs.length){blocks.push({type:'paragraph',text:paragraphs.join('\n')});paragraphs=[];}
    if(list){blocks.push(list);list=null;}
    if(fields.length){blocks.push(fields.length>1?{type:'fields',items:fields}:{type:'paragraph',text:`${fields[0].label}：${fields[0].value}`});fields=[];}
  };
  const cells=line=>line.replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(cell=>cell.trim().replace(/\\\|/g,'|'));
  for(let index=0;index<lines.length;index++){
    const line=lines[index];
    if(!line){flush();continue;}
    if(line.startsWith('```')){
      flush();const code=[];while(++index<lines.length&&!lines[index].startsWith('```'))code.push(lines[index]);
      blocks.push({type:'code',text:code.join('\n')});continue;
    }
    if(line.includes('|')&&lines[index+1]&&cells(lines[index+1]).every(cell=>/^:?-{3,}:?$/.test(cell))){
      flush();const headers=cells(line),rows=[];index++;
      while(index+1<lines.length&&lines[index+1].includes('|')){const row=cells(lines[index+1]);if(row.length!==headers.length)break;rows.push(row);index++;}
      blocks.push({type:'table',headers,rows});continue;
    }
    const sectionLabel=line.match(/^([^:：]{1,20})[:：]$/u);
    const heading=line.match(/^#{1,6}\s+(.+)$/)||line.match(/^[一二三四五六七八九十]+、(诊断结论|原因分析|根因分析|处置建议|检查步骤|维修步骤|安全要求|验收标准)$/)
      ||(sectionLabel&&Object.values(RESULT_LABELS).includes(sectionLabel[1])?sectionLabel:null);
    if(heading){flush();blocks.push({type:'heading',text:heading[1]});continue;}
    if(/^(?:---|___|\*\*\*)+$/.test(line)){flush();continue;}
    const marker=resultListMarker(line);
    if(marker){
      if(paragraphs.length||fields.length||list&&list.ordered!==marker.ordered)flush();
      if(!list)list={type:'list',ordered:marker.ordered,...(marker.ordered?{start:marker.start}:{}),items:[]};
      list.items.push(marker.text);continue;
    }
    const emphasizedField=line.match(/^(\*\*|__)([^*_:：。！？\n]{1,20})[:：]\s*\1\s*(.+)$/u);
    const field=emphasizedField?[emphasizedField[0],emphasizedField[2],emphasizedField[3]]:line.match(/^([^:：。！？\n]{1,20})[:：]\s*(.+)$/u);
    if(field){
      if(paragraphs.length||list)flush();
      fields.push({label:field[1].replace(/^(\*\*|__)(.+)\1$/u,'$2'),value:field[2]});continue;
    }
    if(list||fields.length)flush();
    paragraphs.push(line);
  }
  flush();return blocks.filter(block=>block.type!=='paragraph'||block.text);
}

export function resultListItems(items = []) {
  return items.flatMap(value=>{
    const text=normalizeResultText(value);if(!text)return [];
    const blocks=splitResultBlocks(text);
    if(blocks.length===1&&blocks[0].type==='list')return blocks[0].items;
    const lines=text.split('\n'),first=resultListMarker(lines[0]);
    if(first)lines[0]=first.text;
    return [lines.join('\n')];
  });
}

export function displayRiskLevel(value) {
  return ({critical:'严重风险',high:'高风险',medium:'中等风险',low:'低风险',normal:'常规风险',
    r1:'低风险',r2:'中等风险',r3:'高风险',r4:'严重风险'})[String(value||'').toLowerCase()]||normalizeResultText(value)||'待确认';
}
