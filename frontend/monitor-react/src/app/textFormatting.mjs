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
  return normalizeLines(source)
    .map((line) => line.replace(OCR_PREFIX, "").trim())
    .filter((line) => line && !RETRIEVAL_META_LINE.test(line) && !/^\[[^\]]+\s*\|[^\]]+\]\s*$/i.test(line))
    .join("\n")
    .trim();
}

export function cleanEvidenceText(value) {
  const text = cleanDisplayText(value);
  if (!text) return "";
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
