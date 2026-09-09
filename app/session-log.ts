import type { PromptMessages, PromptValues } from "./prompt-model";
import type { Completion, Engine, Provider } from "./execution-model";
import type { Attachment } from "./document-field";

export type MethodKey = "neon" | "tao" | "yonsei";
export type RunRecord = { request: PromptMessages; response: Completion;
  startedAt: string; completedAt: string; ontology: string | null;
  outputEdit?: { content: string; at: string } };
export type LogEntry = { at: string; event: string; method: MethodKey; stageId?: string; data?: unknown };
export type PromptDefinition = { template: string; fields: string[] };
export type SessionDefaults = {
  valuesByMethod: Record<MethodKey, PromptValues>;
  promptDefinitions: Record<string, PromptDefinition>;
};
export type RestoredSession = SessionDefaults & {
  current: { method: MethodKey; stageId: string; runState: "paused"; autoAdvance: boolean; engine?: Engine; provider?: Provider };
  promptOverrides: Record<string, PromptMessages>;
  attachments: Record<string, Attachment>;
  history: LogEntry[];
  currentRecords: Record<string, RunRecord>;
  currentOutputs: Record<string, string>;
  tokenCount: number;
  exportedAt: string;
  apiCalls?: number;
};

export const MAX_LOG_BYTES = 50 * 1024 * 1024;
export function validateLogFile(name: string, size: number) {
  if (!/\.json$/i.test(name)) throw new Error("전체 로그 저장으로 만든 .json 파일을 선택하세요.");
  if (!size) throw new Error("빈 로그 파일입니다.");
  if (size > MAX_LOG_BYTES) throw new Error("50MB 이하의 로그 파일을 선택하세요.");
}

function check(condition: unknown, path: string): asserts condition {
  if (!condition) throw new Error(`로그 형식이 올바르지 않습니다: ${path}`);
}
function object(value: unknown, path: string): Record<string, unknown> {
  check(value && typeof value === "object" && !Array.isArray(value), path);
  return value as Record<string, unknown>;
}
function string(value: unknown, path: string): string {
  check(typeof value === "string", path); return value;
}
function natural(value: unknown, path: string): number {
  check(typeof value === "number" && Number.isSafeInteger(value) && value >= 0, path); return value;
}
function timestamp(value: unknown, path: string): string {
  const text = string(value, path); check(Number.isFinite(Date.parse(text)), path); return text;
}
function methodKey(value: unknown): MethodKey {
  check(value === "neon" || value === "tao" || value === "yonsei", "method"); return value;
}
function stageKey(key: string) {
  check(/^(neon-(0[1-9]|1[0-9]|20)|tao-0[1-8]|yonsei-0[1-9])$/.test(key), `단계 ${key}`);
}
function fieldKey(key: string) {
  check(/^[a-z][a-z0-9_]*$/.test(key) && !["constructor", "prototype"].includes(key), `입력 변수 ${key}`);
}
function messages(value: unknown, path: string): PromptMessages {
  const item = object(value, path);
  return { system: string(item.system, path + ".system"), user: string(item.user, path + ".user") };
}

// Migration applies only to active NeOn prompts, never to original execution records.
export function removeNeonMetrics(text: string): string {
  let inMetricsBlock = false;
  let changed = false;
  const lines = text.split(/\r?\n/).filter((line) => {
    if (/^\s*(?:-\s*)?The original ontology has /.test(line)
      || /^\s*(?:-\s*)?Make sure that the generated ontology reflects the previous metrics/.test(line)
      || line.includes("{ontology_metrics}")) {
      inMetricsBlock = true; changed = true; return false;
    }
    if (inMetricsBlock && /^\s*(?:and has a high subclass count; if the class count is n,|if the class count is n, the subclass count should at least be n-1\.|the subclass count should at least be n-1\.)/.test(line)) {
      changed = true; return false;
    }
    inMetricsBlock = false;
    return true;
  });
  return changed ? lines.join(text.includes("\r\n") ? "\r\n" : "\n") : text;
}

