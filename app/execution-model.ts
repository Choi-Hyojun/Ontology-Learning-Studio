import type { PromptMessages, simulateCompletion } from "./prompt-model";

export type Provider = "openai" | "anthropic";
export type Engine = "simulation" | "api";
export type ApiCompletion = {
  object: "chat.completion"; model: string;
  choices: { index: number; message: { role: string; content: string }; finish_reason: string }[];
  usage: { prompt_tokens: number; completion_tokens: number };
  execution: { provider: Provider; requestId?: string };
};
export type Completion = ReturnType<typeof simulateCompletion> | ApiCompletion;
export type ExecutionIssue = {
  at: string; code: string; message: string; provider?: Provider; method?: string; stageId?: string;
  status?: number; requestId?: string;
};
export type GenerationRequest = {
  provider: Provider; method: "neon" | "tao" | "yonsei"; stageId: string; messages: PromptMessages; previousOntology: string;
  purpose?: "stage" | "few-shot";
  yonseiTrace?: {
    cqIds: string[];
    elements: { id: string; kind: "class" | "object_property" | "data_property"; cq_ids: string[] }[];
  };
};
export function completionProvider(response: Completion): Provider | "simulation" {
  return "execution" in response ? response.execution.provider : "simulation";
}
export function safeIssue(error: unknown, context: Partial<ExecutionIssue> = {}): ExecutionIssue {
  const issue = error instanceof GenerationError ? error.issue : {
    code: "CLIENT_ERROR", message: "실행 중 예기치 않은 오류가 발생했습니다. 입력과 서버 상태를 확인한 뒤 다시 실행하세요.",
  };
  return { ...context, ...issue, at: new Date().toISOString() };
}
export class GenerationError extends Error {
  issue: Omit<ExecutionIssue, "at">;
  constructor(issue: Omit<ExecutionIssue, "at">) { super(issue.message); this.name = "GenerationError"; this.issue = issue; }
}

export function restoredIssues(history: { event: string; at: string; method: string; stageId?: string; data?: unknown }[]): ExecutionIssue[] {
  return history.flatMap((entry) => {
    if (entry.event !== "execution_error" || !entry.data || typeof entry.data !== "object") return [];
    const data = entry.data as Record<string, unknown>;
    if (typeof data.code !== "string" || typeof data.message !== "string") return [];
    return [{ at: entry.at, code: data.code, message: data.message, method: entry.method,
      ...(entry.stageId ? { stageId: entry.stageId } : {}),
      ...(data.provider === "openai" || data.provider === "anthropic" ? { provider: data.provider } : {}),
      ...(typeof data.status === "number" ? { status: data.status } : {}),
      ...(typeof data.requestId === "string" ? { requestId: data.requestId } : {}) }];
  });
}

export async function requestGeneration(input: GenerationRequest, signal: AbortSignal, transport: typeof fetch = fetch): Promise<{ response: ApiCompletion; ontology: string | null }> {
  const timeout = AbortSignal.timeout(135000);
  let result: Response;
  try {
    result = await transport("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input), signal: AbortSignal.any([signal, timeout]) });
  } catch {
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    throw new GenerationError({ code: timeout.aborted ? "TIMEOUT" : "NETWORK_ERROR",
      message: timeout.aborted ? "응답 대기 시간이 초과되었습니다. 이전 호출은 처리되었을 수 있으니 사용량을 확인하세요." : "서버에 연결하지 못했습니다. 개발 서버와 네트워크 상태를 확인하세요." });
  }
  let data;
  try { data = await result.json(); } catch {
    throw new GenerationError({ code: "INVALID_SERVER_RESPONSE", status: result.status, message: "서버가 올바른 JSON 응답을 반환하지 않았습니다." });
  }
  if (!result.ok) {
    // Only the server's safe error contract is surfaced, never HTML or raw provider bodies.
    const issue = data?.error;
    throw new GenerationError({ code: typeof issue?.code === "string" ? issue.code : "SERVER_ERROR",
      message: typeof issue?.message === "string" ? issue.message : "서버에서 요청 처리에 실패했습니다.",
      status: result.status, ...(typeof issue?.requestId === "string" ? { requestId: issue.requestId } : {}) });
  }
  if (typeof data?.response?.choices?.[0]?.message?.content !== "string" || data.response.execution?.provider !== input.provider
    || !(data.ontology === null || typeof data.ontology === "string") || !Number.isFinite(data.response.usage?.prompt_tokens)
    || !Number.isFinite(data.response.usage?.completion_tokens)) {
    throw new GenerationError({ code: "INVALID_SERVER_RESPONSE", message: "서버 응답의 본문·사용량·온톨로지 형식이 올바르지 않습니다." });
  }
  return data;
}
