export const RAG_SESSION_STORAGE_KEY = "industry-agent.rag-session.v1";
export const RAG_SESSION_FALLBACK_KEY = "industry-agent.rag-session.fallback.v1";

export function needsRagAnswerRefresh(message) {
  if (!message || message.pending || message.agentError) return false;
  const answer = message.answer && typeof message.answer === "object" ? message.answer : {};
  const hasAnswer = [answer.knowledge?.answer, answer.diagnosis?.summary, answer.report?.summary]
    .some((value) => String(value || "").trim());
  if (hasAnswer) return false;
  const summary = String(answer.knowledge?.summary || "").trim();
  return /^检索到\s*\d+\s*条(?:相关)?知识证据\s*[：:]/.test(summary)
    || /^未检索到与[“"].+[”"]直接相关的可追踪知识证据/.test(summary);
}

function readStoredMessages(storage, key) {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((message) => message && !message.pending && message.question).slice(-20)
      : null;
  } catch (_error) {
    return null;
  }
}

export function getRagStorage(windowLike) {
  let primary = null;
  let fallback = null;
  try {
    primary = windowLike?.sessionStorage || null;
  } catch (_error) {
    primary = null;
  }
  try {
    fallback = windowLike?.localStorage || null;
  } catch (_error) {
    fallback = null;
  }
  return { primary, fallback };
}

function compactAnswer(answer) {
  if (!answer || typeof answer !== "object") return null;
  const compact = {};
  if (answer.route) compact.route = answer.route;
  if (answer.route_result && typeof answer.route_result === "object") {
    compact.route_result = {
      intent: answer.route_result.intent,
      reason: answer.route_result.reason,
    };
  }
  for (const key of ["knowledge", "diagnosis", "report"]) {
    const value = answer[key];
    if (!value || typeof value !== "object") continue;
    if (key === "knowledge") compact.knowledge = { answer: value.answer, summary: value.summary };
    if (key === "diagnosis") compact.diagnosis = { summary: value.summary, fault: value.fault, diagnosis: value.diagnosis };
    if (key === "report") compact.report = { title: value.title, summary: value.summary };
  }
  return compact;
}

export function serializeRagMessages(messages) {
  return (Array.isArray(messages) ? messages : [])
    .filter((message) => message && !message.pending && message.question)
    .slice(-20)
    .map((message) => ({
      id: String(message.id || `${Date.now()}-${Math.random()}`),
      question: String(message.question),
      answer: compactAnswer(message.answer),
      agentError: String(message.agentError || ""),
      pending: false,
    }));
}

export function restoreRagMessages(storage, fallbackStorage = null) {
  const primary = readStoredMessages(storage, RAG_SESSION_STORAGE_KEY);
  if (primary !== null) return primary;
  return readStoredMessages(fallbackStorage, RAG_SESSION_FALLBACK_KEY) || [];
}

export function persistRagMessages(storage, messages, fallbackStorage = null) {
  const compact = serializeRagMessages(messages);
  if (!compact.length) {
    try {
      storage?.removeItem(RAG_SESSION_STORAGE_KEY);
    } catch (_error) {
      // 隐私浏览模式下可能无法使用会话存储。
    }
    try {
      fallbackStorage?.removeItem(RAG_SESSION_FALLBACK_KEY);
    } catch (_error) {
      // 本地存储也可能不可用，但内存中的界面仍然可以工作。
    }
    return;
  }
  const serialized = JSON.stringify(compact);
  try {
    storage?.setItem(RAG_SESSION_STORAGE_KEY, serialized);
  } catch (_error) {
    // sessionStorage 被阻止时，下面回退到 localStorage。
  }
  try {
    fallbackStorage?.setItem(RAG_SESSION_FALLBACK_KEY, serialized);
  } catch (_error) {
    // 隐私浏览模式下可能无法使用存储，但内存中的界面仍然可以工作。
  }
}