// Validate before touching UI state. History is audit-only: it must never resurrect
// invalidated outputs or ontologies. Only currentRecords/currentOutputs are restored.
export function parseSessionLog(text: string, defaults: SessionDefaults): RestoredSession {
  check(new TextEncoder().encode(text).length <= MAX_LOG_BYTES, "최대 50MB");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.replace(/^\uFEFF/, ""), (key, value) => {
      if (["__proto__", "constructor", "prototype"].includes(key)) throw new Error("unsafe key");
      return value;
    });
  } catch { throw new Error("안전한 JSON 로그를 읽지 못했습니다. 파일 내용과 인코딩을 확인하세요."); }
  const log = object(parsed, "로그");
  check(log.format === "ontology-studio-session", "Ontology Studio 전체 로그 파일이 아닙니다");
  check(log.version === 1 || log.version === 2 || log.version === 3 || log.version === 4, "지원하지 않는 로그 버전");
  const supportsApi = log.version === 3 || log.version === 4;
  if (!supportsApi) check(log.simulation === true && log.apiCalls === 0, "로컬 시뮬레이션 로그만 지원합니다");
  else { check(typeof log.simulation === "boolean", "simulation"); natural(log.apiCalls, "apiCalls"); }
  const exportedAt = timestamp(log.exportedAt, "exportedAt");
  const current = object(log.current, "current");
  const method = methodKey(current.method);
  const stageId = string(current.stageId, "current.stageId"); stageKey(method + "-" + stageId);
  check(["idle", "running", "paused", "done"].includes(String(current.runState)), "current.runState");
  check(typeof current.autoAdvance === "boolean", "current.autoAdvance");
  if (supportsApi) {
    check(current.engine === "simulation" || current.engine === "api", "current.engine");
    check(current.provider === "openai" || current.provider === "anthropic", "current.provider");
  }

  const values = object(log.valuesByMethod, "valuesByMethod");
  const valuesByMethod = {} as Record<MethodKey, PromptValues>;
  const seedLegacyYonsei = log.version !== 4 && values.yonsei === undefined;
  for (const key of ["neon", "tao", "yonsei"] as const) {
    // A legacy caller may know only the two original methods. Do not invent
    // state in that case, or overwrite any saved Yonsei values with examples.
    if (key === "yonsei" && defaults.valuesByMethod.yonsei === undefined && values.yonsei === undefined) continue;
    if (key === "yonsei" && seedLegacyYonsei) {
      valuesByMethod.yonsei = { ...defaults.valuesByMethod.yonsei };
      continue;
    }
    const saved = object(values[key], "valuesByMethod." + key);
    for (const [field, value] of Object.entries(saved)) { fieldKey(field); string(value, field); }
    if (log.version !== 1 || key === "yonsei") {
      for (const field of Object.keys(defaults.valuesByMethod[key] ?? {})) {
        // Older Studio logs did not expose the NeOn Step 20 CQ input.
        if (log.version !== 4 && key === "neon" && field === "competency_questions" && saved[field] === undefined) continue;
        check(typeof saved[field] === "string", `valuesByMethod.${key}.${field}`);
      }
    }
    // Missing fields from older logs are filled from defaults, never the current workspace.
    valuesByMethod[key] = { ...defaults.valuesByMethod[key], ...saved } as PromptValues;
    if (key === "neon" && saved.competency_questions === undefined) valuesByMethod[key].competency_questions = "";
    if (key === "neon") delete valuesByMethod[key].ontology_metrics;
  }
  check(values[method] !== undefined, "current.method: 저장된 방법론 입력 누락");

  const promptDefinitions: Record<string, PromptDefinition> = {};
  const readDefinition = (value: unknown, key: string) => {
    stageKey(key);
    const spec = object(value, "promptDefinitions." + key);
    check(Array.isArray(spec.fields) && spec.fields.length <= 100, key + ".fields");
    const fields = spec.fields.map((value) => { const field = string(value, key + ".field"); fieldKey(field); return field; });
    const template = string(spec.template, key + ".template");
    promptDefinitions[key] = key.startsWith("neon-")
      ? { template: removeNeonMetrics(template), fields: [...new Set(fields)].filter((field) => field !== "ontology_metrics") }
      : { template, fields: [...new Set(fields)] };
  };
  if (log.version !== 1) {
    for (const [key, spec] of Object.entries(object(log.promptDefinitions, "promptDefinitions"))) readDefinition(spec, key);
  } else {
    // Legacy v1 exports stored NeOn source templates and TAO blueprint tuples.
    const templates = object(log.templates, "templates");
    check(Array.isArray(templates.neon) && templates.neon.length === 20, "templates.neon");
    check(Array.isArray(templates.tao) && templates.tao.length === 8, "templates.tao");
    templates.neon.forEach((spec, index) => readDefinition(spec, "neon-" + String(index + 1).padStart(2, "0")));
    templates.tao.forEach((row, index) => {
      check(Array.isArray(row) && row.length === 3 && row.every((part) => typeof part === "string"), "templates.tao");
      const key = "tao-" + String(index + 1).padStart(2, "0");
      const fields = defaults.promptDefinitions[key].fields;
      readDefinition({ fields, template: `You are a {persona}.\nStage: ${row[1]}\n${fields.filter((field) => field !== "persona").map((field) => field + ": {" + field + "}").join("\n\n")}\n\n${row[2]}` }, key);
    });
  }
  for (const [key, spec] of Object.entries(defaults.promptDefinitions)) {
    if (seedLegacyYonsei && key.startsWith("yonsei-") && !promptDefinitions[key]) {
      readDefinition(spec, key);
    }
    check(promptDefinitions[key], "누락된 프롬프트 " + key);
  }
  const savedStageKey = (key: string) => {
    stageKey(key);
    check(valuesByMethod[key.split("-")[0] as MethodKey], key + ": 방법론 입력 누락");
    check(promptDefinitions[key], "누락된 프롬프트 " + key);
  };
  savedStageKey(method + "-" + stageId);
  const promptOverrides: Record<string, PromptMessages> = {};
  for (const [key, value] of Object.entries(object(log.promptOverrides, "promptOverrides"))) {
    savedStageKey(key); promptOverrides[key] = messages(value, key);
    if (key.startsWith("neon-")) promptOverrides[key] = {
      system: removeNeonMetrics(promptOverrides[key].system), user: removeNeonMetrics(promptOverrides[key].user),
    };
  }
  const attachments: Record<string, Attachment> = {};
  for (const [key, value] of Object.entries(object(log.attachments, "attachments"))) {
    check(key === "neon-domain_description" || key === "tao-page_text" || key === "yonsei-domain_description", "첨부 문서 " + key);
    const item = object(value, key);
    const text = string(item.text, key + ".text");
    check(typeof item.edited === "boolean", key + ".edited");
    const [owner, field] = key.split("-");
    check(valuesByMethod[owner as MethodKey], key + ": 방법론 입력 누락");
    attachments[key] = { name: string(item.name, key + ".name"), size: natural(item.size, key + ".size"),
      importedAt: timestamp(item.importedAt, key + ".importedAt"), text,
      edited: valuesByMethod[owner as MethodKey][field] !== text };
  }

  const currentOutputs: Record<string, string> = {};
  for (const [key, value] of Object.entries(object(log.currentOutputs, "currentOutputs"))) {
    savedStageKey(key); currentOutputs[key] = string(value, key + ".output");
  }
  const currentRecords: Record<string, RunRecord> = {};
  let calculatedTokens = 0;
  for (const [key, value] of Object.entries(object(log.currentRecords, "currentRecords"))) {
    savedStageKey(key);
    const item = object(value, key);
    const request = messages(item.request, key + ".request");
    timestamp(item.startedAt, key + ".startedAt"); timestamp(item.completedAt, key + ".completedAt");
    check(item.ontology === null || typeof item.ontology === "string", key + ".ontology");
    const response = object(item.response, key + ".response");
    string(response.object, key + ".response.object"); string(response.model, key + ".response.model");
    check(Array.isArray(response.choices) && response.choices.length > 0, key + ".choices");
    for (const choiceValue of response.choices) {
      const choice = object(choiceValue, key + ".choice"); natural(choice.index, key + ".index");
      string(choice.finish_reason, key + ".finish_reason");
      const message = object(choice.message, key + ".message");
      string(message.role, key + ".role"); string(message.content, key + ".content");
    }
    const output = object(object(response.choices[0], key).message, key).content;
    let effectiveOutput = string(output, key + ".output");
    if (item.outputEdit !== undefined) {
      check(log.version === 4, key + ": 출력 편집 로그 버전");
      const edit = object(item.outputEdit, key + ".outputEdit");
      effectiveOutput = string(edit.content, key + ".outputEdit.content");
      check(effectiveOutput.trim(), key + ": 빈 편집 출력");
      timestamp(edit.at, key + ".outputEdit.at");
    }
    check(currentOutputs[key] === effectiveOutput, key + ": 응답과 현재 출력 불일치");
    const usage = object(response.usage, key + ".usage");
    calculatedTokens += natural(usage.prompt_tokens, key + ".prompt_tokens") + natural(usage.completion_tokens, key + ".completion_tokens");
    if (response.execution !== undefined) {
      check(supportsApi && response.simulation === undefined, key + ".execution version");
      const execution = object(response.execution, key + ".execution");
      check(execution.provider === "openai" || execution.provider === "anthropic", key + ".provider");
      if (execution.requestId !== undefined) string(execution.requestId, key + ".requestId");
    } else {
      const simulation = object(response.simulation, key + ".simulation"); string(simulation.note, key + ".note");
      const sent = object(simulation.request, key + ".simulation.request").messages;
      check(Array.isArray(sent) && sent.length === 2, key + ".sent messages");
      for (const [index, role] of ["system", "user"].entries()) {
        const message = object(sent[index], key + ".sent message");
        check(message.role === role && message.content === request[role as keyof PromptMessages], key + ": 요청 기록 불일치");
      }
    }
    currentRecords[key] = { ...item, request } as RunRecord;
  }
  for (const key of Object.keys(currentOutputs)) check(currentRecords[key], key + ": 실행 기록 없는 출력");
  check(Array.isArray(log.history), "history");
  const history: LogEntry[] = log.history.map((value) => {
    const entry = object(value, "history entry");
    const at = timestamp(entry.at, "history.at"), event = string(entry.event, "history.event"), method = methodKey(entry.method);
    const stageId = entry.stageId === undefined ? undefined : string(entry.stageId, "history.stageId");
    if (stageId !== undefined) savedStageKey(method + "-" + stageId);
    check(valuesByMethod[method], "history.method: 방법론 입력 누락");
    return { at, event, method, ...(stageId !== undefined ? { stageId } : {}), ...(entry.data !== undefined ? { data: entry.data } : {}) };
  });
  return { current: { method, stageId, runState: "paused", autoAdvance: current.autoAdvance,
      ...(supportsApi ? { engine: current.engine as Engine, provider: current.provider as Provider } : {}) },
    valuesByMethod, promptDefinitions, promptOverrides, attachments, history, currentRecords, currentOutputs,
    tokenCount: log.tokenCount === undefined ? calculatedTokens : natural(log.tokenCount, "tokenCount"), exportedAt,
    ...(supportsApi ? { apiCalls: log.apiCalls as number } : {}) };
}

export function invalidateStageResults<T>(items: Record<string, T>, method: MethodKey, fromStageIndex: number): Record<string, T> {
  return Object.fromEntries(Object.entries(items).filter(([key]) => !key.startsWith(method + "-") || Number(key.split("-")[1]) <= fromStageIndex));
}
