import * as rdf from "rdflib";
import type { ApiCompletion, GenerationRequest, Provider } from "../app/execution-model";

export type ApiEnvironment = { OPENAI_API_KEY?: string; OPENAI_MODEL?: string; ANTHROPIC_API_KEY?: string; ANTHROPIC_MODEL?: string };
const MAX_BODY = 6 * 1024 * 1024;
class ServiceError extends Error {
  code: string; status: number; requestId?: string;
  constructor(code: string, message: string, status = 400, requestId?: string) {
    super(message); this.code = code; this.status = status; this.requestId = requestId;
  }
}
function fail(code: string, message: string, status = 400): never { throw new ServiceError(code, message, status); }
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const safeId = (value: string | null) => value && /^[a-zA-Z0-9_.:-]{1,160}$/.test(value) ? value : undefined;
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const nonempty = (value: unknown): value is string => typeof value === "string" && !!value.trim();
const absoluteIri = (value: unknown): value is string => nonempty(value) && /^[a-z][a-z0-9+.-]*:[^\s<>"{}|\\^`]+$/i.test(value);
const YONSEI_CQ_ANNOTATION = "https://example.org/yonsei/relatedCQ";
const YONSEI_TYPES = {
  class: "http://www.w3.org/2002/07/owl#Class",
  object_property: "http://www.w3.org/2002/07/owl#ObjectProperty",
  data_property: "http://www.w3.org/2002/07/owl#DatatypeProperty",
};

function validateTraceInput(trace: unknown): void {
  if (!isObject(trace) || !Array.isArray(trace.cqIds) || !trace.cqIds.length || trace.cqIds.some(id => !nonempty(id))
    || new Set(trace.cqIds).size !== trace.cqIds.length || !Array.isArray(trace.elements))
    fail("INVALID_REQUEST", "Yonsei CQ 추적 정보의 cqIds와 elements 형식을 확인하세요.");
  const knownCqs = new Set(trace.cqIds);
  const elements = new Set<string>();
  for (const element of trace.elements) {
    if (!isObject(element) || !absoluteIri(element.id) || elements.has(element.id)
      || typeof element.kind !== "string" || !Object.hasOwn(YONSEI_TYPES, element.kind)
      || !Array.isArray(element.cq_ids) || !element.cq_ids.length
      || element.cq_ids.some(id => typeof id !== "string" || !knownCqs.has(id))
      || new Set(element.cq_ids).size !== element.cq_ids.length)
      fail("INVALID_REQUEST", "Yonsei 요소에는 고유한 절대 IRI, 유효한 kind와 알려진 CQ ID 연결이 필요합니다.");
    elements.add(element.id);
  }
}

export function validateGeneration(value: unknown): GenerationRequest {
  if (!isObject(value) || !["openai", "anthropic"].includes(String(value.provider)) || !["neon", "tao", "yonsei"].includes(String(value.method))
    || typeof value.stageId !== "string" || !/^(neon-(0[1-9]|1[0-9]|20)|tao-0[1-8]|yonsei-0[1-9])$/.test(value.method + "-" + value.stageId)
    || (value.purpose !== undefined && value.purpose !== "stage" && value.purpose !== "few-shot")
    || (value.purpose === "few-shot" && (value.method !== "yonsei" || value.stageId === "09"))
    || !isObject(value.messages) || typeof value.messages.system !== "string" || typeof value.messages.user !== "string"
    || !value.messages.user.trim() || typeof value.previousOntology !== "string") fail("INVALID_REQUEST", "제공업체·단계·프롬프트 형식을 확인하세요.");
  if (value.yonseiTrace !== undefined) {
    if (value.method !== "yonsei" || !["08", "09"].includes(value.stageId) || value.purpose === "few-shot")
      fail("INVALID_REQUEST", "CQ 추적 정보는 Yonsei 08·09 단계 실행에서만 사용할 수 있습니다.");
    validateTraceInput(value.yonseiTrace);
  }
  return value as unknown as GenerationRequest;
}

function validateOntologyTrace(graph: ReturnType<typeof rdf.graph>, trace: NonNullable<GenerationRequest["yonseiTrace"]>): void {
  const type = rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
  const annotation = rdf.sym(YONSEI_CQ_ANNOTATION);
  const knownCqs = new Set(trace.cqIds);
  const reject = () => fail("INVALID_CQ_TRACE", "생성된 Turtle이 CQ 추적 정보를 보존하지 않았습니다. 기존 요소의 IRI·종류와 relatedCQ 주석을 유지하고, 알려진 CQ ID만 연결하도록 프롬프트를 확인하세요.", 422);
  if (trace.elements.length && !graph.holds(annotation, type, rdf.sym("http://www.w3.org/2002/07/owl#AnnotationProperty"))) reject();
  for (const statement of graph.statementsMatching(null, annotation, null)) {
    if (statement.object.termType !== "Literal" || !knownCqs.has(statement.object.value)) reject();
  }
  for (const element of trace.elements) {
    const subject = rdf.sym(element.id);
    if (!graph.holds(subject, type, rdf.sym(YONSEI_TYPES[element.kind]))) reject();
    // A changed kind cannot be hidden by retaining the original declaration too.
    if (Object.entries(YONSEI_TYPES).some(([kind, iri]) => kind !== element.kind && graph.holds(subject, type, rdf.sym(iri)))) reject();
    const links = new Set(graph.statementsMatching(subject, annotation, null).map(statement => statement.object.value));
    if (element.cq_ids.some(id => !links.has(id))) reject();
  }
}

export function normalizeResponse(value: unknown, provider: Provider, model: string, requestId?: string): ApiCompletion {
  if (!isObject(value)) fail("INVALID_PROVIDER_RESPONSE", "API가 올바른 응답을 반환하지 않았습니다.", 502);
  let text = "", reason = "";
  const usage = isObject(value.usage) ? value.usage : {};
  let input: unknown, output: unknown;
  if (provider === "openai") {
    const choice = Array.isArray(value.choices) && isObject(value.choices[0]) ? value.choices[0] : {};
    const message = isObject(choice.message) ? choice.message : {};
    reason = String(choice.finish_reason ?? "");
    if (message.refusal || reason === "content_filter") fail("REFUSAL", "모델이 요청에 응답할 수 없다고 반환했습니다. 프롬프트를 검토하세요.", 422);
    text = typeof message.content === "string" ? message.content : "";
    input = usage.prompt_tokens; output = usage.completion_tokens;
  } else {
    reason = String(value.stop_reason ?? "");
    text = Array.isArray(value.content) ? value.content.filter((block) => isObject(block) && block.type === "text" && typeof block.text === "string").map((block) => block.text).join("\n") : "";
    input = usage.input_tokens; output = usage.output_tokens;
  }
  if (reason === "length" || reason === "max_tokens") fail("OUTPUT_TRUNCATED", "모델 출력이 토큰 한도에서 잘렸습니다. 범위를 줄이거나 서버의 출력 한도를 조정하세요. 불완전한 결과는 저장하지 않았습니다.", 422);
  if (!["stop", "end_turn", "stop_sequence"].includes(reason) || !text.trim()) fail("EMPTY_OR_UNSUPPORTED_RESPONSE", "텍스트 응답이 없거나 도구 실행이 필요한 응답입니다. 이 GUI는 텍스트 프롬프트 실행만 지원합니다.", 422);
  if (typeof input !== "number" || !Number.isSafeInteger(input) || input < 0 || typeof output !== "number" || !Number.isSafeInteger(output) || output < 0) fail("INVALID_USAGE", "API 사용량 응답 형식이 올바르지 않습니다.", 502);
  return { object: "chat.completion", model, choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: reason }],
    usage: { prompt_tokens: input, completion_tokens: output }, execution: { provider, ...(requestId ? { requestId } : {}) } };
}

export function ontologyFromResponse(text: string, input: GenerationRequest): string | null {
  // Generated examples and conceptual JSON are context, never ontology snapshots.
  // In particular, a Turtle example nested in that text must not replace real output.
  if (input.purpose === "few-shot" || (input.method === "yonsei" && Number(input.stageId) < 8)) return null;
  const match = text.match(/###start_turtle###([\s\S]*?)###end_turtle###/i) ?? text.match(/```(?:turtle|ttl)\s*\n([\s\S]*?)```/i);
  const expected = input.method === "neon" || input.method === "yonsei" ? Number(input.stageId) >= 8 : ["04", "08"].includes(input.stageId);
  let turtle = match?.[1]?.trim();
  if (!turtle && /^\s*(?:@prefix|PREFIX|@base|BASE)\s/.test(text)) turtle = text.trim();
  if (!turtle) {
    if (expected) fail("TURTLE_MISSING", "온톨로지 단계 응답에 Turtle이 없습니다. 전체 프롬프트에서 Turtle 출력 지시를 확인하세요.", 422);
    return null;
  }
  try {
    const graph = rdf.graph();
    // Original NeOn stages 11–20 emit new triples. Preserve prior triples and prefixes.
    const merge = input.method === "neon" && Number(input.stageId) >= 11;
    rdf.parse((merge && input.previousOntology ? input.previousOntology + "\n" : "") + turtle, graph, "http://example.org/generated/", "text/turtle");
    if (!graph.statements.length) throw new Error("empty graph");
    if (input.yonseiTrace) validateOntologyTrace(graph, input.yonseiTrace);
    const serialized = rdf.serialize(null, graph, "http://example.org/generated/", "text/turtle");
    if (!serialized) throw new Error("serialization failed");
    return serialized;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    fail("INVALID_TURTLE", "생성된 Turtle의 문법 검증에 실패했습니다. 해당 단계는 완료 처리하지 않았습니다. 프롬프트를 수정한 뒤 다시 실행하세요.", 422);
  }
}

// Pure dependency-injected handler: tests supply fake env and fetch; no API keys needed.
export async function handleGeneration(request: Request, env: ApiEnvironment, transport: typeof fetch = fetch, timeoutMs = 120000): Promise<Response> {
  let requestId: string | undefined;
  try {
    const url = new URL(request.url);
    // The workbench has no login. Do not expose a publicly callable, paid API proxy.
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) fail("LOCAL_ONLY", "실제 API 실행은 localhost에서만 허용됩니다. 공개 배포에는 별도 인증이 필요합니다.", 403);
    if (request.headers.get("origin") !== url.origin) fail("ORIGIN_REJECTED", "같은 로컬 웹 화면에서 요청을 실행하세요.", 403);
    if (!request.headers.get("content-type")?.startsWith("application/json")) fail("INVALID_REQUEST", "JSON 요청만 지원합니다.", 415);
    if (Number(request.headers.get("content-length")) > MAX_BODY) fail("REQUEST_TOO_LARGE", "요청이 6MB를 초과했습니다. 입력 문서나 이전 출력을 줄이세요.", 413);
    const reader = request.body?.getReader();
    if (!reader) fail("INVALID_REQUEST", "요청 본문이 없습니다.");
    const decoder = new TextDecoder(); let body = "", size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) { await reader.cancel(); fail("REQUEST_TOO_LARGE", "요청이 6MB를 초과했습니다.", 413); }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    let parsed: unknown;
    try { parsed = JSON.parse(body); } catch { fail("INVALID_REQUEST", "JSON 요청을 읽지 못했습니다."); }
    const input = validateGeneration(parsed);
    const openai = input.provider === "openai";
    const key = (openai ? env.OPENAI_API_KEY : env.ANTHROPIC_API_KEY)?.trim();
    const model = (openai ? env.OPENAI_MODEL : env.ANTHROPIC_MODEL)?.trim();
    if (!key) fail("MISSING_API_KEY", `${openai ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY"}가 비어 있습니다. .env.local을 수정하고 서버를 재시작하세요.`);
    if (!model) fail("MISSING_MODEL", `${openai ? "OPENAI_MODEL" : "ANTHROPIC_MODEL"}에 사용 가능한 모델 ID를 입력하고 서버를 재시작하세요.`);
    if (model.startsWith("sk-") || model === key || !/^[a-zA-Z0-9][a-zA-Z0-9_.:/-]{0,150}$/.test(model)) fail("INVALID_MODEL_CONFIG", "모델 설정에 올바른 모델 ID를 입력하세요. 키를 모델 항목에 넣으면 안 됩니다.");
    const messages = [{ role: "user", content: input.messages.user }];
    const payload = openai ? { model, messages: [{ role: "system", content: input.messages.system }, ...messages], max_completion_tokens: 8192, stream: false, store: false }
      : { model, system: input.messages.system, messages, max_tokens: 8192, stream: false };
    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = AbortSignal.any([request.signal, timeout]);
    let upstream: Response;
    try {
      upstream = await transport(openai ? "https://api.openai.com/v1/chat/completions" : "https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", ...(openai ? { Authorization: `Bearer ${key}` } : { "x-api-key": key, "anthropic-version": "2023-06-01" }) },
        body: JSON.stringify(payload), signal, redirect: "error",
      });
    } catch {
      if (request.signal.aborted) fail("CANCELLED", "요청이 중지되었습니다. 제공업체에서 이미 처리한 호출은 과금될 수 있습니다.", 499);
      if (timeout.aborted) fail("TIMEOUT", "API 응답 대기 시간(120초)이 초과되었습니다. 사용량을 확인한 뒤 다시 실행하세요.", 504);
      fail("PROVIDER_NETWORK_ERROR", "API 제공업체에 연결하지 못했습니다. 네트워크·프록시·방화벽 설정을 확인하세요.", 502);
    }
    requestId = safeId(upstream.headers.get(openai ? "x-request-id" : "request-id"));
    if (requestId === key || requestId?.startsWith("sk-")) requestId = undefined;
    if (!upstream.ok) {
      await upstream.body?.cancel();
      const status = upstream.status;
      const [code, message] = status === 401 ? ["AUTHENTICATION_ERROR", "API 키가 올바르지 않거나 만료되었습니다. 선택한 제공업체의 키를 확인하고 서버를 재시작하세요."]
        : status === 403 ? ["PERMISSION_ERROR", "API 또는 모델에 접근할 권한이 없습니다. 계정·프로젝트 권한을 확인하세요."]
        : status === 429 ? ["RATE_OR_QUOTA_LIMIT", "요청 한도 또는 사용 가능 크레딧을 초과했습니다. 제공업체의 사용량·결제 상태를 확인하세요."]
        : status === 400 || status === 404 ? ["MODEL_OR_REQUEST_ERROR", "모델 ID 또는 요청 옵션이 지원되지 않습니다. 모델 접근 권한과 입력 길이를 확인하세요."]
        : ["PROVIDER_ERROR", "API 제공업체에서 오류를 반환했습니다. 잠시 후 다시 실행하세요."];
      throw new ServiceError(code, message, status >= 400 && status <= 599 ? status : 502, requestId);
    }
    let raw: unknown;
    try { raw = await upstream.json(); } catch {
      if (timeout.aborted) fail("TIMEOUT", "API 응답 수신 시간이 초과되었습니다.", 504);
      fail("INVALID_PROVIDER_RESPONSE", "API 응답 JSON을 읽지 못했습니다.", 502);
    }
    const response = normalizeResponse(raw, input.provider, model, requestId);
    const ontology = ontologyFromResponse(response.choices[0].message.content, input);
    return json({ response, ontology });
  } catch (error) {
    const safe = error instanceof ServiceError ? error : new ServiceError("SERVER_ERROR", "서버 내부 오류가 발생했습니다. 서버 상태를 확인하세요.", 500);
    // Never return provider error bodies, exception stacks, prompt text, keys, or headers.
    return json({ error: { code: safe.code, message: safe.message, status: safe.status, ...(safe.requestId || requestId ? { requestId: safe.requestId || requestId } : {}) } }, safe.status);
  }
}
